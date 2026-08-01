"""Construccion y consulta de la base vectorial de GemSpark.

Uso:
    python AI/main.py build
    python AI/main.py query "¿Por que debo reducir el sodio?"
    python AI/main.py status
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import chromadb
import truststore
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"
CACHE_DIR = BASE_DIR / ".cache" / "rag_pages"
DB_DIR = BASE_DIR / "vector_db"
MANIFEST_PATH = DOCS_DIR / "sources.json"

# Carga local y silenciosa. AI/.env esta excluido de Git.
load_dotenv(BASE_DIR / ".env")
truststore.inject_into_ssl()

COLLECTION_NAME = "gemspark_nutrition"
EMBEDDING_MODEL = "gemini-embedding-2"
EMBEDDING_DIMENSIONS = 768
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200
MIN_PAGE_CHARS = 80
MIN_CHUNK_CHARS = 120

# Las fuentes tabulares 02-04 se llevaran a SQLite/JSON en otro paso. Para el
# RAG solo se indexa evidencia explicativa y normativa.
RAG_SOURCE_IDS = {
    "minsa_guias_alimentarias_2019",
    "minsa_manual_advertencias_2018",
    "minsa_gpc_diabetes_tipo2_2016",
    "ins_gpc_hipertension_2026",
    "who_sodium_guideline_2012",
}

CLINICAL_SOURCE_IDS = {
    "minsa_gpc_diabetes_tipo2_2016",
    "ins_gpc_hipertension_2026",
}

CLINICAL_TERMS = re.compile(
    r"\b(aliment\w*|nutric\w*|dieta\w*|carbohidr\w*|az[uú]car\w*|"
    r"sodio|sal)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class PageText:
    page: int
    text: str
    extraction_method: str


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    text: str
    embedding_text: str
    metadata: dict[str, Any]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file_handle:
        for block in iter(lambda: file_handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ").replace("\u00ad", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def load_manifest() -> list[dict[str, Any]]:
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(f"No existe el manifiesto: {MANIFEST_PATH}")
    with MANIFEST_PATH.open("r", encoding="utf-8") as file_handle:
        sources = json.load(file_handle)
    selected = [source for source in sources if source["source_id"] in RAG_SOURCE_IDS]
    missing = RAG_SOURCE_IDS - {source["source_id"] for source in selected}
    if missing:
        raise ValueError(f"Faltan fuentes RAG en sources.json: {sorted(missing)}")
    return selected


def cache_path(source_id: str, variant: str = "full") -> Path:
    return CACHE_DIR / f"{source_id}_{variant}.json"


def read_page_cache(
    source_id: str, source_hash: str, variant: str = "full"
) -> list[PageText] | None:
    path = cache_path(source_id, variant)
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if payload.get("source_sha256") != source_hash:
        return None
    return [PageText(**page) for page in payload.get("pages", [])]


def write_page_cache(
    source_id: str,
    source_hash: str,
    pages: list[PageText],
    variant: str = "full",
) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "source_sha256": source_hash,
        "pages": [page.__dict__ for page in pages],
    }
    cache_path(source_id, variant).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def get_ocr_engine():
    try:
        from paddleocr import PaddleOCR
    except ImportError as exc:
        raise RuntimeError(
            "El PDF necesita OCR. Instala paddleocr y paddlepaddle desde "
            "AI/requirements.txt."
        ) from exc
    # PaddleOCR intenta usar ~/.paddleocr por defecto. Mantener sus modelos dentro
    # de AI/.cache hace el proyecto portable y evita escribir fuera del workspace.
    model_root = BASE_DIR / ".cache" / "paddleocr_models"
    return PaddleOCR(
        use_angle_cls=False,
        lang="es",
        show_log=False,
        use_gpu=False,
        enable_mkldnn=False,
        cpu_threads=1,
        det_model_dir=str(model_root / "det"),
        rec_model_dir=str(model_root / "rec_latin"),
    )


def ocr_pdf_page(pdf_path: Path, page_number: int, ocr_engine: Any) -> str:
    try:
        import fitz
        import numpy as np
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("Faltan PyMuPDF, numpy o Pillow para ejecutar OCR.") from exc

    document = fitz.open(pdf_path)
    try:
        page = document.load_page(page_number - 1)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0), alpha=False)
        image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
    finally:
        document.close()

    result = ocr_engine.ocr(np.asarray(image), cls=False)
    lines: list[str] = []
    for page_result in result or []:
        for item in page_result or []:
            if len(item) >= 2 and item[1]:
                text, confidence = item[1]
                if text and float(confidence) >= 0.45:
                    lines.append(str(text))
    return clean_text("\n".join(lines))


def extract_pdf_pages(path: Path, allow_ocr: bool = True) -> list[PageText]:
    reader = PdfReader(path)
    extracted: list[PageText] = []
    ocr_engine = None

    for index, page in enumerate(reader.pages, start=1):
        try:
            text = clean_text(page.extract_text() or "")
        except Exception:
            text = ""
        method = "pypdf"
        if allow_ocr and len(text) < MIN_PAGE_CHARS:
            if ocr_engine is None:
                print(f"  Activando OCR para {path.name}...", flush=True)
                ocr_engine = get_ocr_engine()
            ocr_text = ocr_pdf_page(path, index, ocr_engine)
            if len(ocr_text) > len(text):
                text = ocr_text
                method = "paddleocr"
        extracted.append(PageText(page=index, text=text, extraction_method=method))
        if index % 25 == 0 or index == len(reader.pages):
            print(f"  Paginas procesadas: {index}/{len(reader.pages)}", flush=True)
    return extracted


def extract_html(path: Path) -> list[PageText]:
    html = path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")
    for element in soup(["script", "style", "noscript", "nav", "footer", "header"]):
        element.decompose()
    container = soup.find("main") or soup.find("article") or soup.body or soup
    return [PageText(page=1, text=clean_text(container.get_text("\n")), extraction_method="html")]


def remove_repeated_lines(pages: list[PageText]) -> list[PageText]:
    line_pages: dict[str, set[int]] = {}
    for page in pages:
        for line in {line.strip() for line in page.text.splitlines()}:
            if 3 <= len(line) <= 100:
                line_pages.setdefault(line.casefold(), set()).add(page.page)
    threshold = max(3, int(len(pages) * 0.25))
    repeated = {line for line, page_ids in line_pages.items() if len(page_ids) >= threshold}

    cleaned: list[PageText] = []
    for page in pages:
        lines = [line for line in page.text.splitlines() if line.strip().casefold() not in repeated]
        cleaned.append(PageText(page.page, clean_text("\n".join(lines)), page.extraction_method))
    return cleaned


def select_clinical_pages(pages: list[PageText]) -> list[PageText]:
    matches = {page.page for page in pages if CLINICAL_TERMS.search(page.text)}
    selected_numbers = {
        neighbor
        for page_number in matches
        for neighbor in (page_number - 1, page_number, page_number + 1)
        if neighbor >= 1
    }
    return [page for page in pages if page.page in selected_numbers]


def extract_source(
    source: dict[str, Any], force: bool = False, allow_ocr: bool = True
) -> list[PageText]:
    path = DOCS_DIR / source["file"]
    if not path.exists():
        raise FileNotFoundError(f"No existe la fuente: {path}")
    source_hash = file_sha256(path)
    cache_variant = "full" if allow_ocr else "text_only"
    cached = None if force else read_page_cache(
        source["source_id"], source_hash, cache_variant
    )
    if cached is not None:
        print(f"  Cache reutilizada: {len(cached)} paginas", flush=True)
        return cached

    if path.suffix.lower() == ".pdf":
        pages = extract_pdf_pages(path, allow_ocr=allow_ocr)
    elif path.suffix.lower() in {".html", ".htm"}:
        pages = extract_html(path)
    else:
        raise ValueError(f"Formato no soportado: {path.suffix}")

    pages = remove_repeated_lines(pages)
    write_page_cache(source["source_id"], source_hash, pages, cache_variant)
    return pages


def category_for(source_id: str) -> str:
    if "diabetes" in source_id:
        return "diabetes"
    if "hipertension" in source_id:
        return "hipertension"
    if "sodio" in source_id:
        return "sodio"
    if "advertencias" in source_id:
        return "etiquetado"
    return "alimentacion_general"


def create_chunks(source: dict[str, Any], pages: list[PageText]) -> list[Chunk]:
    if source["source_id"] in CLINICAL_SOURCE_IDS:
        pages = select_clinical_pages(pages)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", "; ", ", ", " "],
        length_function=len,
    )
    chunks: list[Chunk] = []
    for page in pages:
        if len(page.text) < MIN_CHUNK_CHARS:
            continue
        for index, text in enumerate(splitter.split_text(page.text)):
            text = clean_text(text)
            if len(text) < MIN_CHUNK_CHARS:
                continue
            content_hash = sha256_bytes(text.encode("utf-8"))
            raw_id = f"{source['source_id']}:{page.page}:{index}:{content_hash}"
            chunk_id = sha256_bytes(raw_id.encode("utf-8"))
            metadata = {
                "source_id": source["source_id"],
                "institution": source["institution"],
                "title": source["title"],
                "year": int(source["year"]),
                "url": source["url"],
                "page": page.page,
                "category": category_for(source["source_id"]),
                "extraction_method": page.extraction_method,
                "content_sha256": content_hash,
            }
            embedding_text = f"title: {source['title']} | text: {text}"
            chunks.append(Chunk(chunk_id, text, embedding_text, metadata))
    return chunks


def require_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Falta GEMINI_API_KEY. Configurala como variable de entorno; no la guardes en el codigo."
        )
    return api_key


def gemini_client():
    try:
        from google import genai
    except ImportError as exc:
        raise RuntimeError("Falta google-genai. Instala AI/requirements.txt.") from exc
    return genai.Client(api_key=require_api_key())


def embed_with_retry(client: Any, text: str, attempts: int = 6) -> list[float]:
    from google.genai import types

    for attempt in range(attempts):
        try:
            result = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSIONS),
            )
            values = list(result.embeddings[0].values)
            if len(values) != EMBEDDING_DIMENSIONS:
                raise RuntimeError(
                    f"Dimension inesperada: {len(values)}; se esperaban {EMBEDDING_DIMENSIONS}."
                )
            return values
        except Exception as exc:
            retryable = any(code in str(exc).upper() for code in ("429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE"))
            if not retryable or attempt == attempts - 1:
                raise
            wait_seconds = min(60, 2 ** attempt)
            print(f"  API temporalmente no disponible; reintento en {wait_seconds}s...", flush=True)
            time.sleep(wait_seconds)
    raise AssertionError("Bucle de reintentos agotado")


def chroma_client() -> chromadb.PersistentClient:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(DB_DIR))


def get_collection(client: chromadb.PersistentClient):
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={
            "hnsw:space": "cosine",
            "embedding_model": EMBEDDING_MODEL,
            "embedding_dimensions": EMBEDDING_DIMENSIONS,
        },
    )


def batched(items: list[Chunk], size: int) -> Iterable[list[Chunk]]:
    for index in range(0, len(items), size):
        yield items[index : index + size]


def sample_evenly(items: list[Chunk], limit: int) -> list[Chunk]:
    if limit <= 0 or len(items) <= limit:
        return items
    if limit == 1:
        return [items[len(items) // 2]]
    indexes = [round(index * (len(items) - 1) / (limit - 1)) for index in range(limit)]
    return [items[index] for index in indexes]


def command_build(args: argparse.Namespace) -> int:
    api_client = gemini_client()
    client = chroma_client()
    if args.rebuild:
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass
    collection = get_collection(client)
    existing_ids = set(collection.get(include=[]).get("ids", []))

    all_chunks: list[Chunk] = []
    sources = load_manifest()
    per_source_limit = (
        max(1, args.max_chunks // len(sources)) if args.max_chunks else 0
    )
    for source in sources:
        print(f"Procesando {source['title']}...", flush=True)
        pages = extract_source(
            source, force=args.force_extract, allow_ocr=not args.skip_ocr
        )
        chunks = create_chunks(source, pages)
        if per_source_limit:
            chunks = sample_evenly(chunks, per_source_limit)
        print(f"  Chunks seleccionados: {len(chunks)}", flush=True)
        all_chunks.extend(chunks)

    pending = [chunk for chunk in all_chunks if chunk.chunk_id not in existing_ids]
    print(f"Total: {len(all_chunks)} chunks; pendientes: {len(pending)}", flush=True)

    completed = 0
    for group in batched(pending, 20):
        embeddings = [embed_with_retry(api_client, chunk.embedding_text) for chunk in group]
        collection.upsert(
            ids=[chunk.chunk_id for chunk in group],
            embeddings=embeddings,
            documents=[chunk.text for chunk in group],
            metadatas=[chunk.metadata for chunk in group],
        )
        completed += len(group)
        print(f"Embeddings guardados: {completed}/{len(pending)}", flush=True)

    print(f"Base lista en {DB_DIR} ({collection.count()} chunks).")
    return 0


def command_query(args: argparse.Namespace) -> int:
    client = chroma_client()
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception as exc:
        raise RuntimeError("La coleccion no existe. Ejecuta primero: python AI/main.py build") from exc
    if collection.count() == 0:
        raise RuntimeError("La coleccion esta vacia. Ejecuta primero el comando build.")

    query_text = f"task: question answering | query: {args.question}"
    embedding = embed_with_retry(gemini_client(), query_text)
    result = collection.query(
        query_embeddings=[embedding],
        n_results=min(args.top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )
    for index, (document, metadata, distance) in enumerate(
        zip(result["documents"][0], result["metadatas"][0], result["distances"][0]),
        start=1,
    ):
        print(f"\n[{index}] distancia={distance:.4f}")
        print(f"Fuente: {metadata['title']} — pagina {metadata['page']}")
        print(f"URL: {metadata['url']}")
        print(document)
    return 0


def command_status(_: argparse.Namespace) -> int:
    client = chroma_client()
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        print("Estado: base vectorial no creada")
        return 0
    print(f"Coleccion: {COLLECTION_NAME}")
    print(f"Chunks: {collection.count()}")
    print(f"Modelo: {collection.metadata.get('embedding_model', 'desconocido')}")
    print(f"Dimensiones: {collection.metadata.get('embedding_dimensions', 'desconocidas')}")
    print(f"Ruta: {DB_DIR}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Base vectorial RAG de GemSpark")
    subparsers = parser.add_subparsers(dest="command", required=True)

    build = subparsers.add_parser("build", help="Extraer documentos y crear embeddings")
    build.add_argument("--rebuild", action="store_true", help="Eliminar y reconstruir la coleccion")
    build.add_argument("--force-extract", action="store_true", help="Ignorar la cache de extraccion")
    build.add_argument(
        "--skip-ocr",
        action="store_true",
        help="Omitir OCR y las paginas escaneadas para una prueba rapida",
    )
    build.add_argument(
        "--max-chunks",
        type=int,
        default=0,
        help="Limitar el corpus a una muestra equilibrada (0 = sin limite)",
    )
    build.set_defaults(handler=command_build)

    query = subparsers.add_parser("query", help="Consultar fragmentos relevantes")
    query.add_argument("question", help="Pregunta en lenguaje natural")
    query.add_argument("--top-k", type=int, default=5, help="Cantidad de resultados")
    query.set_defaults(handler=command_query)

    status = subparsers.add_parser("status", help="Mostrar estado de la base")
    status.set_defaults(handler=command_status)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if getattr(args, "top_k", 1) < 1:
        parser.error("--top-k debe ser mayor que cero")
    if getattr(args, "max_chunks", 0) < 0:
        parser.error("--max-chunks no puede ser negativo")
    try:
        return args.handler(args)
    except KeyboardInterrupt:
        print("\nOperacion cancelada; el progreso ya guardado se reutilizara.", file=sys.stderr)
        return 130
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

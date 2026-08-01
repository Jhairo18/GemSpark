# RAG de GemSpark

Esta carpeta construye una base vectorial con evidencia nutricional oficial. Las
tablas numericas y los umbrales clinicos no se resuelven con el RAG: deben vivir en
SQLite o en el motor de reglas.

## Preparacion

Instala las dependencias:

```powershell
python -m pip install -r AI/requirements.txt
```

Crea una API key nueva en Google AI Studio y configúrala solo en la terminal actual:

```powershell
$env:GEMINI_API_KEY="TU_CLAVE_NUEVA"
```

No escribas la clave dentro del repositorio.

## Construir y probar

```powershell
python AI/main.py build
python AI/main.py status
python AI/main.py query "¿Por qué una persona hipertensa debe reducir el sodio?"
python AI/main.py ask "¿Por qué una persona hipertensa debe reducir el sodio?"
python AI/main.py explain-product AI/examples/product_assessment.json --output AI/examples/product_explanation.json
```

La primera ejecución aplica OCR a las páginas escaneadas y puede tardar. La extracción
se guarda en `AI/.cache`; los embeddings ya completados se guardan inmediatamente en
`AI/vector_db`, por lo que una ejecución interrumpida puede continuar después.

Para una prueba rápida que omita las páginas que necesitan OCR:

```powershell
python AI/main.py build --skip-ocr --max-chunks 100
```

Para reconstruir desde cero la colección vectorial:

```powershell
python AI/main.py build --rebuild
```

Para repetir también la extracción y el OCR:

```powershell
python AI/main.py build --rebuild --force-extract
```

Los resultados de `query` incluyen título, página, URL y distancia coseno. Esta CLI
recupera evidencia. `ask` recupera esa evidencia y usa el modelo local
`gemma2:2b-instruct-q4_K_M` de Ollama para redactar una explicación puntual. La
referencia oficial —documento, página y enlace— se agrega de forma determinística.

`explain-product` recibe el JSON completo generado por el backend, conserva solo los
riesgos pertinentes para las condiciones del usuario y produce el contrato final que
puede devolver un endpoint al frontend. Los valores numéricos se copian del JSON de
entrada; Gemma no los calcula ni los reformula.

# Corpus documental de GemSpark

Documentos oficiales reunidos para construir el RAG nutricional. La presencia de un
documento en esta carpeta no convierte sus valores en reglas clínicas automáticas.

## Uso por tipo de fuente

| Archivo | Uso recomendado |
| --- | --- |
| `01_guias_alimentarias_peru.pdf` | Vectorizar. Explicaciones generales y consejos alimentarios adaptados al Perú. |
| `02_tablas_composicion_alimentos_peru_2017.pdf` | Extraer a SQLite/JSON. Vectorizar solamente definiciones y metodología, no las filas numéricas. |
| `03_tablas_auxiliares_regimenes_alimentarios.pdf` | Extraer porciones y equivalencias a datos estructurados; vectorizar el texto explicativo. |
| `04_guia_intercambio_alimentos.pdf` | Vectorizar explicaciones y estructurar las tablas de intercambios. |
| `05_manual_advertencias_publicitarias.pdf` | Convertir parámetros a reglas determinísticas versionadas; vectorizar el sustento explicativo. |
| `06_gpc_diabetes_mellitus_tipo_2.pdf` | Vectorizar únicamente secciones pertinentes a alimentación, educación y seguridad. |
| `07_gpc_hipertension_adultos_2026.pdf` | Vectorizar únicamente secciones pertinentes a alimentación, sodio, estilo de vida y seguridad. |
| `08_oms_guia_sodio.html` | Vectorizar la descripción/recomendaciones; conservar la URL oficial como procedencia. |

## Metadatos mínimos por fragmento

Cada fragmento debería conservar al menos:

- `source_id` y nombre del archivo.
- Institución, título, año y versión.
- Número de página o sección.
- URL oficial.
- Fecha de descarga.
- Categoría: `alimentacion_general`, `composicion`, `porciones`, `diabetes`,
  `hipertension`, `sodio` o `etiquetado`.
- `usage`: `rag`, `structured_data` o `rules`.

No se deben mezclar filas de tablas, encabezados o notas al pie de páginas diferentes en
un mismo fragmento. Las respuestas de Gemma deben citar la fuente y página recuperadas.
Si no se recupera evidencia suficiente, el sistema debe abstenerse de dar una explicación
clínica específica.

La lista canónica de procedencia está en `sources.json`.

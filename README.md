# GemSpark — Nutrición de Precisión para Pacientes Crónicos en el Perú

Asistente de nutrición de precisión diseñado para la competencia **Build with Gemma – GDG Lima**. Combina un motor de reglas clínico determinístico con modelos Gemma para guiar la alimentación de pacientes crónicos (hipertensión y diabetes).

---

## 📁 Estructura del Proyecto

* **`backend/`**: Servidor API en FastAPI + SQLite con motor de reglas clínicas y cálculo antropométrico OMS. Consulta la [Documentación del Backend](backend/README.md).
* **`CONTEXT.md`**: Especificación de arquitectura, roles y contrato técnico.

---

## ⚡ Inicio Rápido (Backend)

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Para correr las pruebas del backend:
```bash
python backend/test_backend.py
```

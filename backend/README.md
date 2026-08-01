# GemSpark Backend - Nutrición de Precisión (Perú)

Backend desarrollado con **FastAPI** y **SQLite** para **GemSpark**, diseñado para brindar recomendaciones nutricionales determinísticas y evaluación de riesgo para pacientes crónicos en el Perú, integrando las recomendaciones antropométricas de la **OMS** y la **Ley N° 30021 (MINSA)**.

---

## 🚀 Procedimiento de Inicio a Fin

1. **Poblado de Base de Datos SQL**:
   - Al arrancar la aplicación, el backend inicializa la base de datos SQLite (`gemspark.db`) y carga automáticamente la tabla `productos` con la base local de `productos.json` (102 productos en el Perú).

2. **Registro de Paciente y Cálculo de Umbrales (`POST /api/usuarios`)**:
   - Recibe datos biométricos (edad, género, altura, peso) y patologías (`hipertension`, `diabetes`).
   - Calcula el **IMC** ($\text{peso} / \text{altura}^2$).
   - Aplica la fórmula **Mifflin-St Jeor** para determinar el Gasto Energético Total ($\text{GET}$).
   - Determina los umbrales clínicos y la fuente (`condicion_paciente` o `ley_octogonos`):
     - **Hipertensión + Diabetes:** Sodio $\le 350\text{ mg}$, Azúcar $\le 5\text{ g}$.
     - **Hipertensión:** Sodio $\le 400\text{ mg}$, Azúcar $\le 5\%\text{ GET}$.
     - **Diabetes:** Sodio $\le 1500\text{ mg}$, Azúcar $\le 5\text{ g}$.
     - **Sin patología:** Sodio $\le 2000\text{ mg}$, Azúcar $\le 10\%\text{ GET}$.

3. **Búsqueda de Producto (`GET /api/productos/{codigo_barras}`)**:
   - Busca el producto por su código de barras en SQLite. Si no existe localmente, consulta la API de Open Food Facts y lo registra.

4. **Evaluación Semántica de Riesgo (`POST /api/evaluar`)**:
   - Compara los 4 insumos clave (**Azúcar**, **Sal/Sodio**, **Grasas Saturadas** y **Grasas Trans**) contra los umbrales del paciente y la Ley de Octógonos del MINSA.
   - Retorna categorías semánticas (`"Alto"`, `"Moderado"`, `"Bajo"`) e indica si el alimento es seguro.

---

## 🛠️ Instalación y Ejecución

```bash
# Entrar al directorio backend
cd backend

# Activar entorno virtual
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor
uvicorn main:app --reload --port 8000
```

Documentación interactiva disponible en: `http://localhost:8000/docs`

---

## 📡 Endpoints de la API

### 1. Registrar / Actualizar Usuario
* **Ruta:** `POST /api/usuarios` (Aliases: `POST /api/usuario`, `POST /api/paciente`)
* **Request:**
```json
{
  "nombre": "Juan Pérez",
  "datos_biometricos": {
    "edad": 65,
    "genero": "masculino",
    "altura": 170,
    "peso": 78.5
  },
  "condiciones": ["hipertension", "diabetes"]
}
```
* **Response:**
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "datos_biometricos": {
    "edad": 65,
    "genero": "masculino",
    "altura": 170.0,
    "peso": 78.5,
    "imc": 27.2
  },
  "condiciones": ["hipertension", "diabetes"],
  "umbrales": {
    "limite_sodio_mg": 350.0,
    "limite_azucar_g": 5.0,
    "origen": "condicion_paciente",
    "get_kcal": 1833.0,
    "limite_grasas_saturadas_g": 20.4,
    "limite_grasas_trans_g": 2.0
  },
  "actualizado_en": "2026-08-01T10:00:00-05:00"
}
```

---

### 2. Consultar Producto
* **Ruta:** `GET /api/productos/{codigo_barras}`
* **Response:**
```json
{
  "codigo_barras": "7613035963948",
  "nombre": "Morochas chica",
  "marca": "Nestlé",
  "nutriscore": "C",
  "energia_kcal_100g": 140,
  "proteinas_100g": 1.8,
  "carbohidratos_100g": 21.5,
  "azucares_100g": 10.9,
  "grasas_totales_100g": 5.2,
  "grasas_saturadas_100g": 3.1,
  "sodio_100g": 0,
  "fibra_100g": 0
}
```

---

### 3. Evaluar Riesgo Semántico de Insumos
* **Ruta:** `POST /api/evaluar` (Alias: `POST /api/evaluar-producto`, `GET /api/productos/{codigo_barras}/evaluar`)
* **Request:**
```json
{
  "codigo_barras": "7613035963948",
  "usuario_id": 1
}
```
* **Response:**
```json
{
  "producto": {
    "codigo_barras": "7613035963948",
    "nombre": "Morochas chica",
    "marca": "Nestlé",
    "nutriscore": "C"
  },
  "es_seguro": false,
  "nivel_riesgo_global": "Alto",
  "insumos_clave": {
    "azucar": {
      "nivel_riesgo": "Alto",
      "valor_100g": 10.9,
      "unidad": "g/100g",
      "limite_paciente_g": 5.0,
      "excede_limite": true,
      "mensaje": "Riesgo Alto: Contiene 10.9g de azúcar por 100g, superando su límite clínico de 5.0g."
    },
    "sal_sodio": {
      "nivel_riesgo": "Bajo",
      "sodio_mg_100g": 0.0,
      "sal_g_100g": 0.0,
      "limite_sodio_paciente_mg": 350.0,
      "excede_limite": false,
      "mensaje": "Riesgo Bajo: Contiene 0.0mg de sodio por 100g, adecuado para su perfil."
    },
    "grasas_saturadas": {
      "nivel_riesgo": "Moderado",
      "valor_100g": 3.1,
      "unidad": "g/100g",
      "limite_octogono_g": 6.0,
      "excede_limite": false,
      "mensaje": "Riesgo Moderado: Contiene 3.1g de grasas saturadas por 100g."
    },
    "grasas_trans": {
      "nivel_riesgo": "Bajo",
      "valor_100g": 0.0,
      "unidad": "g/100g",
      "excede_limite": false,
      "mensaje": "Riesgo Bajo: Sin presencia significativa de grasas trans."
    }
  },
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "umbrales": {
      "limite_sodio_mg": 350.0,
      "limite_azucar_g": 5.0,
      "origen": "condicion_paciente"
    }
  }
}
```

---

## 🧪 Pruebas Automatizadas

Para validar todos los casos de uso:
```bash
python test_backend.py
```

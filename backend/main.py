from fastapi import FastAPI, HTTPException, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from database import (
    init_db,
    guardar_usuario,
    obtener_usuario_por_id,
    obtener_ultimo_usuario,
    obtener_producto_por_codigo,
    get_db_connection
)
from rules import (
    calcular_imc,
    calcular_umbrales,
    evaluar_riesgo_producto
)
from extract_data import obtener_producto_por_id


# Zona horaria de Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))


def get_current_timestamp_peru() -> str:
    """Genera timestamp en formato ISO 8601 con zona horaria de Perú (-05:00)."""
    now = datetime.now(PERU_TZ)
    return now.isoformat(timespec="seconds")


app = FastAPI(
    title="GemSpark Backend API",
    description="API de nutrición de precisión para pacientes crónicos impulsada por reglas clínicas determinísticas y estándares OMS.",
    version="1.1.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Inicializa la base de datos SQLite y carga la tabla de productos desde productos.json."""
    init_db()


# MODELOS PYDANTIC PARA VALIDACIÓN Y DOCUMENTACIÓN SWAGGER

class DatosBiometricosEntrada(BaseModel):
    edad: int = Field(..., example=65, description="Edad del paciente en años")
    genero: str = Field(..., example="masculino", description="Género: masculino / femenino")
    altura: float = Field(..., example=170.0, description="Altura en centímetros")
    peso: float = Field(..., example=78.5, description="Peso en kilogramos")


class CrearUsuarioRequest(BaseModel):
    nombre: str = Field(..., example="Juan Pérez", description="Nombre del paciente")
    datos_biometricos: DatosBiometricosEntrada
    condiciones: List[str] = Field(..., example=["hipertension", "diabetes"], description="Lista de condiciones crónicas declaradas")


class DatosBiometricosSalida(BaseModel):
    edad: int
    genero: str
    altura: float
    peso: float
    imc: float


class UmbralesSalida(BaseModel):
    limite_sodio_mg: float
    limite_azucar_g: float
    origen: str
    get_kcal: Optional[float] = Field(None, description="Gasto Energético Total OMS (kcal/día)")
    limite_grasas_saturadas_g: Optional[float] = Field(None, description="Límite OMS Grasas Saturadas (<10% GET en g/día)")
    limite_grasas_trans_g: Optional[float] = Field(None, description="Límite OMS Grasas Trans (<1% GET en g/día)")


class UsuarioResponse(BaseModel):
    id: Optional[int] = None
    nombre: str
    datos_biometricos: DatosBiometricosSalida
    condiciones: List[str]
    umbrales: UmbralesSalida
    actualizado_en: str


class EvaluarProductoRequest(BaseModel):
    codigo_barras: str = Field(..., example="7613035963948", description="Código de barras del producto a evaluar")
    usuario_id: Optional[int] = Field(None, description="ID del usuario registrado (opcional, por defecto usa el último)")


# ENDPOINTS DE LA API

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "app": "GemSpark Backend API",
        "version": "1.1.0",
        "normativa": "OMS / Ley de Octógonos N° 30021 MINSA"
    }


@app.post("/api/usuarios", response_model=UsuarioResponse, tags=["Usuarios"])
@app.post("/api/usuario", response_model=UsuarioResponse, include_in_schema=False)
@app.post("/api/paciente", response_model=UsuarioResponse, include_in_schema=False)
def crear_o_actualizar_usuario(user_data: CrearUsuarioRequest):
    """
    Crea o actualiza el registro de un usuario / paciente.
    Calcula IMC y determina los umbrales nutricionales OMS (Mifflin-St Jeor / GET) y clínicos según condiciones.
    """
    bio = user_data.datos_biometricos
    imc = calcular_imc(peso_kg=bio.peso, altura_cm=bio.altura)
    umbrales = calcular_umbrales(
        condiciones=user_data.condiciones,
        edad=bio.edad,
        genero=bio.genero,
        peso_kg=bio.peso,
        altura_cm=bio.altura
    )
    timestamp = get_current_timestamp_peru()

    registro = {
        "nombre": user_data.nombre,
        "datos_biometricos": {
            "edad": bio.edad,
            "genero": bio.genero,
            "altura": bio.altura,
            "peso": bio.peso,
            "imc": imc
        },
        "condiciones": user_data.condiciones,
        "umbrales": umbrales,
        "actualizado_en": timestamp
    }

    usuario_guardado = guardar_usuario(registro)
    return usuario_guardado


@app.get("/api/usuarios/{usuario_id}", response_model=UsuarioResponse, tags=["Usuarios"])
def obtener_usuario(usuario_id: int = Path(..., description="ID del usuario")):
    usuario = obtener_usuario_por_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail=f"Usuario con ID {usuario_id} no encontrado")
    return usuario


@app.get("/api/productos/{codigo_barras}", tags=["Productos"])
def obtener_producto(codigo_barras: str = Path(..., description="Código de barras del producto")):
    """Consulta un producto por su código de barras en la base de datos SQL o API externa."""
    producto = obtener_producto_por_codigo(codigo_barras)
    
    if not producto:
        # Buscar en API externa Open Food Facts y guardar si existe
        prod_ext = obtener_producto_por_id(codigo_barras, buscar_local_primero=True)
        if prod_ext:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO productos (
                    codigo_barras, nombre, marca, nutriscore,
                    energia_kcal_100g, proteinas_100g, carbohidratos_100g,
                    azucares_100g, grasas_totales_100g, grasas_saturadas_100g,
                    sodio_100g, fibra_100g
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                prod_ext["codigo_barras"],
                prod_ext["nombre"],
                prod_ext["marca"],
                prod_ext["nutriscore"],
                prod_ext["energia_kcal_100g"],
                prod_ext["proteinas_100g"],
                prod_ext["carbohidratos_100g"],
                prod_ext["azucares_100g"],
                prod_ext["grasas_totales_100g"],
                prod_ext["grasas_saturadas_100g"],
                prod_ext["sodio_100g"],
                prod_ext["fibra_100g"]
            ))
            conn.commit()
            conn.close()
            producto = prod_ext

    if not producto:
        raise HTTPException(status_code=404, detail=f"Producto con código de barras '{codigo_barras}' no encontrado.")
    
    return producto


@app.post("/api/evaluar", tags=["Evaluación de Riesgo"])
@app.post("/api/evaluar-producto", tags=["Evaluación de Riesgo"], include_in_schema=False)
def evaluar_producto(body: EvaluarProductoRequest):
    """
    Recibe el código de barras del producto y un usuario_id (opcional).
    Consulta el producto en SQLite, recupera los umbrales OMS/clínicos del usuario y
    determina la categoría semántica de riesgo para azúcar, sal/sodio, grasas saturadas y grasas trans.
    """
    codigo_barras = str(body.codigo_barras).strip()
    
    # 1. Obtener producto
    producto = obtener_producto_por_codigo(codigo_barras)
    if not producto:
        prod_ext = obtener_producto_por_id(codigo_barras, buscar_local_primero=True)
        if prod_ext:
            producto = prod_ext
        else:
            raise HTTPException(status_code=404, detail=f"Producto con código de barras '{codigo_barras}' no encontrado.")

    # 2. Obtener usuario
    if body.usuario_id:
        usuario = obtener_usuario_por_id(body.usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail=f"Usuario con ID {body.usuario_id} no encontrado.")
    else:
        usuario = obtener_ultimo_usuario()
        if not usuario:
            # Umbrales por defecto según OMS / Ley de Octógonos
            usuario = {
                "nombre": "Usuario General",
                "umbrales": {
                    "limite_sodio_mg": 2000.0,
                    "limite_azucar_g": 25.0,
                    "origen": "ley_octogonos",
                    "limite_grasas_saturadas_g": 22.2,
                    "limite_grasas_trans_g": 2.2
                }
            }

    # 3. Evaluar riesgo semántico con el motor de reglas
    resultado_evaluacion = evaluar_riesgo_producto(producto, usuario["umbrales"])
    resultado_evaluacion["usuario"] = {
        "id": usuario.get("id"),
        "nombre": usuario.get("nombre"),
        "umbrales": usuario.get("umbrales")
    }

    return resultado_evaluacion


@app.get("/api/productos/{codigo_barras}/evaluar", tags=["Evaluación de Riesgo"])
def evaluar_producto_get(
    codigo_barras: str = Path(..., description="Código de barras del producto"),
    usuario_id: Optional[int] = Query(None, description="ID del usuario")
):
    """Endpoint GET alternativo para evaluar riesgo de un producto."""
    return evaluar_producto(EvaluarProductoRequest(codigo_barras=codigo_barras, usuario_id=usuario_id))

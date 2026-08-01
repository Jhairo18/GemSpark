import sqlite3
import json
import os
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gemspark.db")
PRODUCTOS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "productos.json")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Inicializa la base de datos SQLite y carga la tabla de productos desde productos.json."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabla de productos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS productos (
            codigo_barras TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            marca TEXT,
            nutriscore TEXT,
            energia_kcal_100g REAL DEFAULT 0,
            proteinas_100g REAL DEFAULT 0,
            carbohidratos_100g REAL DEFAULT 0,
            azucares_100g REAL DEFAULT 0,
            grasas_totales_100g REAL DEFAULT 0,
            grasas_saturadas_100g REAL DEFAULT 0,
            sodio_100g REAL DEFAULT 0,
            fibra_100g REAL DEFAULT 0
        )
    """)

    # Tabla de usuarios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            edad INTEGER NOT NULL,
            genero TEXT NOT NULL,
            altura REAL NOT NULL,
            peso REAL NOT NULL,
            imc REAL NOT NULL,
            condiciones TEXT NOT NULL,
            limite_sodio_mg REAL NOT NULL,
            limite_azucar_g REAL NOT NULL,
            origen_umbrales TEXT NOT NULL,
            actualizado_en TEXT NOT NULL
        )
    """)

    conn.commit()

    # Si la tabla de productos está vacía, cargar desde productos.json
    cursor.execute("SELECT COUNT(*) FROM productos")
    count = cursor.fetchone()[0]

    if count == 0 and os.path.exists(PRODUCTOS_JSON_PATH):
        print(f"Poblando tabla de productos desde {PRODUCTOS_JSON_PATH}...")
        try:
            with open(PRODUCTOS_JSON_PATH, "r", encoding="utf-8") as f:
                productos = json.load(f)

            for prod in productos:
                codigo = str(prod.get("codigo_barras", "")).strip()
                if not codigo:
                    continue

                cursor.execute("""
                    INSERT OR REPLACE INTO productos (
                        codigo_barras, nombre, marca, nutriscore,
                        energia_kcal_100g, proteinas_100g, carbohidratos_100g,
                        azucares_100g, grasas_totales_100g, grasas_saturadas_100g,
                        sodio_100g, fibra_100g
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    codigo,
                    prod.get("nombre", "Desconocido"),
                    prod.get("marca", "Desconocido"),
                    str(prod.get("nutriscore", "N/A")).upper(),
                    float(prod.get("energia_kcal_100g", 0) or 0),
                    float(prod.get("proteinas_100g", 0) or 0),
                    float(prod.get("carbohidratos_100g", 0) or 0),
                    float(prod.get("azucares_100g", 0) or 0),
                    float(prod.get("grasas_totales_100g", 0) or 0),
                    float(prod.get("grasas_saturadas_100g", 0) or 0),
                    float(prod.get("sodio_100g", 0) or 0),
                    float(prod.get("fibra_100g", 0) or 0)
                ))

            conn.commit()
            print(f"Cargados exitosamente en SQLite {len(productos)} productos.")
        except Exception as e:
            print(f"Error al poblar productos en SQLite: {e}")

    conn.close()


def obtener_producto_por_codigo(codigo_barras: str) -> Optional[Dict[str, Any]]:
    """Consulta un producto por su código de barras en SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM productos WHERE codigo_barras = ?", (str(codigo_barras).strip(),))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def obtener_todos_productos() -> List[Dict[str, Any]]:
    """Devuelve todo el catálogo local de productos (usado para buscar alternativas)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM productos")
    filas = cursor.fetchall()
    conn.close()
    return [dict(fila) for fila in filas]


def guardar_usuario(datos_usuario: Dict[str, Any]) -> Dict[str, Any]:
    """Guarda o actualiza un registro de usuario en SQLite y retorna el dict estructurado."""
    conn = get_db_connection()
    cursor = conn.cursor()

    biometricos = datos_usuario["datos_biometricos"]
    umbrales = datos_usuario["umbrales"]
    condiciones_str = json.dumps(datos_usuario["condiciones"], ensure_ascii=False)

    cursor.execute("""
        INSERT INTO usuarios (
            nombre, edad, genero, altura, peso, imc,
            condiciones, limite_sodio_mg, limite_azucar_g, origen_umbrales, actualizado_en
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datos_usuario["nombre"],
        biometricos["edad"],
        biometricos["genero"],
        biometricos["altura"],
        biometricos["peso"],
        biometricos["imc"],
        condiciones_str,
        umbrales["limite_sodio_mg"],
        umbrales["limite_azucar_g"],
        umbrales["origen"],
        datos_usuario["actualizado_en"]
    ))

    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    resultado = dict(datos_usuario)
    resultado["id"] = user_id
    return resultado


def obtener_usuario_por_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Obtiene un perfil de usuario por su ID y recalcula los umbrales OMS correspondientes."""
    from rules import calcular_umbrales

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    data = dict(row)
    condiciones = json.loads(data["condiciones"])

    # Re-calculamos umbrales OMS para garantizar consistencia biométrica
    umbrales_completos = calcular_umbrales(
        condiciones=condiciones,
        edad=data["edad"],
        genero=data["genero"],
        peso_kg=data["peso"],
        altura_cm=data["altura"]
    )

    return {
        "id": data["id"],
        "nombre": data["nombre"],
        "datos_biometricos": {
            "edad": data["edad"],
            "genero": data["genero"],
            "altura": data["altura"],
            "peso": data["peso"],
            "imc": data["imc"]
        },
        "condiciones": condiciones,
        "umbrales": umbrales_completos,
        "actualizado_en": data["actualizado_en"]
    }


def obtener_ultimo_usuario() -> Optional[Dict[str, Any]]:
    """Obtiene el último perfil de usuario registrado."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM usuarios ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if row:
        return obtener_usuario_por_id(row["id"])
    return None

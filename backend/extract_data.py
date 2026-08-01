import requests
import json
import math
import time
import os
import argparse

DEFAULT_LOCAL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "productos_nutricionales_peru.json")

def formatear_producto(prod):
    """
    Estructura la información nutricional clave de un diccionario de producto
    proveniente de la API de Open Food Facts o del dataset local.
    """
    if not prod:
        return None

    nutrientes = prod.get("nutriments", {}) if isinstance(prod.get("nutriments"), dict) else {}

    # Si el producto ya tiene el formato transformado localmente
    if "codigo_barras" in prod and "nutriments" not in prod:
        return {
            "codigo_barras": str(prod.get("codigo_barras", "")),
            "nombre": prod.get("nombre", "Desconocido"),
            "marca": prod.get("marca", "Desconocido"),
            "nutriscore": str(prod.get("nutriscore", "N/A")).upper(),
            "energia_kcal_100g": prod.get("energia_kcal_100g", 0),
            "proteinas_100g": prod.get("proteinas_100g", 0),
            "carbohidratos_100g": prod.get("carbohidratos_100g", 0),
            "azucares_100g": prod.get("azucares_100g", 0),
            "grasas_totales_100g": prod.get("grasas_totales_100g", 0),
            "grasas_saturadas_100g": prod.get("grasas_saturadas_100g", 0),
            "sodio_100g": prod.get("sodio_100g", 0),
            "fibra_100g": prod.get("fibra_100g", 0)
        }

    nutriscore = prod.get("nutriscore_grade", "N/A")
    return {
        "codigo_barras": str(prod.get("code", "")),
        "nombre": prod.get("product_name") or prod.get("nombre", "Desconocido"),
        "marca": prod.get("brands") or prod.get("marca", "Desconocido"),
        "nutriscore": nutriscore.upper() if nutriscore else "N/A",
        "energia_kcal_100g": nutrientes.get("energy-kcal_100g", 0),
        "proteinas_100g": nutrientes.get("proteins_100g", 0),
        "carbohidratos_100g": nutrientes.get("carbohydrates_100g", 0),
        "azucares_100g": nutrientes.get("sugars_100g", 0),
        "grasas_totales_100g": nutrientes.get("fat_100g", 0),
        "grasas_saturadas_100g": nutrientes.get("saturated-fat_100g", 0),
        "sodio_100g": nutrientes.get("sodium_100g", 0),
        "fibra_100g": nutrientes.get("fiber_100g", 0)
    }

def obtener_producto_por_id(identificador, buscar_local_primero=False, archivo_local=None):
    """
    Obtiene la información de un producto específico según su identificador / código de barras.
    Consulta la API de Open Food Facts v2 o busca en el dataset local JSON.
    """
    if not identificador:
        return None

    identificador = str(identificador).strip()
    if archivo_local is None:
        archivo_local = DEFAULT_LOCAL_FILE

    def _buscar_en_local():
        if os.path.exists(archivo_local):
            try:
                with open(archivo_local, "r", encoding="utf-8") as f:
                    productos = json.load(f)
                    for prod in productos:
                        codigo = str(prod.get("codigo_barras", "") or prod.get("code", "")).strip()
                        if codigo == identificador:
                            return formatear_producto(prod)
            except Exception as e:
                print(f"Advertencia al leer archivo local {archivo_local}: {e}")
        return None

    if buscar_local_primero:
        prod_local = _buscar_en_local()
        if prod_local:
            return prod_local

    # Consultar la API de Open Food Facts v2 por código de barras
    url = f"https://world.openfoodfacts.org/api/v2/product/{identificador}.json"
    headers = {
        "User-Agent": "GemSparkNutricionalPeru - Python - Version 1.0"
    }

    for intento in range(3):
        try:
            respuesta = requests.get(url, headers=headers, timeout=10)
            if respuesta.status_code == 200:
                datos = respuesta.json()
                if datos.get("status") == 1 and "product" in datos:
                    return formatear_producto(datos["product"])
                break
        except Exception as e:
            print(f"Error de conexión al buscar producto {identificador} (Intento {intento+1}/3): {e}")
        time.sleep(1)

    # Si no se encontró en la API y no habíamos buscado localmente primero, intentar respaldo local
    if not buscar_local_primero:
        return _buscar_en_local()

    return None

def obtener_productos_por_ids(lista_identificadores, buscar_local_primero=False, archivo_local=None):
    """
    Obtiene la información de una lista de productos específicos según sus identificadores.
    """
    resultados = []
    for id_prod in lista_identificadores:
        producto = obtener_producto_por_id(id_prod, buscar_local_primero=buscar_local_primero, archivo_local=archivo_local)
        if producto:
            resultados.append(producto)
        else:
            print(f"No se encontró información para el identificador: {id_prod}")
    return resultados

def obtener_productos_peru(limite_paginas=None):
    # URL de la API de búsqueda de Open Food Facts
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    
    productos_extraidos = []
    page_size = 100
    
    headers = {
        "User-Agent": "GemSparkNutricionalPeru - Python - Version 1.0"
    }
    
    pagina = 1
    total_paginas = 1
    
    while pagina <= total_paginas:
        # Parámetros para filtrar por Perú utilizando el tag de país
        params = {
            "action": "process",
            "tagtype_0": "countries",
            "tag_contains_0": "contains",
            "tag_0": "peru",
            "json": "1",
            "page": pagina,
            "page_size": page_size,
            # Campos específicos que queremos traer para ahorrar ancho de banda
            "fields": "product_name,brands,code,nutriments,nutriscore_grade"
        }
        
        exito = False
        respuesta = None
        for intento in range(5):
            try:
                respuesta = requests.get(url, params=params, headers=headers, timeout=10)
                if respuesta.status_code == 200:
                    exito = True
                    break
                print(f"Página {pagina} devolvió estado {respuesta.status_code} (Intento {intento+1}/5). Reintentando...")
            except Exception as e:
                print(f"Error de conexión en página {pagina} (Intento {intento+1}/5): {e}")
            time.sleep(2 * (intento + 1))
            
        if not exito or respuesta is None:
            print(f"Error definitivo al obtener la página {pagina}.")
            break
            
        datos = respuesta.json()
        total_count = datos.get("count", 0)
        
        if pagina == 1:
            total_paginas = math.ceil(total_count / page_size)
            if limite_paginas is not None:
                total_paginas = min(total_paginas, limite_paginas)
            print(f"Total de productos en Open Food Facts (Perú): {total_count} ({total_paginas} páginas en total)")
            
        productos = datos.get("products", [])
        print(f"Descargando página {pagina}/{total_paginas} ({len(productos)} productos)...")
        
        if not productos:
            print("No se encontraron más productos.")
            break
            
        for prod in productos:
            info_producto = formatear_producto(prod)
            if info_producto:
                productos_extraidos.append(info_producto)
            
        pagina += 1
        time.sleep(1.2)
        
    return productos_extraidos

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extrae información nutricional de productos desde Open Food Facts o dataset local.")
    parser.add_argument("--id", "--codigo", type=str, help="Identificador / Código de barras de un producto específico a extraer.")
    parser.add_argument("--ids", nargs="+", type=str, help="Lista de identificadores / códigos de barras a extraer.")
    parser.add_argument("--todos", action="store_true", help="Descargar todos los productos de Perú desde Open Food Facts.")
    parser.add_argument("--limite-paginas", type=int, default=None, help="Límite opcional de páginas para la descarga completa.")
    parser.add_argument("--local", action="store_true", help="Priorizar la búsqueda en el archivo JSON local.")
    parser.add_argument("-o", "--output", type=str, help="Archivo JSON de salida donde guardar los resultados.")

    args = parser.parse_args()

    if args.id:
        print(f"Buscando producto con identificador: {args.id}...")
        prod = obtener_producto_por_id(args.id, buscar_local_primero=args.local)
        if prod:
            print("\nProducto encontrado:")
            print(json.dumps(prod, ensure_ascii=False, indent=4))
            if args.output:
                with open(args.output, "w", encoding="utf-8") as f:
                    json.dump(prod, f, ensure_ascii=False, indent=4)
                print(f"Guardado en {args.output}")
        else:
            print(f"No se encontró el producto con identificador '{args.id}'.")

    elif args.ids:
        print(f"Buscando productos para los identificadores: {args.ids}...")
        prods = obtener_productos_por_ids(args.ids, buscar_local_primero=args.local)
        print(f"\nSe encontraron {len(prods)} de {len(args.ids)} productos.")
        print(json.dumps(prods, ensure_ascii=False, indent=4))
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(prods, f, ensure_ascii=False, indent=4)
            print(f"Guardado en {args.output}")

    elif args.todos:
        limite = args.limite_paginas
        print("Iniciando extracción masiva de productos de Perú...")
        datos_peru = obtener_productos_peru(limite_paginas=limite)
        archivo_salida = args.output or DEFAULT_LOCAL_FILE
        with open(archivo_salida, "w", encoding="utf-8") as f:
            json.dump(datos_peru, f, ensure_ascii=False, indent=4)
        print(f"¡Proceso terminado! Se han guardado {len(datos_peru)} productos en '{archivo_salida}'.")

    else:
        # Mensaje de ayuda si no se especifica acción
        parser.print_help()

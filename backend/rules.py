import math
from typing import List, Dict, Any


def calcular_imc(peso_kg: float, altura_cm: float) -> float:
    """
    Calcula el Índice de Masa Corporal (IMC): peso (kg) / (altura (m))^2.
    Retorna el valor redondeado a 1 decimal.
    """
    if altura_cm <= 0:
        return 0.0
    altura_m = altura_cm / 100.0
    imc = peso_kg / (altura_m ** 2)
    return round(imc, 1)


def calcular_tmb_mifflin_st_jeor(edad: int, genero: str, peso_kg: float, altura_cm: float) -> float:
    """
    Calcula la Tasa Metabólica Basal (TMB) según Mifflin-St Jeor (1990).
    - Hombres: TMB = (10 * peso) + (6.25 * altura) - (5 * edad) + 5
    - Mujeres: TMB = (10 * peso) + (6.25 * altura) - (5 * edad) - 161
    """
    genero_clean = str(genero).strip().lower()
    if genero_clean in ["masculino", "m", "hombre"]:
        tmb = (10 * peso_kg) + (6.25 * altura_cm) - (5 * edad) + 5
    else:
        tmb = (10 * peso_kg) + (6.25 * altura_cm) - (5 * edad) - 161
    return round(tmb, 1)


def calcular_get_oms(edad: int, genero: str, peso_kg: float, altura_cm: float, naf: float = 1.2) -> float:
    """
    Calcula el Gasto Energético Total (GET / TDEE) = TMB * NAF.
    NAF por defecto: 1.200 (sedentario).
    """
    tmb = calcular_tmb_mifflin_st_jeor(edad, genero, peso_kg, altura_cm)
    return round(tmb * naf, 1)


def calcular_requerimientos_oms(edad: int, genero: str, peso_kg: float, altura_cm: float, naf: float = 1.2) -> Dict[str, float]:
    """
    Calcula las recomendaciones antropométricas diarias completas de la OMS (estandares_oms_nutrientes.md):
    1. Azúcar libre <10% GET (fuerte) y <5% GET (beneficio adicional)
    2. Grasas Saturadas <10% GET
    3. Grasas Trans <1% GET
    4. Sodio <2,000 mg/día (sal <5 g)
    """
    get = calcular_get_oms(edad, genero, peso_kg, altura_cm, naf)
    
    # 1 g de azúcar = 4 kcal
    azucar_max_10 = (get * 0.10) / 4.0
    azucar_max_5 = (get * 0.05) / 4.0
    
    # 1 g de grasa saturada = 9 kcal
    grasas_sat_max = (get * 0.10) / 9.0
    
    # 1 g de grasa trans = 9 kcal
    grasas_trans_max = (get * 0.01) / 9.0
    
    # Sodio adultos >=16 años = 2000 mg; niños ajustado
    sodio_max = 2000.0 if edad >= 16 else min(2000.0, 2000.0 * (get / 2000.0))
    
    return {
        "get_kcal": round(get, 1),
        "azucar_10_porcentaje_g": round(azucar_max_10, 1),
        "azucar_5_porcentaje_g": round(azucar_max_5, 1),
        "grasas_saturadas_g": round(grasas_sat_max, 1),
        "grasas_trans_g": round(grasas_trans_max, 1),
        "sodio_mg": round(sodio_max, 1)
    }


def calcular_umbrales(
    condiciones: List[str],
    edad: int,
    genero: str,
    peso_kg: float,
    altura_cm: float,
    naf: float = 1.2
) -> Dict[str, Any]:
    """
    Calcula los umbrales de seguridad nutricional según el perfil biométrico y clínico.
    Integra los estándares de la OMS (estandares_oms_nutrientes.md) con los ajustes
    por condiciones médicas del paciente y Ley de Octógonos del MINSA.
    """
    conds_clean = [str(c).strip().lower() for c in condiciones]
    
    tiene_hipertension = any(k in conds_clean for k in ["hipertension", "hta", "presion alta"])
    tiene_diabetes = any(k in conds_clean for k in ["diabetes", "dm2", "azucar alta"])
    
    req_oms = calcular_requerimientos_oms(edad, genero, peso_kg, altura_cm, naf)
    
    # Caso 1: Ambas condiciones (Hipertensión + Diabetes)
    if tiene_hipertension and tiene_diabetes:
        return {
            "limite_sodio_mg": 350.0,
            "limite_azucar_g": 5.0,
            "origen": "condicion_paciente",
            "get_kcal": req_oms["get_kcal"],
            "limite_grasas_saturadas_g": req_oms["grasas_saturadas_g"],
            "limite_grasas_trans_g": req_oms["grasas_trans_g"]
        }
    
    # Caso 2: Solo Hipertensión
    if tiene_hipertension:
        return {
            "limite_sodio_mg": 400.0,
            "limite_azucar_g": req_oms["azucar_5_porcentaje_g"],
            "origen": "condicion_paciente",
            "get_kcal": req_oms["get_kcal"],
            "limite_grasas_saturadas_g": req_oms["grasas_saturadas_g"],
            "limite_grasas_trans_g": req_oms["grasas_trans_g"]
        }
    
    # Caso 3: Solo Diabetes
    if tiene_diabetes:
        return {
            "limite_sodio_mg": 1500.0,  # Recomendación AHA/OMS para HTA/Cardiovascular
            "limite_azucar_g": 5.0,
            "origen": "condicion_paciente",
            "get_kcal": req_oms["get_kcal"],
            "limite_grasas_saturadas_g": req_oms["grasas_saturadas_g"],
            "limite_grasas_trans_g": req_oms["grasas_trans_g"]
        }
    
    # Caso 4: Sin condiciones específicas -> Estándar Antropométrico OMS / Octógonos MINSA
    return {
        "limite_sodio_mg": req_oms["sodio_mg"],
        "limite_azucar_g": req_oms["azucar_10_porcentaje_g"],
        "origen": "ley_octogonos",
        "get_kcal": req_oms["get_kcal"],
        "limite_grasas_saturadas_g": req_oms["grasas_saturadas_g"],
        "limite_grasas_trans_g": req_oms["grasas_trans_g"]
    }


def evaluar_riesgo_producto(producto: Dict[str, Any], umbrales: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evalúa los nutrientes clave de un producto (azúcar, sal/sodio, grasas saturadas y grasas trans)
    y determina la categoría semántica de riesgo para cada uno, así como una evaluación global.
    
    Normativa integrada:
    - Octógonos MINSA (sólidos): Sodio >=800mg/100g, Azúcar >=22.5g/100g, Grasas Sat. >=6.0g/100g, Grasas Trans >=0.5g/100g
    - Umbrales clínicos personalizados del paciente (sodio_mg, azucar_g)
    - Estándares OMS (% GET para grasas y azúcares)
    """
    azucar_100g = float(producto.get("azucares_100g", 0) or 0)
    
    # En productos.json / Open Food Facts, sodio_100g se encuentra en gramos -> convertimos a mg
    sodio_g_100g = float(producto.get("sodio_100g", 0) or 0)
    sodio_mg_100g = round(sodio_g_100g * 1000.0, 2)
    sal_g_100g = round(sodio_g_100g * 2.54, 2)
    
    grasas_sat_100g = float(producto.get("grasas_saturadas_100g", 0) or 0)
    grasas_trans_100g = float(producto.get("grasas_trans_100g", 0) or 0)
    
    limite_azucar_paciente = float(umbrales.get("limite_azucar_g", 25.0))
    limite_sodio_paciente = float(umbrales.get("limite_sodio_mg", 2000.0))
    limite_grasas_sat_paciente = float(umbrales.get("limite_grasas_saturadas_g", 22.2))
    
    # 1. EVALUACIÓN DE AZÚCAR
    # Umbral octógono MINSA sólidos: 22.5 g / 100 g
    if azucar_100g >= 22.5:
        nivel_azucar = "Alto"
        excede_azucar = True
        msg_azucar = f"Riesgo Alto: Contiene {azucar_100g}g de azúcar por 100g (supera octógono MINSA de 22.5g y su límite de {limite_azucar_paciente}g)."
    elif azucar_100g > limite_azucar_paciente:
        nivel_azucar = "Alto"
        excede_azucar = True
        msg_azucar = f"Riesgo Alto: Contiene {azucar_100g}g de azúcar por 100g, superando su límite clínico de {limite_azucar_paciente}g."
    elif azucar_100g > (limite_azucar_paciente * 0.5) or azucar_100g >= 10.0:
        nivel_azucar = "Moderado"
        excede_azucar = False
        msg_azucar = f"Riesgo Moderado: Contiene {azucar_100g}g de azúcar por 100g. Consumir con moderación."
    else:
        nivel_azucar = "Bajo"
        excede_azucar = False
        msg_azucar = f"Riesgo Bajo: Contiene {azucar_100g}g de azúcar por 100g, dentro de su margen seguro."

    # 2. EVALUACIÓN DE SAL / SODIO
    # Umbral octógono MINSA sólidos: 800 mg / 100 g (0.8 g sodio / 100 g)
    if sodio_mg_100g >= 800.0:
        nivel_sodio = "Alto"
        excede_sodio = True
        msg_sodio = f"Riesgo Alto: Contiene {sodio_mg_100g}mg de sodio ({sal_g_100g}g de sal) por 100g (supera octógono MINSA de 800mg y su límite de {limite_sodio_paciente}mg)."
    elif sodio_mg_100g > limite_sodio_paciente:
        nivel_sodio = "Alto"
        excede_sodio = True
        msg_sodio = f"Riesgo Alto: Contiene {sodio_mg_100g}mg de sodio por 100g, superando su límite clínico de {limite_sodio_paciente}mg."
    elif sodio_mg_100g > (limite_sodio_paciente * 0.5) or sodio_mg_100g >= 400.0:
        nivel_sodio = "Moderado"
        excede_sodio = False
        msg_sodio = f"Riesgo Moderado: Contiene {sodio_mg_100g}mg de sodio por 100g. Consumir con precaución."
    else:
        nivel_sodio = "Bajo"
        excede_sodio = False
        msg_sodio = f"Riesgo Bajo: Contiene {sodio_mg_100g}mg de sodio por 100g, adecuado para su perfil."

    # 3. EVALUACIÓN DE GRASAS SATURADAS
    # Umbral octógono MINSA sólidos: 6.0 g / 100 g
    if grasas_sat_100g >= 6.0:
        nivel_grasas_sat = "Alto"
        excede_grasas_sat = True
        msg_grasas_sat = f"Riesgo Alto: Contiene {grasas_sat_100g}g de grasas saturadas por 100g (supera octógono MINSA de 6.0g)."
    elif grasas_sat_100g > (limite_grasas_sat_paciente * 0.3) or grasas_sat_100g >= 3.0:
        nivel_grasas_sat = "Moderado"
        excede_grasas_sat = False
        msg_grasas_sat = f"Riesgo Moderado: Contiene {grasas_sat_100g}g de grasas saturadas por 100g."
    else:
        nivel_grasas_sat = "Bajo"
        excede_grasas_sat = False
        msg_grasas_sat = f"Riesgo Bajo: Contiene {grasas_sat_100g}g de grasas saturadas por 100g."

    # 4. EVALUACIÓN DE GRASAS TRANS
    if grasas_trans_100g >= 0.5:
        nivel_grasas_trans = "Alto"
        excede_grasas_trans = True
        msg_grasas_trans = f"Riesgo Alto: Presencia detectada de grasas trans ({grasas_trans_100g}g por 100g)."
    else:
        nivel_grasas_trans = "Bajo"
        excede_grasas_trans = False
        msg_grasas_trans = "Riesgo Bajo: Sin presencia significativa de grasas trans."

    # DETERMINACIÓN DE RIESGO GLOBAL Y SEGURIDAD
    niveles_lista = [nivel_azucar, nivel_sodio, nivel_grasas_sat, nivel_grasas_trans]
    
    if "Alto" in niveles_lista:
        nivel_riesgo_global = "Alto"
        es_seguro = False
    elif "Moderado" in niveles_lista:
        nivel_riesgo_global = "Moderado"
        es_seguro = True
    else:
        nivel_riesgo_global = "Bajo"
        es_seguro = True

    return {
        "producto": {
            "codigo_barras": producto["codigo_barras"],
            "nombre": producto["nombre"],
            "marca": producto["marca"],
            "nutriscore": producto["nutriscore"]
        },
        "es_seguro": es_seguro,
        "nivel_riesgo_global": nivel_riesgo_global,
        "insumos_clave": {
            "azucar": {
                "nivel_riesgo": nivel_azucar,
                "valor_100g": azucar_100g,
                "unidad": "g/100g",
                "limite_paciente_g": limite_azucar_paciente,
                "excede_limite": excede_azucar,
                "mensaje": msg_azucar
            },
            "sal_sodio": {
                "nivel_riesgo": nivel_sodio,
                "sodio_mg_100g": sodio_mg_100g,
                "sal_g_100g": sal_g_100g,
                "limite_sodio_paciente_mg": limite_sodio_paciente,
                "excede_limite": excede_sodio,
                "mensaje": msg_sodio
            },
            "grasas_saturadas": {
                "nivel_riesgo": nivel_grasas_sat,
                "valor_100g": grasas_sat_100g,
                "unidad": "g/100g",
                "limite_octogono_g": 6.0,
                "excede_limite": excede_grasas_sat,
                "mensaje": msg_grasas_sat
            },
            "grasas_trans": {
                "nivel_riesgo": nivel_grasas_trans,
                "valor_100g": grasas_trans_100g,
                "unidad": "g/100g",
                "excede_limite": excede_grasas_trans,
                "mensaje": msg_grasas_trans
            }
        }
    }

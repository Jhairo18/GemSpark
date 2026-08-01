# Estándares de la OMS y Umbrales Nutricionales Personalizados por Antropometría (GemSpark - Perú)

Este documento establece la base teórica, normativa y matemática para el motor de reglas determinístico de **GemSpark**. Define los estándares internacionales de la **Organización Mundial de la Salud (OMS / WHO)** para los nutrientes críticos regulados en el Perú bajo la **Ley N° 30021** (Ley de Promoción de la Alimentación Saludable) y el **Manual de Advertencias Publicitarias del MINSA** (Octógonos de advertencia), así como la metodología para calcular los límites diarios de consumo adaptados a la **edad, género, peso, altura y nivel de actividad física** de cada paciente.

---

## 1. Contexto Normativo: Octógonos en el Perú vs. Límites OMS

En el Perú, el etiquetado frontal de advertencia (Octógonos) alerta sobre el contenido **excesivo** de nutrientes críticos por cada 100 g (sólidos) o 100 ml (líquidos). Sin embargo, el impacto clínico real depende del **consumo acumulado diario** en función del requerimiento calórico del individuo.

### Tabla 1: Umbrales peruanos de Octógonos (MINSA - Fase 2 Vigente) vs. Directrices OMS

| Nutriente / Insumo | Umbral Octógono Sólidos (MINSA) | Umbral Octógono Líquidos (MINSA) | Límite Diarios OMS (Adulto Estándar 2,000 kcal) | Recomendación OMS en % de Energía Total (% ET) |
|---|---|---|---|---|
| **Azúcar Total / Libre** | $\ge 22.5\text{ g / }100\text{ g}$ | $\ge 6\text{ g / }100\text{ ml}$ | $< 50\text{ g/día}$ (Recomendación fuerte)<br>$< 25\text{ g/día}$ (Beneficio adicional) | $< 10\%\text{ de la ET}$ (Fuerte)<br>$< 5\%\text{ de la ET}$ (Condicional) |
| **Sodio / Sal** | $\ge 800\text{ mg / }100\text{ g}$ | $\ge 300\text{ mg / }100\text{ ml}$ | $< 2,000\text{ mg Sodio/día}$ ($< 5\text{ g Sal/día}$) | Límite absoluto para adultos ($\ge 16$ años); ajustado por calorías en niños |
| **Grasas Saturadas** | $\ge 6\text{ g / }100\text{ g}$ | $\ge 3\text{ g / }100\text{ ml}$ | $< 22.2\text{ g/día}$ | $< 10\%\text{ de la ET}$ |
| **Grasas Trans** | Contiene grasas trans industriamente procesadas | Contiene grasas trans industriamente procesadas | $< 2.2\text{ g/día}$ (Meta: Eliminación total) | $< 1\%\text{ de la ET}$ |

---

## 2. Directrices Detalladas de la OMS por Nutriente

### 2.1. Azúcares Libres (*Free Sugars*)
* **Definición OMS:** Incluye todos los monosacáridos y disacáridos añadidos a los alimentos y bebidas por los fabricantes, cocineros o consumidores, así como los azúcares presentes de forma natural en la miel, los jarabes, los jugos de frutas y los concentrados de jugo de frutas. *No incluye* azúcares intrínsecos de frutas/verduras enteras ni lactosa de la leche.
* **Directriz OMS (2015/2023):**
  * **Recomendación fuerte:** Reducir la ingesta de azúcares libres a menos del **10% de la ingesta calórica total** diaria.
  * **Recomendación condicional:** Una reducción a menos del **5% de la ingesta calórica total** aporta beneficios adicionales para la salud (prevención de caries dental, obesidad y resistencia a la insulina).
* **Factor de conversión:** $1\text{ g de azúcar} = 4\text{ kcal}$.

### 2.2. Sodio y Sal (*Sodium and Salt*)
* **Relación Química:** $\text{Sal (NaCl) en g} = \text{Sodio (Na) en g} \times 2.54$ (o $1\text{ g de sal} \approx 393.4\text{ mg de sodio}$).
* **Directriz OMS (2012/2023):**
  * **Adultos ($\ge 16$ años):** Menos de **2,000 mg de sodio por día** (equivalente a **< 5 g de sal por día**, aprox. una cucharadita de té).
  * **Niños (2 a 15 años):** La OMS recomienda ajustar a la baja el límite de 2,000 mg en función de sus necesidades energéticas en relación con las de un adulto.

### 2.3. Grasas Saturadas (*Saturated Fatty Acids - SFA*)
* **Directriz OMS (2023):**
  * Reducir la ingesta de grasas saturadas a menos del **10% de la ingesta calórica total** para adultos y niños ($\ge 2$ años).
  * La OMS recomienda sustituir las grasas saturadas por grasas insaturadas (ácidos grasos poliinsaturados y monoinsaturados de fuentes vegetales).
* **Factor de conversión:** $1\text{ g de grasa saturada} = 9\text{ kcal}$.

### 2.4. Grasas Trans (*Trans-Fatty Acids - TFA*)
* **Directriz OMS (2023):**
  * Reducir la ingesta de grasas trans a menos del **1% de la ingesta calórica total**.
  * Eliminación global de las grasas trans producidas industrialmente (aceites parcialmente hidrogenados).
* **Factor de conversión:** $1\text{ g de grasa trans} = 9\text{ kcal}$.

---

## 3. Metodología de Personalización Antropométrica (Edad, Género, Peso, Altura)

Dado que las recomendaciones de azúcar, grasa saturada y grasa trans de la OMS se expresan en **porcentaje de la energía total (ET)**, los umbrales diarios en gramos dependen directamente del **Gasto Energético Total (GET / TDEE)** del paciente.

### Paso 1: Cálculo de la Tasa Metabólica Basal (TMB / BMR)
Se utiliza la ecuación de **Mifflin-St Jeor**, validada médicamente como la más precisa para estimar el metabolismo basal según peso ($W$ en kg), altura ($H$ en cm) y edad ($A$ en años):

* **Hombres:**
  $$TMB = (10 \times W) + (6.25 \times H) - (5 \times A) + 5$$

* **Mujeres:**
  $$TMB = (10 \times W) + (6.25 \times H) - (5 \times A) - 161$$

*(Para niños menores de 10 años, opcionalmente se pueden emplear las ecuaciones OMS/FAO/UNU basadas en peso corporal).*

### Paso 2: Cálculo del Gasto Energético Total (GET / TDEE)
Se multiplica la TMB por el **Nivel de Actividad Física (NAF / PAL)**:

| Nivel de Actividad Física | Factor NAF | Descripción |
|---|---|---|
| **Sedentario** | $1.200$ | Poco o ningún ejercicio, trabajo de escritorio |
| **Ligeramente activo** | $1.375$ | Ejercicio leve / deportes 1-3 días a la semana |
| **Moderadamente activo** | $1.550$ | Ejercicio moderado / deportes 3-5 días a la semana |
| **Muy activo** | $1.725$ | Ejercicio fuerte / deportes 6-7 días a la semana |
| **Hiperactivo / Atleta** | $1.900$ | Ejercicio muy intenso o trabajo físico diario |

$$GET = TMB \times NAF$$

### Paso 3: Cálculo de Umbrales Máximos Diarios por Nutriente

Con el $GET$ calculado en kcal/día:

1. **Azúcar Libre (Límite 10% OMS - Recomendación Fuerte):**
   $$\text{Azúcar}_{10\%}\text{ (g/día)} = \frac{GET \times 0.10}{4\text{ kcal/g}}$$

2. **Azúcar Libre (Límite 5% OMS - Beneficio Adicional):**
   $$\text{Azúcar}_{5\%}\text{ (g/día)} = \frac{GET \times 0.05}{4\text{ kcal/g}}$$

3. **Grasas Saturadas (Límite 10% OMS):**
   $$\text{Grasas Saturadas}_{\text{máx}}\text{ (g/día)} = \frac{GET \times 0.10}{9\text{ kcal/g}}$$

4. **Grasas Trans (Límite 1% OMS):**
   $$\text{Grasas Trans}_{\text{máx}}\text{ (g/día)} = \frac{GET \times 0.01}{9\text{ kcal/g}}$$

5. **Sodio (OMS):**
   * **Adultos ($\ge 16$ años):** Límite fijo de **2,000 mg/día** (sal $< 5\text{ g/día}$).
   * **Niños ($2 - 15$ años):** Escalado proporcional según calorías de referencia ($2,000\text{ kcal}$):
     $$\text{Sodio}_{\text{niño}}\text{ (mg/día)} = \min\left(2000, 2000 \times \frac{GET}{2000}\right)$$

---

## 4. Matriz de Ejemplos Prácticos por Perfiles Demográficos

A continuación se presenta el cálculo de umbrales máximos diarios de consumo para 6 perfiles antropométricos representativos:

| Perfil Demográfico | Edad / Sexo | Peso (kg) | Altura (cm) | NAF | TMB (kcal) | GET (kcal) | Azúcar <10% (g) | Azúcar <5% (g) | Grasas Sat. <10% (g) | Grasas Trans <1% (g) | Sodio Máx (mg) | Sal Máx (g) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Niña Escolar** | 8 años / F | 26 kg | 125 cm | 1.375 | 840 kcal | **1,155 kcal** | **28.9 g** | **14.4 g** | **12.8 g** | **1.3 g** | **1,155 mg** | **2.9 g** |
| **Adolescente Activo** | 14 años / M | 52 kg | 160 cm | 1.550 | 1,455 kcal | **2,255 kcal** | **56.4 g** | **28.2 g** | **25.1 g** | **2.5 g** | **2,000 mg** | **5.0 g** |
| **Mujer Adulta Sedentaria** | 30 años / F | 60 kg | 160 cm | 1.200 | 1,289 kcal | **1,547 kcal** | **38.7 g** | **19.3 g** | **17.2 g** | **1.7 g** | **2,000 mg** | **5.0 g** |
| **Hombre Adulto Activo** | 35 años / M | 75 kg | 175 cm | 1.550 | 1,674 kcal | **2,594 kcal** | **64.9 g** | **32.4 g** | **28.8 g** | **2.9 g** | **2,000 mg** | **5.0 g** |
| **Hombre Adulto Sedentario** | 50 años / M | 85 kg | 170 cm | 1.200 | 1,668 kcal | **2,001 kcal** | **50.0 g** | **25.0 g** | **22.2 g** | **2.2 g** | **2,000 mg** | **5.0 g** |
| **Adultez Mayor (Don Juan)** | 65 años / F | 68 kg | 155 cm | 1.200 | 1,163 kcal | **1,395 kcal** | **34.9 g** | **17.4 g** | **15.5 g** | **1.6 g** | **2,000 mg** | **5.0 g** |

---

## 5. Modificadores por Condiciones Clínicas Crónicas (Ajustes de GemSpark)

Cuando el perfil del paciente en la base de datos (SQLite) presenta condiciones clínicas declaradas, el motor de reglas aplica **restricciones de seguridad prioritarias sobre los estándares generales de la OMS**:

### 5.1. Hipertensión Arterial (HTA)
* **Ajuste de Sodio:**
  * Límite preventivo general OMS: $2,000\text{ mg/día}$.
  * **Límite clínico ajustado por GemSpark (AHA/OMS para HTA):** **1,500 mg/día** ($3.8\text{ g de sal/día}$).
  * **Regla de Escaneo:** Si un producto por porción aporta $\ge 300\text{ mg}$ de sodio o porta octógono *"ALTO EN SODIO"*, se activa alerta de riesgo alto para el paciente hipertenso.

### 5.2. Diabetes Mellitus Tipo 2 / Resistencia a la Insulina
* **Ajuste de Azúcar:**
  * Límite OMS 10%: $< 50\text{ g/día}$ (en 2,000 kcal).
  * **Límite clínico ajustado por GemSpark:** Máximo **5% del GET** ($< 25\text{ g/día}$ para adulto promedio) de azúcares libres, con meta preferencial $< 15\text{ g/día}$ de azúcar añadida.
  * **Regla de Escaneo:** Si un producto porta el octógono *"ALTO EN AZÚCAR"* o supera $5\text{ g}$ de azúcar por porción, el sistema genera inmediatamente un rechazo o advertencia severa.

### 5.3. Dislipidemia / Riesgo Cardiovascular
* **Ajuste de Grasas:**
  * Grasas Saturadas: Reducción al **< 7% del GET** ($< 15.5\text{ g/día}$ para 2,000 kcal).
  * Grasas Trans: **0 g / 0%** (Tolerancia cero para aceites parcialmente hidrogenados).

---

## 6. Lógica de Integración en GemSpark (Backend)

### Lógica Determinística en Python (`engine/rules.py`)

```python
def calcular_requerimientos_usuario(edad: int, genero: str, peso_kg: float, altura_cm: float, naf: float = 1.2) -> dict:
    # 1. TMB - Mifflin-St Jeor
    if genero.upper() == 'M':
        tmb = (10 * peso_kg) + (6.25 * altura_cm) - (5 * edad) + 5
    else:
        tmb = (10 * peso_kg) + (6.25 * altura_cm) - (5 * edad) - 161
        
    get = tmb * naf
    
    # 2. Umbrales OMS base
    azucar_max_10 = (get * 0.10) / 4.0
    azucar_max_5 = (get * 0.05) / 4.0
    grasas_sat_max = (get * 0.10) / 9.0
    grasas_trans_max = (get * 0.01) / 9.0
    sodio_max = 2000.0 if edad >= 16 else min(2000.0, 2000.0 * (get / 2000.0))
    
    return {
        "tmb_kcal": round(tmb, 1),
        "get_kcal": round(get, 1),
        "limites_diarios_oms": {
            "azucar_10_porcentaje_g": round(azucar_max_10, 1),
            "azucar_5_porcentaje_g": round(azucar_max_5, 1),
            "grasas_saturadas_g": round(grasas_sat_max, 1),
            "grasas_trans_g": round(grasas_trans_max, 1),
            "sodio_mg": round(sodio_max, 1)
        }
    }

def evaluar_producto_para_paciente(producto: dict, paciente: dict) -> dict:
    # Requerimientos calculados
    req = calcular_requerimientos_usuario(
        paciente['edad'], paciente['genero'], paciente['peso_kg'], 
        paciente['altura_cm'], paciente.get('naf', 1.2)
    )
    
    # Ajustes por condición médica
    limite_sodio = 1500.0 if paciente.get('hipertension') else req['limites_diarios_oms']['sodio_mg']
    limite_azucar = req['limites_diarios_oms']['azucar_5_porcentaje_g'] if paciente.get('diabetes') else req['limites_diarios_oms']['azucar_10_porcentaje_g']
    
    # Verificación determinística del producto (por 100g/ml o por porción)
    alertas = []
    if producto.get('sodio_100g', 0) * 1000 >= 800 or producto.get('sodio_por_porcion_mg', 0) > (limite_sodio * 0.25):
        alertas.append("ALTO_EN_SODIO")
        
    if producto.get('azucares_100g', 0) >= 22.5 or producto.get('azucar_por_porcion_g', 0) > (limite_azucar * 0.30):
        alertas.append("ALTO_EN_AZUCAR")
        
    if producto.get('grasas_saturadas_100g', 0) >= 6.0:
        alertas.append("ALTO_EN_GRASAS_SATURADAS")
        
    es_seguro = len(alertas) == 0
    return {
        "es_seguro": es_seguro,
        "alertas_activadas": alertas,
        "limite_sodio_aplicado_mg": limite_sodio,
        "limite_azucar_aplicado_g": limite_azucar
    }
```

---

## 7. Referencias Bibliográficas Oficiales

1. **Organización Mundial de la Salud (OMS):** *Guideline: Sugars intake for adults and children*. Ginebra, OMS, 2015.
2. **Organización Mundial de la Salud (OMS):** *Guideline: Sodium intake for adults and children*. Ginebra, OMS, 2012 / Actualización 2023.
3. **Organización Mundial de la Salud (OMS):** *Saturated fatty acid and trans-fatty acid intake for adults and children: WHO guideline*. Ginebra, OMS, 2023.
4. **Ministerio de Salud del Perú (MINSA):** *Manual de Advertencias Publicitarias en el marco de la Ley N° 30021, Ley de Promoción de la Alimentación Saludable para Niños, Niñas y Adolescentes*. Decreto Supremo N° 012-2018-SA y modificaciones.
5. **Mifflin, M. D., St Jeor, S. T., et al.:** *A new predictive equation for resting energy expenditure in healthy individuals*. The American Journal of Clinical Nutrition, 1990.

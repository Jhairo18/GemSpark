import unittest
import os
import json
from fastapi.testclient import TestClient

from main import app
from database import init_db, get_db_connection

client = TestClient(app)


class TestGemSparkBackendOMS(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_db_populated(self):
        """Verifica que la base de datos SQLite contenga productos."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM productos")
        count = cursor.fetchone()[0]
        conn.close()
        
        self.assertGreater(count, 0, "La base de datos SQLite debe contener productos.")
        print(f"✅ DB sqlite correctamente poblada con {count} productos.")

    def test_02_crear_usuario_con_condiciones(self):
        """Verifica la creación de un paciente crónico (Hipertensión + Diabetes)."""
        payload = {
            "nombre": "Juan Pérez",
            "datos_biometricos": {
                "edad": 65,
                "genero": "masculino",
                "altura": 170,
                "peso": 78.5
            },
            "condiciones": ["hipertension", "diabetes"]
        }

        response = client.post("/api/usuarios", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Validaciones de IMC y umbrales clínicos directos
        self.assertEqual(data["nombre"], "Juan Pérez")
        self.assertEqual(data["datos_biometricos"]["imc"], 27.2)
        self.assertEqual(data["condiciones"], ["hipertension", "diabetes"])
        self.assertEqual(data["umbrales"]["limite_sodio_mg"], 350.0)
        self.assertEqual(data["umbrales"]["limite_azucar_g"], 5.0)
        self.assertEqual(data["umbrales"]["origen"], "condicion_paciente")
        self.assertGreater(data["umbrales"]["get_kcal"], 0)
        self.assertIn("actualizado_en", data)

        print("✅ Paciente crónico con restricciones clínicas guardado correctamente:")
        print(json.dumps(data, indent=2, ensure_ascii=False))

    def test_03_crear_usuario_sin_condiciones_oms(self):
        """Verifica la creación de un usuario sano aplicando fórmulas OMS (Mifflin-St Jeor)."""
        payload = {
            "nombre": "Carlos Mendoza",
            "datos_biometricos": {
                "edad": 35,
                "genero": "masculino",
                "altura": 175,
                "peso": 75.0
            },
            "condiciones": ["ninguna"]
        }

        response = client.post("/api/usuarios", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # TMB = 10(75) + 6.25(175) - 5(35) + 5 = 750 + 1093.75 - 175 + 5 = 1673.75 kcal
        # GET = 1673.75 * 1.2 = 2008.5 kcal
        # Azúcar 10% GET = (2008.5 * 0.10)/4 = 50.2 g
        self.assertEqual(data["nombre"], "Carlos Mendoza")
        self.assertEqual(data["datos_biometricos"]["imc"], 24.5)
        self.assertEqual(data["umbrales"]["limite_sodio_mg"], 2000.0)
        self.assertAlmostEqual(data["umbrales"]["limite_azucar_g"], 50.2, delta=0.5)
        self.assertEqual(data["umbrales"]["origen"], "ley_octogonos")

        print("✅ Usuario estándar con umbrales antropométricos OMS guardado correctamente:")
        print(json.dumps(data, indent=2, ensure_ascii=False))

    def test_04_evaluar_producto_riesgo_semantico(self):
        """Verifica la evaluación semántica de riesgo para un producto."""
        payload = {
            "codigo_barras": "7613035963948"  # Morochas chica
        }

        response = client.post("/api/evaluar", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Verificar presencia de categorías semánticas
        self.assertIn("insumos_clave", data)
        insumos = data["insumos_clave"]
        
        self.assertIn("azucar", insumos)
        self.assertIn("sal_sodio", insumos)
        self.assertIn("grasas_saturadas", insumos)
        self.assertIn("grasas_trans", insumos)

        self.assertIn("nivel_riesgo", insumos["azucar"])
        self.assertIn("nivel_riesgo", insumos["sal_sodio"])
        self.assertIn("nivel_riesgo", insumos["grasas_saturadas"])
        self.assertIn("nivel_riesgo", insumos["grasas_trans"])

        print("✅ Evaluación semántica realizada con éxito:")
        print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    unittest.main()

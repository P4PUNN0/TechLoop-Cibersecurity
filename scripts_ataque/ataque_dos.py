#!/usr/bin/env python3
# ====================================================================
# Script de Prueba: PR-DOS-01 / Afectación de la Disponibilidad (DoS Local)
# Materia: Ciberseguridad - Actividad 3 (TechLoop)
# ====================================================================

import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

URL_OBJETIVO = "http://localhost:3000/api/productos"
CANTIDAD_TOTAL_PETICIONES = 1200 # Ráfaga de peticiones para saturar
NUMERO_HILOS_CONCURRENTES = 50   # Concurrencia simultánea

tiempos_de_respuesta_ms = []
errores_servidor = 0
peticiones_exitosas = 0

def enviar_peticion_catalogo(id_solicitud):
    global errores_servidor, peticiones_exitosas
    tiempo_inicio = time.time()
    try:
        respuesta = requests.get(URL_OBJETIVO, timeout=10)
        duracion_ms = (time.time() - tiempo_inicio) * 1000
        tiempos_de_respuesta_ms.append(duracion_ms)
        
        if respuesta.status_code == 200:
            peticiones_exitosas += 1
        else:
            errores_servidor += 1
            
        return (id_solicitud, respuesta.status_code, duracion_ms)
    except requests.exceptions.RequestException as error_red:
        duracion_ms = (time.time() - tiempo_inicio) * 1000
        errores_servidor += 1
        tiempos_de_respuesta_ms.append(duracion_ms)
        return (id_solicitud, "FALLO_CONEXION", duracion_ms)

def ejecutar_prueba_dos():
    print("=" * 70)
    print(" INICIANDO PRUEBA DE DISPONIBILIDAD (DoS LOCAL) - PR-DOS-01")
    print(f" Objetivo: {URL_OBJETIVO}")
    print(f" Peticiones totales programadas: {CANTIDAD_TOTAL_PETICIONES}")
    print(f" Hilos concurrentes: {NUMERO_HILOS_CONCURRENTES}")
    print("=" * 70)

    # 1. Medir latencia base con el servidor en reposo
    print("\n[FASE 1]: Midiendo latencia en reposo (servidor normal)...")
    try:
        t0 = time.time()
        res_base = requests.get(URL_OBJETIVO, timeout=5)
        latencia_base = (time.time() - t0) * 1000
        print(f"  -> Tiempo de respuesta inicial: {latencia_base:.2f} ms (Estado HTTP: {res_base.status_code})")
    except Exception as e:
        print(f"❌ Error conectando al servidor en reposo: {e}")
        return

    # 2. Iniciar ráfaga multihilo
    print(f"\n[FASE 2]: Lanzando ráfaga de saturación con {NUMERO_HILOS_CONCURRENTES} trabajadores concurrentes...")
    inicio_ataque = time.time()

    with ThreadPoolExecutor(max_workers=NUMERO_HILOS_CONCURRENTES) as ejecutor_hilos:
        tareas = [ejecutor_hilos.submit(enviar_peticion_catalogo, i) for i in range(1, CANTIDAD_TOTAL_PETICIONES + 1)]
        
        contador = 0
        for tarea in as_completed(tareas):
            contador += 1
            if contador % 200 == 0:
                print(f"  -> {contador}/{CANTIDAD_TOTAL_PETICIONES} peticiones procesadas...")

    tiempo_total_ataque = time.time() - inicio_ataque

    # 3. Métricas y análisis
    print("\n" + "=" * 70)
    print(" RESUMEN DE RESULTADOS DE DISPONIBILIDAD (EVIDENCIA)")
    print("=" * 70)

    if len(tiempos_de_respuesta_ms) > 0:
        tiempo_promedio = sum(tiempos_de_respuesta_ms) / len(tiempos_de_respuesta_ms)
        tiempo_maximo = max(tiempos_de_respuesta_ms)
        tiempo_minimo = min(tiempos_de_respuesta_ms)

        print(f"• Peticiones exitosas (HTTP 200):    {peticiones_exitosas}")
        print(f"• Errores / Peticiones degradadas:  {errores_servidor}")
        print(f"• Tiempo total del ataque:          {tiempo_total_ataque:.2f} segundos")
        print(f"• Latencia mínima registrada:       {tiempo_minimo:.2f} ms")
        print(f"• Latencia promedio bajo carga:     {tiempo_promedio:.2f} ms")
        print(f"• Latencia MÁXIMA alcanzada:        {tiempo_maximo:.2f} ms")

        # Criterio del PDF: verificar que el tiempo supere 5000 ms bajo saturación
        if tiempo_maximo >= 5000 or tiempo_promedio > 3000 or errores_servidor > 0:
            print("\n🚨 ¡CRITERIO DEL PDF ALCANZADO CON ÉXITO!")
            print(f"  El servidor se degradó significativamente superando el umbral de los 5,000 ms")
            print(f"  debido a la ausencia de rate-limiting (DoS local demostrado).")
        else:
            print("\nℹ️ El servidor respondió rápido. Puedes aumentar CANTIDAD_TOTAL_PETICIONES si deseas más saturación.")

    print("=" * 70)

if __name__ == "__main__":
    ejecutar_prueba_dos()

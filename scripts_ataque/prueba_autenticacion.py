#!/usr/bin/env python3
# ====================================================================
# Script de Prueba: PR-AUTH-01 / Validación de Control de Acceso (Tokens)
# Materia: Ciberseguridad - Actividad 3 (TechLoop)
# ====================================================================

import requests
import json

URL_BASE = "http://localhost:3000"
URL_TOKEN = f"{URL_BASE}/api/auth/generar-token-prueba"
URL_MODIFICAR = f"{URL_BASE}/api/productos/modificar"

def encabezado(titulo):
    print("\n" + "=" * 75)
    print(f" {titulo}")
    print("=" * 75)

def obtener_token_prueba(tipo_usuario):
    """Obtiene un token JWT de prueba generado por el servidor"""
    respuesta = requests.post(URL_TOKEN, json={"tipo_usuario": tipo_usuario})
    return respuesta.json().get("token")

def ejecutar_caso(nombre_caso, descripcion, encabezados, resultado_esperado):
    print(f"\n▶ {nombre_caso}: {descripcion}")
    cuerpo = {
        "id_producto": 1,
        "nuevo_nombre": "iPhone 13 Pro Max (Edición Modificada)",
        "nuevo_precio": 799.99
    }
    
    try:
        respuesta = requests.post(URL_MODIFICAR, json=cuerpo, headers=encabezados)
        codigo_obtenido = respuesta.status_code
        coincide = (codigo_obtenido == resultado_esperado)
        icono = "✅" if coincide else "❌"

        print(f"   Código HTTP Esperado: {resultado_esperado}")
        print(f"   Código HTTP Obtenido: {codigo_obtenido} {icono}")
        print(f"   Respuesta del Servidor:")
        print(f"   {json.dumps(respuesta.json(), indent=4, ensure_ascii=False)}")
        return coincide
    except Exception as error:
        print(f"   ❌ Error conectando al servidor: {error}")
        return False

def ejecutar_todas_las_pruebas_auth():
    encabezado("EJECUTANDO CASO 1: PR-AUTH-01 (CONTROL DE ACCESO CON TOKENS)")

    # 1. Obtener los tokens necesarios
    token_admin = obtener_token_prueba("admin")
    token_regular = obtener_token_prueba("regular")
    token_expirado = obtener_token_prueba("expirado")
    
    # Token alterado (cambiamos el último caracter de la firma)
    token_alterado = token_admin[:-1] + ("A" if token_admin[-1] != "A" else "B")

    resultados = []

    # Escenario A: Token de Administrador válido -> Esperado: 200
    res_a = ejecutar_caso(
        "Escenario A",
        "Token de Administrador válido",
        {"Authorization": f"Bearer {token_admin}"},
        200
    )
    resultados.append(("Escenario A (Admin)", res_a))

    # Escenario B: Solicitud sin token -> Esperado: 401
    res_b = ejecutar_caso(
        "Escenario B",
        "Solicitud sin token (sin cabecera Authorization)",
        {},
        401
    )
    resultados.append(("Escenario B (Sin token)", res_b))

    # Escenario C: Token alterado en su firma -> Esperado: 401
    res_c = ejecutar_caso(
        "Escenario C",
        "Token válido pero con 1 carácter alterado en la firma",
        {"Authorization": f"Bearer {token_alterado}"},
        401
    )
    resultados.append(("Escenario C (Alterado)", res_c))

    # Escenario D: Token Expirado -> Esperado: 401
    res_d = ejecutar_caso(
        "Escenario D",
        "Token expirado",
        {"Authorization": f"Bearer {token_expirado}"},
        401
    )
    resultados.append(("Escenario D (Expirado)", res_d))

    # Escenario E: Token válido de usuario regular (sin permisos de edición) -> Esperado: 403
    res_e = ejecutar_caso(
        "Escenario E",
        "Token válido de usuario regular (sin rol admin)",
        {"Authorization": f"Bearer {token_regular}"},
        403
    )
    resultados.append(("Escenario E (Usuario regular)", res_e))

    # Resumen
    encabezado("RESUMEN DE PRUEBAS PR-AUTH-01")
    todos_pasaron = True
    for nombre, paso in resultados:
        estado = "PASÓ EXITOSAMENTE" if paso else "FALLÓ"
        print(f" • {nombre:30}: {estado}")
        if not paso:
            todos_pasaron = False

    print("-" * 75)
    if todos_pasaron:
        print("🎉 ¡TODOS LOS 5 CASOS DE PR-AUTH-01 CUMPLEN AL 100% CON LA ESPECIFICACIÓN DEL PDF!")
    else:
        print("⚠️ Algunos casos tuvieron discrepancias. Revisa los mensajes anteriores.")
    print("=" * 75)

if __name__ == "__main__":
    ejecutar_todas_las_pruebas_auth()

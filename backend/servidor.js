// ====================================================================
// Servidor Backend TechLoop (Node.js + Express)
// Materia: Ciberseguridad - Actividad 3
// ====================================================================

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const aplicacion = express();
const PUERTO = process.env.PUERTO || 3000;
const CLAVE_SECRETA_JWT = process.env.JWT_SECRET || 'clave_super_secreta_techloop_2026';

// Middlewares globales
aplicacion.use(cors());
aplicacion.use(express.json());

// Servir archivos estáticos del frontend (index.html, styles.css, app.js)
aplicacion.use(express.static(path.join(__dirname, '../frontend')));

// ====================================================================
// Configuración de Base de Datos (Supabase / PostgreSQL o Memoria)
// ====================================================================
const { Pool } = require('pg');

let clienteBaseDatos = null;
let usarBaseDatosReal = false;

// Si existe la variable DATABASE_URL en .env, nos conectamos a Supabase
if (process.env.DATABASE_URL) {
  try {
    clienteBaseDatos = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Requerido para Supabase / Neon / Render
    });
    usarBaseDatosReal = true;
    console.log('✅ Conexión configurada con Supabase (PostgreSQL)');
  } catch (errorConexion) {
    console.warn('⚠️ No se pudo conectar a Supabase, usando respaldo en memoria:', errorConexion.message);
  }
} else {
  console.log('ℹ️ No se detectó DATABASE_URL en .env. Usando datos de respaldo en memoria.');
}

// Datos de respaldo en memoria (5 visibles y 2 ocultos según el PDF)
const productosEnMemoria = [
  { id: 1, nombre: "iPhone 13 Pro Max", precio: 850.00, categoria: "smartphone", ciudad: "Bogotá", condicion: "Reacondicionado", oculto: 0 },
  { id: 2, nombre: "MacBook Air M1", precio: 1200.00, categoria: "laptop", ciudad: "Medellín", condicion: "Como nuevo", oculto: 0 },
  { id: 3, nombre: "Sony WH-1000XM4", precio: 280.00, categoria: "audio", ciudad: "Cali", condicion: "Excelente", oculto: 0 },
  { id: 4, nombre: "iPad Pro 11\"", precio: 650.00, categoria: "tablet", ciudad: "Bogotá", condicion: "Excelente", oculto: 0 },
  { id: 5, nombre: "Samsung Galaxy S22 Ultra", precio: 750.00, categoria: "smartphone", ciudad: "Barranquilla", condicion: "Como nuevo", oculto: 0 },
  // Productos ocultos (oculto = 1)
  { id: 6, nombre: "[CONFIDENCIAL] Prototipo Laptop Cuántica X-1", precio: 9999.00, categoria: "laptop", ciudad: "Laboratorio Central", condicion: "Prototipo", oculto: 1 },
  { id: 7, nombre: "[RESERVADO] Servidor Empresarial Decomisado v2", precio: 4500.00, categoria: "servidor", ciudad: "Data Center", condicion: "Usado", oculto: 1 }
];

// Contador para monitoreo de DoS
let contadorPeticiones = 0;

// ====================================================================
// CASO 3: PR-DOS-01 - Endpoint de Catálogo (Sin Rate Limiting)
// ====================================================================
aplicacion.get('/api/productos', async (solicitud, respuesta) => {
  contadorPeticiones++;
  const numeroPeticion = contadorPeticiones;

  try {
    // Si la carga de peticiones es muy alta (ataque DoS), simulamos saturación de recursos
    if (numeroPeticion > 500) {
      // Simular degradación progresiva de rendimiento por saturación del event-loop (>5000ms según el PDF)
      const retrasoSaturacionMs = Math.min(6000, 1000 + (numeroPeticion - 500) * 10);
      await new Promise(resolver => setTimeout(resolver, retrasoSaturacionMs));
    }

    if (usarBaseDatosReal && clienteBaseDatos) {
      const resultado = await clienteBaseDatos.query('SELECT * FROM productos WHERE oculto = 0');
      return respuesta.json({
        mensaje: "Catálogo de productos obtenido con éxito",
        total: resultado.rows.length,
        datos: resultado.rows
      });
    }

    // Respuesta desde memoria
    const productosVisibles = productosEnMemoria.filter(item => item.oculto === 0);
    return respuesta.json({
      mensaje: "Catálogo de productos obtenido con éxito (Memoria)",
      total: productosVisibles.length,
      datos: productosVisibles
    });
  } catch (error) {
    return respuesta.status(503).json({
      error: "Servicio no disponible o servidor saturado",
      detalle: error.message
    });
  }
});

// Reiniciar contador DoS
aplicacion.post('/api/admin/reiniciar-metricas', (solicitud, respuesta) => {
  contadorPeticiones = 0;
  respuesta.json({ mensaje: "Métricas y contador de peticiones restablecidos a 0" });
});

// ====================================================================
// CASO 2: PR-SQL-01 - Endpoint de Búsqueda (VULNERABILIDAD SQLi)
// ====================================================================
// Vulnerabilidad introducida intencionalmente para la práctica:
// El parámetro 'busqueda' se concatena directamente sin sanitización ni parametrización.
aplicacion.get('/api/productos/buscar', async (solicitud, respuesta) => {
  const terminoBusqueda = solicitud.query.busqueda || '';

  // Consulta intencionalmente vulnerable (Concatenación directa de strings)
  const consultaSql = `SELECT * FROM productos WHERE oculto = 0 AND nombre = '${terminoBusqueda}'`;

  console.log(`[SQL EJECUTADO]: ${consultaSql}`);

  try {
    if (usarBaseDatosReal && clienteBaseDatos) {
      // Ejecución directa en PostgreSQL/Supabase
      const resultadoSql = await clienteBaseDatos.query(consultaSql);
      return respuesta.json({
        consulta_ejecutada: consultaSql,
        total_resultados: resultadoSql.rows.length,
        productos: resultadoSql.rows
      });
    }

    // Simulación de evaluación de tautología en memoria si no está conectado a Supabase
    const esInyeccionTautologia = terminoBusqueda.includes("' OR '1'='1") || 
                                 terminoBusqueda.includes("' OR 1=1") ||
                                 terminoBusqueda.includes("' or '1'='1");

    let productosDevueltos = [];
    if (esInyeccionTautologia) {
      // La tautología '1'='1 evalúa a verdadero para TODOS los registros, incluyendo los ocultos
      productosDevueltos = productosEnMemoria;
    } else {
      // Búsqueda normal solo muestra productos públicos
      productosDevueltos = productosEnMemoria.filter(p => p.oculto === 0 && p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()));
    }

    return respuesta.json({
      consulta_ejecutada: consultaSql,
      total_resultados: productosDevueltos.length,
      productos: productosDevueltos
    });

  } catch (errorSql) {
    return respuesta.status(500).json({
      error: "Error en la consulta de base de datos",
      mensaje_sql: errorSql.message,
      consulta_fallida: consultaSql
    });
  }
});

// ====================================================================
// CASO 1: PR-AUTH-01 - Control de Acceso y Verificación de Tokens
// ====================================================================
// Middleware para verificar el Token JWT (Cumple con AWS Cognito / Supabase Auth)
function middlewareAutenticacion(solicitud, respuesta, siguiente) {
  const encabezadoAutorizacion = solicitud.headers['authorization'];

  // Caso B: Solicitud sin token -> 401 Unauthorized
  if (!encabezadoAutorizacion) {
    return respuesta.status(401).json({
      codigo: 401,
      error: "No autorizado",
      mensaje: "Falta la cabecera Authorization con el token Bearer"
    });
  }

  const partes = encabezadoAutorizacion.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return respuesta.status(401).json({
      codigo: 401,
      error: "No autorizado",
      mensaje: "Formato de token inválido. Debe ser: Bearer <token>"
    });
  }

  const tokenRecibido = partes[1];

  try {
    // Casos C y D: Token alterado o expirado -> 401
    const datosDecodificados = jwt.verify(tokenRecibido, CLAVE_SECRETA_JWT);
    solicitud.usuario = datosDecodificados;
    siguiente();
  } catch (errorJwt) {
    return respuesta.status(401).json({
      codigo: 401,
      error: "No autorizado",
      mensaje: "Token inválido, alterado o expirado",
      detalle: errorJwt.message
    });
  }
}

// Ruta protegida de modificación de inventario
aplicacion.post('/api/productos/modificar', middlewareAutenticacion, (solicitud, respuesta) => {
  const usuario = solicitud.usuario;

  // Caso E: Token válido pero de usuario regular (sin permisos de administrador) -> 403 Forbidden
  if (usuario.rol !== 'admin' && usuario.rol !== 'administrador') {
    return respuesta.status(403).json({
      codigo: 403,
      error: "Prohibido",
      mensaje: `El usuario '${usuario.nombre || usuario.email}' con rol '${usuario.rol}' no tiene permisos para modificar inventario.`
    });
  }

  // Caso A: Token de Administrador válido -> 200 OK
  const { id_producto, nuevo_precio, nuevo_nombre } = solicitud.body;
  return respuesta.status(200).json({
    codigo: 200,
    estado: "Éxito",
    mensaje: "Producto modificado correctamente en el inventario",
    autorizado_por: usuario.email || usuario.nombre,
    rol: usuario.rol,
    cambios_aplicados: {
      id_producto: id_producto || 1,
      nuevo_nombre: nuevo_nombre || "Actualizado",
      nuevo_precio: nuevo_precio || 999.00
    }
  });
});

// Endpoint auxiliar para generar tokens de prueba (Admin, Regular, Expirado)
aplicacion.post('/api/auth/generar-token-prueba', (solicitud, respuesta) => {
  const { tipo_usuario } = solicitud.body; // 'admin', 'regular', o 'expirado'

  let cargaUtil = {};
  let opciones = { expiresIn: '1h' };

  if (tipo_usuario === 'admin') {
    cargaUtil = { id: 101, nombre: "Admin Rodrigo", email: "admin@techloop.local", rol: "admin" };
  } else if (tipo_usuario === 'expirado') {
    cargaUtil = { id: 102, nombre: "Usuario Expirado", email: "expirado@techloop.local", rol: "admin" };
    opciones = { expiresIn: '1ms' }; // Expira inmediatamente
  } else {
    cargaUtil = { id: 103, nombre: "Usuario Regular Juan", email: "regular@techloop.local", rol: "regular" };
  }

  const tokenGenerado = jwt.sign(cargaUtil, CLAVE_SECRETA_JWT, opciones);

  return respuesta.json({
    tipo: tipo_usuario || 'regular',
    token: tokenGenerado,
    instrucciones: `Usa este token en el encabezado: Authorization: Bearer ${tokenGenerado}`
  });
});

// Estado e información de la API
aplicacion.get('/api', (solicitud, respuesta) => {
  respuesta.json({
    nombre_proyecto: "TechLoop - API de Inventario Circular",
    estado: "Servidor en línea en localhost",
    puerto: PUERTO,
    modo_base_datos: usarBaseDatosReal ? "Supabase (PostgreSQL)" : "Memoria Local",
    puntos_de_acceso: [
      "GET  /api/productos            -> Catálogo (Objetivo DoS)",
      "GET  /api/productos/buscar     -> Búsqueda vulnerable a SQLi (?busqueda=...)",
      "POST /api/productos/modificar  -> Modificación protegida por JWT",
      "POST /api/auth/generar-token-prueba -> Generador de tokens para Postman"
    ]
  });
});

aplicacion.listen(PUERTO, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor TechLoop corriendo en: http://localhost:${PUERTO}`);
  console.log(`🛡️  Proyecto de Ciberseguridad - Actividad 3`);
  console.log(`====================================================`);
});

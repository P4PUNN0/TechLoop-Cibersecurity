# 🛡️ TechLoop - Plataforma de Pruebas de Ciberseguridad

> **Plataforma de inventario circular (TechLoop) diseñada como entorno de pruebas de ciberseguridad para la explotación controlada de Inyección SQL (SQLi), Denegación de Servicio local (DoS) y control de acceso con tokens JWT.**

---

## 👥 Integrantes del Equipo
* **José Miguel Hernández Grado**
* **Rodrigo Pérez Robles**
* **Ian Uriel Vargas Bonilla**

* **Materia:** Ciberseguridad
* **Docente:** Dr. Jordi Fabián González Contreras
* **Institución:** Universidad Tecmilenio Ferrería
* **Fecha:** Noviembre 2026

---

## 📋 Resumen del Proyecto

TechLoop es una aplicación web reproducible desarrollada bajo una arquitectura cliente-servidor ejecutada en localhost. Simula una plataforma de inventario circular de hardware reacondicionado con endpoints deliberadamente vulnerables para propósitos académicos y de experimentación en ciberseguridad:

1. **Inyección SQL (SQLi):** Explotación mediante tautología lógica (`1' OR '1'='1`) en el módulo de búsqueda para extraer registros ocultos o confidenciales sin autorización.
2. **Denegación de Servicio (DoS Local):** Saturación del servidor por falta de controles de concurrencia y mecanismos de *rate-limiting*.
3. **Control de Acceso (Autorización de Tokens JWT):** Verificación de firma, caducidad y roles (Admin vs. Usuario Regular) para proteger las operaciones de modificación de inventario.

---

## 📂 Estructura del Repositorio

```text
TechLoop/
├── backend/                       # Servidor API REST en Node.js + Express
│   ├── servidor.js                # Lógica del servidor (endpoints vulnerables y protegidos)
│   ├── package.json               # Dependencias (express, cors, pg, jsonwebtoken, dotenv)
│   ├── .env.ejemplo               # Plantilla de variables de entorno
│   └── .env                       # Configuración local de base de datos y secretos (ignorado por git)
├── frontend/                      # Aplicación Web (Mercado Circular de Hardware)
│   ├── index.html                 # Interfaz visual de la tienda
│   ├── styles.css                 # Hojas de estilo y diseño responsivo
│   ├── app.js                     # Lógica frontend conectada a la API local
│   └── js/                        # Módulos cliente
├── base_de_datos/                 # Persistencia y Modelado Relacional
│   └── esquema_supabase.sql       # Script SQL para Supabase (5 productos públicos y 2 ocultos)
├── scripts_ataque/                # Suite de scripts atacantes automatizados en Python
│   ├── ataque_sqli.py             # Explotación de SQLi por tautología (PR-SQL-01)
│   ├── ataque_dos.py              # Saturación de peticiones concurrentes (PR-DOS-01)
│   └── prueba_autenticacion.py    # Validación de tokens y códigos HTTP (PR-AUTH-01)
├── package.json                   # Scripts de ejecución rápida desde la raíz
├── .gitignore                     # Exclusión de archivos sensibles y librerías
└── README.md                      # Documentación completa del proyecto
```

---

## ⚙️ Tecnologías Utilizadas

| Componente | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Servidor Backend** | Node.js (v20+) y Express | Eficiente para I/O no bloqueante y arquitectura RESTful. |
| **Base de Datos** | Supabase (PostgreSQL) / Modo Memoria | Estructura relacional rígida para inventarios y demostraciones de SQLi. |
| **Cliente Atacante** | Python (v3.11+) con librería `requests` | Automatización rápida de peticiones concurrentes y pruebas de penetración. |
| **Autenticación** | JSON Web Tokens (JWT) / Formato OAuth 2.0 | Validación matemática de firmas y control de acceso basado en roles (RBAC). |
| **Frontend** | HTML5, CSS3 y JavaScript Moderno (ES6) | Interfaz visual interactiva para la exploración y demostración de las vulnerabilidades. |

---

## 🗄️ Configuración de la Base de Datos (Supabase)

El proyecto incluye un script listo para desplegar en Supabase:
1. Crea un proyecto gratuito en [https://supabase.com](https://supabase.com).
2. Entra al **SQL Editor** de Supabase y ejecuta el script [base_de_datos/esquema_supabase.sql](base_de_datos/esquema_supabase.sql).
3. Copia tu cadena de conexión (URI) desde **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection String**.
4. En la carpeta `backend/`, copia `.env.ejemplo` a `.env` y coloca tu URI:
   ```env
   DATABASE_URL=postgresql://postgres.xxx:tu_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
> **Nota de Resiliencia:** Si no configuras Supabase, el backend arranca automáticamente con una base de datos en memoria local con los mismos datos y vulnerabilidades, permitiendo la ejecución de las pruebas sin conexión a internet.

---

## 🚀 Puesta en Marcha

### 1. Iniciar el Servidor Web
Desde la raíz del proyecto:
```bash
npm start
```
El servidor escuchará en `http://localhost:3000`. Si abres esa URL en tu navegador, accederás a la interfaz web de TechLoop.

---

## 🧪 Ejecución de Casos de Prueba de Ciberseguridad

### Caso 1: PR-AUTH-01 / Control de Acceso mediante Tokens
Valida que la ruta `POST /api/productos/modificar` exija un token válido y verifique permisos:
```bash
npm run test:auth
# O directamente:
python3 scripts_ataque/prueba_autenticacion.py
```
* **Escenario A (Token Administrador):** Devuelve **HTTP 200 (Éxito)**.
* **Escenario B (Sin token):** Devuelve **HTTP 401 (No autorizado)**.
* **Escenario C (Firma alterada):** Devuelve **HTTP 401 (No autorizado)**.
* **Escenario D (Token expirado):** Devuelve **HTTP 401 (No autorizado)**.
* **Escenario E (Usuario regular sin permisos):** Devuelve **HTTP 403 (Prohibido)**.

---

### Caso 2: PR-SQL-01 / Inyección SQL (Fuga de Información)
Demuestra la extracción de los 2 registros confidenciales ocultos (`oculto = 1`) en `GET /api/productos/buscar`:
```bash
npm run test:sqli
# O directamente:
python3 scripts_ataque/ataque_sqli.py
```
* **Petición legítima:** Búsqueda de `iPhone` $\rightarrow$ Retorna únicamente 1 registro público.
* **Petición maliciosa:** Búsqueda con valor `1' OR '1'='1'` $\rightarrow$ La consulta no parametrizada evalúa la condición lógica a verdadero para todas las filas y **devuelve los 7 registros**, exponiendo el hardware confidencial.
* **Demostración en Frontend:** Escribe `1' OR '1'='1` en el buscador de la aplicación web (`http://localhost:3000`) para visualizar los prototipos secretos marcados en rojo.

---

### Caso 3: PR-DOS-01 / Denegación de Servicio Local
Evalúa la disponibilidad ante ráfagas masivas sin *rate-limiting* en `GET /api/productos`:
```bash
npm run test:dos
# O directamente:
python3 scripts_ataque/ataque_dos.py
```
* Un cliente multihilo lanza ráfagas continuas de peticiones concurrentes.
* Demuestra cómo la latencia del servidor se degrada desde ~9 ms hasta **superar los 5,000 ms** bajo saturación de conexiones.

---

## 🛡️ Medidas de Mitigación Recomendadas

1. **Contra SQLi:** Implementar consultas preparadas (Prepared Statements / Consultas parametrizadas) o un ORM seguro que impida la interpretación de datos de usuario como código SQL.
2. **Contra DoS:** Configurar middleware de limitación de tasa (*rate limiting*, e.g. `express-rate-limit`) que restrinja el número máximo de solicitudes por IP en una ventana de tiempo, e implementar balanceadores de carga y capas de caché.
3. **Control de Acceso:** Mantener rotación de claves criptográficas, tiempos de expiración reducidos en los Access Tokens (ej. 15-60 min) y validar estrictamente los *claims* de roles en cada transacción sensible.

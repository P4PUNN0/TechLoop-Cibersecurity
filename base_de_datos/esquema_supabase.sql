-- ====================================================================
-- Script SQL para Supabase / PostgreSQL (Proyecto TechLoop)
-- Base de Datos: inventario circular de hardware
-- Requisito del PDF: 5 productos visibles y 2 productos ocultos (oculto = 1)
-- ====================================================================

-- 1. Eliminar la tabla si ya existe para empezar limpio
DROP TABLE IF EXISTS productos;

-- 2. Crear la tabla de productos con variables y campos en español
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    ciudad VARCHAR(50) NOT NULL DEFAULT 'Bogotá',
    condicion VARCHAR(50) NOT NULL DEFAULT 'Reacondicionado',
    imagen TEXT,
    oculto INT NOT NULL DEFAULT 0, -- 0 = visible, 1 = oculto (confidencial / no publicado)
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insertar 5 productos visibles (oculto = 0)
INSERT INTO productos (nombre, precio, descripcion, categoria, ciudad, condicion, imagen, oculto)
VALUES 
('iPhone 13 Pro Max', 850.00, '128GB, Batería al 95%, excelente estado. Incluye cargador original.', 'smartphone', 'Bogotá', 'Reacondicionado', 'https://images.unsplash.com/photo-1632661674596-df8b762a8bd6?w=400&h=300&fit=crop', 0),
('MacBook Air M1', 1200.00, '8GB RAM, 256GB SSD, Gris Espacial. Ciclos de batería: 45.', 'laptop', 'Medellín', 'Como nuevo', 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop', 0),
('Sony WH-1000XM4', 280.00, 'Audífonos con cancelación de ruido. Almohadillas nuevas, estuche original.', 'audio', 'Cali', 'Excelente', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop', 0),
('iPad Pro 11"', 650.00, '2da Generación, 128GB Wi-Fi. Sin rayones en pantalla.', 'tablet', 'Bogotá', 'Excelente', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', 0),
('Samsung Galaxy S22 Ultra', 750.00, '256GB, Phantom Black, S-Pen incluido.', 'smartphone', 'Barranquilla', 'Como nuevo', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop', 0);

-- 4. Insertar 2 productos ocultos (oculto = 1) - Estos solo deben salir con la Inyección SQL
INSERT INTO productos (nombre, precio, descripcion, categoria, ciudad, condicion, imagen, oculto)
VALUES 
('[CONFIDENCIAL] Prototipo Laptop Cuántica X-1', 9999.00, 'Prototipo secreto de hardware de prueba interna. No divulgar al público.', 'laptop', 'Laboratorio Central', 'Prototipo', 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&h=300&fit=crop', 1),
('[RESERVADO] Servidor Empresarial Decomisado v2', 4500.00, 'Servidor con registros sensibles pendiente de borrado seguro.', 'servidor', 'Data Center Norte', 'Usado', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop', 1);

-- 5. Consulta de verificación:
-- Los usuarios normales solo deberían ver 5 productos:
-- SELECT * FROM productos WHERE oculto = 0;

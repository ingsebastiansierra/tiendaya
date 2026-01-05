-- ============================================
-- CONFIGURAR SUPABASE STORAGE PARA IMÁGENES DE PRODUCTOS
-- ============================================

-- 1. Crear bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acceso para el bucket de productos

-- Permitir que todos vean las imágenes (público)
CREATE POLICY "Las imágenes de productos son públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

-- Permitir que usuarios autenticados suban imágenes
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'productos' 
    AND auth.role() = 'authenticated'
);

-- Permitir que usuarios autenticados actualicen sus imágenes
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'productos' 
    AND auth.role() = 'authenticated'
);

-- Permitir que usuarios autenticados eliminen imágenes
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'productos' 
    AND auth.role() = 'authenticated'
);

-- Verificar que el bucket se creó correctamente
SELECT 
    '✅ Bucket de productos creado' as resultado,
    id,
    name,
    public
FROM storage.buckets
WHERE id = 'productos';

-- Verificar políticas
SELECT 
    '📋 Políticas del bucket' as resultado,
    policyname,
    cmd as operacion
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%productos%';

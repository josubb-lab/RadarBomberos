-- migrate-003-seed-data.sql
-- Ejecutar en Supabase SQL Editor (requiere privilegios de escritura)

-- ── Procesos ─────────────────────────────────────────────────────────────────

INSERT INTO procesos_selectivos
  (slug, organismo, comunidad, provincia, municipio, cuerpo, plazas, estado,
   fecha_pub, fecha_fin_inst, url_oficial, descripcion, nicho, curado)
VALUES
  (
    'oposicion-bomberos-cartagena-2025',
    'Ayuntamiento de Cartagena',
    'Región de Murcia', 'Murcia', 'Cartagena',
    'bombero', 23, 'activo',
    '2025-09-03', null,
    'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-17741',
    'Convocatoria de 23 plazas de Bombero. El BOE publicó una corrección de errores que cambió el sistema de selección de concurso-oposición a oposición pura, con apertura de nuevo plazo de presentación de solicitudes.',
    'bomberos', true
  ),
  (
    'oposicion-bomberos-malaga-2022',
    'Consorcio Provincial de Bomberos de Málaga',
    'Andalucía', 'Málaga', null,
    'bombero-conductor', 63, 'activo',
    '2022-10-21', null,
    'https://www.boe.es/buscar/doc.php?id=BOE-A-2022-17448',
    'Convocatoria de 63 plazas de Bombero/a-Conductor/a. El BOE publicó una corrección de errores que cambió el sistema de selección de concurso-oposición a oposición pura, afectando al núcleo del método selectivo.',
    'bomberos', true
  ),
  (
    'proceso-selectivo-bombero-generalitat-cataluna-2019',
    'Departament d''Interior, Generalitat de Catalunya',
    'Cataluña', 'Cataluña', null,
    'bombero (escala básica)', null, 'activo',
    '2019-07-18', null, null,
    'Proceso selectivo 81/19.2 de acceso a bombero/a de escala básica del Cuerpo de Bomberos de la Generalitat de Catalunya. El TSJ de Cataluña anuló el test de personalidad por vulneración de los principios de publicidad y transparencia.',
    'bomberos', true
  ),
  (
    'oposicion-sargento-bomberos-palma',
    'Ajuntament de Palma',
    'Islas Baleares', 'Baleares', 'Palma',
    'sargento', null, 'anulado',
    null, null, null,
    'Oposición para sargento de bombero del Ajuntament de Palma. Una sentencia judicial declaró nulo el proceso selectivo.',
    'bomberos', true
  ),
  (
    'oposicion-bomberos-consorcio-alicante',
    'Consorcio Provincial de Bomberos de Alicante',
    'Comunitat Valenciana', 'Alicante', null,
    'bombero', null, 'impugnado',
    null, null, null,
    'Proceso selectivo del Consorcio Provincial de Bomberos de Alicante con más de 200 bomberos afectados. Una sentencia judicial puso en cuestión el desarrollo del proceso.',
    'bomberos', true
  )
ON CONFLICT (slug) DO UPDATE SET
  organismo       = EXCLUDED.organismo,
  estado          = EXCLUDED.estado,
  descripcion     = EXCLUDED.descripcion,
  curado          = EXCLUDED.curado,
  updated_at      = now();

-- ── Señales (vinculadas por slug) ────────────────────────────────────────────

-- Limpiar señales previas de estos procesos
DELETE FROM senales_proceso
WHERE proceso_id IN (
  SELECT id FROM procesos_selectivos
  WHERE slug IN (
    'oposicion-bomberos-cartagena-2025',
    'oposicion-bomberos-malaga-2022',
    'proceso-selectivo-bombero-generalitat-cataluna-2019',
    'oposicion-sargento-bomberos-palma',
    'oposicion-bomberos-consorcio-alicante'
  )
);

-- Insertar señales
INSERT INTO senales_proceso (proceso_id, tipo, titulo, fecha, url, fuente)
SELECT p.id, s.tipo, s.titulo, s.fecha::date, s.url, s.fuente
FROM procesos_selectivos p
JOIN (VALUES
  ('oposicion-bomberos-cartagena-2025',
   'correccion',
   'Corrección de errores del sistema de selección publicada en BOE',
   '2025-09-03',
   '/incidencias/correccion-sistema-seleccion-23-plazas-bomberos-cartagena-2025',
   'BOE'),

  ('oposicion-bomberos-malaga-2022',
   'correccion',
   'Corrección de errores del sistema de selección publicada en BOE',
   '2022-10-21',
   '/incidencias/correccion-sistema-seleccion-63-plazas-bomberos-malaga-2022',
   'BOE'),

  ('proceso-selectivo-bombero-generalitat-cataluna-2019',
   'sentencia',
   'TSJ Cataluña anula el test de personalidad por falta de transparencia',
   '2023-05-29',
   '/incidencias/tsj-catalunya-anulacion-prueba-psicologica-bomberos-generalitat-2023',
   'CENDOJ'),

  ('oposicion-sargento-bomberos-palma',
   'sentencia',
   'Sentencia declara nula la oposición para sargento de bombero de Palma',
   null,
   '/hallazgos/una-sentencia-declara-nula-una-oposicion-para-sargento-de-bombero-de-palma',
   'prensa'),

  ('oposicion-bomberos-consorcio-alicante',
   'sentencia',
   'Sentencia deja en el aire las oposiciones de más de 200 bomberos del Consorcio',
   null,
   '/hallazgos/una-sentencia-deja-en-el-aire-las-oposiciones-de-mas-de-200-bomberos-del',
   'prensa')
) AS s(slug, tipo, titulo, fecha, url, fuente)
ON p.slug = s.slug;

-- ── Verificar resultado ───────────────────────────────────────────────────────

SELECT
  p.slug,
  p.organismo,
  p.estado,
  count(s.id) AS num_senales
FROM procesos_selectivos p
LEFT JOIN senales_proceso s ON s.proceso_id = p.id
WHERE p.nicho = 'bomberos'
GROUP BY p.id, p.slug, p.organismo, p.estado
ORDER BY p.created_at;

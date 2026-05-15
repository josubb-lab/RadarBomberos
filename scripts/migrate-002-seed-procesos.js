/**
 * scripts/migrate-002-seed-procesos.js
 * Migra los 5 procesos de src/data/procesos.ts a Supabase.
 * Idempotente: usa upsert por slug.
 *
 * Uso:
 *   node --env-file=.env scripts/migrate-002-seed-procesos.js
 */

import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY,
)

const PROCESOS = [
  {
    slug:           'oposicion-bomberos-cartagena-2025',
    organismo:      'Ayuntamiento de Cartagena',
    comunidad:      'Región de Murcia',
    provincia:      'Murcia',
    municipio:      'Cartagena',
    cuerpo:         'bombero',
    plazas:         23,
    estado:         'activo',
    fecha_pub:      '2025-09-03',
    fecha_fin_inst: null,
    url_oficial:    'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-17741',
    descripcion:    'Convocatoria de 23 plazas de Bombero. El BOE publicó una corrección de errores que cambió el sistema de selección de concurso-oposición a oposición pura, con apertura de nuevo plazo de presentación de solicitudes.',
    nicho:          'bomberos',
    curado:         true,
    senales: [
      {
        tipo:   'correccion',
        titulo: 'Corrección de errores del sistema de selección publicada en BOE',
        fecha:  '2025-09-03',
        url:    '/incidencias/correccion-sistema-seleccion-23-plazas-bomberos-cartagena-2025',
        fuente: 'BOE',
      },
    ],
  },
  {
    slug:           'oposicion-bomberos-malaga-2022',
    organismo:      'Consorcio Provincial de Bomberos de Málaga',
    comunidad:      'Andalucía',
    provincia:      'Málaga',
    municipio:      null,
    cuerpo:         'bombero-conductor',
    plazas:         63,
    estado:         'activo',
    fecha_pub:      '2022-10-21',
    fecha_fin_inst: null,
    url_oficial:    'https://www.boe.es/buscar/doc.php?id=BOE-A-2022-17448',
    descripcion:    'Convocatoria de 63 plazas de Bombero/a-Conductor/a. El BOE publicó una corrección de errores que cambió el sistema de selección de concurso-oposición a oposición pura, afectando al núcleo del método selectivo.',
    nicho:          'bomberos',
    curado:         true,
    senales: [
      {
        tipo:   'correccion',
        titulo: 'Corrección de errores del sistema de selección publicada en BOE',
        fecha:  '2022-10-21',
        url:    '/incidencias/correccion-sistema-seleccion-63-plazas-bomberos-malaga-2022',
        fuente: 'BOE',
      },
    ],
  },
  {
    slug:           'proceso-selectivo-bombero-generalitat-cataluna-2019',
    organismo:      "Departament d'Interior, Generalitat de Catalunya",
    comunidad:      'Cataluña',
    provincia:      'Cataluña',
    municipio:      null,
    cuerpo:         'bombero (escala básica)',
    plazas:         null,
    estado:         'activo',
    fecha_pub:      '2019-07-18',
    fecha_fin_inst: null,
    url_oficial:    null,
    descripcion:    'Proceso selectivo 81/19.2 de acceso a bombero/a de escala básica del Cuerpo de Bomberos de la Generalitat de Catalunya. El TSJ de Cataluña anuló el test de personalidad por vulneración de los principios de publicidad y transparencia.',
    nicho:          'bomberos',
    curado:         true,
    senales: [
      {
        tipo:   'sentencia',
        titulo: 'TSJ Cataluña anula el test de personalidad por falta de transparencia',
        fecha:  '2023-05-29',
        url:    '/incidencias/tsj-catalunya-anulacion-prueba-psicologica-bomberos-generalitat-2023',
        fuente: 'CENDOJ',
      },
    ],
  },
  {
    slug:           'oposicion-sargento-bomberos-palma',
    organismo:      'Ajuntament de Palma',
    comunidad:      'Islas Baleares',
    provincia:      'Baleares',
    municipio:      'Palma',
    cuerpo:         'sargento',
    plazas:         null,
    estado:         'anulado',
    fecha_pub:      null,
    fecha_fin_inst: null,
    url_oficial:    null,
    descripcion:    'Oposición para sargento de bombero del Ajuntament de Palma. Una sentencia judicial declaró nulo el proceso selectivo.',
    nicho:          'bomberos',
    curado:         true,
    senales: [
      {
        tipo:   'sentencia',
        titulo: 'Sentencia declara nula la oposición para sargento de bombero de Palma',
        fecha:  null,
        url:    '/hallazgos/una-sentencia-declara-nula-una-oposicion-para-sargento-de-bombero-de-palma',
        fuente: 'prensa',
      },
    ],
  },
  {
    slug:           'oposicion-bomberos-consorcio-alicante',
    organismo:      'Consorcio Provincial de Bomberos de Alicante',
    comunidad:      'Comunitat Valenciana',
    provincia:      'Alicante',
    municipio:      null,
    cuerpo:         'bombero',
    plazas:         null,
    estado:         'impugnado',
    fecha_pub:      null,
    fecha_fin_inst: null,
    url_oficial:    null,
    descripcion:    'Proceso selectivo del Consorcio Provincial de Bomberos de Alicante con más de 200 bomberos afectados. Una sentencia judicial puso en cuestión el desarrollo del proceso.',
    nicho:          'bomberos',
    curado:         true,
    senales: [
      {
        tipo:   'sentencia',
        titulo: 'Sentencia deja en el aire las oposiciones de más de 200 bomberos del Consorcio',
        fecha:  null,
        url:    '/hallazgos/una-sentencia-deja-en-el-aire-las-oposiciones-de-mas-de-200-bomberos-del',
        fuente: 'prensa',
      },
    ],
  },
]

async function main() {
  console.log(`\n📦 Migrando ${PROCESOS.length} procesos a Supabase...\n`)

  for (const p of PROCESOS) {
    const { senales, ...proceso } = p

    // Upsert proceso
    const { data: inserted, error: ep } = await sb
      .from('procesos_selectivos')
      .upsert(proceso, { onConflict: 'slug' })
      .select('id, slug')
      .single()

    if (ep) {
      console.log(`  ❌ ${p.slug}: ${ep.message}`)
      continue
    }

    console.log(`  ✅ proceso: ${inserted.slug}`)

    // Borrar señales previas del proceso (para idempotencia)
    await sb.from('senales_proceso').delete().eq('proceso_id', inserted.id)

    // Insertar señales
    if (senales.length > 0) {
      const rows = senales.map(s => ({ ...s, proceso_id: inserted.id }))
      const { error: es } = await sb.from('senales_proceso').insert(rows)
      if (es) console.log(`     ❌ señales: ${es.message}`)
      else console.log(`     ↳ ${senales.length} señal(es) insertada(s)`)
    }
  }

  console.log('\n✅ Migración completada.\n')
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1) })

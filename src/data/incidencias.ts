export type TipoIncidencia =
  | 'pregunta_anulada'
  | 'correccion_convocatoria'
  | 'sentencia'
  | 'impugnacion'
  | 'recurso'

export type FuenteTipo = 'BOE' | 'CENDOJ' | 'INAP' | 'BOP' | 'sede_oficial'

export type PrioridadSeo = 'alta' | 'media' | 'baja'

export interface Incidencia {
  slug:                string
  titulo:              string
  tipo:                TipoIncidencia
  convocatoria:        string
  organismo:           string
  ubicacion:           string
  fecha:               string          // YYYY-MM-DD o YYYY
  resumen:             string
  fuente_url:          string          // URL directa y verificable
  fuente_tipo:         FuenteTipo
  referencia_oficial?: string          // ECLI, BOE-A-XXXX, ROJ, etc.
  nicho:               'bomberos'
  prioridad_seo:       PrioridadSeo
}

export const incidencias: Incidencia[] = [

  // ─── TIER 1: BOE directo ────────────────────────────────────────────────

  {
    slug:               'correccion-sistema-seleccion-63-plazas-bomberos-malaga-2022',
    titulo:             'Error en el sistema de selección de 63 plazas de Bombero-Conductor — Consorcio de Bomberos de Málaga',
    tipo:               'correccion_convocatoria',
    convocatoria:       'Convocatoria de plazas de Bombero/a-Conductor/a y Sargento — Consorcio Provincial de Bomberos de Málaga',
    organismo:          'Consorcio Provincial de Bomberos de Málaga',
    ubicacion:          'Málaga',
    fecha:              '2022-10-21',
    resumen:            'El Consorcio Provincial de Bomberos de Málaga publicó en el BOE una corrección de errores que cambió el sistema de selección de las 63 plazas de Bombero/a-Conductor/a de "concurso-oposición" a "oposición" pura. Simultáneamente, las plazas de Sargento pasaron de "concurso-oposición" a "concurso" puro. El error afectaba al núcleo del método selectivo, una cuestión de orden público administrativo.',
    fuente_url:         'https://www.boe.es/buscar/doc.php?id=BOE-A-2022-17448',
    fuente_tipo:        'BOE',
    referencia_oficial: 'BOE-A-2022-17448',
    nicho:              'bomberos',
    prioridad_seo:      'media',
  },

  {
    slug:               'correccion-sistema-seleccion-23-plazas-bomberos-cartagena-2025',
    titulo:             'Error en el sistema de selección de 23 plazas de Bombero — Ayuntamiento de Cartagena',
    tipo:               'correccion_convocatoria',
    convocatoria:       'Convocatoria de 23 plazas de Bombero — Ayuntamiento de Cartagena',
    organismo:          'Ayuntamiento de Cartagena',
    ubicacion:          'Cartagena',
    fecha:              '2025-09-03',
    resumen:            'El Ayuntamiento de Cartagena publicó en el BOE una corrección de errores por la que el sistema de selección de las 23 plazas de Bombero pasaba de "concurso-oposición" a "oposición" pura. Al afectar al método de acceso a la función pública se consideró error de orden público administrativo. Se abrió un nuevo plazo de 20 días hábiles de presentación de solicitudes tras la corrección.',
    fuente_url:         'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-17741',
    fuente_tipo:        'BOE',
    referencia_oficial: 'BOE-A-2025-17741',
    nicho:              'bomberos',
    prioridad_seo:      'media',
  },

  // ─── TIER 2: Sentencias con referencia judicial verificable ─────────────

  {
    slug:               'tsj-catalunya-anulacion-prueba-psicologica-bomberos-generalitat-2023',
    titulo:             'TSJ Cataluña anula el test de personalidad de la oposición a Bombero de la Generalitat por falta de transparencia',
    tipo:               'sentencia',
    convocatoria:       'Proceso selectivo 81/19.2 — acceso a bombero/a de escala básica, Cuerpo de Bomberos de la Generalitat de Catalunya (Resolución INT/3584/2019, DOGC 18/07/2019)',
    organismo:          'Departament d\'Interior, Generalitat de Catalunya',
    ubicacion:          'Cataluña',
    fecha:              '2023-05-29',
    resumen:            'El TSJ de Cataluña (Sección Cuarta) declaró nulo el tercer ejercicio de la primera prueba —el test de evaluación de la personalidad— del proceso selectivo 81/19.2 para bombero/a de escala básica. La Sala apreció vulneración de los principios de publicidad y transparencia: los criterios de evaluación no fueron comunicados a los aspirantes antes de realizar la prueba. Se reconoció el derecho de la recurrente a participar en las pruebas posteriores del proceso.',
    fuente_url:         'https://www.poderjudicial.es/search/AN/openDocument/08019330042023100234',
    fuente_tipo:        'CENDOJ',
    referencia_oficial: 'ECLI:ES:TSJCAT:2023:4309',
    nicho:              'bomberos',
    prioridad_seo:      'alta',
  },

  {
    slug:               'sts-74-2022-doctrina-psicoecnicos-transparencia-criterios-oposiciones-bomberos',
    titulo:             'STS 74/2022: doctrina del Tribunal Supremo — los criterios de los psicotécnicos deben publicarse antes de la prueba',
    tipo:               'sentencia',
    convocatoria:       'Proceso selectivo de 37 plazas de Policía Foral de Navarra (doctrina de aplicación general a todas las oposiciones públicas)',
    organismo:          'Tribunal Supremo — Sala de lo Contencioso-Administrativo, Sección Cuarta',
    ubicacion:          'España',
    fecha:              '2022-01-27',
    resumen:            'El Tribunal Supremo fijó doctrina sobre los requisitos de transparencia en pruebas psicotécnicas de procesos selectivos: los aspirantes deben conocer previamente el perfil profesiográfico, los rasgos a valorar y el sistema de baremación. La declaración de "no apto" debe motivarse indicando las fuentes de información utilizadas, los criterios cualitativos de valoración y la razón concreta de la no aptitud. Esta sentencia es el fundamento jurídico de la mayoría de impugnaciones de psicotécnicos en oposiciones a bomberos.',
    fuente_url:         'https://laadministracionaldia.inap.es/noticia.asp?id=1220730',
    fuente_tipo:        'INAP',
    referencia_oficial: 'ROJ: STS 74/2022',
    nicho:              'bomberos',
    prioridad_seo:      'alta',
  },

  // ─── PENDIENTES: sin URL oficial directa confirmada ─────────────────────
  //
  // STS 642/2025 — Anulación ejercicio práctico bomberos Córdoba
  //   Fuente disponible: vLex (agregador privado, no oficial)
  //   Referencia: STS 642/2025, Sala C-A Sección Cuarta
  //   Acción: localizar en CENDOJ por ROJ antes de incluir
  //
  // Juzgado C-A Vitoria — Anulación psicotécnico OPE bomberos Araba+Gipuzkoa 2022
  //   Fuente disponible: Noticias de Álava + ELA Sindikatua (medios)
  //   Acción: localizar sentencia en CENDOJ o sede judicial del TSJPV
  //
  // TSJA — Anulación plaza bombero Melilla 2017
  //   Fuente disponible: Confilegal + El Faro de Melilla (medios)
  //   Acción: localizar en CENDOJ por organismo + fecha
  //
  // TSJCyL — Anulación psicotécnico bomberos Salamanca 2022
  //   Fuente disponible: La Gaceta de Salamanca (medio)
  //   Acción: localizar en CENDOJ o sede del TSJCyL
  //
  // Juzgado C-A Palencia — Anulación oposición bomberos por pruebas físicas 2021
  //   Fuente disponible: El Diario (medio)
  //   Acción: localizar en CENDOJ o BOP Palencia

]

export type EstadoProceso =
  | 'abierto'     // plazo de instancias vigente
  | 'activo'      // en curso: pruebas, listas o resolución
  | 'impugnado'   // con recurso o impugnación sin resolver
  | 'suspendido'  // paralizado por resolución judicial
  | 'cerrado'     // finalizado sin señales relevantes
  | 'anulado'     // declarado nulo total o parcialmente

export interface SenalProceso {
  tipo:   'convocatoria' | 'correccion' | 'impugnacion' | 'sentencia' | 'anulacion' | 'recurso' | 'suspension'
  titulo: string
  fecha:  string | null
  url:    string | null   // '/incidencias/slug' | '/hallazgos/slug' | URL externa
  fuente: string
}

export interface Proceso {
  slug:              string
  organismo:         string
  comunidad:         string
  provincia:         string
  municipio:         string | null
  cuerpo:            string
  plazas:            number | null
  estado:            EstadoProceso
  fechaPublicacion:  string | null   // YYYY-MM-DD
  fechaFinInstancia: string | null
  urlOficial:        string | null
  descripcion:       string
  tieneSenales:      boolean
  senales:           SenalProceso[]
}

export const procesos: Proceso[] = [

  {
    slug:             'oposicion-bomberos-cartagena-2025',
    organismo:        'Ayuntamiento de Cartagena',
    comunidad:        'Región de Murcia',
    provincia:        'Murcia',
    municipio:        'Cartagena',
    cuerpo:           'bombero',
    plazas:           23,
    estado:           'activo',
    fechaPublicacion: '2025-09-03',
    fechaFinInstancia: null,
    urlOficial:       'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-17741',
    descripcion:      'Convocatoria de 23 plazas de Bombero. El BOE publicó una corrección de errores que cambió el sistema de selección de concurso-oposición a oposición pura, con apertura de nuevo plazo de presentación de solicitudes.',
    tieneSenales:     true,
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
    slug:             'oposicion-bomberos-malaga-2022',
    organismo:        'Consorcio Provincial de Bomberos de Málaga',
    comunidad:        'Andalucía',
    provincia:        'Málaga',
    municipio:        null,
    cuerpo:           'bombero-conductor',
    plazas:           63,
    estado:           'activo',
    fechaPublicacion: '2022-10-21',
    fechaFinInstancia: null,
    urlOficial:       'https://www.boe.es/buscar/doc.php?id=BOE-A-2022-17448',
    descripcion:      'Convocatoria de 63 plazas de Bombero/a-Conductor/a. El BOE publicó una corrección de errores que cambió el sistema de selección de concurso-oposición a oposición pura, afectando al núcleo del método selectivo.',
    tieneSenales:     true,
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
    slug:             'proceso-selectivo-bombero-generalitat-cataluna-2019',
    organismo:        'Departament d\'Interior, Generalitat de Catalunya',
    comunidad:        'Cataluña',
    provincia:        'Cataluña',
    municipio:        null,
    cuerpo:           'bombero (escala básica)',
    plazas:           null,
    estado:           'activo',
    fechaPublicacion: '2019-07-18',
    fechaFinInstancia: null,
    urlOficial:       null,
    descripcion:      'Proceso selectivo 81/19.2 de acceso a bombero/a de escala básica del Cuerpo de Bomberos de la Generalitat de Catalunya. El TSJ de Cataluña anuló el test de personalidad por vulneración de los principios de publicidad y transparencia.',
    tieneSenales:     true,
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
    slug:             'oposicion-sargento-bomberos-palma',
    organismo:        'Ajuntament de Palma',
    comunidad:        'Islas Baleares',
    provincia:        'Baleares',
    municipio:        'Palma',
    cuerpo:           'sargento',
    plazas:           null,
    estado:           'anulado',
    fechaPublicacion: null,
    fechaFinInstancia: null,
    urlOficial:       null,
    descripcion:      'Oposición para sargento de bombero del Ajuntament de Palma. Una sentencia judicial declaró nulo el proceso selectivo.',
    tieneSenales:     true,
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
    slug:             'oposicion-bomberos-consorcio-alicante',
    organismo:        'Consorcio Provincial de Bomberos de Alicante',
    comunidad:        'Comunitat Valenciana',
    provincia:        'Alicante',
    municipio:        null,
    cuerpo:           'bombero',
    plazas:           null,
    estado:           'impugnado',
    fechaPublicacion: null,
    fechaFinInstancia: null,
    urlOficial:       null,
    descripcion:      'Proceso selectivo del Consorcio Provincial de Bomberos de Alicante con más de 200 bomberos afectados. Una sentencia judicial puso en cuestión el desarrollo del proceso.',
    tieneSenales:     true,
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

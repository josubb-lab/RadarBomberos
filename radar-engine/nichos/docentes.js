export default {
  // fuente-noticias
  queriesGenerales: [
    'oposición docentes (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)',
    'oposiciones maestros (discriminación OR nepotismo OR enchufe OR amiguismo)',
    'oposición profesor (nulidad OR suspensión OR impugna OR corrupción)',
    'opositor docente (trampa OR tongo OR favoritismo OR injusticia)',
    'docentes proceso selectivo (ilegal OR anulado OR suspendido OR impugnado)',
    'oposiciones educación tribunal selección (irregular OR denunciado OR recurrido)',
    'maestros convocatoria bases impugnadas recurso contencioso',
    'plaza docente convocatoria escándalo fraude enchufe',
    'sentencia oposición docente maestro nulidad impugnación',
    'bolsa interinos docentes irregularidad fraude denuncia',
    'cuerpo de maestros oposición (nepotismo OR enchufismo OR contactos)',
    'profesores secundaria oposición irregularidad anulación',
    'oposición educación primaria discriminación baremo irregularidad',
    'interinos docentes lista irregularidad fraude denuncia escándalo',
  ],
  queryTemplateComunidad: (c) => [
    `docentes ${c} oposición (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)`,
    `maestros ${c} (recurso OR escándalo OR anulación OR enchufe OR irregular OR interinos)`,
  ],
  queryTemplateCiudad: (c) =>
    `docentes ${c} oposición (impugnación OR fraude OR irregularidad OR denuncia OR anulación)`,
  topicKeywords: [
    'oposicion', 'oposiciones', 'convocatoria', 'proceso selectivo', 'pruebas selectivas',
    'docente', 'docentes', 'maestro', 'maestros', 'profesor', 'profesores',
    'cuerpo de maestros', 'educacion primaria', 'educacion secundaria',
    'interino', 'interinos', 'bolsa de trabajo', 'bolsa interinos',
    'programacion didactica', 'unidad didactica',
  ],
  extraStopWords: [],

  // fuente-boletines
  terminosBOE: [
    'docentes proceso selectivo',
    'cuerpo de maestros proceso selectivo',
    'profesores educacion secundaria proceso selectivo',
    'docentes convocatoria oposicion',
    'maestros anulacion convocatoria',
    'docentes impugnacion',
    'docentes nulidad convocatoria',
    'cuerpo maestros bases seleccion',
    'profesores secundaria suspension convocatoria',
    'bolsa docentes interinos irregularidad',
    'oposiciones docentes rectificacion',
  ],
  keywordsNicho: [
    'docente', 'docentes', 'maestro', 'maestros', 'profesor', 'profesores',
    'cuerpo de maestros', 'educación primaria', 'educación secundaria',
    'interino', 'interinos', 'bolsa de trabajo',
  ],

  // fuente-sentencias
  queriesCENDOJ: [
    'docentes oposición anulación nulidad proceso selectivo',
    'maestros oposición discriminación recurso contencioso',
    'profesores convocatoria impugnación irregularidad bolsa interinos',
    'cuerpo maestros oposición nulidad anulación',
  ],
  queriesDDG: [
    'site:poderjudicial.es docentes oposición nulidad anulación',
    'site:poderjudicial.es maestros proceso selectivo impugnación',
    'site:poderjudicial.es profesores oposición discriminación interinos',
  ],

  // fuente-foros
  subreddits: {
    oposiciones: [
      'docentes irregularidad oposicion',
      'maestros impugnacion fraude',
      'oposicion docente trampa enchufe',
      'profesor proceso selectivo denunci',
      'docentes discriminacion oposiciones',
      'maestros nepotismo enchufismo selectivo',
      'interinos irregularidad lista bolsa fraude',
      'oposicion docente nulidad recurso',
    ],
    spain: [
      'oposicion docentes fraude',
      'maestros impugnacion oposicion interinos',
      'profesores irregularidad selectivo bolsa',
    ],
    maestros: [
      'oposicion irregularidad fraude',
      'impugnacion proceso selectivo',
      'enchufe nepotismo oposicion',
      'interinos lista irregularidad',
    ],
  },
  keywordsTema: [
    'docente', 'docentes', 'maestro', 'maestros', 'profesor', 'profesores',
    'interino', 'interinos', 'educacion', 'educación', 'cuerpo de maestros',
    'bolsa', 'secundaria', 'primaria',
  ],
}

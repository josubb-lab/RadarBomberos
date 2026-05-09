export default {
  // fuente-noticias
  queriesGenerales: [
    'oposición bomberos (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)',
    'oposiciones bombero (discriminación OR nepotismo OR enchufe OR amiguismo)',
    'SPEIS oposición (anulación OR irregularidad OR escándalo OR recurso)',
    'bomberos convocatoria (nulidad OR suspensión OR impugna OR corrupción)',
    'opositor bombero (trampa OR tongo OR favoritismo OR injusticia)',
    'bombero proceso selectivo (ilegal OR anulado OR suspendido OR impugnado)',
    'bomberos tribunal selección (irregular OR denunciado OR recurrido OR cuestionado)',
    'oposición bombero discriminación pruebas físicas sexo',
    'bomberos cupo reserva convocatoria irregularidad',
    'convocatoria bombero bases impugnadas recurso contencioso',
    'SPEIS plaza convocatoria escándalo fraude enchufe',
    'bombero oposición nepotismo enchufismo contactos selectivo',
    'sentencia bomberos proceso selectivo nulidad impugnación',
  ],
  queryTemplateComunidad: (c) => [
    `bomberos ${c} (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)`,
    `oposición bombero ${c} (recurso OR escándalo OR anulación OR enchufe OR irregular)`,
  ],
  queryTemplateCiudad: (c) =>
    `bomberos ${c} oposición (impugnación OR fraude OR irregularidad OR denuncia OR anulación)`,
  topicKeywords: [
    'oposicion', 'oposiciones', 'convocatoria', 'plaza de bombero', 'plazas de bombero',
    'proceso selectivo', 'bases de la convocatoria', 'pruebas selectivas',
    'bombero', 'bomberos', 'servicio de extincion', 'speis', 'parque de bomberos',
  ],
  extraStopWords: [],

  // fuente-boletines
  terminosBOE: [
    'bomberos proceso selectivo',
    'SPEIS proceso selectivo',
    'bomberos convocatoria oposicion',
    'extincion incendios proceso selectivo',
    'bomberos anulacion',
    'bomberos impugnacion',
    'bomberos nulidad convocatoria',
    'bomberos recurso selectivo',
    'bombero bases pruebas seleccion',
    'bombero suspension convocatoria',
  ],
  keywordsNicho: [
    'bomberos', 'extinción de incendios', 'extincion de incendios', 'speis', 'bombero', 'salvamento',
  ],

  // fuente-sentencias
  queriesCENDOJ: [
    'bomberos oposición anulación nulidad proceso selectivo',
    'SPEIS oposición discriminación recurso contencioso',
    'bomberos convocatoria impugnación irregularidad',
  ],
  queriesDDG: [
    'site:poderjudicial.es bomberos oposición nulidad anulación',
    'site:poderjudicial.es SPEIS proceso selectivo impugnación',
    'site:poderjudicial.es bomberos discriminación oposición',
  ],

  // fuente-foros
  subreddits: {
    oposiciones: [
      'bomberos irregularidad oposicion',
      'bomberos impugnacion fraude',
      'oposicion bombero trampa enchufe',
      'bombero proceso selectivo denunci',
      'bomberos discriminacion oposiciones',
      'SPEIS oposicion irregularidad',
      'bombero nepotismo enchufismo selectivo',
      'oposicion bombero nulidad recurso',
    ],
    spain: [
      'oposicion bomberos fraude',
      'bomberos impugnacion oposicion',
      'bombero irregularidad selectivo',
    ],
    bomberos: [
      'oposicion irregularidad fraude',
      'impugnacion proceso selectivo',
      'enchufe nepotismo oposicion',
    ],
  },
  keywordsTema: ['bombero', 'bomberos', 'speis', 'extincion', 'extinción'],
}

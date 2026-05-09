export default {
  // fuente-noticias
  queriesGenerales: [
    'oposición policía local (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)',
    'oposiciones policía local (discriminación OR nepotismo OR enchufe OR amiguismo)',
    'policía local convocatoria (nulidad OR suspensión OR impugna OR corrupción)',
    'opositor policía local (trampa OR tongo OR favoritismo OR injusticia)',
    'policía local proceso selectivo (ilegal OR anulado OR suspendido OR impugnado)',
    'policía local tribunal selección (irregular OR denunciado OR recurrido OR cuestionado)',
    'oposición policía local discriminación pruebas físicas sexo',
    'convocatoria policía local bases impugnadas recurso contencioso',
    'plaza policía local convocatoria escándalo fraude enchufe',
    'policía local oposición nepotismo enchufismo contactos selectivo',
    'sentencia policía local proceso selectivo nulidad impugnación',
    'policía municipal oposición (fraude OR irregularidad OR nulidad OR enchufe)',
    'auxiliar policía local oposición irregularidad anulación',
  ],
  queryTemplateComunidad: (c) => [
    `policía local ${c} (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)`,
    `oposición policía local ${c} (recurso OR escándalo OR anulación OR enchufe OR irregular)`,
  ],
  queryTemplateCiudad: (c) =>
    `policía local ${c} oposición (impugnación OR fraude OR irregularidad OR denuncia OR anulación)`,
  nichoKeywords: [
    'policía local', 'policia local', 'policía municipal', 'policia municipal',
    'agente de policía local', 'agente de policia local', 'subinspector de policia', 'auxiliar de policía local',
  ],
  extraStopWords: [],

  // fuente-boletines
  terminosBOE: [
    'policía local proceso selectivo',
    'policía local convocatoria oposicion',
    'policía local anulacion',
    'policía local impugnacion',
    'policía local nulidad convocatoria',
    'agente policía local proceso selectivo',
    'policía municipal convocatoria proceso selectivo',
    'policía local bases pruebas seleccion',
    'policía local suspension convocatoria',
    'subinspector policía local proceso selectivo',
  ],
  keywordsNicho: [
    'policía local', 'policia local', 'policía municipal', 'policia municipal',
    'agente de policía local', 'subinspector de policía', 'auxiliar de policía',
  ],

  // fuente-sentencias
  queriesCENDOJ: [
    'policía local oposición anulación nulidad proceso selectivo',
    'policía local oposición discriminación recurso contencioso',
    'policía local convocatoria impugnación irregularidad',
    'policía municipal oposición nulidad anulación selectivo',
  ],
  queriesDDG: [
    'site:poderjudicial.es policía local oposición nulidad anulación',
    'site:poderjudicial.es policía local proceso selectivo impugnación',
    'site:poderjudicial.es policía local discriminación oposición',
  ],

  // fuente-foros
  subreddits: {
    oposiciones: [
      'policía local irregularidad oposicion',
      'policía local impugnacion fraude',
      'oposicion policia local trampa enchufe',
      'policia local proceso selectivo denunci',
      'policía local discriminacion oposiciones',
      'policia local nepotismo enchufismo selectivo',
      'oposicion policia local nulidad recurso',
      'policía municipal irregularidad convocatoria',
    ],
    spain: [
      'oposicion policia local fraude',
      'policía local impugnacion oposicion',
      'policia local irregularidad selectivo',
    ],
  },
  keywordsTema: [
    'policía local', 'policia local', 'policía municipal', 'policia municipal',
    'agente de policía', 'agente policia', 'auxiliar policía', 'auxiliar policia',
  ],
}

export default {
  // fuente-noticias
  queriesGenerales: [
    'oposición policía nacional (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)',
    'oposiciones policía nacional (discriminación OR nepotismo OR enchufe OR amiguismo)',
    'CNP convocatoria (nulidad OR suspensión OR impugna OR corrupción)',
    'opositor policía nacional (trampa OR tongo OR favoritismo OR injusticia)',
    'policía nacional proceso selectivo (ilegal OR anulado OR suspendido OR impugnado)',
    'cuerpo nacional de policía tribunal selección (irregular OR denunciado OR recurrido)',
    'oposición policía nacional discriminación pruebas físicas sexo',
    'convocatoria policía nacional bases impugnadas recurso contencioso',
    'CNP plaza convocatoria escándalo fraude enchufe',
    'policía nacional oposición nepotismo enchufismo contactos selectivo',
    'sentencia policía nacional proceso selectivo nulidad impugnación',
    'escala básica policía nacional oposición irregularidad anulación',
    'inspector policía nacional oposición fraude irregularidad',
  ],
  queryTemplateComunidad: (c) => [
    `policía nacional ${c} (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)`,
    `oposición policía nacional ${c} (recurso OR escándalo OR anulación OR enchufe OR irregular)`,
  ],
  queryTemplateCiudad: (c) =>
    `policía nacional ${c} oposición (impugnación OR fraude OR irregularidad OR denuncia OR anulación)`,
  nichoKeywords: [
    'policía nacional', 'policia nacional', 'CNP', 'cuerpo nacional de policía',
    'cuerpo nacional de policia', 'escala básica policía', 'escala basica policia',
  ],
  extraStopWords: [],

  // fuente-boletines
  terminosBOE: [
    'policía nacional proceso selectivo',
    'cuerpo nacional de policía proceso selectivo',
    'policía nacional convocatoria oposicion',
    'policía nacional anulacion',
    'policía nacional impugnacion',
    'cuerpo nacional policía nulidad convocatoria',
    'policía nacional bases seleccion',
    'policía nacional suspension convocatoria',
    'escala básica policía proceso selectivo',
    'inspector policía nacional convocatoria',
  ],
  keywordsNicho: [
    'policía nacional', 'policia nacional', 'cuerpo nacional de policía',
    'CNP', 'escala básica', 'inspector de policía', 'subinspector de policía',
  ],

  // fuente-sentencias
  queriesCENDOJ: [
    'policía nacional oposición anulación nulidad proceso selectivo',
    'cuerpo nacional de policía oposición discriminación recurso contencioso',
    'policía nacional convocatoria impugnación irregularidad',
    'escala básica policía nacional oposición nulidad',
  ],
  queriesDDG: [
    'site:poderjudicial.es policía nacional oposición nulidad anulación',
    'site:poderjudicial.es CNP proceso selectivo impugnación',
    'site:poderjudicial.es cuerpo nacional policía discriminación oposición',
  ],

  // fuente-foros
  subreddits: {
    oposiciones: [
      'policía nacional irregularidad oposicion',
      'policía nacional impugnacion fraude',
      'oposicion policia nacional trampa enchufe',
      'CNP proceso selectivo denunci',
      'policía nacional discriminacion oposiciones',
      'policia nacional nepotismo enchufismo selectivo',
      'oposicion policia nacional nulidad recurso',
      'escala básica policía irregularidad',
    ],
    spain: [
      'oposicion policia nacional fraude',
      'CNP impugnacion oposicion',
      'policia nacional irregularidad selectivo',
    ],
  },
  keywordsTema: [
    'policía nacional', 'policia nacional', 'CNP', 'cuerpo nacional',
    'escala básica', 'inspector policia', 'subinspector',
  ],
}

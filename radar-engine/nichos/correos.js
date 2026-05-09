export default {
  // fuente-noticias
  queriesGenerales: [
    'oposición correos (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)',
    'oposiciones correos (discriminación OR nepotismo OR enchufe OR amiguismo)',
    'OPE correos convocatoria (nulidad OR suspensión OR impugna OR corrupción)',
    'opositor correos (trampa OR tongo OR favoritismo OR injusticia)',
    'correos proceso selectivo (ilegal OR anulado OR suspendido OR impugnado)',
    'sociedad estatal correos tribunal selección (irregular OR denunciado OR recurrido)',
    'correos convocatoria bases impugnadas recurso contencioso',
    'correos plaza convocatoria escándalo fraude enchufe',
    'sentencia correos proceso selectivo nulidad impugnación',
    'correos cartero (nepotismo OR enchufismo OR contactos OR favoritismo)',
    'correos examen trampa copia fraude denuncia',
    'OPE correos irregular anulación escándalo filtración',
    'correos pruebas selectivas copia filtración trampa',
  ],
  queryTemplateComunidad: (c) => [
    `correos ${c} (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)`,
    `oposición correos ${c} (recurso OR escándalo OR anulación OR enchufe OR irregular)`,
  ],
  queryTemplateCiudad: (c) =>
    `correos ${c} oposición (impugnación OR fraude OR irregularidad OR denuncia OR anulación)`,
  topicKeywords: [
    'oposicion', 'oposiciones', 'convocatoria', 'proceso selectivo', 'pruebas selectivas',
    'correos', 'cartero', 'repartidor', 'sociedad estatal correos',
    'OPE correos', 'correos y telegrafos', 'correos y telégrafos',
  ],
  extraStopWords: [],

  // fuente-boletines
  terminosBOE: [
    'correos proceso selectivo',
    'sociedad estatal correos proceso selectivo',
    'correos convocatoria oposicion',
    'correos anulacion',
    'correos impugnacion',
    'correos nulidad convocatoria',
    'sociedad estatal correos bases seleccion',
    'correos suspension convocatoria',
    'OPE correos irregularidad rectificacion',
  ],
  keywordsNicho: [
    'correos', 'cartero', 'repartidor', 'sociedad estatal correos',
    'correos y telégrafos', 'OPE correos',
  ],

  // fuente-sentencias
  queriesCENDOJ: [
    'correos oposición anulación nulidad proceso selectivo',
    'sociedad estatal correos oposición discriminación recurso contencioso',
    'correos convocatoria impugnación irregularidad',
  ],
  queriesDDG: [
    'site:poderjudicial.es correos oposición nulidad anulación',
    'site:poderjudicial.es sociedad estatal correos proceso selectivo impugnación',
    'site:poderjudicial.es correos discriminación oposición',
  ],

  // fuente-foros
  subreddits: {
    oposiciones: [
      'correos irregularidad oposicion',
      'correos impugnacion fraude',
      'oposicion correos trampa enchufe',
      'correos proceso selectivo denunci',
      'correos discriminacion oposiciones',
      'correos nepotismo enchufismo selectivo',
      'oposicion correos nulidad recurso',
      'correos examen trampa copia filtración',
    ],
    spain: [
      'oposicion correos fraude escandalo',
      'correos impugnacion oposicion',
      'correos irregularidad selectivo examen',
    ],
  },
  keywordsTema: [
    'correos', 'cartero', 'repartidor', 'sociedad estatal correos', 'ope correos',
    'correos y telégrafos',
  ],
}

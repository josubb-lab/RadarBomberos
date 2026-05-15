export interface NichoConfig {
  nombre:      string
  colectivo:   string
  siteUrl:     string
  heroTitulo:  string
  heroDesc:    string
  placeholder: string
  sugerencias: string[]
  seoTitle:    string
  seoDesc:     string
  tagline:     string
}

const NICHOS: Record<string, NichoConfig> = {
  'bomberos': {
    nombre:      'Radar Bomberos',
    colectivo:   'bombero',
    siteUrl:     'https://firefighter.es',
    heroTitulo:  'Observatorio sobre oposiciones de bomberos en España',
    heroDesc:    'Sentencias, impugnaciones, convocatorias y procesos selectivos basados en fuentes públicas.',
    placeholder: 'Ej: impugnación, discriminación, nulidad, Palma, Ferrol...',
    sugerencias: ['impugnación', 'discriminación', 'nulidad', 'anulación', 'sentencia', 'nepotismo', 'Palma', 'Ferrol'],
    seoTitle:    'Radar Bomberos · Observatorio jurídico de oposiciones a bombero',
    seoDesc:     'Monitorizamos sentencias, impugnaciones, anulaciones y anomalías en oposiciones a bombero en España.',
    tagline:     'Observatorio jurídico · Oposiciones a Bombero · España',
  },
  'policia-local': {
    nombre:      'Radar Policía Local',
    colectivo:   'policía local',
    siteUrl:     'https://radar-policialocal.es',
    heroTitulo:  '¿Te ha pasado algo en tus oposiciones?',
    heroDesc:    'Busca si existe algún precedente — sentencias, impugnaciones, noticias o denuncias relacionadas con tu caso.',
    placeholder: 'Ej: impugnación, fraude, nepotismo, enchufe, discriminación...',
    sugerencias: ['impugnación', 'fraude', 'enchufe', 'discriminación', 'nulidad', 'nepotismo', 'pruebas físicas', 'baremo'],
    seoTitle:    'Radar Policía Local · Buscador de señales en oposiciones a policía local',
    seoDesc:     'Busca precedentes de irregularidades, impugnaciones, sentencias y denuncias en oposiciones a policía local en España.',
    tagline:     'Transparencia · Oposiciones a Policía Local · España',
  },
  'policia-nacional': {
    nombre:      'Radar Policía Nacional',
    colectivo:   'policía nacional',
    siteUrl:     'https://radar-policianacional.es',
    heroTitulo:  '¿Te ha pasado algo en tus oposiciones?',
    heroDesc:    'Busca si existe algún precedente — sentencias, impugnaciones, noticias o denuncias relacionadas con tu caso.',
    placeholder: 'Ej: impugnación, fraude, escala básica, discriminación, enchufe...',
    sugerencias: ['impugnación', 'fraude', 'discriminación', 'nulidad', 'enchufe', 'escala básica', 'pruebas físicas', 'nepotismo'],
    seoTitle:    'Radar Policía Nacional · Buscador de señales en oposiciones al CNP',
    seoDesc:     'Busca precedentes de irregularidades, impugnaciones, sentencias y denuncias en oposiciones a policía nacional en España.',
    tagline:     'Transparencia · Oposiciones a Policía Nacional · España',
  },
  'docentes': {
    nombre:      'Radar Docentes',
    colectivo:   'docente',
    siteUrl:     'https://radar-docentes.es',
    heroTitulo:  '¿Te ha pasado algo en tus oposiciones?',
    heroDesc:    'Busca si existe algún precedente — sentencias, impugnaciones, noticias o denuncias relacionadas con tu caso.',
    placeholder: 'Ej: impugnación, interinos, bolsa, baremo, fraude, discriminación...',
    sugerencias: ['impugnación', 'interinos', 'bolsa', 'baremo', 'fraude', 'discriminación', 'nulidad', 'enchufe'],
    seoTitle:    'Radar Docentes · Buscador de señales en oposiciones de educación',
    seoDesc:     'Busca precedentes de irregularidades, impugnaciones, sentencias y denuncias en oposiciones de maestros y profesores en España.',
    tagline:     'Transparencia · Oposiciones Docentes · España',
  },
  'correos': {
    nombre:      'Radar Correos',
    colectivo:   'correos',
    siteUrl:     'https://radar-correos.es',
    heroTitulo:  '¿Te ha pasado algo en tus oposiciones?',
    heroDesc:    'Busca si existe algún precedente — sentencias, impugnaciones, noticias o denuncias relacionadas con tu caso.',
    placeholder: 'Ej: impugnación, fraude, trampa, filtración, enchufe, OPE...',
    sugerencias: ['impugnación', 'fraude', 'trampa', 'filtración', 'enchufe', 'nulidad', 'OPE', 'copia'],
    seoTitle:    'Radar Correos · Buscador de señales en oposiciones a Correos',
    seoDesc:     'Busca precedentes de irregularidades, impugnaciones, sentencias y denuncias en oposiciones a Correos y Telégrafos en España.',
    tagline:     'Transparencia · Oposiciones a Correos · España',
  },
}

const FALLBACK: NichoConfig = NICHOS['bomberos']

const rawId: string = import.meta.env.PUBLIC_NICHO || 'bomberos'

export const nichoId: string    = rawId
export const nicho:   NichoConfig = NICHOS[rawId] ?? FALLBACK

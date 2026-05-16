/**
 * scripts/scraper.js
 * Scraper de señales jurídicas — oposiciones a bombero en España.
 *
 * Fuentes:
 *   BOE (API sumario JSON) · BOCM · DOGC · DOCV · BOB · BON · BOJA
 *   Google News RSS (noticias generales)
 *
 * Salidas:
 *   1. Supabase `hallazgos`  — señales jurídicas (observatorio)
 *   2. Supabase `noticias`   — noticias generales (home)
 *   3. exports/csv/senales-activas-bomberos-FECHA.csv
 *   4. Vercel Deploy Hook    — rebuild automático de la web
 *
 * Uso:
 *   node --env-file=.env scripts/scraper.js
 *   node --env-file=.env scripts/scraper.js --dias=14
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'

// ── Config ─────────────────────────────────────────────────────────────────

const SB_URL      = process.env.PUBLIC_SUPABASE_URL
const SB_KEY      = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_KEY
const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK
const NICHO       = process.env.PUBLIC_NICHO || 'bomberos'
const DIAS        = parseInt(process.argv.find(a => a.startsWith('--dias='))?.split('=')[1] ?? '7')

if (!SB_URL || !SB_KEY) {
  console.error('❌  Faltan PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const sb = createClient(SB_URL, SB_KEY)

// ── Clasificación ──────────────────────────────────────────────────────────

const TIPO_MAP = {
  anulacion:   ['anulación', 'anulado', 'anulada', 'nulidad', 'nulo', 'nula'],
  impugnacion: ['impugnación', 'impugnado', 'impugna', 'recurso contencioso'],
  sentencia:   ['sentencia', 'fallo', 'auto judicial', 'resolución judicial'],
  suspension:  ['suspensión cautelar', 'suspendido', 'paralización'],
  correccion:  ['corrección de errores', 'fe de erratas'],
}

const KW_BOMBERO  = ['bombero', 'bomberos', 'suhiltzaile', 'suhiltzaileak']
const KW_JURIDICO = Object.values(TIPO_MAP).flat()

function detectarTipo(texto) {
  const t = texto.toLowerCase()
  for (const [tipo, kws] of Object.entries(TIPO_MAP)) {
    if (kws.some(kw => t.includes(kw))) return tipo
  }
  return 'convocatoria'
}

function relevancia(titulo, desc = '') {
  const texto = `${titulo} ${desc}`.toLowerCase()
  const tipo  = detectarTipo(texto)
  if (['anulacion', 'impugnacion', 'sentencia', 'suspension'].includes(tipo)) return 3
  if (KW_JURIDICO.some(kw => texto.includes(kw))) return 2
  return 1
}

function esBombero(texto) {
  return KW_BOMBERO.some(kw => texto.toLowerCase().includes(kw))
}

// ── Dedup ──────────────────────────────────────────────────────────────────

let urlsExistentes = new Set()

async function cargarUrls() {
  const { data } = await sb.from('hallazgos').select('url').eq('nicho', NICHO)
  urlsExistentes = new Set((data ?? []).map(r => r.url).filter(Boolean))
  console.log(`ℹ️   ${urlsExistentes.size} señales ya en Supabase`)
}

// ── Inserción hallazgos ────────────────────────────────────────────────────

let insertados = 0

async function insertar({ titulo, descripcion, fuente, fecha, url, tipo, rel }) {
  if (!url || urlsExistentes.has(url)) return
  const { error } = await sb.from('hallazgos').insert({
    titulo,
    descripcion: descripcion?.slice(0, 500) || titulo,
    fuente,
    fecha:       fecha || null,
    url,
    tipo,
    relevancia:  rel,
    nicho:       NICHO,
    curado:      false,
  })
  if (error) { console.warn(`  ⚠️  ${fuente}: ${error.message} — ${titulo?.slice(0, 50)}`); return }
  urlsExistentes.add(url)
  insertados++
  console.log(`  ✅ [${tipo.padEnd(12)}] ${titulo?.slice(0, 75)}`)
}

// ── Parsear RSS ────────────────────────────────────────────────────────────

function parsearRSS(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const b   = m[1]
    const get = tag => {
      const cd = b.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`))?.[1]
      return (cd ?? b.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? '').trim()
    }
    return {
      titulo: get('title'),
      link:   get('link') || get('guid'),
      desc:   get('description'),
      fecha:  get('pubDate'),
    }
  })
}

function toFecha(str) {
  if (!str) return null
  try { return new Date(str).toISOString().slice(0, 10) } catch { return null }
}

// ── FUENTE: BOE — API sumario JSON ─────────────────────────────────────────

function extraerItemsBOE(obj, lista = []) {
  if (!obj || typeof obj !== 'object') return lista
  if (Array.isArray(obj)) { obj.forEach(i => extraerItemsBOE(i, lista)); return lista }
  if (obj.titulo && (obj.urlHtml || obj.url_html)) { lista.push(obj); return lista }
  Object.values(obj).forEach(v => extraerItemsBOE(v, lista))
  return lista
}

async function scrapeBOE() {
  console.log('\n📋 BOE — sumarios diarios')
  let encontrados = 0

  for (let i = 0; i < DIAS; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const id = d.toISOString().slice(0, 10).replace(/-/g, '')
    try {
      const res = await fetch(`https://www.boe.es/datosabiertos/api/boe/sumario/${id}`, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) continue
      const json = await res.json()
      const items = extraerItemsBOE(json)

      for (const item of items) {
        const titulo = item.titulo ?? ''
        if (!esBombero(titulo)) continue
        const url = item.identificador
          ? `https://www.boe.es/diario_boe/txt.php?id=${item.identificador}`
          : ''
        await insertar({
          titulo,
          descripcion: titulo,
          fuente: 'BOE',
          fecha:  d.toISOString().slice(0, 10),
          url,
          tipo:   detectarTipo(titulo),
          rel:    relevancia(titulo),
        })
        encontrados++
      }
    } catch (e) { console.warn(`  ⚠️  BOE ${id}: ${e.message}`) }
  }
  console.log(`  → ${encontrados} ítems con "bombero"`)
}

// ── FUENTE: Boletines autonómicos ──────────────────────────────────────────

const BOLETINES = [
  { nombre: 'DOGC', rss: 'https://dogc.gencat.cat/ca/pdogc_canals_interns/pdogc_resultats_fitxa/?action=fitxa&text=bombero&format=rss', atom: false },
  { nombre: 'BOB',  rss: 'http://www.bizkaia.eus/lehendakaritza/Bao_bob/RSS/BT00_RSS_EU.XML',                                          atom: false },
  { nombre: 'BOJA', rss: 'https://www.juntadeandalucia.es/boja/distribucion/s51.xml', atom: true },
  { nombre: 'BOJA', rss: 'https://www.juntadeandalucia.es/boja/distribucion/s52.xml', atom: true },
]

function parsearAtom(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
    const b    = m[1]
    const get  = tag => b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? ''
    const href = b.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? ''
    return { titulo: get('title'), link: href, desc: get('content') || get('summary') || '', fecha: get('updated') }
  })
}

async function scrapeBoletines() {
  console.log('\n📋 Boletines autonómicos')

  for (const bol of BOLETINES) {
    try {
      const res = await fetch(bol.rss, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) { console.warn(`  ⚠️  ${bol.nombre}: HTTP ${res.status}`); continue }
      const xml   = await res.text()
      const items = bol.atom ? parsearAtom(xml) : parsearRSS(xml)
      let cnt = 0

      for (const item of items) {
        const texto = `${item.titulo} ${item.desc}`
        if (!esBombero(texto)) continue
        const rel = relevancia(item.titulo, item.desc)
        if (rel < 2) continue

        await insertar({
          titulo:      item.titulo,
          descripcion: item.desc,
          fuente:      bol.nombre,
          fecha:       toFecha(item.fecha),
          url:         item.link,
          tipo:        detectarTipo(texto),
          rel,
        })
        cnt++
      }
      console.log(`  ${bol.nombre.padEnd(6)}: ${cnt} señales jurídicas`)
    } catch (e) { console.warn(`  ⚠️  ${bol.nombre}: ${e.message}`) }
  }
}

// ── FUENTE: Google News RSS — noticias generales ───────────────────────────

async function scrapeNoticias() {
  console.log('\n📰 Noticias generales (Google News)')

  const queries = [
    'bomberos+oposiciones+España',
    'bomberos+impugnación+proceso+selectivo',
    'bomberos+convocatoria+plazas+2025',
  ]

  const candidatas = []
  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${q}&hl=es-ES&gl=ES&ceid=ES:es`
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const xml = await res.text()
      parsearRSS(xml).slice(0, 6).forEach(i => {
        if (i.titulo && i.link) candidatas.push({ titulo: i.titulo, url: i.link, fecha: toFecha(i.fecha) })
      })
    } catch (e) { console.warn(`  ⚠️  Google News "${q}": ${e.message}`) }
  }

  // Dedup por URL
  const unicas = [...new Map(candidatas.map(n => [n.url, n])).values()].slice(0, 12)

  // Cargar URLs ya existentes en tabla noticias
  const { data: existentes } = await sb.from('noticias').select('url').eq('nicho', NICHO)
  const urlsNoticias = new Set((existentes ?? []).map(r => r.url))

  let cnt = 0
  for (const n of unicas) {
    if (urlsNoticias.has(n.url)) continue
    const { error } = await sb.from('noticias').insert({ ...n, nicho: NICHO })
    if (!error) cnt++
  }
  console.log(`  → ${cnt} noticias nuevas`)
}

// ── CSV — señales activas (tipo != sentencia) ──────────────────────────────

async function generarCSV() {
  console.log('\n📊 CSV señales activas...')

  const { data, error } = await sb
    .from('hallazgos')
    .select('titulo, tipo, fuente, fecha, url, relevancia, descripcion, created_at')
    .eq('nicho', NICHO)
    .neq('tipo', 'sentencia')
    .gte('relevancia', 2)
    .order('fecha', { ascending: false, nullsFirst: false })

  if (error || !data?.length) {
    console.warn('  ⚠️  Sin datos:', error?.message ?? 'vacío')
    return
  }

  const cols  = ['titulo', 'tipo', 'fuente', 'fecha', 'relevancia', 'url', 'descripcion']
  const filas = data.map(r => cols.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))
  const csv   = [cols.join(','), ...filas].join('\n')

  mkdirSync('exports/csv', { recursive: true })
  const fecha = new Date().toISOString().slice(0, 10)
  const path  = `exports/csv/senales-activas-bomberos-${fecha}.csv`
  writeFileSync(path, `﻿${csv}`, 'utf8') // BOM para Excel
  console.log(`  ✅ ${path}  (${data.length} filas)`)
}

// ── Deploy Hook ────────────────────────────────────────────────────────────

async function dispararDeploy() {
  if (!DEPLOY_HOOK) {
    console.log('\n⚠️  VERCEL_DEPLOY_HOOK no configurado — haz git push para actualizar la web')
    return
  }
  try {
    await fetch(DEPLOY_HOOK, { method: 'POST', signal: AbortSignal.timeout(10000) })
    console.log('\n🚀 Vercel deploy disparado')
  } catch (e) { console.warn('\n⚠️  Deploy hook falló:', e.message) }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔍 Scraper Radar Bomberos — ${new Date().toISOString()}`)
  console.log(`   Nicho: ${NICHO} · Días atrás: ${DIAS}\n`)

  await cargarUrls()
  await scrapeBOE()
  await scrapeBoletines()
  await scrapeNoticias()

  console.log(`\n✅ Señales insertadas esta ejecución: ${insertados}`)

  await generarCSV()
  await dispararDeploy()

  console.log('\n🏁 Scraper completado')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

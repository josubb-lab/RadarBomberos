/**
 * fuente-boletines.js
 * BOE — parametrizado por nicho.
 */

import axios    from "axios";
import * as cheerio from "cheerio";

const BOE_URL  = "https://www.boe.es/buscar/boe.php";
const DELAY_MS = 2_000;
const PUNTOS   = 30;

const KEYWORDS_NEGATIVAS = [
  "impugnaci", "anulaci", "nulidad", "suspensi", "irregularidad",
  "rectificaci", "denegad",
];

const sleep      = (ms) => new Promise((r) => setTimeout(r, ms));
const esNegativo = (t) => KEYWORDS_NEGATIVAS.some((kw) => t.toLowerCase().includes(kw));

function buildParams(termino) {
  return new URLSearchParams({
    "campo[0]":      "ORIS",
    "dato[0][1]":    "1",
    "dato[0][2]":    "2",
    "dato[0][3]":    "3",
    "dato[0][4]":    "4",
    "dato[0][5]":    "5",
    "operador[0]":   "and",
    "campo[1]":      "TITULOS",
    "dato[1]":       termino,
    "operador[1]":   "and",
    "sort_field[0]": "FPU",
    "sort_order[0]": "desc",
    "page_hits":     "100",
    "campo[6]":      "FPU",
    "dato[6][0]":    "2000-01-01",
    "operador[6]":   "and",
    "accion":        "Buscar",
  });
}

function parsearFecha(lineaPub) {
  const m = lineaPub.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

async function consultarBOE(termino) {
  try {
    const { data: html } = await axios.get(`${BOE_URL}?${buildParams(termino)}`, {
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      timeout: 15_000,
    });

    const $          = cheerio.load(html);
    const resultados = [];

    $("li.resultado-busqueda").each((_i, el) => {
      const parrafos = $(el).find("p");
      const lineaDem = parrafos.eq(0).text().trim();
      const lineaPub = parrafos.eq(1).text().trim();
      const resumen  = parrafos.eq(2).text().trim();
      const enlace   = $(el).find("a.resultado-busqueda-link-defecto").attr("href") ?? "";

      if (!resumen) return;

      const url = enlace.startsWith("http")
        ? enlace
        : `https://www.boe.es/buscar/${enlace.replace(/^\.\.\/buscar\//, "")}`;

      resultados.push({
        titulo:  resumen,
        resumen: `${lineaDem} — ${lineaPub}`.trim(),
        fecha:   parsearFecha(lineaPub),
        url,
      });
    });

    return resultados;
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn(`[Boletines] Rate limit BOE. Esperando 8 s...`);
      await sleep(8_000);
    } else {
      console.warn(`[Boletines] Error («${termino}»): ${err.message}`);
    }
    return [];
  }
}

export async function analizarBoletines(config) {
  const esSobreNicho = (t) => config.keywordsNicho.some((kw) => t.toLowerCase().includes(kw));
  const hallazgos    = [];

  for (const termino of config.terminosBOE) {
    const resultados = await consultarBOE(termino);

    for (const r of resultados) {
      const texto = `${r.titulo} ${r.resumen}`;
      if (esSobreNicho(texto) && esNegativo(texto)) {
        hallazgos.push({
          fuente:      "BOE",
          tipo:        "boletin_negativo",
          titulo:      r.titulo,
          descripcion: r.resumen || null,
          fecha:       r.fecha,
          url:         r.url,
          puntos:      PUNTOS,
        });
      }
    }

    console.log(`[Boletines] «${termino}» → ${resultados.length} docs, ${hallazgos.length} hallazgos acumulados`);
    await sleep(DELAY_MS);
  }

  const seen = new Set();
  return hallazgos.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

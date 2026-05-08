/**
 * fuente-foros.js
 * Reddit — quejas sobre oposiciones a bombero (subreddits múltiples).
 */

import axios from "axios";

const PUNTOS_FORO = 2;
const MIN_REPLIES = 1;

const SUBREDDITS = ["oposiciones", "spain", "bomberos"];

const QUERIES_POR_SUB = {
  oposiciones: [
    "bomberos irregularidad oposicion",
    "bomberos impugnacion fraude",
    "oposicion bombero trampa enchufe",
    "bombero proceso selectivo denunci",
    "bomberos discriminacion oposiciones",
    "SPEIS oposicion irregularidad",
    "bombero nepotismo enchufismo selectivo",
    "oposicion bombero nulidad recurso",
  ],
  spain: [
    "oposicion bomberos fraude",
    "bomberos impugnacion oposicion",
    "bombero irregularidad selectivo",
  ],
  bomberos: [
    "oposicion irregularidad fraude",
    "impugnacion proceso selectivo",
    "enchufe nepotismo oposicion",
  ],
};

const KEYWORDS_QUEJA = [
  "trampa", "fraude", "amiguismo", "enchufe", "irregularidad",
  "denunci", "escándalo", "injust", "impugn", "nulidad",
  "chanchullo", "favoritismo", "tongo", "contactos",
  "queja", "vergüenza", "corrupción", "manipulaci",
  "enchufismo", "nepotismo", "discriminaci", "ilegal",
];

const KEYWORDS_BOMBERO = [
  "bombero", "bomberos", "speis", "extincion", "extinción",
];

const esQueja    = (t) => KEYWORDS_QUEJA.some((kw) => t.toLowerCase().includes(kw));
const esBomberos = (t) => KEYWORDS_BOMBERO.some((kw) => t.toLowerCase().includes(kw));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function buscarReddit(subreddit, query) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?` +
    new URLSearchParams({ q: query, sort: "new", limit: "50", restrict_sr: "1" });

  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "web_radar/1.0 (educational project)" },
      timeout: 10_000,
    });

    const posts = data?.data?.children ?? [];
    const hallazgos = [];

    for (const { data: post } of posts) {
      const titulo = post.title    ?? "";
      const body   = post.selftext ?? "";
      const texto  = `${titulo} ${body}`;

      if (esQueja(texto) && esBomberos(texto) && (post.num_comments ?? 0) >= MIN_REPLIES) {
        hallazgos.push({
          fuente:      "Reddit r/oposiciones",
          tipo:        "queja_foro",
          titulo,
          descripcion: body.slice(0, 300) || null,
          fecha:       new Date(post.created_utc * 1000).toISOString(),
          url:         `https://www.reddit.com${post.permalink}`,
          puntos:      PUNTOS_FORO,
        });
      }
    }

    return hallazgos;
  } catch (err) {
    console.warn(`[Foros] Error Reddit r/${subreddit} («${query}»): ${err.message}`);
    return [];
  }
}

export async function analizarForos() {
  const allHallazgos = [];

  for (const [sub, queries] of Object.entries(QUERIES_POR_SUB)) {
    for (const query of queries) {
      const hallazgos = await buscarReddit(sub, query);
      allHallazgos.push(...hallazgos);
      if (hallazgos.length > 0) {
        console.log(`[Foros] r/${sub} «${query}» → ${hallazgos.length} posts`);
      }
      await sleep(1_200);
    }
  }

  const seen = new Set();
  return allHallazgos.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

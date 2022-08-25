#!/usr/bin/env node
const fs = require("fs-extra");
const { resolve } = require("path");
const crypto = require("crypto");
const { config } = require("up-dir-env");

const loadFech = async () => {
  if (!global.fetch) {
    await import("node-fetch").then((v) => {
      global.fetch = v.default;
    });
  }
};

const languagesText = [
  "en",
  "zh",
  "cht",
  "kor",
  "fra",
  "de",
  "jp",
  "spa",
  "ru",
  "it",
];

const getItem = (key, items) => {
  const { en, zh, cht, kor, fra, de, jp, spa, ru, it } = items;
  return `
  "${key}": i18nLocal({
    en: \`${en}\`,
    zh: \`${zh}\`,
    cht: \`${cht}\`,
    kor: \`${kor}\`,
    fra: \`${fra}\`,
    de: \`${de}\`,
    jp: \`${jp}\`,
    spa: \`${spa}\`,
    ru: \`${ru}\`,
    it: \`${it}\`,
  }),
  `;
};

// 此密钥不可公布
const baiduURL = "https://fanyi-api.baidu.com/api/trans/vip/translate";
const caches = {
  cache: undefined,
  appid: "",
  password: "",
};

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex").toString();
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

const fetchTranslate = async (lang, q) => {
  // lang = baiduLanguageMap[lang];
  let key = lang + "__" + q;
  if (caches.cache[key]) {
    return caches.cache[key];
  }
  if (!caches.appid || !caches.password) {
    throw "Not found: appid, password";
  }

  const salt = Date.now();
  const sign = md5(caches.appid + q + salt + caches.password);
  const code = encodeURIComponent(q);
  const query = `q=${code}&from=auto&to=${lang}&appid=${caches.appid}&salt=${salt}&sign=${sign}&tts=0&dict=0`;
  const url = `${baiduURL}?${query}`;
  try {
    const res = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    }).then((v) => v.json());
    if (
      res &&
      res.trans_result &&
      res.trans_result[0] &&
      res.trans_result[0].dst
    ) {
      const dst = res.trans_result[0].dst;
      caches.cache[key] = dst;
      return dst;
    } else {
      console.error(res);
    }
  } catch (err) {
    console.error(err);
    return q;
  }

  return q;
};

const allTranslate = {};

const i18nCli = async (inputDir) => {
  await loadFech();
  let cachePath = resolve(__dirname, "./cache.json");
  if (!fs.existsSync(cachePath)) {
    fs.writeFileSync(cachePath, "{}");
  }
  caches.cache = require(cachePath);
  if (!caches.cache) {
    throw `Not found: ${cache}`;
  }

  caches.appid = process.env["translate_appid"];
  caches.password = process.env["translate_password"];

  if (!caches.appid || !caches.password) {
    throw `Not found: .env: translate_appid, translate_password`;
  }

  await require("esbuild").build({
    entryPoints: [resolve(process.cwd(), inputDir, "lang.ts")],
    outfile: resolve(__dirname, "temp_lang.js"),
    bundle: true,
    target: ["node16"],
    format: "cjs",
    platform: "node",
    treeShaking: false,
    define: {
      "import.meta.vitest": "false",
      "import_meta.vitest": "false",
    },
    sourcemap: false,
    allowOverwrite: true,
  });

  const langSouces = require(resolve(__dirname, "temp_lang.js")).default;
  const keys = Object.keys(langSouces);

  for (const key of keys) {
    console.log("fetch translate:", key);
    const data = {};
    const promises = [];
    const langs = [];
    for (const langKind of languagesText) {
      const q = langSouces[key];
      if (typeof q === "object") {
        if (q[langKind]) {
          data[langKind] = q[langKind];
        } else {
          promises.push(fetchTranslate(langKind, q["zh"] || q["en"]));
          langs.push(langKind);
        }
      } else {
        langs.push(langKind);
        promises.push(fetchTranslate(langKind, q));
      }
    }
    const list = await Promise.all(promises);

    list.forEach((text, i) => {
      data[langs[i]] = text;
    });
    allTranslate[key] = data;
    fs.writeJSONSync(cachePath, caches.cache, { spaces: 2 });
  }
  let text = "";
  Object.keys(allTranslate).forEach((key) => {
    text += getItem(key, allTranslate[key]);
  });
  const file = `
/* Don't edit this file, it's generate from https://www.npmjs.com/package/i18n-less-translate */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { i18nLocal } from "i18n-less-translate";
import lang from "./lang";
export const i18n: typeof lang = {${text}} as any;
`.trim();
  const serveLang = `
/* Don't edit this file, it's generate from https://www.npmjs.com/package/i18n-less-translate */
/* eslint-disable @typescript-eslint/no-explicit-any */
import lang from "./lang";
export const serveLang = { ...lang };

Object.keys(serveLang).forEach((k) => {
  (serveLang as never as Record<string, string>)[k] = k;
});
  `.trim();
  fs.writeJSONSync(cachePath, caches.cache, { spaces: 2 });
  fs.writeFileSync(resolve(process.cwd(), inputDir, "index.ts"), file);
  fs.writeFileSync(resolve(process.cwd(), inputDir, "serveLang.ts"), serveLang);
  fs.rmSync(resolve(__dirname, "temp_lang.js"));
};

const argv = process.argv.splice(2);
const entryDir = argv[0];
const envPath = argv[1] || "./";
config();
i18nCli(entryDir);

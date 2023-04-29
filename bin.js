#!/usr/bin/env node
const fs = require("fs-extra");
const { resolve } = require("path");
const crypto = require("crypto");
const { config } = require("up-dir-env");
const path = require("path");

function getLastDir(url) {
  const dirs = path.dirname(url).split("/");
  return dirs[dirs.length - 1];
}

function urlToName(url) {
  const parseStr = (str, split) => {
    const parts = str.split(split);
    const nameParts = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part.length > 0) {
        const namePart = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        nameParts.push(namePart);
      }
    }

    return nameParts.join("");
  };
  url = parseStr(url, "/");
  url = parseStr(url, " ");
  return url;
}

function upperFirst(url) {
  return url[0].toUpperCase() + url.slice(1);
}

function lowerFirst(url) {
  return url[0].toLowerCase() + url.slice(1);
}

const loadFech = async () => {
  if (!global.fetch) {
    await import("node-fetch").then((v) => {
      global.fetch = v.default;
    });
  }
};

const languagesText = ["en", "zh", "cht", "kor", "fra", "de", "jp", "spa", "ru", "it"];

const getItem = (key, items) => {
  const { en, zh, cht, kor, fra, de, jp, spa, ru, it } = items;
  return `
  "${key}": {
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
  }[lng],
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
    if (res && res.trans_result && res.trans_result[0] && res.trans_result[0].dst) {
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
let cachePath = "";
let golangPath = "";

const i18nCli = async (inputDir) => {
  await loadFech();
  if (!cachePath) {
    console.error(`Not set cache path, please set like:`);
    console.error(`i18n-less-translate ./i18n --catch ~/i18n-cache.json`);
    return;
  }
  console.log("i18n cache path:", cachePath);
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

  const tempFile = `temp_lang${String(Math.random()).replace("0.", "")}.js`;
  await require("esbuild").build({
    entryPoints: [resolve(process.cwd(), inputDir, "lang.ts")],
    outfile: resolve(__dirname, tempFile),
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

  const langSouces = require(resolve(__dirname, tempFile)).default;
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
  let golangText = "";
  Object.keys(allTranslate).forEach((key) => {
    text += getItem(key, allTranslate[key]);
    if (golangPath) {
      golangText += `const ${urlToName(key)} = "${key}"\n`;
    }
  });
  const file = `
/* Don't edit this file, it's generate from https://www.npmjs.com/package/i18n-less-translate */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { i18nLocal, Langs } from "i18n-less-translate";
import lang from "./lang";
type TypeLang = typeof lang;

export const i18nReload = (lng: keyof Langs):TypeLang=>{
  return {
    ${text}
  } as any;
}

export const i18n: typeof lang = i18nReload(i18nLocal.getLanguage());
`.trim();
  const i18nKeys = `
/* Don't edit this file, it's generate from https://www.npmjs.com/package/i18n-less-translate */
/* eslint-disable @typescript-eslint/no-explicit-any */
import lang from "./lang";
export const i18nKeys = { ...lang };

Object.keys(i18nKeys).forEach((k) => {
  (i18nKeys as never as Record<string, string>)[k] = k;
});
  `.trim();
  fs.ensureDirSync(path.dirname(cachePath));
  fs.writeJSONSync(cachePath, caches.cache, { spaces: 2 });
  fs.writeFileSync(resolve(process.cwd(), inputDir, "index.ts"), file);
  fs.writeFileSync(resolve(process.cwd(), inputDir, "i18nKeys.ts"), i18nKeys);
  fs.rmSync(resolve(__dirname, tempFile));

  if (golangPath) {
    const golangKeys = `package ${getLastDir(golangPath)}

${golangText}
    `;
    fs.ensureDirSync(path.dirname(golangPath));
    fs.writeFileSync(golangPath, golangKeys, { spaces: 2 });
  }
};

const argv = process.argv.splice(2);
const entryDir = argv[0];
config();
i18nCli(entryDir);

for (let i = 0; i < argv.length; i++) {
  const v = argv[i];
  if (v === "--cache") {
    cachePath = resolve(process.cwd(), argv[i + 1]);
  } else if (v === "--golang") {
    golangPath = resolve(process.cwd(), argv[i + 1]);
  }
}

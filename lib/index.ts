/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Langs {
  en: string;
  zh?: string;
  cht?: string;
  kor?: string;
  fra?: string;
  de?: string;
  jp?: string;
  spa?: string;
  ru?: string;
  it?: string;
}

let nowLang = "" as keyof Langs;

const langMap = {
  en: "en",
  "zh-CN": "zh",
  "zh-": "cht",
  "ko-": "kor",
  fr: "fra",
  de: "de",
  "ja-": "jp",
  es: "spa",
  ru: "ru",
  it: "it",
};

const keys = Object.keys(langMap);
const is_ssr =
  typeof window === "undefined" ||
  typeof window.localStorage === "undefined" ||
  typeof window.navigator === "undefined";

if (!is_ssr) {
  const old = localStorage.getItem("i18n-less-language");
  if (old) {
    (nowLang as string) = old;
  } else {
    let language = "en";
    if (navigator.language) {
      language = navigator.language;
    } else if ((navigator as any)["browserLanguage"]) {
      language = (navigator as any)["browserLanguage"];
    }
    for (let i = 0; i < keys.length; i++) {
      const v = keys[i];
      if (language.indexOf(v) === 0) {
        console.log(langMap, v);
        nowLang = (langMap as any)[v];
        break;
      }
    }
  }
}

const languagesText = {
  en: "English",
  zh: "简体中文",
  cht: "繁体中文",
  kor: "한국인",
  fra: "Français",
  de: "Deutsch",
  jp: "日本",
  spa: "Española",
  ru: "русский",
  it: "Italia",
};

const needUpper = {
  en: true,
  fra: true,
  de: true,
  ru: true,
  spa: true,
} as Record<string, boolean>;

type II18fn = (languages: Langs, defLang?: keyof Langs) => string;

interface II18fnProp {
  // 使用 cli 进行生成多语言
  setNowLanguage: (v: keyof Langs) => void;
  getLanguage: () => keyof Langs;
  isZh: () => boolean;
  isEn: () => boolean;
  languagesText: typeof languagesText & Record<string, string>;
}

const upperFirst = (str: string) => {
  return str[0].toUpperCase() + str.substring(1);
};

export const i18nLocal: II18fn & II18fnProp = (
  languages: Langs,
  defLang?: keyof Langs
): string => {
  let lang = defLang || i18nLocal.getLanguage();
  let str = languages[lang];
  if (!str) {
    lang = "en";
    str = languages[lang];
  }
  if (!str) {
    console.error("i8n not find");
    str = "[i18n not find]";
  }

  if (needUpper[lang]) {
    str = upperFirst(str);
  }
  return str;
};

i18nLocal.setNowLanguage = (v: keyof Langs) => {
  nowLang = v;
  if (!is_ssr) {
    localStorage.setItem("i18n-less-language", nowLang);
  }
};

i18nLocal.getLanguage = (): keyof Langs => {
  return nowLang;
};

i18nLocal.isZh = () => nowLang == "zh";
i18nLocal.isEn = () => nowLang == "en";
i18nLocal.languagesText = languagesText;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lang(obj: Partial<Langs>): any {
  return obj;
}

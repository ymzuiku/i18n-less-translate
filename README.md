# 特性

- 约定大于配置
- 利用翻译接口自动翻译多语言
- 后端无须进行多语言配置，后端只需返回错误原始 key，前端进行多语言
- 支持 typescript, 支持将翻译后的对象映射到声明对象的类型中，方便调整

## 使用方法：

确保 .env 文件有以下变量, 记录着百度翻译 api 的密钥：

```sh
translate_appid="xxxxxxxxxxxxx"
translate_password="xxxxxxxxxxxxxxxxx"
```

## 创建语言文件

创建一个目录：

```sh
mkdir i18n
```

创建一个描述默认语言的文件，**约定为 `lang.ts`**：

```sh
touch i18n/lang.ts
```

```typescript
import { lang } from "i18n-less-translate";

export default {
  "web title": lang({
    zh: "某系统",
    en: "One OS",
  }),
  "Please input phone": "请输入手机号",
  "Incorrect phone format": "手机号格式不正确",
  "Please input send code": "请输入验证码",
  "Verification is error": "验证码不正确",
  "Incorrect code format": "验证码格式错误",
  "Please select phone crown": "请选择手机号的国际区域",
  "Please input password": "请输入密码",
  "Incorrect password format": "密码格式错误",
  "Send code type error": "验证码类型错误",
  "Verification code length is error": "验证码格式不正确",
};
```

### 默认支持的语言

i8n-less-translate 默认会翻译以下语言

```sh
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
```

如果要覆盖默认翻译语言, 可以使用此方式声明某个语言不进行翻译:

```typescript
import { lang } from "i18n-less-translate";
"web title": lang({
  zh: "某系统",
  en: "One OS",
}),
```

## 翻译多国语言

确保 i18n 目录下有 lang.ts 文件, 然后执行

```sh
i18n-less-translate ./i18n --cache ./i18n_cache.json
```

如果 `.env` 路径不在执行目录（monorepo 类型的工程）, 可以指定相对 `.env` 路径

```sh
i18n-less-translate ./i18n ../../.env  --cache ./i18n_cache.json
```

如果要编译 golang 的 i18nKey 常量:

```sh
i18n-less-translate ./i18n ../../.env  --cache ./i18n_cache.json --golang ../your-golang-pkg
```

## 在工程中使用翻译好的代码

```typescript
import { i18n } from "./i18n";

// i18n 会根据用户浏览器的语种返回一个翻译后的string
// 注意 i18n[".."] 是一个 string，这是为了调整修改原始语言方便，所以类型映射到了原始文件中
console.log(i18n["Please input phone"]);
```

## 切换语言

默认会读取用户浏览器的语言，如果要切换，可以执行：

```typescript
import { i18nLocal } from "i18n-less-translate";

// 注意，切换后需要刷新页面
i18nLocal.setNowLanguage("zh");
```

## 后端返回多语言 key

i18n 做了一个巧妙的设计，如果要实现后端的多语言，后端只需要返回前端多语言的 key 即可，所以后端不需要知道用户端的当前语言。

这种设计不仅减少了后端的开销，而且让 services 层更好的对错误进行测试。

以下是后端应该返回的错误类型：

```typescript
// ./i18n/i18nKeys 是自动生成的一系列多语言的key
import { i18nKeys } from "./i18n/i18nKeys";

console.log(i18nKeys["Please input phone"]); // 输出值和key一致： Please input phone

app.use("/example", () => {
  throw Error(i18nKeys["Please input phone"]);
});
```

## SSR 中解决水合问题

参考: https://nextjs.org/docs/messages/react-hydration-error

在项目中添加一个一个 useI18n.ts 的文件

```tsx
import { i18nLocal } from "i18n-less-translate";
import { useEffect, useState } from "react";
import { i18n, i18nReload } from "./index";

const cache = {
  render: false,
};

export function useI18n() {
  if (!cache.render) {
    cache.render = true;
    Object.assign(i18n, i18nReload("en"));
  }
  const [lng, setLng] = useState(i18n);
  useEffect(() => {
    if (!i18nLocal.isEn()) {
      Object.assign(i18n, i18nReload(i18nLocal.getLanguage()));
      setLng({ ...i18n });
    }
  }, []);
  return lng as typeof i18n;
}
```

### 不使用自动翻译

添加参数: '--nofetch'

```sh
i18n-less-translate ./i18n --cache ./i18n_cache.json --nofetch
```

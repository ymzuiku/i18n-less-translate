var i=Object.defineProperty;var l=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var c=(n,a)=>{for(var e in a)i(n,e,{get:a[e],enumerable:!0})},d=(n,a,e,t)=>{if(a&&typeof a=="object"||typeof a=="function")for(let g of u(a))!p.call(n,g)&&g!==e&&i(n,g,{get:()=>a[g],enumerable:!(t=l(a,g))||t.enumerable});return n};var L=n=>d(i({},"__esModule",{value:!0}),n);var v={};c(v,{i18nLocal:()=>h,lang:()=>k});module.exports=L(v);var s="",o={en:"en","zh-CN":"zh","zh-":"cht","ko-":"kor",fr:"fra",de:"de","ja-":"jp",es:"spa",ru:"ru",it:"it",th:"th",vi:"vie",pt:"pt"},r=Object.keys(o),f=typeof window>"u"||typeof window.localStorage>"u"||typeof window.navigator>"u";if(!f){let n=localStorage.getItem("i18n-less-language");if(n)s=n;else{let a="en";navigator.language?a=navigator.language:navigator.browserLanguage&&(a=navigator.browserLanguage);for(let e=0;e<r.length;e++){let t=r[e];if(a.indexOf(t)===0){s=o[t];break}}}}var y={en:"English",zh:"\u7B80\u4F53\u4E2D\u6587",cht:"\u7E41\u4F53\u4E2D\u6587",kor:"\uD55C\uAD6D\uC778",fra:"Fran\xE7ais",de:"Deutsch",jp:"\u65E5\u672C",spa:"Espa\xF1ola",ru:"\u0440\u0443\u0441\u0441\u043A\u0438\u0439",it:"Italia",th:"\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22",vie:"Vi\u1EC7t Nam",pt:"Portugu\xEAs"},h={setNowLanguage:n=>{s=n,f||localStorage.setItem("i18n-less-language",s)},getLanguage:()=>s,languagesText:y};function k(n){return n}

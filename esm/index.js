var a="",i={en:"en","zh-CN":"zh","zh-":"cht","ko-":"kor",fr:"fra",de:"de","ja-":"jp",es:"spa",ru:"ru",it:"it",th:"th",vi:"vie",pt:"pt"},s=Object.keys(i),r=typeof window>"u"||typeof window.localStorage>"u"||typeof window.navigator>"u";if(!r){let n=localStorage.getItem("i18n-less-language");if(n)a=n;else{let e="en";navigator.language?e=navigator.language:navigator.browserLanguage&&(e=navigator.browserLanguage);for(let t=0;t<s.length;t++){let g=s[t];if(e.indexOf(g)===0){a=i[g];break}}}}var o={en:"English",zh:"\u7B80\u4F53\u4E2D\u6587",cht:"\u7E41\u4F53\u4E2D\u6587",kor:"\uD55C\uAD6D\uC778",fra:"Fran\xE7ais",de:"Deutsch",jp:"\u65E5\u672C",spa:"Espa\xF1ola",ru:"\u0440\u0443\u0441\u0441\u043A\u0438\u0439",it:"Italia",th:"\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22",vie:"Vi\u1EC7t Nam",pt:"Portugu\xEAs"},f={setNowLanguage:n=>{a=n,r||localStorage.setItem("i18n-less-language",a)},getLanguage:()=>a,languagesText:o};function l(n){return n}export{f as i18nLocal,l as lang};

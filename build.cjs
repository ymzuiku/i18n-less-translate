const fs = require("fs");
const path = require("path");
const { build } = require("esbuild");

const formDir = "/Applications/source/work/amarkdown/packages/i18n-less-translate";
const toDir = "./";
const ignores = ["node_modules", ".git", ".DS_Store", "package.json"];

const pkg = require("./package.json");
const dep = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

const runBuild = () => {
  build({
    entryPoints: ["lib/index.ts"],
    bundle: true,
    format: "cjs",
    external: Object.keys(dep),
    outfile: "cjs/index.js",
    minify: true,
    loader: {
      ".svg": "dataurl",
    },
    logLevel: "info",
  }).catch(() => process.exit(1));

  build({
    entryPoints: ["lib/index.ts"],
    bundle: true,
    format: "esm",
    external: Object.keys(dep),
    outfile: "esm/index.js",
    minify: true,
    loader: {
      ".svg": "dataurl",
    },
    logLevel: "info",
  }).catch(() => process.exit(1));
};

// 递归地遍历目录并返回所有文件的路径
function getAllFiles(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const isNodeModules = filePath.includes("node_modules");
    if (ignores.includes(file) || isNodeModules) return;

    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// 用于将更改同步到另一个文件夹的函数
function syncFiles(fileList, sourceDir, targetDir) {
  fileList.forEach((file) => {
    const relativePath = path.relative(sourceDir, file);
    const targetPath = path.join(targetDir, relativePath);
    fs.copyFileSync(file, targetPath);
    console.log(`Synced ${file} to ${targetPath}`);
  });
}

if (fs.existsSync(formDir)) {
  fs.watch(formDir, { recursive: true }, (eventType, filename) => {
    if (/temp_lang/.test(filename)) {
      return;
    }
    console.log(`Event type: ${eventType}, filename: ${filename}`);
    const fileList = getAllFiles(formDir);
    syncFiles(fileList, formDir, toDir);
    runBuild();
  });
  const fileList = getAllFiles(formDir);
  syncFiles(fileList, formDir, toDir);
}

runBuild();

// sigil/esbuild.mjs
//
import * as esbuild from "esbuild";
import {
  importTransformationPlugin,
  outputWatcherPlugin,
  copyAssetsPlugin,
  decoratorFixPlugin,
} from "onejs-core/scripts/esbuild/index.mjs";

const once = process.argv.includes("--once");

let ctx = await esbuild.context({
  entryPoints: ["@outputs/tsc/index.js"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  sourcemap: "inline",
  outfile: "@outputs/esbuild/app.js",
  plugins: [
    importTransformationPlugin(),
    !once && outputWatcherPlugin(),
    copyAssetsPlugin(),
    decoratorFixPlugin(),
  ].filter(Boolean),
  inject: ["onejs-core/dist/index.js"],
  alias: {
    onejs: "onejs-core",
    preact: "onejs-preact",
    react: "onejs-preact/compat",
    "react-dom": "onejs-preact/compat",
    crypto: "./stubs/node/crypto.ts",
    // child_process: "./stubs/node/child_process.ts",
    // fs: "./stubs/node/fs.ts",
    path: "./stubs/node/path.ts",
    // readline: "./stubs/node/readline.ts",
    // http: "./stubs/node/http.ts",
    // https: "./stubs/node/https.ts",
    // net: "./stubs/node/net.ts",
    // tls: "./stubs/node/tls.ts",
    // zlib: "./stubs/node/zlib.ts",
    // stream: "./stubs/node/stream.ts",
    // os: "./stubs/node/os.ts",
    "react/jsx-runtime": "./stubs/node/jsx.ts",
  },
});

if (once) {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Build finished.");
  process.exit(0);
} else {
  await ctx.watch();
  console.log("Watching for changes…");
}

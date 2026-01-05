const require = function (name) {
  if (name === "fs") {
    return {
      existsSync: function (path) {
        return CS.System.IO.File.Exists(path);
      },
      readFileSync: function (path) {
        return CS.System.IO.File.ReadAllText(path);
      },
    };
  } else if (name === "path") {
    return {
      dirname: function (path) {
        return CS.System.IO.Path.GetDirectoryName(path);
      },
      resolve: function (dir, url) {
        url = url.replace(/\\/g, "/");
        while (url.startsWith("../")) {
          dir = CS.System.IO.Path.GetDirectoryName(dir);
          url = url.substr(3);
        }
        return CS.System.IO.Path.Combine(dir, url);
      },
      join: function () {
        return CS.System.IO.Path.Combine(...arguments);
      },
    };
  }
  return null;
};

require("source-map-support").install({
  retrieveSourceMap: (source: string) => {
    const fullpath = require("path").join(___workingDir, source + ".map");
    if (!require("fs").existsSync(fullpath)) return null;
    return {
      map: require("fs").readFileSync(fullpath, "utf8"),
    };
  },
});

/**
 * Default OneJS ESbuild Config
 */
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
  plugins: [
    importTransformationPlugin(),
    !once && outputWatcherPlugin(),
    copyAssetsPlugin(),
    decoratorFixPlugin(),
  ].filter(Boolean),
  inject: ["onejs-core/dist/index.js"],
  platform: "node",
  sourcemap: "inline",
  sourceRoot: process.cwd() + "/index",
  alias: {
    onejs: "onejs-core",
    preact: "onejs-preact",
    react: "onejs-preact/compat",
    "react-dom": "onejs-preact/compat",
  },
  outfile: "@outputs/esbuild/app.js",
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

const fs = require("fs");
const path = require("path");

function copyRelayerBundle() {
  const packageRoot = path.dirname(
    require.resolve("@zama-fhe/relayer-sdk/package.json", {
      paths: [path.resolve(__dirname, "..", "packages", "nextjs")],
    }),
  );
  const bundleEntry = path.join(packageRoot, "bundle", "relayer-sdk-js.umd.cjs");
  const bundleDir = path.dirname(bundleEntry);
  const targetDir = path.resolve(__dirname, "..", "packages", "nextjs", "public", "relayer");

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const copyRecursive = (srcDir, dstDir) => {
    fs.mkdirSync(dstDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir)) {
      const source = path.join(srcDir, entry);
      const dest = path.join(dstDir, entry);
      const stats = fs.statSync(source);
      if (stats.isDirectory()) {
        copyRecursive(source, dest);
      } else {
        fs.copyFileSync(source, dest);
      }
    }
  };

  copyRecursive(bundleDir, targetDir);

  console.log(`[relayer-sdk] Copied assets to ${targetDir}`);
}

copyRelayerBundle();

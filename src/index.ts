import {Reporter} from '@parcel/plugin';
import {resolve, join, relative} from 'path';
import {statSync, existsSync, mkdirSync, copyFileSync, readdirSync} from 'fs';

export default new Reporter({
  async report({event}) {
    if (event.type === 'buildSuccess') {
      const bundles = event.bundleGraph.getBundles();
      // extract out dir
      let outDir;
      for (let i = 0; i < bundles.length; i++) {
        const distDir = bundles[i].target?.distDir;
        if (!distDir) continue;
        outDir = distDir;
        break;
      }
      // copy the public folder
      if (outDir) {
        const sourcePath = resolve('public');
        const outPath = resolve(outDir);
        copyDir(sourcePath, outPath);
      }
    }
  },
});

const copyDir = (copyFrom: string, copyTo: string) => {
  if (!existsSync(copyTo)) {
    mkdirSync(copyTo, {recursive: true});
  }
  const copy = (filepath: string, relative: string, filename?: string) => {
    const dest = join(copyTo, relative);
    if (!filename) {
      if (!existsSync(dest)) {
        mkdirSync(dest, {recursive: true});
      }
    } else {
      copyFileSync(filepath, dest);
    }
  };
  recurseSync(copyFrom, copy);
};

const recurseSync = (
  dirpath: string,
  callback: (filePath: string, relative: string, filename?: string) => void
) => {
  const rootpath = dirpath;
  function recurse(dirpath: string) {
    readdirSync(dirpath).forEach(filename => {
      const filepath = join(dirpath, filename);
      const stats = statSync(filepath);
      const relPath = relative(rootpath, filepath);
      if (stats.isDirectory()) {
        callback(filepath, relPath);
        recurse(filepath);
      } else {
        callback(filepath, relPath, filename);
      }
    });
  }
  recurse(dirpath);
};

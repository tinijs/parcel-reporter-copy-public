import {Reporter} from '@parcel/plugin';
import {resolve, join, basename, relative} from 'path';
import {statSync, existsSync, mkdirSync, copyFileSync, readdirSync} from 'fs';

export default new Reporter({
  async report({event}) {
    if (event.type === 'buildSuccess') {
      const sourceDir = resolve('public');
      const targets = Array.from(
        new Set(
          event.bundleGraph
            .getBundles()
            .filter(bundle => bundle.target && bundle.target.distDir)
            .map(bundle => bundle.target.distDir)
        )
      );
      for (let i = 0; i < targets.length; i++) {
        const outDir = resolve(targets[i]);
        const fn = statSync(sourceDir).isDirectory() ? copyDir : copyFile;
        fn(sourceDir, outDir);
      }
    }
  },
});

const copyFile = (copyFrom: string, copyTo: string) => {
  copyFileSync(copyFrom, join(copyTo, basename(copyFrom)));
};

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

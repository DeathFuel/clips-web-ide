# CLIPS Web IDE
https://deathfuel.github.io/clips-web-ide/

Contains most of the features of the official IDEs, plus a few extras.

## Local setup
Run
```bash
git clone https://github.com/DeathFuel/clips-web-ide/
cd clips-web-ide

wget https://sourceforge.net/projects/clipsrules/files/CLIPS/6.4.2/clips_core_source_642.tar.gz
tar xzf clips_core_source_642.tar.gz
cp -RTn clips_core_source_642/ clips_core_source/
rm -rf clips_core_source_642.tar.gz clips_core_source_642

(cd clips_core_source/core && emmake make -f Makefile -j$(nproc))

npm ci
npx vite dev
```
Then navigate to the displayed URL (replace `localhost` with `127.0.0.1` or `[::1]` in case of issues).

## Credits

This project depends on [emscripten](https://emscripten.org) and [CLIPS](https://clipsrules.net/) and was partially inspired by the work of [@mrryanjohnston](https://github.com/mrryanjohnston/).

See [DEP-LICENSES.md](https://github.com/DeathFuel/clips-web-ide/blob/master/DEP-LICENSES.md) for npm dependencies and their licenses.

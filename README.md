# CLIPS Web IDE
https://deathfuel.github.io/clips-web-ide/

An IDE for [CLIPS](https://clipsrules.net/) that runs in your browser.

## Keyboard shortcuts
Press:
- Arrow Up/Arrow Down in the Terminal's input area for history.
- Ctrl+Shift+Enter in the Batch Input to send the current program to CLIPS.

## Tabs
### Terminal
The CLIPS console, which should work exactly like the default CLIPS REPL. Always present.
### Batch Input
A code editor for executing entire programs at once. Checking `Clear console...` recreates the CLIPS environment and the Terminal's output log every time you send your code to CLIPS, which can be very convenient for rapid iteration (try appending `(reset)` and `(run)` to your program like the examples do).
### Agenda Viewer, Fact Browser, Instance Browser, Global Browser
Similar in behavior to their counterparts in the official IDEs, though the Global Browser is an original addition. Each of these tabs might -- depending on program state -- contain a list of modules. Clicking on a module can then present its agenda, facts, instances, or globals.
### Construct Inspector
Shows a pretty-print form when certain items are clicked in different browsers. The tab can display an agenda item's defrule, a fact's deftemplate, an instance's defclass, or a global's defglobal statement.

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

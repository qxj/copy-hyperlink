# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Manifest V3 Chrome extension (vanilla JS, no build step, no dependencies) that mimics Edge's "copy page as link": pressing the configured shortcut on a page **with no selection** copies the page title + URL as a rich-text anchor (`<a href="URL">Title</a>`).

## Commands

- **Load for development:** `chrome://extensions` → Developer Mode → "Load unpacked" → point at this directory. Edits to `*.js`/`*.html` need a reload of the extension and a refresh of any open tabs (because content scripts only inject on document_start).
- **Package for Web Store:** `./build.sh` produces `copy-hyperlink-0.x.zip` (rename to match `manifest.json` `version`, e.g. `0.2`). The script excludes `.git/`, `.vscode/`, `*.DS_Store`, `build.sh`, `README.md`, and existing `*.zip`s.
- **Bumping version:** any feature change or bug fix that will be uploaded to the Chrome Web Store **must** increment `manifest.json` `version` before re-running `build.sh` — the Web Store rejects uploads whose version is not strictly greater than the published one (`Invalid version number in manifest`). Bump as part of the same change, not as a follow-up.
- No tests, lint, or formatter configured.

## Architecture

Three runtime surfaces, all plain JS — no framework, no bundler.

### Content scripts (`copyurlwithtitle.js`, `toast.js`)
Injected into every http(s) frame at `document_start`, **including iframes** (`all_frames: true` in `manifest.json`). The script listens for `keydown` in its own frame.

**Cross-frame coordination is load-bearing:** when focus is inside an iframe (e.g. an embedded editor), the keydown only fires there. The iframe forwards a `postMessage({ __cahl: true, type: "__cahl_forward__" })` up to its parent, which re-forwards until the top window sees it and calls `performCopyOnTop()`. The top window then copies its own `document.title` / `document.location.href` and shows the toast once. This is what fixes the "I have to click the outer page first" UX bug — don't break this when refactoring.

**Clipboard write has two paths** in `setClipboard()`:
1. Modern: `navigator.clipboard.write([new ClipboardItem({ "text/html": ..., "text/plain": ... })])` so rich-text editors get the anchor and plain-text targets get `title\nurl`.
2. Legacy fallback (`legacyCopy`): inserts a hidden `<a>`, builds a Range across it, calls `document.execCommand("copy")`, restores the previous selection. Triggered when `ClipboardItem` is unavailable or the modern call rejects.

**"Has selection" detection** (`isSelected()`) returns true only when there is an actual non-collapsed Range, *or* `document.activeElement` is a real editable (`<input>`, `<textarea>`, `<select>`, or `contentEditable`). Plain focus on a link / tabindex div / turbo-frame must not suppress the URL copy — that was the original GitHub `application-main` regression: clicking the main column moved focus to a non-body, non-editable element, and the older "any non-body active element" heuristic falsely treated it as "user is editing" and bailed out.

### Options page (`options.html` + `options.js`)
Recorder UI: click **Record**, press a combo, click **Save**. Persists `{ ctrl, meta, alt, shift, key }` to `chrome.storage.sync` under the key `shortcut`. The content script reads the same key on load and subscribes via `chrome.storage.onChanged` so changes take effect without reloading the page. Default is platform-aware: Cmd+C on macOS, Ctrl+C elsewhere.

### Toast (`toast.js`)
Exposes `window.takashyx.toast.Toast(title, content, options)`. The toast is rendered inside a **Shadow DOM** host so host-page CSS can't bleed in (a real bug seen in earlier versions where pages with aggressive global styles distorted the toast).

## Conventions worth knowing

- No service worker / background script — `manifest.json` only declares content scripts, `storage` permission, and `options_ui`. Don't introduce a background script unless something actually requires one; it would change the extension's privacy posture (the README advertises "no background service worker").
- The shortcut config schema is `{ ctrl, meta, alt, shift, key }` where `key` is lowercased single chars or named keys (`"ArrowUp"`, etc.). `matchesShortcut()` and the options recorder must stay in sync on this shape.
- `chrome.storage` access is wrapped in try/catch because some sandboxed iframes block it — failures must not crash the keydown handler.


# Copy Hyperlink as Edge Does

A Chrome extension that mimics Microsoft Edge's built-in "copy page as link" feature — available on any webpage.

## Install

[Chrome Web Store](https://chromewebstore.google.com/detail/copy-hyperlink-as-edge-do/pindpfknjjhmjdpgpfdempcnheecfkah)

## How It Works

Press **Cmd+C** (macOS) or **Ctrl+C** (Windows/Linux) on any webpage **without selecting any text**. Instead of copying nothing, the extension automatically copies the page title and URL as a rich-text hyperlink (an anchor element `<a href="URL">Title</a>`).

If you have text selected, the shortcut behaves normally and copies the selected text.

A small toast notification confirms the copy action.

## Use Cases

Paste the copied hyperlink into any rich-text editor that understands HTML or JavaScript DOM objects, for example:

- Rich-text input fields in web apps (Gmail, Notion, etc.)
- [Obsidian](https://obsidian.md/) and other Markdown editors that accept pasted hyperlinks
- Word processors that preserve hyperlink formatting on paste

## Options

Open `chrome://extensions` → find **Copy hyperlink as Edge does** → **Details** → **Extension options** to customize the shortcut. Click **Record**, press the desired combination (e.g. `Ctrl+Shift+L`), then **Save**.

## Permissions

- Runs on all `http://` and `https://` pages as a content script
- `storage` — to remember your custom shortcut (synced via your Chrome account)
- No background service worker; no data is collected or transmitted

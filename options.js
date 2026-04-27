"use strict";

const isMac = navigator.platform.indexOf("Mac") !== -1;

const DEFAULT_SHORTCUT = {
  ctrl: !isMac,
  meta: isMac,
  alt: false,
  shift: false,
  key: "c"
};

const shortcutEl = document.getElementById("shortcut");
const recordBtn  = document.getElementById("record");
const resetBtn   = document.getElementById("reset");
const saveBtn    = document.getElementById("save");
const statusEl   = document.getElementById("status");

let current = { ...DEFAULT_SHORTCUT };
let recording = false;

function format(sc) {
  if (!sc || !sc.key) return "—";
  const parts = [];
  if (sc.ctrl)  parts.push("Ctrl");
  if (sc.meta)  parts.push(isMac ? "Cmd" : "Meta");
  if (sc.alt)   parts.push(isMac ? "Option" : "Alt");
  if (sc.shift) parts.push("Shift");
  parts.push(sc.key.length === 1 ? sc.key.toUpperCase() : sc.key);
  return parts.join(" + ");
}

function render() {
  shortcutEl.textContent = format(current);
}

function load() {
  chrome.storage.sync.get({ shortcut: DEFAULT_SHORTCUT }, (items) => {
    current = items.shortcut || { ...DEFAULT_SHORTCUT };
    render();
  });
}

function startRecording() {
  recording = true;
  shortcutEl.textContent = "Press a key combination…";
  shortcutEl.focus();
  statusEl.textContent = "";
}

function isModifierKey(key) {
  return key === "Control" || key === "Shift" || key === "Alt" || key === "Meta";
}

shortcutEl.addEventListener("keydown", (e) => {
  if (!recording) return;
  e.preventDefault();
  e.stopPropagation();
  if (isModifierKey(e.key)) return; // wait for the non-modifier
  current = {
    ctrl:  e.ctrlKey,
    meta:  e.metaKey,
    alt:   e.altKey,
    shift: e.shiftKey,
    key:   e.key.length === 1 ? e.key.toLowerCase() : e.key
  };
  recording = false;
  render();
});

recordBtn.addEventListener("click", startRecording);

resetBtn.addEventListener("click", () => {
  current = { ...DEFAULT_SHORTCUT };
  render();
  statusEl.textContent = "";
});

saveBtn.addEventListener("click", () => {
  if (!current || !current.key || isModifierKey(current.key)) {
    statusEl.style.color = "#b00";
    statusEl.textContent = "Please record a valid shortcut first.";
    return;
  }
  chrome.storage.sync.set({ shortcut: current }, () => {
    statusEl.style.color = "#2a7d2e";
    statusEl.textContent = "Saved.";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  });
});

load();

"use strict";

(function () {

    var isMac = navigator.platform.indexOf("Mac") !== -1;
    var isWin = navigator.platform.indexOf("Win") !== -1;
    var crlf_flag = "[[[br]]]";
    var crlf = isWin ? "\r\n" : "\n";

    var DEFAULT_SHORTCUT = {
        ctrl: !isMac,
        meta: isMac,
        alt: false,
        shift: false,
        key: "c"
    };

    var shortcut = Object.assign({}, DEFAULT_SHORTCUT);
    var FORWARD_TAG = "__cahl_forward__";

    // Load shortcut from storage and keep it in sync.
    function loadShortcut() {
        try {
            chrome.storage.sync.get({ shortcut: DEFAULT_SHORTCUT }, function (items) {
                if (items && items.shortcut && items.shortcut.key) {
                    shortcut = items.shortcut;
                }
            });
        } catch (e) {
            // chrome.storage may be unavailable in some sandboxed frames
        }
    }
    loadShortcut();

    try {
        chrome.storage.onChanged.addListener(function (changes, area) {
            if (area === "sync" && changes.shortcut && changes.shortcut.newValue) {
                shortcut = changes.shortcut.newValue;
            }
        });
    } catch (e) { /* ignore */ }

    function matchesShortcut(event) {
        if (!shortcut || !shortcut.key) return false;
        var key = (event.key || "").toLowerCase();
        if (key !== shortcut.key.toLowerCase()) return false;
        if (!!event.ctrlKey  !== !!shortcut.ctrl)  return false;
        if (!!event.metaKey  !== !!shortcut.meta)  return false;
        if (!!event.altKey   !== !!shortcut.alt)   return false;
        if (!!event.shiftKey !== !!shortcut.shift) return false;
        return true;
    }

    function isSelected() {
        var sel = window.getSelection();
        if (!sel || sel.rangeCount <= 0) return false;
        if (sel.rangeCount > 1) return true;
        var range = sel.getRangeAt(0);
        if (!range.collapsed) return true;
        if (range.startContainer !== range.endContainer) return true;
        if (range.startOffset !== range.endOffset) return true;
        var ae = document.activeElement;
        if (ae && ae.tagName && ae.tagName.toLowerCase() !== "body") return true;
        return false;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Copy "title + url" as a real anchor element so rich-text editors get
    // <a href="...">Title</a>, while plain-text targets get "title\nurl".
    function setClipboard(url, text) {
        if (navigator.clipboard && window.ClipboardItem) {
            try {
                var html  = '<a href="' + escapeHtml(url) + '">' + escapeHtml(text) + '</a>';
                var plain = text + crlf + url;
                var item  = new ClipboardItem({
                    "text/html":  new Blob([html],  { type: "text/html"  }),
                    "text/plain": new Blob([plain], { type: "text/plain" })
                });
                return navigator.clipboard.write([item]).catch(function () {
                    return legacyCopy(url, text);
                });
            } catch (e) {
                return legacyCopy(url, text);
            }
        }
        return legacyCopy(url, text);
    }

    function legacyCopy(url, text) {
        var link = document.createElement("a");
        link.setAttribute("id", "_cahl_link");
        link.setAttribute("href", url);
        link.setAttribute("style", "font-size: 1em");
        link.appendChild(document.createTextNode(text));

        var endd = document.createElement("div");
        endd.setAttribute("id", "_cahl_endCopy");

        document.body.appendChild(link);
        document.body.appendChild(endd);

        var range = document.createRange();
        range.setStart(link, 0);
        range.setEnd(endd, 0);

        var selObj = window.getSelection();
        var prevRanges = [];
        for (var i = 0; i < selObj.rangeCount; i++) prevRanges.push(selObj.getRangeAt(i));
        selObj.removeAllRanges();
        selObj.addRange(range);

        return new Promise(function (res, rej) {
            var ok = false;
            try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
            link.remove();
            endd.remove();
            selObj.removeAllRanges();
            for (var j = 0; j < prevRanges.length; j++) selObj.addRange(prevRanges[j]);
            ok ? res() : rej();
        });
    }

    function performCopyOnTop() {
        var page_title = document.title;
        var page_url   = document.location.href;

        if (window.takashyx && window.takashyx.toast) {
            try {
                window.takashyx.toast.Toast(
                    "URL with Title Copied",
                    page_title + crlf_flag + page_url + crlf_flag,
                    { settings: { duration: 1800 } }
                );
            } catch (e) { /* toast failure must not block copy */ }
        }
        setClipboard(page_url, page_title);
    }

    // Key handler — installed in every frame (content_scripts.all_frames=true).
    // When the focused element lives inside an <iframe>, the keydown only
    // fires there. We forward it up to the top window so the visible page
    // can do the copy with its OWN title/url and show a single toast. This
    // fixes the "I have to click the outer page first" problem.
    function onKeyDown(event) {
        if (!matchesShortcut(event)) return;
        if (isSelected()) return; // let normal copy proceed

        if (window.top === window.self) {
            event.preventDefault();
            event.stopPropagation();
            performCopyOnTop();
        } else {
            try {
                window.parent.postMessage({ __cahl: true, type: FORWARD_TAG }, "*");
            } catch (e) { /* cross-origin restrictions */ }
        }
    }

    function onMessage(event) {
        var data = event.data;
        if (!data || data.__cahl !== true) return;
        if (data.type === FORWARD_TAG) {
            if (window.top === window.self) {
                performCopyOnTop();
            } else {
                try { window.parent.postMessage(data, "*"); } catch (e) { /* ignore */ }
            }
        }
    }

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("message",  onMessage, true);

})();


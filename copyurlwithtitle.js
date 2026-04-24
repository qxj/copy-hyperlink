window.addEventListener('keydown', copyURLWithTitle, true);

function setClipboard(url, text) {
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
    range.setEnd(document.getElementById("_cahl_endCopy"), 0);

    var selObj = window.getSelection()
    selObj.removeAllRanges();
    selObj.addRange(range);

    return new Promise((res, rej) => {
        document.execCommand('copy') ? res() : rej();
        link.remove();
        endd.remove();
    });
}

function copyURLWithTitle(event) {

    var format = "";

    // capture "C"
    if (event.keyCode != 67) return;

    // check OS
    var isWin = (navigator.platform.indexOf("Win") != -1);
    var isMac = (navigator.platform.indexOf("Mac") != -1);

    // newline symbol
    var crlf_flag = "[[[br]]]";
    var crlf = isWin ? "\r\n" : "\n";
    var page_url;
    var page_title;
    var title_for_toast;
    var content_for_toast;
    var options_for_toast;

    //get options
    console.log("copyurlwithtitle.js");

    // detect copy type
    if (((!isMac) && event.ctrlKey) || (isMac && event.metaKey)) {

        // check selection
        if (isSelected()) {
            format = "normal";
        }
        else {
            format = "text";
        }
    }

    // if ((event.altKey)) format = "markdown";

    if (format == "text") {
        page_title = document.title;
        page_url = document.location.href;
        // show toast
        title_for_toast = "URL with Title Copied";
        content_for_toast = page_title + crlf_flag + page_url + crlf_flag;
        options_for_toast = { style: { main: { color: '#ffffff', background: '#606000' } }, settings: { duration: 1800 } };
        takashyx.toast.Toast(title_for_toast, content_for_toast, options_for_toast);
        console.log("toast options: " + JSON.stringify(options_for_toast));
        // override copy
        setClipboard(page_url, page_title);
    }
}

function isSelected() {

    // detect by range count
    var sel = window.getSelection();
    if (sel.rangeCount <= 0) return false;
    if (sel.rangeCount > 1) return true;

    // when sel.rangeCount == 1
    var range = sel.getRangeAt(0);
    if (!range.collapsed) return true;
    if (range.startContainer != range.endContainer) return true;
    if (range.startOffset != range.endOffset) return true;
    if (document.activeElement.tagName.toLowerCase() != "body") return true;

    return false;
}


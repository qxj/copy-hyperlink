
"use strict";

var takashyx = takashyx || {};

takashyx.toast = (function () {

	/**
	 * The main Toast object
	 * @param {Object} options See Toast.prototype.DEFAULT_SETTINGS for more info
	 */
	function Toast(title, content, options) {
		if (getToastStage() != null) {
			// If there is already a Toast being shown, hide it
			Toast.prototype.destroy();
		}
		var _options = options || {};
		_options = Toast.prototype.mergeOptions(Toast.prototype.DEFAULT_SETTINGS, _options);

		Toast.prototype.show(title, content, _options);

		_options = null;
	};


	/**
	 * The host element for the Shadow DOM that contains the Toast.
	 * Using Shadow DOM keeps page CSS from leaking in (so the Toast no
	 * longer randomly grows or shrinks based on the host page's styles).
	 * @type {Element}
	 */
	var _toastHost  = null;
	var _toastStage = null;
	var _toastRoot  = null;
	function getToastHost()  { return _toastHost;  }
	function getToastStage() { return _toastStage; }
	function getToastRoot()  { return _toastRoot;  }


	/**
	 * The Toast animation speed; how long the Toast takes to move to and from the screen
	 * @type {Number}
	 */
	Toast.prototype.TOAST_ANIMATION_SPEED = 400;

	// Toast classes (scoped inside the Shadow DOM)
	Toast.prototype.CLASS_TOAST_GONE     = "takashyx_toast_gone";
	Toast.prototype.CLASS_TOAST_VISIBLE  = "takashyx_toast_visible";
	Toast.prototype.CLASS_TOAST_ANIMATED = "takashyx_toast_animated";


	/**
	 * Default Toast settings. All sizes are in absolute units (px) so the
	 * Toast is rendered identically regardless of the host page's
	 * `html { font-size: ... }` or `* { ... }` rules.
	 * @type {Object}
	 */
	Toast.prototype.DEFAULT_SETTINGS = {
		settings: {
			duration: 1800
		},
		style: {
			main: {
				"all": "initial",
				"box-sizing": "border-box",
				"font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
				"font-size": "14px",
				"line-height": "1.4",

				"background": "rgba(0, 0, 0, .85)",
				"box-shadow": "0 2px 12px rgba(0, 0, 0, .5)",
				"border-radius": "6px",
				"color": "rgba(255, 255, 255, .95)",

				"max-width": "480px",
				"width": "auto",
				"word-break": "break-all",
				"text-align": "center",

				"position": "fixed",
				"left": "50%",
				"top": "10%",
				"transform": "translateX(-50%)",
				"z-index": "2147483647",

				"padding": "12px 16px",
				"pointer-events": "none"
			},
			title: {
				"display": "block",
				"font-weight": "bold",
				"font-size": "16px",
				"margin": "0 0 6px 0",
				"padding": "0"
			},
			content: {
				"display": "block",
				"margin": "6px 0 0 0",
				"padding": "8px",
				"border": "1px solid rgba(255,255,255,0.6)",
				"border-radius": "4px",
				"font-size": "13px"
			}
		}
	};


	/**
	 * Merge the DEFAULT_SETTINGS with the user defined options if specified
	 * @param  {Object} options The user defined options
	 */
	Toast.prototype.mergeOptions = function (initialOptions, customOptions) {
		var merged = customOptions;
		for (var prop in initialOptions) {
			if (merged.hasOwnProperty(prop)) {
				if (initialOptions[prop] != null && initialOptions[prop].constructor == Object) {
					merged[prop] = Toast.prototype.mergeOptions(initialOptions[prop], merged[prop]);
				}
			} else {
				merged[prop] = initialOptions[prop];
			}
		}
		return merged;
	};


	/**
	 * Inject the animation stylesheet into the shadow root.
	 */
	Toast.prototype.initializeStyles = function (root) {
		var style = document.createElement("style");

		style.textContent =
			Toast.prototype.generateInlineStylesheetRules("." + this.CLASS_TOAST_GONE, {
				"opacity": "0"
			}) +
			Toast.prototype.generateInlineStylesheetRules("." + this.CLASS_TOAST_VISIBLE, {
				"opacity": "0.95"
			}) +
			Toast.prototype.generateInlineStylesheetRules("." + this.CLASS_TOAST_ANIMATED, {
				"transition": "opacity " + this.TOAST_ANIMATION_SPEED + "ms ease"
			});

		root.appendChild(style);
	};


	/**
	 * Generate the Toast with the specified content.
	 */
	Toast.prototype.generate = function (title, content, style) {

		var toastStage = document.createElement("div");
		var titleDiv   = document.createElement("div");
		titleDiv.appendChild(document.createTextNode(title));
		toastStage.appendChild(titleDiv);

		var contentDiv = document.createElement("div");
		if (typeof content === "string") {
			var lines = content.split('[[[br]]]');
			for (var i = 0; i < lines.length; i++) {
				if (i > 0) contentDiv.appendChild(document.createElement('br'));
				contentDiv.appendChild(document.createTextNode(lines[i]));
			}
		} else {
			contentDiv.appendChild(content);
		}

		toastStage.appendChild(contentDiv);
		_toastStage = toastStage;

		Toast.prototype.stylize(toastStage, style.main);
		Toast.prototype.stylize(titleDiv,   style.title);
		Toast.prototype.stylize(contentDiv, style.content);
	};

	/**
	 * Apply inline styles to an element.
	 */
	Toast.prototype.stylize = function (element, styles) {
		Object.keys(styles).forEach(function (key) {
			// setProperty with priority "important" beats any leftover page rules
			// that might still match (defense in depth on top of Shadow DOM).
			try {
				element.style.setProperty(key, styles[key], "important");
			} catch (e) {
				element.style[key] = styles[key];
			}
		});
	};


	/**
	 * Generate a CSS rule string.
	 */
	Toast.prototype.generateInlineStylesheetRules = function (selector, styles) {
		var out = selector + "{";
		Object.keys(styles).forEach(function (style) {
			out += style + ":" + styles[style] + " !important;";
		});
		out += "}";
		return out;
	};


	/**
	 * Show the Toast inside a closed Shadow DOM mounted on the page <body>.
	 */
	Toast.prototype.show = function (title, content, options) {
		// Host that lives in the page DOM. Reset all inheritable styles.
		var host = document.createElement("div");
		host.setAttribute("data-cahl-toast", "");
		host.style.setProperty("all", "initial", "important");
		host.style.setProperty("position", "fixed", "important");
		host.style.setProperty("top", "0", "important");
		host.style.setProperty("left", "0", "important");
		host.style.setProperty("width", "0", "important");
		host.style.setProperty("height", "0", "important");
		host.style.setProperty("z-index", "2147483647", "important");
		host.style.setProperty("pointer-events", "none", "important");

		var root = host.attachShadow ? host.attachShadow({ mode: "closed" }) : host;

		this.initializeStyles(root);
		this.generate(title, content, options.style);

		var toastStage = getToastStage();
		toastStage.classList.add(this.CLASS_TOAST_ANIMATED);
		toastStage.classList.add(this.CLASS_TOAST_GONE);
		root.appendChild(toastStage);

		(document.body || document.documentElement).appendChild(host);
		_toastHost = host;
		_toastRoot = root;

		// Force layout flush so the transition kicks in.
		// eslint-disable-next-line no-unused-expressions
		toastStage.offsetHeight;

		toastStage.classList.remove(this.CLASS_TOAST_GONE);
		toastStage.classList.add(this.CLASS_TOAST_VISIBLE);

		clearTimeout(Toast.prototype.timeout);
		Toast.prototype.timeout = setTimeout(Toast.prototype.hide, parseInt(options.settings.duration));
	};


	/**
	 * Hide the Toast that's currently shown
	 */
	Toast.prototype.hide = function () {
		var toastStage = getToastStage();
		if (!toastStage) return;
		toastStage.classList.remove(Toast.prototype.CLASS_TOAST_VISIBLE);
		toastStage.classList.add(Toast.prototype.CLASS_TOAST_GONE);

		clearTimeout(Toast.prototype.timeout);
		Toast.prototype.timeout = setTimeout(Toast.prototype.destroy, Toast.prototype.TOAST_ANIMATION_SPEED);
	};


	/**
	 * Clean up after the Toast slides away.
	 */
	Toast.prototype.destroy = function () {
		var host = getToastHost();
		if (host && host.parentNode) {
			host.parentNode.removeChild(host);
		}
		_toastHost  = null;
		_toastRoot  = null;
		_toastStage = null;
	};

	return {
		Toast: Toast
	};
})();

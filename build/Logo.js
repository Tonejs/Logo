(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Logo"] = factory();
	else
		root["Logo"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			memo[selector] = fn.call(this, selector);
		}

		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(2);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 2 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (Waveforms) {

	var bufferLen = 256;

	var waveform = Waveforms(bufferLen).random;


	function hasTone(){
		return typeof window.Tone === "function";
	}

	var Analyser = function(container){

		/**
		 *  the value below which it is considered silent
		 */
		this._silentThresh = 0.001;

		/**
		 *  The current RMS of the incoming signal
		 */
		this._rms = 0;

		/**
		 *  the container of the canvas
		 */
		this._container = container;

		/**
		 *  the canvas element
		 */
		this._element = document.createElement("canvas");
		this._element.id = "Canvas";
		container.appendChild(this._element);

		/**
		 *  the drawing context
		 */
		this._context = this._element.getContext("2d");

		//the analyser element
		if (hasTone()){
			/**
			 *  The waveform analysis of the incoming signal
			 *  @type  {Tone.Analyser}
			 */
			this._analyser = new Tone.Analyser({
				"size" : bufferLen,
				"type" : "waveform"
			});

			/**
			 *  A signal to make the analyser rest
			 *  at 0 when nothing is connected
			 *  @private
			 */
			this._signal = new Tone.Zero().connect(this._analyser);

			//connect the master output to the analyser
			Tone.Master.connect(this._analyser);
		}

		if (hasTone()){
			this._boundLoop = this._loop.bind(this);
			this._loop();
		}

		//resize initially
		this.resize();
	};

	Analyser.prototype.resize = function(width, height){
		width = width || this._container.offsetWidth;
		height = height || this._container.offsetHeight;
		this._context.canvas.width = width * 2;
		this._context.canvas.height = height * 2;
		if (!hasTone()){
			this._drawBuffer(waveform, true);
		}
	};

	Analyser.prototype._loop = function(){
		requestAnimationFrame(this._boundLoop);
		//if it's silent, draw a canned waveform when the mouse is over
		var analysis = this._analyser.analyse();
		if (this._isSilent(analysis)){
			this._drawBuffer(waveform, true);
		} else { //if it's not silent, draw the waveform
			this._drawBuffer(analysis, false);
		}
	};

	/**
	 *  Draw the given buffer onto the canvas
	 */
	Analyser.prototype._drawBuffer = function(buffer, silent){
		var context = this._context;
		var width = this._context.canvas.width;
		var height = this._context.canvas.height;
		if (silent){
			margin = this._scale(this._rms, 0, this._silentThresh, height * 0.2, height * 0.5);
		} else {
			margin = height * 0.2;
		}
		context.clearRect(0, 0, width, height);
		context.beginPath();

		var firstValue;

		for (var i = 0, len = buffer.length; i < len; i++){
			var x = this._scale(i, 0, len - 1, 0, width);
			var y = this._scale(buffer[i], -1, 1, height - margin, margin);
			if (i === 0){
				firstValue = y;
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}
		context.lineTo(width, height);
		context.lineTo(0, height);
		context.lineTo(0, firstValue);
		context.lineCap = "round";
		// context.stroke();
		context.fillStyle = "#22DBC0";
		context.fill();

	};

	/**
	 *  True if the analyser analysis array is silent (all 0s)
	 *  @private
	 */
	Analyser.prototype._isSilent = function(analysis){
		//if the average is close to 128
		var total = 0;
		for (var i = 0; i < analysis.length; i++){
			total += Math.pow(analysis[i], 2);
		}
		var rms = Math.sqrt(total / analysis.length);
		this._rms = Math.max(rms, this._rms * 0.9);
		return this._rms < this._silentThresh;
	};

	/**
	 *  Scale a value from between the inputMin/Max to the outputMin/Max
	 *  @private
	 */
	Analyser.prototype._scale = function(value, inputMin, inputMax, outputMin, outputMax){
		var norm = (value - inputMin) / (inputMax - inputMin);
		return norm * (outputMax - outputMin) + outputMin;
	};

	return Analyser;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function () {

	return function(bufferLength){

		var sine = new Array(bufferLength);
		var square = new Array(bufferLength);
		var sawtooth = new Array(bufferLength);
		var triangle = new Array(bufferLength);

		var choices = [sine, sawtooth, triangle, square];


		var i;
		for (i = 0; i < bufferLength; i++){
			sine[i] = Math.sin(Math.PI * 2 * i / bufferLength);
		}

		for (i = 0; i < bufferLength; i++){
			sawtooth[i] = (((i + bufferLength/2) % bufferLength) / bufferLength) * 2 - 1;
		}

		for (i = 0; i < bufferLength; i++){
			if (i < bufferLength/3){
				triangle[i] = i/(bufferLength/3) * 2 - 1;
			} else if (i < bufferLength * 2/3){
				triangle[i] = (1 - (i - bufferLength/3)/(bufferLength/3)) * 2 - 1;
			} else {
				triangle[i] = (i - bufferLength * 2/3)/(bufferLength/3) * 2 - 1;
			}
		}

		for (i = 0; i < bufferLength; i++){
			var margin = bufferLength/16;
			if (i < margin){
				square[i] = -1;
			} else if (i < bufferLength/2){
				square[i] = 1;
			} else if (i < (bufferLength - margin)){
				square[i] = -1;
			} else {
				square[i] = 1;
			}
		}

		var random = choices[Math.floor(Math.random()*choices.length)];

		return {
			sawtooth : sawtooth,
			sine : sine,
			triangle : triangle,
			square : square,
			random : random
		};
	};
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNjAuMDA5NzY1NjI1IiBoZWlnaHQ9IjEzMS44ODQ3NjU2MjUiPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNNTYuNDUgMjYuNDFMMzQuNDcgMjYuNDFMMzQuNDcgODkuNzlMMjUuNjggODkuNzlMMjUuNjggMjYuNDFMMy43MSAyNi40MUwzLjcxIDE4LjY5TDU2LjQ1IDE4LjY5TDU2LjQ1IDI2LjQxWiIvPjwvc3ZnPg=="

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7), __webpack_require__(3), __webpack_require__(5)], __WEBPACK_AMD_DEFINE_RESULT__ = function(LogoStyle, Analyser, svgT){

	/**
	 *  @class  Logo visualizes current Tone.js context
	 *  @param  {Object}  options  The options
	 */
	var Logo = function(options){

		if (this instanceof Logo) {

			//get the defaults
			for (var attr in Logo.defaults){
				if (typeof options[attr] === "undefined"){
					options[attr] = Logo.defaults[attr];
				}
			}

			/**
			 *  The container element
			 *  @type  {Element}
			 */
			this.element = document.createElement("div");
			this.element.id = "TonejsLogo";

			if (typeof options.container === "string"){
				document.querySelector(options.container).appendChild(this.element);
			} else if (options.container instanceof Element){
				options.container.appendChild(this.element);
			}


			/**
			 *  the Tone.js title
			 *  @type  {Element}
			 */
			this.logoContainer = document.createElement("div");
			this.logoContainer.id = "LogoContainer";
			this.logoContainer.innerHTML = "<span id='T'></span><span id='one'></span><span id='js'></span>";
			this.element.appendChild(this.logoContainer);

			/**
			 *  the element which holds the waveform
			 *  @type  {Element}
			 */
			this.canvasContainer = document.createElement("div");
			this.canvasContainer.id = "Canvas";
			this.logoContainer.appendChild(this.canvasContainer);

			/**
			 *  the waveform
			 *  @type  {Analyser}
			 */
			this.analyser = new Analyser(this.canvasContainer);

			/**
			 *  The link
			 *  @type {Element}
			 */
			this.link = document.createElement("a");
			this.link.href = "https://tonejs.github.io";
			this.logoContainer.appendChild(this.link);


			this.resize(options.width, options.height);

		} else {
			return new Logo(options);
		}
	};

	/**
	 *  The defaults
	 *  @type  {Object}
	 */
	Logo.defaults = {
		"container" : "body",
		"width" : 300,
		"height" : 80,
	};

	/**
	 *  Set the size of the logo
	 *  @param  {Number}  width
	 *  @param  {Number}  height
	 *  @return  {Logo}  this
	 */
	Logo.prototype.resize = function(width, height) {
		//set the size of the logo
		this.element.style.width = width + "px";
		this.element.style.height = height + "px";

		// make sure the logo container maintains the right aspect ratio
		width = height / 0.3;

		this.logoContainer.style.width = width + "px";
		this.logoContainer.style.height = height + "px";

		this.canvasContainer.style.borderRadius = height/50 + "px";
		this.canvasContainer.style.width = this.canvasContainer.offsetHeight + "px";
		this.canvasContainer.style.height = this.canvasContainer.offsetHeight + "px";

		this.analyser.resize(this.canvasContainer.offsetHeight, this.canvasContainer.offsetHeight);

		return this;
	};

	/**
	 *  The draw loop which paints the waveform
	 */
	Logo.prototype._draw = function() {
		requestAnimationFrame(this._draw.bind(this));
		var analysis = this.analyser.analyse();
		//if it's silent, draw a canned waveform when the mouse is over
		if (this._isSilent(analysis)){
			this._drawBuffer(waveform, true);
		} else { //if it's not silent, draw the waveform
			this._drawBuffer(analysis, false);
		}
	};

	/**
	 *  Draw the given buffer onto the canvas
	 */
	Logo.prototype._drawBuffer = function(buffer, silent){
		var context = this.context;
		var width = this.context.canvas.width;
		var height = this.context.canvas.height;
		if (silent){
			margin = this._scale(this._rms, 0, this._silentThresh, height * 0.2, height * 0.5);
		} else {
			margin = height * 0.2;
		}
		context.clearRect(0, 0, width, height);
		context.beginPath();

		var firstValue;

		for (var i = 0, len = buffer.length; i < len; i++){
			var x = this._scale(i, 0, len - 1, 0, width);
			var y = this._scale(buffer[i], -1, 1, height - margin, margin);
			if (i === 0){
				firstValue = y;
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}
		context.lineTo(width, height);
		context.lineTo(0, height);
		context.lineTo(0, firstValue);
		context.lineCap = "round";
		// context.stroke();
		context.fillStyle = "#22DBC0";
		context.fill();

	};

	/**
	 *  True if the analyser analysis array is silent (all 0s)
	 *  @private
	 */
	Logo.prototype._isSilent = function(analysis){
		//if the average is close to 128
		var total = 0;
		for (var i = 0; i < analysis.length; i++){
			total += Math.pow((analysis[i] - 128) / 128, 2);
		}
		var rms = Math.sqrt(total / analysis.length);
		this._rms = Math.max(rms, this._rms * 0.9);
		return this._rms < this._silentThresh;
	};

	/**
	 *  Scale a value from between the inputMin/Max to the outputMin/Max
	 *  @private
	 */
	Logo.prototype._scale = function(value, inputMin, inputMax, outputMin, outputMax){
		var norm = (value - inputMin) / (inputMax - inputMin);
		return norm * (outputMax - outputMin) + outputMin;
	};

	/**
	 *  Clean up
	 *  @returns {Logo} this
	 */
	Logo.prototype.dispose = function(){
		this.element.remove();
		this.element = null;
		this.canvas.remove();
		this.canvas = null;
		this.title.remove();
		this.title = null;
		this.context = null;
		this.analyser.dispose();
		this.analyser = null;
		this._signal.dispose();
		this._signal = null;
	};

	return Logo;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(8);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(1)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./Logo.scss", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!../node_modules/autoprefixer-loader/index.js!../node_modules/sass-loader/lib/loader.js!./Logo.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)(undefined);
// imports


// module
exports.push([module.i, "#TonejsLogo {\n  position: relative; }\n  #TonejsLogo #LogoContainer {\n    position: absolute;\n    left: 50%;\n    top: 50%;\n    -webkit-transform: translate(-50%, -50%);\n            transform: translate(-50%, -50%);\n    height: 100%;\n    width: 100%;\n    overflow: hidden;\n    background-color: black; }\n    #TonejsLogo #LogoContainer span {\n      height: 100%;\n      width: 100%;\n      position: relative;\n      display: inline-block;\n      position: absolute; }\n    #TonejsLogo #LogoContainer #T {\n      background: url(" + __webpack_require__(5) + ");\n      background-repeat: no-repeat;\n      background-size: auto 110%;\n      left: 0px; }\n    #TonejsLogo #LogoContainer #one {\n      background: url(" + __webpack_require__(9) + ");\n      background-repeat: no-repeat;\n      background-size: auto 110%;\n      left: 13%; }\n    #TonejsLogo #LogoContainer #js {\n      background: url(" + __webpack_require__(10) + ");\n      background-repeat: no-repeat;\n      background-size: auto 110%;\n      left: 54%; }\n    #TonejsLogo #LogoContainer #Canvas {\n      position: absolute;\n      height: 100%;\n      top: 0px;\n      border-radius: 2%;\n      right: 0px;\n      background-color: #F734D7;\n      z-index: -1; }\n    #TonejsLogo #LogoContainer a {\n      position: absolute;\n      z-index: 2;\n      cursor: pointer;\n      width: 100%;\n      height: 100%;\n      top: 0px;\n      left: 0px; }\n\n#TonejsLogoWaveform {\n  position: absolute;\n  top: 0px;\n  left: 0px;\n  width: 100%;\n  height: 100%; }\n", ""]);

// exports


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTgwLjAyOTI5Njg3NSIgaGVpZ2h0PSIxMzEuODg0NzY1NjI1Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTUuOTYgNjIuODhRNS45NiA1Ny4xNyA3LjYyIDUyLjI2UTkuMjggNDcuMzUgMTIuMzggNDMuNzRRMTUuNDggNDAuMTMgMTkuOTIgMzguMDVRMjQuMzcgMzUuOTggMjkuOTMgMzUuOThRMzUuNTUgMzUuOTggNDAuMDEgMzguMDVRNDQuNDggNDAuMTMgNDcuNTggNDMuNzRRNTAuNjggNDcuMzUgNTIuMzQgNTIuMjZRNTQuMDAgNTcuMTcgNTQuMDAgNjIuODhMNTQuMDAgNjMuOTZRNTQuMDAgNjkuNjcgNTIuMzQgNzQuNTVRNTAuNjggNzkuNDMgNDcuNTggODMuMDVRNDQuNDggODYuNjYgNDAuMDQgODguNzFRMzUuNjAgOTAuNzYgMzAuMDMgOTAuNzZRMjQuNDEgOTAuNzYgMTkuOTUgODguNzFRMTUuNDggODYuNjYgMTIuMzggODMuMDVROS4yOCA3OS40MyA3LjYyIDc0LjU1UTUuOTYgNjkuNjcgNS45NiA2My45Nkw1Ljk2IDYyLjg4TTE0Ljk5IDYzLjk2UTE0Ljk5IDY3Ljg2IDE1LjkyIDcxLjQwUTE2Ljg1IDc0Ljk0IDE4LjczIDc3LjYzUTIwLjYxIDgwLjMxIDIzLjQ0IDgxLjg4UTI2LjI3IDgzLjQ0IDMwLjAzIDgzLjQ0UTMzLjc0IDgzLjQ0IDM2LjU1IDgxLjg4UTM5LjM2IDgwLjMxIDQxLjI0IDc3LjYzUTQzLjEyIDc0Ljk0IDQ0LjA0IDcxLjQwUTQ0Ljk3IDY3Ljg2IDQ0Ljk3IDYzLjk2TDQ0Ljk3IDYyLjg4UTQ0Ljk3IDU5LjAyIDQ0LjAyIDU1LjQ4UTQzLjA3IDUxLjk0IDQxLjE5IDQ5LjI2UTM5LjMxIDQ2LjU3IDM2LjUwIDQ0Ljk5UTMzLjY5IDQzLjQwIDI5LjkzIDQzLjQwUTI2LjE3IDQzLjQwIDIzLjM5IDQ0Ljk5UTIwLjYxIDQ2LjU3IDE4LjczIDQ5LjI2UTE2Ljg1IDUxLjk0IDE1LjkyIDU1LjQ4UTE0Ljk5IDU5LjAyIDE0Ljk5IDYyLjg4TDE0Ljk5IDYzLjk2Wk03Ni42MSAzNi45NUw3Ny4yNSA0NC43N1E4MC4xMyA0MC42NiA4NC4zMyAzOC4zNFE4OC41MyAzNi4wMyA5My43MCAzNS45OFE5Ny44NSAzNS45OCAxMDEuMjUgMzcuMTVRMTA0LjY0IDM4LjMyIDEwNy4wMyA0MC44MVExMDkuNDIgNDMuMzAgMTEwLjcyIDQ3LjEzUTExMi4wMSA1MC45NyAxMTIuMDEgNTYuMjRMMTEyLjAxIDg5Ljc5TDEwMi45OCA4OS43OUwxMDIuOTggNTYuNDRRMTAyLjk4IDUyLjkyIDEwMi4yMCA1MC40OFExMDEuNDIgNDguMDQgOTkuODggNDYuNTJROTguMzQgNDUuMDEgOTYuMTIgNDQuMzNROTMuOTAgNDMuNjQgOTEuMDIgNDMuNjRRODYuNDcgNDMuNjQgODMuMDMgNDUuOTFRNzkuNTkgNDguMTggNzcuNTQgNTEuODlMNzcuNTQgODkuNzlMNjguNTEgODkuNzlMNjguNTEgMzYuOTVMNzYuNjEgMzYuOTVaTTE1MS44NiA5MC43NlExNDYuMjkgOTAuNzYgMTQxLjYzIDg4Ljg2UTEzNi45NiA4Ni45NSAxMzMuNjQgODMuNTRRMTMwLjMyIDgwLjEyIDEyOC40NyA3NS40M1ExMjYuNjEgNzAuNzQgMTI2LjYxIDY1LjIyTDEyNi42MSA2My4xN1ExMjYuNjEgNTYuNzggMTI4LjY2IDUxLjcyUTEzMC43MSA0Ni42NyAxMzQuMTEgNDMuMThRMTM3LjUwIDM5LjY5IDE0MS44MiAzNy44M1ExNDYuMTQgMzUuOTggMTUwLjY4IDM1Ljk4UTE1Ni40MCAzNS45OCAxNjAuNjcgMzcuOTVRMTY0Ljk0IDM5LjkzIDE2Ny43NyA0My40MlExNzAuNjEgNDYuOTEgMTcyLjAwIDUxLjY1UTE3My4zOSA1Ni4zOSAxNzMuMzkgNjEuOTBMMTczLjM5IDY1Ljk2TDEzNS42NCA2NS45NlExMzUuNzkgNjkuNTcgMTM3LjA0IDcyLjc0UTEzOC4yOCA3NS45MiAxNDAuNDUgNzguMjlRMTQyLjYzIDgwLjY1IDE0NS42NSA4Mi4wMlExNDguNjggODMuMzkgMTUyLjM0IDgzLjM5UTE1Ny4xOCA4My4zOSAxNjAuOTQgODEuNDRRMTY0LjcwIDc5LjQ4IDE2Ny4xOSA3Ni4yNkwxNzIuNzEgODAuNTZRMTcxLjM5IDgyLjU2IDE2OS40MSA4NC4zOVExNjcuNDMgODYuMjIgMTY0Ljg0IDg3LjY0UTE2Mi4yNiA4OS4wNSAxNTguOTggODkuOTFRMTU1LjcxIDkwLjc2IDE1MS44NiA5MC43Nk0xNTAuNjggNDMuNDBRMTQ3Ljk1IDQzLjQwIDE0NS41MSA0NC40MFExNDMuMDcgNDUuNDAgMTQxLjExIDQ3LjMzUTEzOS4xNiA0OS4yNiAxMzcuODIgNTIuMDdRMTM2LjQ3IDU0Ljg3IDEzNS45NCA1OC41NEwxNjQuMzYgNTguNTRMMTY0LjM2IDU3Ljg1UTE2NC4yMSA1NS4yMSAxNjMuMzUgNTIuNjNRMTYyLjUwIDUwLjA0IDE2MC44NCA0Ny45OVExNTkuMTggNDUuOTQgMTU2LjY3IDQ0LjY3UTE1NC4xNSA0My40MCAxNTAuNjggNDMuNDBaIi8+PC9zdmc+"

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTgwLjAyOTI5Njg3NSIgaGVpZ2h0PSIxMzEuODg0NzY1NjI1Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTI0LjIyIDgzLjkzUTI0LjIyIDgyLjQ2IDI0LjY4IDgxLjE5UTI1LjE1IDc5LjkyIDI2LjAzIDc4Ljk3UTI2LjkwIDc4LjAyIDI4LjIyIDc3LjQ4UTI5LjU0IDc2Ljk0IDMxLjMwIDc2Ljk0UTMzLjA2IDc2Ljk0IDM0LjQwIDc3LjQ4UTM1Ljc0IDc4LjAyIDM2LjY1IDc4Ljk3UTM3LjU1IDc5LjkyIDM4LjAxIDgxLjE5UTM4LjQ4IDgyLjQ2IDM4LjQ4IDgzLjkzUTM4LjQ4IDg1LjM0IDM4LjAxIDg2LjU5UTM3LjU1IDg3LjgzIDM2LjY1IDg4Ljc2UTM1Ljc0IDg5LjY5IDM0LjQwIDkwLjIwUTMzLjA2IDkwLjcxIDMxLjMwIDkwLjcxUTI5LjU0IDkwLjcxIDI4LjIyIDkwLjIwUTI2LjkwIDg5LjY5IDI2LjAzIDg4Ljc2UTI1LjE1IDg3LjgzIDI0LjY4IDg2LjU5UTI0LjIyIDg1LjM0IDI0LjIyIDgzLjkzWk03NC42MSAzNi45NUwxMDEuMjcgMzYuOTVMMTAxLjI3IDkwLjEzUTEwMS4yNyA5NS4yMSA5OS44OCA5OS4xMVE5OC40OSAxMDMuMDIgOTUuODMgMTA1LjY4UTkzLjE2IDEwOC4zNCA4OS4zMyAxMDkuNzNRODUuNTAgMTExLjEyIDgwLjYyIDExMS4xMlE3Ny44MyAxMTEuMTIgNzUuNDIgMTEwLjk1UTczLjAwIDExMC43OCA3MC4zMSAxMTAuMjlMNzAuOTUgMTAyLjg3UTcxLjc4IDEwMy4wMiA3My4wNSAxMDMuMTRRNzQuMzIgMTAzLjI2IDc1LjYxIDEwMy4zM1E3Ni45MCAxMDMuNDEgNzguMTAgMTAzLjQzUTc5LjMwIDEwMy40NiA3OS45OCAxMDMuNDZRODIuNTIgMTAzLjQ2IDg0Ljc3IDEwMi44MFE4Ny4wMSAxMDIuMTQgODguNjcgMTAwLjU4UTkwLjMzIDk5LjAxIDkxLjI4IDk2LjQ1UTkyLjI0IDkzLjg5IDkyLjI0IDkwLjEzTDkyLjI0IDQ0LjgxTDc0LjYxIDQ0LjgxTDc0LjYxIDM2Ljk1TTkwLjk3IDIzLjA0UTkwLjk3IDIwLjg0IDkyLjI5IDE5LjMwUTkzLjYwIDE3Ljc2IDk2LjM0IDE3Ljc2UTk5LjA3IDE3Ljc2IDEwMC40NCAxOS4zMFExMDEuODEgMjAuODQgMTAxLjgxIDIzLjA0UTEwMS44MSAyNS4yMyAxMDAuNDQgMjYuNzJROTkuMDcgMjguMjEgOTYuMzQgMjguMjFROTMuNjAgMjguMjEgOTIuMjkgMjYuNzJROTAuOTcgMjUuMjMgOTAuOTcgMjMuMDRaTTE2My42MiA3NS43N1ExNjMuNjIgNzQuMTYgMTYyLjk5IDcyLjg3UTE2Mi4zNSA3MS41NyAxNjAuODQgNzAuNTBRMTU5LjMzIDY5LjQyIDE1Ni44NCA2OC41MlExNTQuMzUgNjcuNjIgMTUwLjYzIDY2Ljg4UTE0Ni4wOSA2NS45NiAxNDIuMzYgNjQuNjRRMTM4LjYyIDYzLjMyIDEzNS45NiA2MS40OVExMzMuMzAgNTkuNjYgMTMxLjg0IDU3LjE5UTEzMC4zNyA1NC43MyAxMzAuMzcgNTEuNDZRMTMwLjM3IDQ4LjIzIDEzMS44OCA0NS40MlExMzMuNDAgNDIuNjIgMTM2LjEzIDQwLjUyUTEzOC44NyAzOC40MiAxNDIuNjUgMzcuMjBRMTQ2LjQ0IDM1Ljk4IDE1MC45OCAzNS45OFExNTUuODYgMzUuOTggMTU5Ljc3IDM3LjI1UTE2My42NyAzOC41MiAxNjYuNDEgNDAuNzZRMTY5LjE0IDQzLjAxIDE3MC42MyA0Ni4wMVExNzIuMTIgNDkuMDEgMTcyLjEyIDUyLjQ4TDE2My4wOSA1Mi40OFExNjMuMDkgNTAuNzcgMTYyLjIxIDQ5LjE0UTE2MS4zMyA0Ny41MCAxNTkuNzcgNDYuMjNRMTU4LjIwIDQ0Ljk2IDE1NS45OCA0NC4xOFExNTMuNzYgNDMuNDAgMTUwLjk4IDQzLjQwUTE0OC4xMCA0My40MCAxNDUuOTIgNDQuMDNRMTQzLjc1IDQ0LjY3IDE0Mi4zMSA0NS43NFExNDAuODcgNDYuODIgMTQwLjE0IDQ4LjIzUTEzOS40MCA0OS42NSAxMzkuNDAgNTEuMTZRMTM5LjQwIDUyLjcyIDEzOS45OSA1My45NVExNDAuNTggNTUuMTcgMTQyLjAyIDU2LjE0UTE0My40NiA1Ny4xMiAxNDUuODcgNTcuOTBRMTQ4LjI5IDU4LjY4IDE1Mi4wMCA1OS40MVExNTYuODggNjAuNDQgMTYwLjc0IDYxLjc4UTE2NC42MCA2My4xMyAxNjcuMjQgNjUuMDBRMTY5Ljg3IDY2Ljg4IDE3MS4yNiA2OS4zOFExNzIuNjYgNzEuODcgMTcyLjY2IDc1LjE0UTE3Mi42NiA3OC42NSAxNzEuMDcgODEuNTNRMTY5LjQ4IDg0LjQxIDE2Ni42NSA4Ni40NlExNjMuODIgODguNTIgMTU5Ljg2IDg5LjY0UTE1NS45MSA5MC43NiAxNTEuMjIgOTAuNzZRMTQ1Ljg1IDkwLjc2IDE0MS42NSA4OS4zMlExMzcuNDUgODcuODggMTM0LjU1IDg1LjUxUTEzMS42NCA4My4xNCAxMzAuMTAgODAuMDJRMTI4LjU2IDc2Ljg5IDEyOC41NiA3My41M0wxMzcuNjAgNzMuNTNRMTM3Ljc5IDc2LjMxIDEzOS4wOSA3OC4yMVExNDAuMzggODAuMTIgMTQyLjMxIDgxLjI5UTE0NC4yNCA4Mi40NiAxNDYuNTggODIuOTVRMTQ4LjkzIDgzLjQ0IDE1MS4yMiA4My40NFExNTYuOTMgODMuNDQgMTYwLjI1IDgxLjM0UTE2My41NyA3OS4yNCAxNjMuNjIgNzUuNzdaIi8+PC9zdmc+"

/***/ })
/******/ ]);
});
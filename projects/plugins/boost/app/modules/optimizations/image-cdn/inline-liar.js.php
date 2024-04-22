<?php // phpcs:ignoreFile ?>
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 697:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "z2": () => (/* binding */ dynamicSrcset)
/* harmony export */ });
/* unused harmony exports parseImageSize, getImageSizeFromUrl, calculateTargetSize, isSizeReusable, findClosestImageSize */
function getDpr() {
  return window.devicePixelRatio || 1;
}
function parseImageSize(resizeParam) {
  const [width, height] = resizeParam.split(',').map(Number);
  if (isNaN(width) || isNaN(height)) {
    return null;
  }
  return {
    width,
    height
  };
}
function getImageSizeFromUrl(url) {
  const resizeParam = new URL(url).searchParams.get('resize');
  if (!resizeParam) {
    return null;
  }
  return parseImageSize(resizeParam);
}
function calculateTargetSize(dimensions) {
  const dpr = getDpr();
  const ratio = dimensions.width / dimensions.height;
  const targetWidth = Math.ceil(dimensions.width * dpr / 10) * 10;
  const targetHeight = Math.ceil(targetWidth / ratio);
  return {
    width: targetWidth,
    height: targetHeight
  };
}
function isSizeReusable(desiredWidth, existingWidth) {
  if (existingWidth <= 0) {
    return false;
  }
  const diff = existingWidth - desiredWidth;
  if (diff < 0) {
    return false;
  }
  if (diff < 50) {
    return true;
  }
  const ratio = desiredWidth / existingWidth;
  return ratio > 0.9 && ratio <= 1;
}
function findClosestImageSize(urls, targetWidth) {
  for (const src of urls) {
    const [url, widthStr] = src.trim().split(' ');
    if (!widthStr?.trim().endsWith('w')) {
      continue;
    }
    const imageSize = getImageSizeFromUrl(url);
    if (!imageSize) {
      continue;
    }
    if (isSizeReusable(targetWidth, imageSize.width)) {
      return {
        url: new URL(url),
        ...imageSize
      };
    }
  }
  return undefined;
}
function resizeImage(imageUrl, targetSize) {
  const newUrl = new URL(imageUrl);
  newUrl.searchParams.set('resize', `${targetSize.width},${targetSize.height}`);
  return newUrl;
}
function dynamicSrcset(img) {
  if (!img.getAttribute('width') || !img.getAttribute('height') || !img.srcset || !img.src || !img.src.includes('.wp.com')) {
    return;
  }
  const rect = img.getBoundingClientRect();
  const targetSize = calculateTargetSize(rect);
  const srcset = img.srcset.split(',');
  const closestImage = findClosestImageSize([`${img.src} 0w`, ...srcset], targetSize.width);
  if (closestImage) {
    closestImage.url.searchParams.set('_jb', '2');
    srcset.push(`${closestImage.url} ${window.innerWidth * getDpr()}w`);
    img.srcset = srcset.join(',');
    img.sizes = 'auto';
  } else {
    const newUrl = resizeImage(img.src, targetSize);
    newUrl.searchParams.set('_jb', '1');
    srcset.push(`${newUrl} ${window.innerWidth * getDpr()}w`);
    img.srcset = srcset.join(',');
    img.sizes = 'auto';
  }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/* harmony import */ var _srcset__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(697);

(function () {
  const lazyImages = document.querySelectorAll('img[loading=lazy]');
  lazyImages.forEach(_srcset__WEBPACK_IMPORTED_MODULE_0__/* .dynamicSrcset */ .z2);
})();
})();

/******/ })()
;

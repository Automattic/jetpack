this["wp"] = this["wp"] || {}; this["wp"]["blockSerializationDefaultParser"] =
/******/ (function(modules) { // webpackBootstrap
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
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "SiJt");
/******/ })
/************************************************************************/
/******/ ({

/***/ "SiJt":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parse", function() { return parse; });
let document;
let offset;
let output;
let stack;
/**
 * Matches block comment delimiters
 *
 * While most of this pattern is straightforward the attribute parsing
 * incorporates a tricks to make sure we don't choke on specific input
 *
 *  - since JavaScript has no possessive quantifier or atomic grouping
 *    we are emulating it with a trick
 *
 *    we want a possessive quantifier or atomic group to prevent backtracking
 *    on the `}`s should we fail to match the remainder of the pattern
 *
 *    we can emulate this with a positive lookahead and back reference
 *    (a++)*c === ((?=(a+))\1)*c
 *
 *    let's examine an example:
 *      - /(a+)*c/.test('aaaaaaaaaaaaad') fails after over 49,000 steps
 *      - /(a++)*c/.test('aaaaaaaaaaaaad') fails after 85 steps
 *      - /(?>a+)*c/.test('aaaaaaaaaaaaad') fails after 126 steps
 *
 *    this is because the possessive `++` and the atomic group `(?>)`
 *    tell the engine that all those `a`s belong together as a single group
 *    and so it won't split it up when stepping backwards to try and match
 *
 *    if we use /((?=(a+))\1)*c/ then we get the same behavior as the atomic group
 *    or possessive and prevent the backtracking because the `a+` is matched but
 *    not captured. thus, we find the long string of `a`s and remember it, then
 *    reference it as a whole unit inside our pattern
 *
 *    @see http://instanceof.me/post/52245507631/regex-emulate-atomic-grouping-with-lookahead
 *    @see http://blog.stevenlevithan.com/archives/mimic-atomic-groups
 *    @see https://javascript.info/regexp-infinite-backtracking-problem
 *
 *    once browsers reliably support atomic grouping or possessive
 *    quantifiers natively we should remove this trick and simplify
 *
 * @type {RegExp}
 *
 * @since 3.8.0
 * @since 4.6.1 added optimization to prevent backtracking on attribute parsing
 */

const tokenizer = /<!--\s+(\/)?wp:([a-z][a-z0-9_-]*\/)?([a-z][a-z0-9_-]*)\s+({(?:(?=([^}]+|}+(?=})|(?!}\s+\/?-->)[^])*)\5|[^]*?)}\s+)?(\/)?-->/g;

function Block(blockName, attrs, innerBlocks, innerHTML, innerContent) {
  return {
    blockName,
    attrs,
    innerBlocks,
    innerHTML,
    innerContent
  };
}

function Freeform(innerHTML) {
  return Block(null, {}, [], innerHTML, [innerHTML]);
}

function Frame(block, tokenStart, tokenLength, prevOffset, leadingHtmlStart) {
  return {
    block,
    tokenStart,
    tokenLength,
    prevOffset: prevOffset || tokenStart + tokenLength,
    leadingHtmlStart
  };
}
/**
 * Parser function, that converts input HTML into a block based structure.
 *
 * @param {string} doc The HTML document to parse.
 *
 * @example
 * Input post:
 * ```html
 * <!-- wp:columns {"columns":3} -->
 * <div class="wp-block-columns has-3-columns"><!-- wp:column -->
 * <div class="wp-block-column"><!-- wp:paragraph -->
 * <p>Left</p>
 * <!-- /wp:paragraph --></div>
 * <!-- /wp:column -->
 *
 * <!-- wp:column -->
 * <div class="wp-block-column"><!-- wp:paragraph -->
 * <p><strong>Middle</strong></p>
 * <!-- /wp:paragraph --></div>
 * <!-- /wp:column -->
 *
 * <!-- wp:column -->
 * <div class="wp-block-column"></div>
 * <!-- /wp:column --></div>
 * <!-- /wp:columns -->
 * ```
 *
 * Parsing code:
 * ```js
 * import { parse } from '@wordpress/block-serialization-default-parser';
 *
 * parse( post ) === [
 *     {
 *         blockName: "core/columns",
 *         attrs: {
 *             columns: 3
 *         },
 *         innerBlocks: [
 *             {
 *                 blockName: "core/column",
 *                 attrs: null,
 *                 innerBlocks: [
 *                     {
 *                         blockName: "core/paragraph",
 *                         attrs: null,
 *                         innerBlocks: [],
 *                         innerHTML: "\n<p>Left</p>\n"
 *                     }
 *                 ],
 *                 innerHTML: '\n<div class="wp-block-column"></div>\n'
 *             },
 *             {
 *                 blockName: "core/column",
 *                 attrs: null,
 *                 innerBlocks: [
 *                     {
 *                         blockName: "core/paragraph",
 *                         attrs: null,
 *                         innerBlocks: [],
 *                         innerHTML: "\n<p><strong>Middle</strong></p>\n"
 *                     }
 *                 ],
 *                 innerHTML: '\n<div class="wp-block-column"></div>\n'
 *             },
 *             {
 *                 blockName: "core/column",
 *                 attrs: null,
 *                 innerBlocks: [],
 *                 innerHTML: '\n<div class="wp-block-column"></div>\n'
 *             }
 *         ],
 *         innerHTML: '\n<div class="wp-block-columns has-3-columns">\n\n\n\n</div>\n'
 *     }
 * ];
 * ```
 * @return {Array} A block-based representation of the input HTML.
 */


const parse = doc => {
  document = doc;
  offset = 0;
  output = [];
  stack = [];
  tokenizer.lastIndex = 0;

  do {// twiddle our thumbs
  } while (proceed());

  return output;
};

function proceed() {
  const next = nextToken();
  const [tokenType, blockName, attrs, startOffset, tokenLength] = next;
  const stackDepth = stack.length; // we may have some HTML soup before the next block

  const leadingHtmlStart = startOffset > offset ? offset : null;

  switch (tokenType) {
    case 'no-more-tokens':
      // if not in a block then flush output
      if (0 === stackDepth) {
        addFreeform();
        return false;
      } // Otherwise we have a problem
      // This is an error
      // we have options
      //  - treat it all as freeform text
      //  - assume an implicit closer (easiest when not nesting)
      // for the easy case we'll assume an implicit closer


      if (1 === stackDepth) {
        addBlockFromStack();
        return false;
      } // for the nested case where it's more difficult we'll
      // have to assume that multiple closers are missing
      // and so we'll collapse the whole stack piecewise


      while (0 < stack.length) {
        addBlockFromStack();
      }

      return false;

    case 'void-block':
      // easy case is if we stumbled upon a void block
      // in the top-level of the document
      if (0 === stackDepth) {
        if (null !== leadingHtmlStart) {
          output.push(Freeform(document.substr(leadingHtmlStart, startOffset - leadingHtmlStart)));
        }

        output.push(Block(blockName, attrs, [], '', []));
        offset = startOffset + tokenLength;
        return true;
      } // otherwise we found an inner block


      addInnerBlock(Block(blockName, attrs, [], '', []), startOffset, tokenLength);
      offset = startOffset + tokenLength;
      return true;

    case 'block-opener':
      // track all newly-opened blocks on the stack
      stack.push(Frame(Block(blockName, attrs, [], '', []), startOffset, tokenLength, startOffset + tokenLength, leadingHtmlStart));
      offset = startOffset + tokenLength;
      return true;

    case 'block-closer':
      // if we're missing an opener we're in trouble
      // This is an error
      if (0 === stackDepth) {
        // we have options
        //  - assume an implicit opener
        //  - assume _this_ is the opener
        //  - give up and close out the document
        addFreeform();
        return false;
      } // if we're not nesting then this is easy - close the block


      if (1 === stackDepth) {
        addBlockFromStack(startOffset);
        offset = startOffset + tokenLength;
        return true;
      } // otherwise we're nested and we have to close out the current
      // block and add it as a innerBlock to the parent


      const stackTop = stack.pop();
      const html = document.substr(stackTop.prevOffset, startOffset - stackTop.prevOffset);
      stackTop.block.innerHTML += html;
      stackTop.block.innerContent.push(html);
      stackTop.prevOffset = startOffset + tokenLength;
      addInnerBlock(stackTop.block, stackTop.tokenStart, stackTop.tokenLength, startOffset + tokenLength);
      offset = startOffset + tokenLength;
      return true;

    default:
      // This is an error
      addFreeform();
      return false;
  }
}
/**
 * Parse JSON if valid, otherwise return null
 *
 * Note that JSON coming from the block comment
 * delimiters is constrained to be an object
 * and cannot be things like `true` or `null`
 *
 * @param {string} input JSON input string to parse
 * @return {Object|null} parsed JSON if valid
 */


function parseJSON(input) {
  try {
    return JSON.parse(input);
  } catch (e) {
    return null;
  }
}

function nextToken() {
  // aye the magic
  // we're using a single RegExp to tokenize the block comment delimiters
  // we're also using a trick here because the only difference between a
  // block opener and a block closer is the leading `/` before `wp:` (and
  // a closer has no attributes). we can trap them both and process the
  // match back in JavaScript to see which one it was.
  const matches = tokenizer.exec(document); // we have no more tokens

  if (null === matches) {
    return ['no-more-tokens'];
  }

  const startedAt = matches.index;
  const [match, closerMatch, namespaceMatch, nameMatch, attrsMatch
  /* internal/unused */
  ,, voidMatch] = matches;
  const length = match.length;
  const isCloser = !!closerMatch;
  const isVoid = !!voidMatch;
  const namespace = namespaceMatch || 'core/';
  const name = namespace + nameMatch;
  const hasAttrs = !!attrsMatch;
  const attrs = hasAttrs ? parseJSON(attrsMatch) : {}; // This state isn't allowed
  // This is an error

  if (isCloser && (isVoid || hasAttrs)) {// we can ignore them since they don't hurt anything
    // we may warn against this at some point or reject it
  }

  if (isVoid) {
    return ['void-block', name, attrs, startedAt, length];
  }

  if (isCloser) {
    return ['block-closer', name, null, startedAt, length];
  }

  return ['block-opener', name, attrs, startedAt, length];
}

function addFreeform(rawLength) {
  const length = rawLength ? rawLength : document.length - offset;

  if (0 === length) {
    return;
  }

  output.push(Freeform(document.substr(offset, length)));
}

function addInnerBlock(block, tokenStart, tokenLength, lastOffset) {
  const parent = stack[stack.length - 1];
  parent.block.innerBlocks.push(block);
  const html = document.substr(parent.prevOffset, tokenStart - parent.prevOffset);

  if (html) {
    parent.block.innerHTML += html;
    parent.block.innerContent.push(html);
  }

  parent.block.innerContent.push(null);
  parent.prevOffset = lastOffset ? lastOffset : tokenStart + tokenLength;
}

function addBlockFromStack(endOffset) {
  const {
    block,
    leadingHtmlStart,
    prevOffset,
    tokenStart
  } = stack.pop();
  const html = endOffset ? document.substr(prevOffset, endOffset - prevOffset) : document.substr(prevOffset);

  if (html) {
    block.innerHTML += html;
    block.innerContent.push(html);
  }

  if (null !== leadingHtmlStart) {
    output.push(Freeform(document.substr(leadingHtmlStart, tokenStart - leadingHtmlStart)));
  }

  output.push(block);
}


/***/ })

/******/ });
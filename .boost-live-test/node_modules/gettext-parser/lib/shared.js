'use strict';

// Expose to the world
module.exports.parseHeader = parseHeader;
module.exports.generateHeader = generateHeader;
module.exports.formatCharset = formatCharset;
module.exports.foldLine = foldLine;

/**
 * Parses a header string into an object of key-value pairs
 *
 * @param {String} str Header string
 * @return {Object} An object of key-value pairs
 */
function parseHeader (str) {
  var lines = (str || '').split('\n');
  var headers = {};

  lines.forEach(function (line) {
    var parts = line.trim().split(':');
    var key = (parts.shift() || '').trim().toLowerCase();
    var value = parts.join(':').trim();
    if (!key) {
      return;
    }
    headers[key] = value;
  });

  return headers;
}

/**
 * Convert first letters after - to uppercase, other lowercase
 *
 * @param {String} str String to be updated
 * @return {String} A string with uppercase words
 */
function upperCaseWords (str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/^(MIME|POT?(?=-)|[a-z])|-[a-z]/gi, function (str) {
      return str.toUpperCase();
    });
}

/**
 * Joins a header object of key value pairs into a header string
 *
 * @param {Object} header Object of key value pairs
 * @return {String} Header string
 */
function generateHeader (header) {
  var lines = [];

  Object.keys(header || {}).forEach(function (key) {
    if (key) {
      lines.push(upperCaseWords(key) + ': ' + (header[key] || '').trim());
    }
  });

  return lines.join('\n') + (lines.length ? '\n' : '');
}

/**
 * Normalizes charset name. Converts utf8 to utf-8, WIN1257 to windows-1257 etc.
 *
 * @param {String} charset Charset name
 * @return {String} Normalized charset name
 */
function formatCharset (charset, defaultCharset) {
  return (charset || 'iso-8859-1').toString().toLowerCase()
    .replace(/^utf[-_]?(\d+)$/, 'utf-$1')
    .replace(/^win(?:dows)?[-_]?(\d+)$/, 'windows-$1')
    .replace(/^latin[-_]?(\d+)$/, 'iso-8859-$1')
    .replace(/^(us[-_]?)?ascii$/, 'ascii')
    .replace(/^charset$/, defaultCharset || 'iso-8859-1')
    .trim();
}

/**
 * Folds long lines according to PO format
 *
 * @param {String} str PO formatted string to be folded
 * @param {Number} [maxLen=76] Maximum allowed length for folded lines
 * @return {Array} An array of lines
 */
function foldLine (str, maxLen) {
  maxLen = maxLen || 76;

  var lines = [];
  var curLine = '';
  var pos = 0;
  var len = str.length;
  var match;

  while (pos < len) {
    curLine = str.substr(pos, maxLen);

    // ensure that the line never ends with a partial escaping
    // make longer lines if needed
    while (curLine.substr(-1) === '\\' && pos + curLine.length < len) {
      curLine += str.charAt(pos + curLine.length);
    }

    // ensure that if possible, line breaks are done at reasonable places
    if ((match = /.*?\\n/.exec(curLine))) {
      // use everything before and including the first line break
      curLine = match[0];
    } else if (pos + curLine.length < len) {
      // if we're not at the end
      if ((match = /.*\s+/.exec(curLine)) && /[^\s]/.test(match[0])) {
        // use everything before and including the last white space character (if anything)
        curLine = match[0];
      } else if ((match = /.*[\x21-\x2f0-9\x5b-\x60\x7b-\x7e]+/.exec(curLine)) && /[^\x21-\x2f0-9\x5b-\x60\x7b-\x7e]/.test(match[0])) {
        // use everything before and including the last "special" character (if anything)
        curLine = match[0];
      }
    }

    lines.push(curLine);
    pos += curLine.length;
  }

  return lines;
}

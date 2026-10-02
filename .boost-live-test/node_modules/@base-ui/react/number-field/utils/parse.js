"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SPACE_SEPARATOR_RE = exports.PLUS_SIGNS_WITH_ASCII = exports.PERMILLE_RE = exports.PERMILLE = exports.PERCENT_RE = exports.PERCENTAGES = exports.MINUS_SIGNS_WITH_ASCII = exports.HAN_DETECT_RE = exports.FULLWIDTH_GROUP = exports.FULLWIDTH_DECIMAL = exports.FORMAT_CONTROL_DETECT_RE = exports.BASE_NON_NUMERIC_SYMBOLS = exports.ARABIC_PERSIAN_DETECT_RE = exports.ANY_PLUS_RE = exports.ANY_PLUS_DETECT_RE = exports.ANY_MINUS_RE = exports.ANY_MINUS_DETECT_RE = void 0;
exports.getFormatParts = getFormatParts;
exports.getNumberLocaleDetails = getNumberLocaleDetails;
exports.isNumeralChar = isNumeralChar;
exports.parseNumber = parseNumber;
var _formatNumber = require("@base-ui/utils/formatNumber");
// Han numerals in digit order, with both zero forms first ('零' at 0, '〇' at 1), so a
// character's digit value is `max(indexOf - 1, 0)`.
const HAN_NUMERALS = '零〇一二三四五六七八九';

// Arabic-Indic (U+0660–0669), Persian (U+06F0–06F9), and fullwidth (U+FF10–FF19) digits are
// contiguous ranges whose bases are divisible by 16, so `charCode % 16` is the digit value for
// all three systems.
const NON_ASCII_DIGIT_RE = /[٠-٩۰-۹０-９]/g;
const HAN_RE = /[零〇一二三四五六七八九]/g;
const PERCENTAGES = exports.PERCENTAGES = ['%', '٪', '％', '﹪'];
const PERMILLE = exports.PERMILLE = ['‰', '؉'];

// Fullwidth punctuation common in CJK inputs
const FULLWIDTH_DECIMAL = exports.FULLWIDTH_DECIMAL = '．'; // U+FF0E
const FULLWIDTH_GROUP = exports.FULLWIDTH_GROUP = '，'; // U+FF0C

const PERCENT_RE = exports.PERCENT_RE = /[%٪％﹪]/;
const PERMILLE_RE = exports.PERMILLE_RE = /[‰؉]/;
const PERCENT_GLOBAL_RE = /[%٪％﹪]/g;
const PERMILLE_GLOBAL_RE = /[‰؉]/g;

// Detection regexes (non-global to avoid lastIndex side effects). Arabic-Indic and Persian
// digits share one regex because both resolve to the `ar` locale heuristic.
const ARABIC_PERSIAN_DETECT_RE = exports.ARABIC_PERSIAN_DETECT_RE = /[٠-٩۰-۹]/;
const HAN_DETECT_RE = exports.HAN_DETECT_RE = /[零〇一二三四五六七八九]/;
const ANY_NUMERAL_DETECT_RE = /[0-9٠-٩۰-۹０-９零〇一二三四五六七八九]/;

// Whether the character is a digit in any numeral system the field accepts.
function isNumeralChar(char) {
  return ANY_NUMERAL_DETECT_RE.test(char);
}
const BASE_NON_NUMERIC_SYMBOLS = exports.BASE_NON_NUMERIC_SYMBOLS = ['.', ',', FULLWIDTH_DECIMAL, FULLWIDTH_GROUP, '٫', '٬'];
const SPACE_SEPARATOR_RE = exports.SPACE_SEPARATOR_RE = /\p{Zs}/u;
// Format/bidi control characters (e.g. the LRM/ALM marks RTL locales insert around exponent and
// currency signs). `parseNumber` strips these, so input validation must treat them as ignorable
// rather than rejecting the typed string. Non-global so it's safe for repeated `.test(char)`.
const FORMAT_CONTROL_DETECT_RE = exports.FORMAT_CONTROL_DETECT_RE = /\p{Cf}/u;
const FORMAT_CONTROL_GLOBAL_RE = /\p{Cf}/gu;
const PLUS_SIGNS_WITH_ASCII = exports.PLUS_SIGNS_WITH_ASCII = ['+', '＋', '﹢'];
const MINUS_SIGNS_WITH_ASCII = exports.MINUS_SIGNS_WITH_ASCII = ['-', '−', '－', '‒', '–', '—', '﹣'];
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function shiftDecimal(value, exponentDelta) {
  const [coefficient, exponent = '0'] = String(value).split('e');
  return Number(`${coefficient}e${Number(exponent) + exponentDelta}`);
}
const ANY_MINUS_RE = exports.ANY_MINUS_RE = /[-−－‒–—﹣]/gu;
const ANY_PLUS_RE = exports.ANY_PLUS_RE = /[+＋﹢]/gu;
const ANY_MINUS_DETECT_RE = exports.ANY_MINUS_DETECT_RE = /[-−－‒–—﹣]/;
const ANY_PLUS_DETECT_RE = exports.ANY_PLUS_DETECT_RE = /[+＋﹢]/;

// A representative value with a grouping separator and a fractional part, so that the formatter
// emits every locale-specific part (group, decimal, currency, unit, literal, exponent, …). Shared
// so the locale-detail and allowed-character derivations enumerate the same parts.
const SAMPLE_FORMAT_NUMBER = 11111.1;

/**
 * Returns the `Intl.NumberFormat` parts of a representative number, which surface every
 * non-numeric symbol a given locale/format renders.
 */
function getFormatParts(locale, options) {
  return (0, _formatNumber.getFormatter)(locale, options).formatToParts(SAMPLE_FORMAT_NUMBER);
}
function getNumberLocaleDetails(locale, options) {
  const parts = getFormatParts(locale, options);
  const result = {};
  parts.forEach(part => {
    result[part.type] = part.value;
  });

  // The formatting options may omit the decimal separator (e.g. integer formats), so resolve it
  // from the plain locale formatter, which renders one for every locale and numbering system. This
  // overrides any options-derived decimal too, which is safe because the separator is
  // locale-determined and identical across format styles. The ASCII seed is a formality to keep
  // the separator non-optional for callers; it is always replaced below.
  let decimal = '.';
  (0, _formatNumber.getFormatter)(locale).formatToParts(0.1).forEach(part => {
    if (part.type === 'decimal') {
      decimal = part.value;
    }
  });
  return {
    ...result,
    decimal
  };
}
function parseNumber(formattedNumber, locale, options) {
  // Normalize control characters and whitespace; remove bidi/format controls
  let input = formattedNumber.replace(FORMAT_CONTROL_GLOBAL_RE, '').trim();

  // Normalize unicode minus/plus to ASCII, handle leading/trailing signs
  input = input.replace(ANY_MINUS_RE, '-').replace(ANY_PLUS_RE, '+');
  let isNegative = false;

  // Strips a matched sign (leading "-12" / trailing "1234-") while recording negativity.
  const takeSign = (match, sign) => {
    if (sign === '-') {
      isNegative = true;
    }
    return '';
  };
  input = input.replace(/([+-])\s*$/, takeSign).replace(/^\s*([+-])/, takeSign);

  // Heuristic locale detection
  let computedLocale = locale;
  if (computedLocale === undefined) {
    if (ARABIC_PERSIAN_DETECT_RE.test(input)) {
      computedLocale = 'ar';
    } else if (HAN_DETECT_RE.test(input)) {
      computedLocale = 'zh';
    }
  }
  const {
    group,
    decimal,
    currency,
    exponentSeparator
  } = getNumberLocaleDetails(computedLocale, options);

  // Build robust unit regex from all unit parts (such as "km/h")
  const unitParts = (0, _formatNumber.getFormatter)(computedLocale, options).formatToParts(1).filter(p => p.type === 'unit').map(p => escapeRegExp(p.value));
  const unitRegex = unitParts.length ? new RegExp(unitParts.join('|'), 'g') : null;
  let groupRegex = null;
  if (group) {
    const isSpaceGroup = /\p{Zs}/u.test(group);
    const isApostropheGroup = group === "'" || group === '’';

    // Check if the group separator is a space-like character.
    // If so, we'll replace all such characters with an empty string.
    if (isSpaceGroup) {
      groupRegex = /\p{Zs}/gu;
    } else if (isApostropheGroup) {
      // Some environments format numbers with ASCII apostrophe and others with a curly apostrophe.
      groupRegex = /['’]/g;
    } else {
      groupRegex = new RegExp(escapeRegExp(group), 'g');
    }
  }
  const replacements = [[groupRegex, ''], [new RegExp(escapeRegExp(decimal), 'g'), '.'],
  // Fullwidth/Arabic punctuation
  [/[．٫]/g, '.'],
  // FULLWIDTH_DECIMAL, ARABIC DECIMAL SEPARATOR (U+066B)
  [/[，٬]/g, ''],
  // FULLWIDTH_GROUP, ARABIC THOUSANDS SEPARATOR (U+066C)
  // Currency & unit labels
  [currency ? new RegExp(escapeRegExp(currency), 'g') : null, ''], [unitRegex, ''], [PERCENT_GLOBAL_RE, ''], [PERMILLE_GLOBAL_RE, ''], [exponentSeparator ? new RegExp(escapeRegExp(exponentSeparator), 'g') : null, 'e'],
  // Numeral systems to ASCII digits
  [NON_ASCII_DIGIT_RE, ch => String(ch.charCodeAt(0) % 16)], [HAN_RE, ch => String(Math.max(HAN_NUMERALS.indexOf(ch) - 1, 0))]];
  let unformatted = replacements.reduce((acc, [regex, replacement]) => {
    return regex ? acc.replace(regex, replacement) : acc;
  }, input);

  // Mixed-locale safety: keep only the last '.' as decimal
  const lastDot = unformatted.lastIndexOf('.');
  if (lastDot !== -1) {
    unformatted = `${unformatted.slice(0, lastDot).replace(/\./g, '')}.${unformatted.slice(lastDot + 1).replace(/\./g, '')}`;
  }

  // Guard against Infinity inputs (ASCII and symbol)
  if (/^[-+]?Infinity$/i.test(input) || input.includes('∞')) {
    return null;
  }
  const parseTarget = (isNegative ? '-' : '') + unformatted;
  let num = parseFloat(parseTarget);
  const style = options?.style;
  const isUnitPercent = style === 'unit' && options?.unit === 'percent';
  const hasPercentSymbol = PERCENT_RE.test(formattedNumber) || style === 'percent';
  const hasPermilleSymbol = PERMILLE_RE.test(formattedNumber);
  if (hasPermilleSymbol) {
    num = shiftDecimal(num, -3);
  } else if (!isUnitPercent && hasPercentSymbol) {
    num = shiftDecimal(num, -2);
  }
  if (!Number.isFinite(num)) {
    return null;
  }
  return num;
}
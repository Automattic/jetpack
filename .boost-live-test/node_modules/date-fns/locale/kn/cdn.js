(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/kn/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: {
      default: "1 ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
      future: "1 ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
      past: "1 ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ"
    },
    other: {
      default: "{{count}} ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
      future: "{{count}} ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
      past: "{{count}} ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ"
    }
  },
  xSeconds: {
    one: {
      default: "1 ಸೆಕೆಂಡ್",
      future: "1 ಸೆಕೆಂಡ್‌ನಲ್ಲಿ",
      past: "1 ಸೆಕೆಂಡ್ ಹಿಂದೆ"
    },
    other: {
      default: "{{count}} ಸೆಕೆಂಡುಗಳು",
      future: "{{count}} ಸೆಕೆಂಡ್‌ಗಳಲ್ಲಿ",
      past: "{{count}} ಸೆಕೆಂಡ್ ಹಿಂದೆ"
    }
  },
  halfAMinute: { other: {
      default: "ಅರ್ಧ ನಿಮಿಷ",
      future: "ಅರ್ಧ ನಿಮಿಷದಲ್ಲಿ",
      past: "ಅರ್ಧ ನಿಮಿಷದ ಹಿಂದೆ"
    } },
  lessThanXMinutes: {
    one: {
      default: "1 ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
      future: "1 ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
      past: "1 ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ"
    },
    other: {
      default: "{{count}} ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
      future: "{{count}} ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
      past: "{{count}} ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ"
    }
  },
  xMinutes: {
    one: {
      default: "1 ನಿಮಿಷ",
      future: "1 ನಿಮಿಷದಲ್ಲಿ",
      past: "1 ನಿಮಿಷದ ಹಿಂದೆ"
    },
    other: {
      default: "{{count}} ನಿಮಿಷಗಳು",
      future: "{{count}} ನಿಮಿಷಗಳಲ್ಲಿ",
      past: "{{count}} ನಿಮಿಷಗಳ ಹಿಂದೆ"
    }
  },
  aboutXHours: {
    one: {
      default: "ಸುಮಾರು 1 ಗಂಟೆ",
      future: "ಸುಮಾರು 1 ಗಂಟೆಯಲ್ಲಿ",
      past: "ಸುಮಾರು 1 ಗಂಟೆ ಹಿಂದೆ"
    },
    other: {
      default: "ಸುಮಾರು {{count}} ಗಂಟೆಗಳು",
      future: "ಸುಮಾರು {{count}} ಗಂಟೆಗಳಲ್ಲಿ",
      past: "ಸುಮಾರು {{count}} ಗಂಟೆಗಳ ಹಿಂದೆ"
    }
  },
  xHours: {
    one: {
      default: "1 ಗಂಟೆ",
      future: "1 ಗಂಟೆಯಲ್ಲಿ",
      past: "1 ಗಂಟೆ ಹಿಂದೆ"
    },
    other: {
      default: "{{count}} ಗಂಟೆಗಳು",
      future: "{{count}} ಗಂಟೆಗಳಲ್ಲಿ",
      past: "{{count}} ಗಂಟೆಗಳ ಹಿಂದೆ"
    }
  },
  xDays: {
    one: {
      default: "1 ದಿನ",
      future: "1 ದಿನದಲ್ಲಿ",
      past: "1 ದಿನದ ಹಿಂದೆ"
    },
    other: {
      default: "{{count}} ದಿನಗಳು",
      future: "{{count}} ದಿನಗಳಲ್ಲಿ",
      past: "{{count}} ದಿನಗಳ ಹಿಂದೆ"
    }
  },
  aboutXMonths: {
    one: {
      default: "ಸುಮಾರು 1 ತಿಂಗಳು",
      future: "ಸುಮಾರು 1 ತಿಂಗಳಲ್ಲಿ",
      past: "ಸುಮಾರು 1 ತಿಂಗಳ ಹಿಂದೆ"
    },
    other: {
      default: "ಸುಮಾರು {{count}} ತಿಂಗಳು",
      future: "ಸುಮಾರು {{count}} ತಿಂಗಳುಗಳಲ್ಲಿ",
      past: "ಸುಮಾರು {{count}} ತಿಂಗಳುಗಳ ಹಿಂದೆ"
    }
  },
  xMonths: {
    one: {
      default: "1 ತಿಂಗಳು",
      future: "1 ತಿಂಗಳಲ್ಲಿ",
      past: "1 ತಿಂಗಳ ಹಿಂದೆ"
    },
    other: {
      default: "{{count}} ತಿಂಗಳು",
      future: "{{count}} ತಿಂಗಳುಗಳಲ್ಲಿ",
      past: "{{count}} ತಿಂಗಳುಗಳ ಹಿಂದೆ"
    }
  },
  aboutXYears: {
    one: {
      default: "ಸುಮಾರು 1 ವರ್ಷ",
      future: "ಸುಮಾರು 1 ವರ್ಷದಲ್ಲಿ",
      past: "ಸುಮಾರು 1 ವರ್ಷದ ಹಿಂದೆ"
    },
    other: {
      default: "ಸುಮಾರು {{count}} ವರ್ಷಗಳು",
      future: "ಸುಮಾರು {{count}} ವರ್ಷಗಳಲ್ಲಿ",
      past: "ಸುಮಾರು {{count}} ವರ್ಷಗಳ ಹಿಂದೆ"
    }
  },
  xYears: {
    one: {
      default: "1 ವರ್ಷ",
      future: "1 ವರ್ಷದಲ್ಲಿ",
      past: "1 ವರ್ಷದ ಹಿಂದೆ"
    },
    other: {
      default: "{{count}} ವರ್ಷಗಳು",
      future: "{{count}} ವರ್ಷಗಳಲ್ಲಿ",
      past: "{{count}} ವರ್ಷಗಳ ಹಿಂದೆ"
    }
  },
  overXYears: {
    one: {
      default: "1 ವರ್ಷದ ಮೇಲೆ",
      future: "1 ವರ್ಷದ ಮೇಲೆ",
      past: "1 ವರ್ಷದ ಮೇಲೆ"
    },
    other: {
      default: "{{count}} ವರ್ಷಗಳ ಮೇಲೆ",
      future: "{{count}} ವರ್ಷಗಳ ಮೇಲೆ",
      past: "{{count}} ವರ್ಷಗಳ ಮೇಲೆ"
    }
  },
  almostXYears: {
    one: {
      default: "ಬಹುತೇಕ 1 ವರ್ಷದಲ್ಲಿ",
      future: "ಬಹುತೇಕ 1 ವರ್ಷದಲ್ಲಿ",
      past: "ಬಹುತೇಕ 1 ವರ್ಷದಲ್ಲಿ"
    },
    other: {
      default: "ಬಹುತೇಕ {{count}} ವರ್ಷಗಳಲ್ಲಿ",
      future: "ಬಹುತೇಕ {{count}} ವರ್ಷಗಳಲ್ಲಿ",
      past: "ಬಹುತೇಕ {{count}} ವರ್ಷಗಳಲ್ಲಿ"
    }
  }
};
function getResultByTense(parentToken, options) {
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return parentToken.future;else
  return parentToken.past;
  return parentToken.default;
}
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (tokenValue.one && count === 1) result = getResultByTense(tokenValue.one, options);else
  result = getResultByTense(tokenValue.other, options);
  return result.replace("{{count}}", String(count));
};
//#endregion
//#region dist/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args) {
  return function () {var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var width = options.width ? String(options.width) : args.defaultWidth;
    return args.formats[width] || args.formats[args.defaultWidth];
  };
}
var formatLong = {
  date: buildFormatLongFn({
    formats: {
      full: "EEEE, MMMM d, y",
      long: "MMMM d, y",
      medium: "MMM d, y",
      short: "d/M/yy"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "hh:mm:ss a zzzz",
      long: "hh:mm:ss a z",
      medium: "hh:mm:ss a",
      short: "hh:mm a"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} {{time}}",
      long: "{{date}} {{time}}",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/kn/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'ಕಳೆದ' eeee p 'ಕ್ಕೆ'",
  yesterday: "'ನಿನ್ನೆ' p 'ಕ್ಕೆ'",
  today: "'ಇಂದು' p 'ಕ್ಕೆ'",
  tomorrow: "'ನಾಳೆ' p 'ಕ್ಕೆ'",
  nextWeek: "eeee p 'ಕ್ಕೆ'",
  other: "P"
};
var formatRelative = function formatRelative(token, _date, _baseDate, _options) {return formatRelativeLocale[token];};
//#endregion
//#region dist/date-fns/locale/_lib/buildLocalizeFn.js
/**
* The localize function argument callback which allows to convert raw value to
* the actual type.
*
* @param value - The value to convert
*
* @returns The converted value
*/
/**
* The map of localized values for each width.
*/
/**
* The index type of the locale unit value. It types conversion of units of
* values that don't start at 0 (i.e. quarters).
*/
/**
* Converts the unit value to the tuple of values.
*/
/**
* The tuple of localized era values. The first element represents BC,
* the second element represents AD.
*/
/**
* The tuple of localized quarter values. The first element represents Q1.
*/
/**
* The tuple of localized day values. The first element represents Sunday.
*/
/**
* The tuple of localized month values. The first element represents January.
*/
function buildLocalizeFn(args) {
  return function (value, options) {
    var context = options !== null && options !== void 0 && options.context ? String(options.context) : "standalone";
    var valuesArray;
    if (context === "formatting" && args.formattingValues) {
      var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      var width = options !== null && options !== void 0 && options.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      var _defaultWidth = args.defaultWidth;
      var _width = options !== null && options !== void 0 && options.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[_width] || args.values[_defaultWidth];
    }
    var index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}
//#endregion
//#region dist/date-fns/locale/kn/_lib/localize.js
var eraValues = {
  narrow: ["ಕ್ರಿ.ಪೂ", "ಕ್ರಿ.ಶ"],
  abbreviated: ["ಕ್ರಿ.ಪೂ", "ಕ್ರಿ.ಶ"],
  wide: ["ಕ್ರಿಸ್ತ ಪೂರ್ವ", "ಕ್ರಿಸ್ತ ಶಕ"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "ತ್ರೈ 1",
  "ತ್ರೈ 2",
  "ತ್ರೈ 3",
  "ತ್ರೈ 4"],

  wide: [
  "1ನೇ ತ್ರೈಮಾಸಿಕ",
  "2ನೇ ತ್ರೈಮಾಸಿಕ",
  "3ನೇ ತ್ರೈಮಾಸಿಕ",
  "4ನೇ ತ್ರೈಮಾಸಿಕ"]

};
var monthValues = {
  narrow: [
  "ಜ",
  "ಫೆ",
  "ಮಾ",
  "ಏ",
  "ಮೇ",
  "ಜೂ",
  "ಜು",
  "ಆ",
  "ಸೆ",
  "ಅ",
  "ನ",
  "ಡಿ"],

  abbreviated: [
  "ಜನ",
  "ಫೆಬ್ರ",
  "ಮಾರ್ಚ್",
  "ಏಪ್ರಿ",
  "ಮೇ",
  "ಜೂನ್",
  "ಜುಲೈ",
  "ಆಗ",
  "ಸೆಪ್ಟೆಂ",
  "ಅಕ್ಟೋ",
  "ನವೆಂ",
  "ಡಿಸೆಂ"],

  wide: [
  "ಜನವರಿ",
  "ಫೆಬ್ರವರಿ",
  "ಮಾರ್ಚ್",
  "ಏಪ್ರಿಲ್",
  "ಮೇ",
  "ಜೂನ್",
  "ಜುಲೈ",
  "ಆಗಸ್ಟ್",
  "ಸೆಪ್ಟೆಂಬರ್",
  "ಅಕ್ಟೋಬರ್",
  "ನವೆಂಬರ್",
  "ಡಿಸೆಂಬರ್"]

};
var dayValues = {
  narrow: [
  "ಭಾ",
  "ಸೋ",
  "ಮಂ",
  "ಬು",
  "ಗು",
  "ಶು",
  "ಶ"],

  short: [
  "ಭಾನು",
  "ಸೋಮ",
  "ಮಂಗಳ",
  "ಬುಧ",
  "ಗುರು",
  "ಶುಕ್ರ",
  "ಶನಿ"],

  abbreviated: [
  "ಭಾನು",
  "ಸೋಮ",
  "ಮಂಗಳ",
  "ಬುಧ",
  "ಗುರು",
  "ಶುಕ್ರ",
  "ಶನಿ"],

  wide: [
  "ಭಾನುವಾರ",
  "ಸೋಮವಾರ",
  "ಮಂಗಳವಾರ",
  "ಬುಧವಾರ",
  "ಗುರುವಾರ",
  "ಶುಕ್ರವಾರ",
  "ಶನಿವಾರ"]

};
var dayPeriodValues = {
  narrow: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾಹ್ನ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾಹ್ನ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ"
  },
  abbreviated: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ"
  },
  wide: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "ಪೂ",
    pm: "ಅ",
    midnight: "ಮಧ್ಯರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ"
  },
  abbreviated: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯ ರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ"
  },
  wide: {
    am: "ಪೂರ್ವಾಹ್ನ",
    pm: "ಅಪರಾಹ್ನ",
    midnight: "ಮಧ್ಯ ರಾತ್ರಿ",
    noon: "ಮಧ್ಯಾನ್ಹ",
    morning: "ಬೆಳಗ್ಗೆ",
    afternoon: "ಮಧ್ಯಾನ್ಹ",
    evening: "ಸಂಜೆ",
    night: "ರಾತ್ರಿ"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return Number(dirtyNumber) + "ನೇ";
};
var localize = {
  ordinalNumber: ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: function argumentCallback(quarter) {return quarter - 1;}
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};
//#endregion
//#region dist/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args) {
  return function (string) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var width = options.width;
    var matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    var matchResult = string.match(matchPattern);
    if (!matchResult) return null;
    var matchedString = matchResult[0];
    var parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    var key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, function (pattern) {return pattern.test(matchedString);}) : findKey(parsePatterns, function (pattern) {return pattern.test(matchedString);});
    var value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? options.valueCallback(value) : value;
    var rest = string.slice(matchedString.length);
    return {
      value: value,
      rest: rest
    };
  };
}
function findKey(object, predicate) {
  for (var key in object) if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) return key;
}
function findIndex(array, predicate) {
  for (var key = 0; key < array.length; key++) if (predicate(array[key])) return key;
}
//#endregion
//#region dist/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args) {
  return function (string) {var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    var matchedString = matchResult[0];
    var parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    var value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    var rest = string.slice(matchedString.length);
    return {
      value: value,
      rest: rest
    };
  };
}
//#endregion
//#region dist/date-fns/locale/kn.js
/**
* @category Locales
* @summary Kannada locale (India).
* @language Kannada
* @iso-639-2 kan
* @author Manjunatha Gouli [@developergouli](https://github.com/developergouli)
*/
var kn = {
  code: "kn",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(ನೇ|ನೆ)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(ಕ್ರಿ.ಪೂ|ಕ್ರಿ.ಶ)/i,
        abbreviated: /^(ಕ್ರಿ\.?\s?ಪೂ\.?|ಕ್ರಿ\.?\s?ಶ\.?|ಪ್ರ\.?\s?ಶ\.?)/i,
        wide: /^(ಕ್ರಿಸ್ತ ಪೂರ್ವ|ಕ್ರಿಸ್ತ ಶಕ|ಪ್ರಸಕ್ತ ಶಕ)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^ಪೂ/i, /^(ಶ|ಪ್ರ)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^ತ್ರೈ[1234]|ತ್ರೈ [1234]| [1234]ತ್ರೈ/i,
        wide: /^[1234](ನೇ)? ತ್ರೈಮಾಸಿಕ/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /1/i,
        /2/i,
        /3/i,
        /4/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^(ಜೂ|ಜು|ಜ|ಫೆ|ಮಾ|ಏ|ಮೇ|ಆ|ಸೆ|ಅ|ನ|ಡಿ)/i,
        abbreviated: /^(ಜನ|ಫೆಬ್ರ|ಮಾರ್ಚ್|ಏಪ್ರಿ|ಮೇ|ಜೂನ್|ಜುಲೈ|ಆಗ|ಸೆಪ್ಟೆಂ|ಅಕ್ಟೋ|ನವೆಂ|ಡಿಸೆಂ)/i,
        wide: /^(ಜನವರಿ|ಫೆಬ್ರವರಿ|ಮಾರ್ಚ್|ಏಪ್ರಿಲ್|ಮೇ|ಜೂನ್|ಜುಲೈ|ಆಗಸ್ಟ್|ಸೆಪ್ಟೆಂಬರ್|ಅಕ್ಟೋಬರ್|ನವೆಂಬರ್|ಡಿಸೆಂಬರ್)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ಜ$/i,
        /^ಫೆ/i,
        /^ಮಾ/i,
        /^ಏ/i,
        /^ಮೇ/i,
        /^ಜೂ/i,
        /^ಜು$/i,
        /^ಆ/i,
        /^ಸೆ/i,
        /^ಅ/i,
        /^ನ/i,
        /^ಡಿ/i],

        any: [
        /^ಜನ/i,
        /^ಫೆ/i,
        /^ಮಾ/i,
        /^ಏ/i,
        /^ಮೇ/i,
        /^ಜೂನ್/i,
        /^ಜುಲೈ/i,
        /^ಆ/i,
        /^ಸೆ/i,
        /^ಅ/i,
        /^ನ/i,
        /^ಡಿ/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(ಭಾ|ಸೋ|ಮ|ಬು|ಗು|ಶು|ಶ)/i,
        short: /^(ಭಾನು|ಸೋಮ|ಮಂಗಳ|ಬುಧ|ಗುರು|ಶುಕ್ರ|ಶನಿ)/i,
        abbreviated: /^(ಭಾನು|ಸೋಮ|ಮಂಗಳ|ಬುಧ|ಗುರು|ಶುಕ್ರ|ಶನಿ)/i,
        wide: /^(ಭಾನುವಾರ|ಸೋಮವಾರ|ಮಂಗಳವಾರ|ಬುಧವಾರ|ಗುರುವಾರ|ಶುಕ್ರವಾರ|ಶನಿವಾರ)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ಭಾ/i,
        /^ಸೋ/i,
        /^ಮ/i,
        /^ಬು/i,
        /^ಗು/i,
        /^ಶು/i,
        /^ಶ/i],

        any: [
        /^ಭಾ/i,
        /^ಸೋ/i,
        /^ಮ/i,
        /^ಬು/i,
        /^ಗು/i,
        /^ಶು/i,
        /^ಶ/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(ಪೂ|ಅ|ಮಧ್ಯರಾತ್ರಿ|ಮಧ್ಯಾನ್ಹ|ಬೆಳಗ್ಗೆ|ಸಂಜೆ|ರಾತ್ರಿ)/i,
        any: /^(ಪೂರ್ವಾಹ್ನ|ಅಪರಾಹ್ನ|ಮಧ್ಯರಾತ್ರಿ|ಮಧ್ಯಾನ್ಹ|ಬೆಳಗ್ಗೆ|ಸಂಜೆ|ರಾತ್ರಿ)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^ಪೂ/i,
          pm: /^ಅ/i,
          midnight: /ಮಧ್ಯರಾತ್ರಿ/i,
          noon: /ಮಧ್ಯಾನ್ಹ/i,
          morning: /ಬೆಳಗ್ಗೆ/i,
          afternoon: /ಮಧ್ಯಾನ್ಹ/i,
          evening: /ಸಂಜೆ/i,
          night: /ರಾತ್ರಿ/i
        } },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 1
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/kn/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    kn: kn }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();
(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/ta/_lib/formatDistance.js
function isPluralType(val) {
  return val.one !== void 0;
}
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: {
      default: "ஒரு வினாடிக்கு குறைவாக",
      in: "ஒரு வினாடிக்குள்",
      ago: "ஒரு வினாடிக்கு முன்பு"
    },
    other: {
      default: "{{count}} வினாடிகளுக்கு குறைவாக",
      in: "{{count}} வினாடிகளுக்குள்",
      ago: "{{count}} வினாடிகளுக்கு முன்பு"
    }
  },
  xSeconds: {
    one: {
      default: "1 வினாடி",
      in: "1 வினாடியில்",
      ago: "1 வினாடி முன்பு"
    },
    other: {
      default: "{{count}} விநாடிகள்",
      in: "{{count}} வினாடிகளில்",
      ago: "{{count}} விநாடிகளுக்கு முன்பு"
    }
  },
  halfAMinute: {
    default: "அரை நிமிடம்",
    in: "அரை நிமிடத்தில்",
    ago: "அரை நிமிடம் முன்பு"
  },
  lessThanXMinutes: {
    one: {
      default: "ஒரு நிமிடத்திற்கும் குறைவாக",
      in: "ஒரு நிமிடத்திற்குள்",
      ago: "ஒரு நிமிடத்திற்கு முன்பு"
    },
    other: {
      default: "{{count}} நிமிடங்களுக்கும் குறைவாக",
      in: "{{count}} நிமிடங்களுக்குள்",
      ago: "{{count}} நிமிடங்களுக்கு முன்பு"
    }
  },
  xMinutes: {
    one: {
      default: "1 நிமிடம்",
      in: "1 நிமிடத்தில்",
      ago: "1 நிமிடம் முன்பு"
    },
    other: {
      default: "{{count}} நிமிடங்கள்",
      in: "{{count}} நிமிடங்களில்",
      ago: "{{count}} நிமிடங்களுக்கு முன்பு"
    }
  },
  aboutXHours: {
    one: {
      default: "சுமார் 1 மணி நேரம்",
      in: "சுமார் 1 மணி நேரத்தில்",
      ago: "சுமார் 1 மணி நேரத்திற்கு முன்பு"
    },
    other: {
      default: "சுமார் {{count}} மணி நேரம்",
      in: "சுமார் {{count}} மணி நேரத்திற்கு முன்பு",
      ago: "சுமார் {{count}} மணி நேரத்தில்"
    }
  },
  xHours: {
    one: {
      default: "1 மணி நேரம்",
      in: "1 மணி நேரத்தில்",
      ago: "1 மணி நேரத்திற்கு முன்பு"
    },
    other: {
      default: "{{count}} மணி நேரம்",
      in: "{{count}} மணி நேரத்தில்",
      ago: "{{count}} மணி நேரத்திற்கு முன்பு"
    }
  },
  xDays: {
    one: {
      default: "1 நாள்",
      in: "1 நாளில்",
      ago: "1 நாள் முன்பு"
    },
    other: {
      default: "{{count}} நாட்கள்",
      in: "{{count}} நாட்களில்",
      ago: "{{count}} நாட்களுக்கு முன்பு"
    }
  },
  aboutXWeeks: {
    one: {
      default: "சுமார் 1 வாரம்",
      in: "சுமார் 1 வாரத்தில்",
      ago: "சுமார் 1 வாரம் முன்பு"
    },
    other: {
      default: "சுமார் {{count}} வாரங்கள்",
      in: "சுமார் {{count}} வாரங்களில்",
      ago: "சுமார் {{count}} வாரங்களுக்கு முன்பு"
    }
  },
  xWeeks: {
    one: {
      default: "1 வாரம்",
      in: "1 வாரத்தில்",
      ago: "1 வாரம் முன்பு"
    },
    other: {
      default: "{{count}} வாரங்கள்",
      in: "{{count}} வாரங்களில்",
      ago: "{{count}} வாரங்களுக்கு முன்பு"
    }
  },
  aboutXMonths: {
    one: {
      default: "சுமார் 1 மாதம்",
      in: "சுமார் 1 மாதத்தில்",
      ago: "சுமார் 1 மாதத்திற்கு முன்பு"
    },
    other: {
      default: "சுமார் {{count}} மாதங்கள்",
      in: "சுமார் {{count}} மாதங்களில்",
      ago: "சுமார் {{count}} மாதங்களுக்கு முன்பு"
    }
  },
  xMonths: {
    one: {
      default: "1 மாதம்",
      in: "1 மாதத்தில்",
      ago: "1 மாதம் முன்பு"
    },
    other: {
      default: "{{count}} மாதங்கள்",
      in: "{{count}} மாதங்களில்",
      ago: "{{count}} மாதங்களுக்கு முன்பு"
    }
  },
  aboutXYears: {
    one: {
      default: "சுமார் 1 வருடம்",
      in: "சுமார் 1 ஆண்டில்",
      ago: "சுமார் 1 வருடம் முன்பு"
    },
    other: {
      default: "சுமார் {{count}} ஆண்டுகள்",
      in: "சுமார் {{count}} ஆண்டுகளில்",
      ago: "சுமார் {{count}} ஆண்டுகளுக்கு முன்பு"
    }
  },
  xYears: {
    one: {
      default: "1 வருடம்",
      in: "1 ஆண்டில்",
      ago: "1 வருடம் முன்பு"
    },
    other: {
      default: "{{count}} ஆண்டுகள்",
      in: "{{count}} ஆண்டுகளில்",
      ago: "{{count}} ஆண்டுகளுக்கு முன்பு"
    }
  },
  overXYears: {
    one: {
      default: "1 வருடத்திற்கு மேல்",
      in: "1 வருடத்திற்கும் மேலாக",
      ago: "1 வருடம் முன்பு"
    },
    other: {
      default: "{{count}} ஆண்டுகளுக்கும் மேலாக",
      in: "{{count}} ஆண்டுகளில்",
      ago: "{{count}} ஆண்டுகளுக்கு முன்பு"
    }
  },
  almostXYears: {
    one: {
      default: "கிட்டத்தட்ட 1 வருடம்",
      in: "கிட்டத்தட்ட 1 ஆண்டில்",
      ago: "கிட்டத்தட்ட 1 வருடம் முன்பு"
    },
    other: {
      default: "கிட்டத்தட்ட {{count}} ஆண்டுகள்",
      in: "கிட்டத்தட்ட {{count}} ஆண்டுகளில்",
      ago: "கிட்டத்தட்ட {{count}} ஆண்டுகளுக்கு முன்பு"
    }
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var tense = options !== null && options !== void 0 && options.addSuffix ? options.comparison && options.comparison > 0 ? "in" : "ago" : "default";
  var tokenValue = formatDistanceLocale[token];
  if (!isPluralType(tokenValue)) return tokenValue[tense];
  if (count === 1) return tokenValue.one[tense];else
  return tokenValue.other[tense].replace("{{count}}", String(count));
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
      full: "EEEE, d MMMM, y",
      long: "d MMMM, y",
      medium: "d MMM, y",
      short: "d/M/yy"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "a h:mm:ss zzzz",
      long: "a h:mm:ss z",
      medium: "a h:mm:ss",
      short: "a h:mm"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} {{time}}",
      long: "{{date}} {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/ta/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'கடந்த' eeee p 'மணிக்கு'",
  yesterday: "'நேற்று ' p 'மணிக்கு'",
  today: "'இன்று ' p 'மணிக்கு'",
  tomorrow: "'நாளை ' p 'மணிக்கு'",
  nextWeek: "eeee p 'மணிக்கு'",
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
//#region dist/date-fns/locale/ta/_lib/localize.js
var eraValues = {
  narrow: ["கி.மு.", "கி.பி."],
  abbreviated: ["கி.மு.", "கி.பி."],
  wide: ["கிறிஸ்துவுக்கு முன்", "அன்னோ டோமினி"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "காலா.1",
  "காலா.2",
  "காலா.3",
  "காலா.4"],

  wide: [
  "ஒன்றாம் காலாண்டு",
  "இரண்டாம் காலாண்டு",
  "மூன்றாம் காலாண்டு",
  "நான்காம் காலாண்டு"]

};
var monthValues = {
  narrow: [
  "ஜ",
  "பி",
  "மா",
  "ஏ",
  "மே",
  "ஜூ",
  "ஜூ",
  "ஆ",
  "செ",
  "அ",
  "ந",
  "டி"],

  abbreviated: [
  "ஜன.",
  "பிப்.",
  "மார்.",
  "ஏப்.",
  "மே",
  "ஜூன்",
  "ஜூலை",
  "ஆக.",
  "செப்.",
  "அக்.",
  "நவ.",
  "டிச."],

  wide: [
  "ஜனவரி",
  "பிப்ரவரி",
  "மார்ச்",
  "ஏப்ரல்",
  "மே",
  "ஜூன்",
  "ஜூலை",
  "ஆகஸ்ட்",
  "செப்டம்பர்",
  "அக்டோபர்",
  "நவம்பர்",
  "டிசம்பர்"]

};
var dayValues = {
  narrow: [
  "ஞா",
  "தி",
  "செ",
  "பு",
  "வி",
  "வெ",
  "ச"],

  short: [
  "ஞா",
  "தி",
  "செ",
  "பு",
  "வி",
  "வெ",
  "ச"],

  abbreviated: [
  "ஞாயி.",
  "திங்.",
  "செவ்.",
  "புத.",
  "வியா.",
  "வெள்.",
  "சனி"],

  wide: [
  "ஞாயிறு",
  "திங்கள்",
  "செவ்வாய்",
  "புதன்",
  "வியாழன்",
  "வெள்ளி",
  "சனி"]

};
var dayPeriodValues = {
  narrow: {
    am: "மு.ப",
    pm: "பி.ப",
    midnight: "நள்.",
    noon: "நண்.",
    morning: "கா.",
    afternoon: "மதி.",
    evening: "மா.",
    night: "இர."
  },
  abbreviated: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு"
  },
  wide: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "மு.ப",
    pm: "பி.ப",
    midnight: "நள்.",
    noon: "நண்.",
    morning: "கா.",
    afternoon: "மதி.",
    evening: "மா.",
    night: "இர."
  },
  abbreviated: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு"
  },
  wide: {
    am: "முற்பகல்",
    pm: "பிற்பகல்",
    midnight: "நள்ளிரவு",
    noon: "நண்பகல்",
    morning: "காலை",
    afternoon: "மதியம்",
    evening: "மாலை",
    night: "இரவு"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return String(dirtyNumber);
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
//#region dist/date-fns/locale/ta.js
/**
* @category Locales
* @summary Tamil locale (India).
* @language Tamil
* @iso-639-2 tam
* @author Sibiraj [@sibiraj-s](https://github.com/sibiraj-s)
*/
var ta = {
  code: "ta",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(வது)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(கி.மு.|கி.பி.)/i,
        abbreviated: /^(கி\.?\s?மு\.?|கி\.?\s?பி\.?)/,
        wide: /^(கிறிஸ்துவுக்கு\sமுன்|அன்னோ\sடோமினி)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/கி\.?\s?மு\.?/, /கி\.?\s?பி\.?/] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^காலா.[1234]/i,
        wide: /^(ஒன்றாம்|இரண்டாம்|மூன்றாம்|நான்காம்) காலாண்டு/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /1/i,
        /2/i,
        /3/i,
        /4/i],

        any: [
        /(1|காலா.1|ஒன்றாம்)/i,
        /(2|காலா.2|இரண்டாம்)/i,
        /(3|காலா.3|மூன்றாம்)/i,
        /(4|காலா.4|நான்காம்)/i]

      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^(ஜ|பி|மா|ஏ|மே|ஜூ|ஆ|செ|அ|ந|டி)$/i,
        abbreviated: /^(ஜன.|பிப்.|மார்.|ஏப்.|மே|ஜூன்|ஜூலை|ஆக.|செப்.|அக்.|நவ.|டிச.)/i,
        wide: /^(ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ஜ$/i,
        /^பி/i,
        /^மா/i,
        /^ஏ/i,
        /^மே/i,
        /^ஜூ/i,
        /^ஜூ/i,
        /^ஆ/i,
        /^செ/i,
        /^அ/i,
        /^ந/i,
        /^டி/i],

        any: [
        /^ஜன/i,
        /^பி/i,
        /^மா/i,
        /^ஏ/i,
        /^மே/i,
        /^ஜூன்/i,
        /^ஜூலை/i,
        /^ஆ/i,
        /^செ/i,
        /^அ/i,
        /^ந/i,
        /^டி/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(ஞா|தி|செ|பு|வி|வெ|ச)/i,
        short: /^(ஞா|தி|செ|பு|வி|வெ|ச)/i,
        abbreviated: /^(ஞாயி.|திங்.|செவ்.|புத.|வியா.|வெள்.|சனி)/i,
        wide: /^(ஞாயிறு|திங்கள்|செவ்வாய்|புதன்|வியாழன்|வெள்ளி|சனி)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ஞா/i,
        /^தி/i,
        /^செ/i,
        /^பு/i,
        /^வி/i,
        /^வெ/i,
        /^ச/i],

        any: [
        /^ஞா/i,
        /^தி/i,
        /^செ/i,
        /^பு/i,
        /^வி/i,
        /^வெ/i,
        /^ச/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(மு.ப|பி.ப|நள்|நண்|காலை|மதியம்|மாலை|இரவு)/i,
        any: /^(மு.ப|பி.ப|முற்பகல்|பிற்பகல்|நள்ளிரவு|நண்பகல்|காலை|மதியம்|மாலை|இரவு)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^மு/i,
          pm: /^பி/i,
          midnight: /^நள்/i,
          noon: /^நண்/i,
          morning: /காலை/i,
          afternoon: /மதியம்/i,
          evening: /மாலை/i,
          night: /இரவு/i
        } },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/ta/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    ta: ta }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();
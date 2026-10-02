(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/te/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    standalone: {
      one: "సెకను కన్నా తక్కువ",
      other: "{{count}} సెకన్ల కన్నా తక్కువ"
    },
    withPreposition: {
      one: "సెకను",
      other: "{{count}} సెకన్ల"
    }
  },
  xSeconds: {
    standalone: {
      one: "ఒక సెకను",
      other: "{{count}} సెకన్ల"
    },
    withPreposition: {
      one: "ఒక సెకను",
      other: "{{count}} సెకన్ల"
    }
  },
  halfAMinute: {
    standalone: "అర నిమిషం",
    withPreposition: "అర నిమిషం"
  },
  lessThanXMinutes: {
    standalone: {
      one: "ఒక నిమిషం కన్నా తక్కువ",
      other: "{{count}} నిమిషాల కన్నా తక్కువ"
    },
    withPreposition: {
      one: "ఒక నిమిషం",
      other: "{{count}} నిమిషాల"
    }
  },
  xMinutes: {
    standalone: {
      one: "ఒక నిమిషం",
      other: "{{count}} నిమిషాలు"
    },
    withPreposition: {
      one: "ఒక నిమిషం",
      other: "{{count}} నిమిషాల"
    }
  },
  aboutXHours: {
    standalone: {
      one: "సుమారు ఒక గంట",
      other: "సుమారు {{count}} గంటలు"
    },
    withPreposition: {
      one: "సుమారు ఒక గంట",
      other: "సుమారు {{count}} గంటల"
    }
  },
  xHours: {
    standalone: {
      one: "ఒక గంట",
      other: "{{count}} గంటలు"
    },
    withPreposition: {
      one: "ఒక గంట",
      other: "{{count}} గంటల"
    }
  },
  xDays: {
    standalone: {
      one: "ఒక రోజు",
      other: "{{count}} రోజులు"
    },
    withPreposition: {
      one: "ఒక రోజు",
      other: "{{count}} రోజుల"
    }
  },
  aboutXWeeks: {
    standalone: {
      one: "సుమారు ఒక వారం",
      other: "సుమారు {{count}} వారాలు"
    },
    withPreposition: {
      one: "సుమారు ఒక వారం",
      other: "సుమారు {{count}} వారాలల"
    }
  },
  xWeeks: {
    standalone: {
      one: "ఒక వారం",
      other: "{{count}} వారాలు"
    },
    withPreposition: {
      one: "ఒక వారం",
      other: "{{count}} వారాలల"
    }
  },
  aboutXMonths: {
    standalone: {
      one: "సుమారు ఒక నెల",
      other: "సుమారు {{count}} నెలలు"
    },
    withPreposition: {
      one: "సుమారు ఒక నెల",
      other: "సుమారు {{count}} నెలల"
    }
  },
  xMonths: {
    standalone: {
      one: "ఒక నెల",
      other: "{{count}} నెలలు"
    },
    withPreposition: {
      one: "ఒక నెల",
      other: "{{count}} నెలల"
    }
  },
  aboutXYears: {
    standalone: {
      one: "సుమారు ఒక సంవత్సరం",
      other: "సుమారు {{count}} సంవత్సరాలు"
    },
    withPreposition: {
      one: "సుమారు ఒక సంవత్సరం",
      other: "సుమారు {{count}} సంవత్సరాల"
    }
  },
  xYears: {
    standalone: {
      one: "ఒక సంవత్సరం",
      other: "{{count}} సంవత్సరాలు"
    },
    withPreposition: {
      one: "ఒక సంవత్సరం",
      other: "{{count}} సంవత్సరాల"
    }
  },
  overXYears: {
    standalone: {
      one: "ఒక సంవత్సరం పైగా",
      other: "{{count}} సంవత్సరాలకు పైగా"
    },
    withPreposition: {
      one: "ఒక సంవత్సరం",
      other: "{{count}} సంవత్సరాల"
    }
  },
  almostXYears: {
    standalone: {
      one: "దాదాపు ఒక సంవత్సరం",
      other: "దాదాపు {{count}} సంవత్సరాలు"
    },
    withPreposition: {
      one: "దాదాపు ఒక సంవత్సరం",
      other: "దాదాపు {{count}} సంవత్సరాల"
    }
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = options !== null && options !== void 0 && options.addSuffix ? formatDistanceLocale[token].withPreposition : formatDistanceLocale[token].standalone;
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + "లో";else
  return result + " క్రితం";
  return result;
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
      full: "d, MMMM y, EEEE",
      long: "d MMMM, y",
      medium: "d MMM, y",
      short: "dd-MM-yy"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "h:mm:ss a zzzz",
      long: "h:mm:ss a z",
      medium: "h:mm:ss a",
      short: "h:mm a"
    },
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: {
      full: "{{date}} {{time}}'కి'",
      long: "{{date}} {{time}}'కి'",
      medium: "{{date}} {{time}}",
      short: "{{date}} {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/te/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'గత' eeee p",
  yesterday: "'నిన్న' p",
  today: "'ఈ రోజు' p",
  tomorrow: "'రేపు' p",
  nextWeek: "'తదుపరి' eeee p",
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
//#region dist/date-fns/locale/te/_lib/localize.js
var eraValues = {
  narrow: ["క్రీ.పూ.", "క్రీ.శ."],
  abbreviated: ["క్రీ.పూ.", "క్రీ.శ."],
  wide: ["క్రీస్తు పూర్వం", "క్రీస్తుశకం"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "త్రై1",
  "త్రై2",
  "త్రై3",
  "త్రై4"],

  wide: [
  "1వ త్రైమాసికం",
  "2వ త్రైమాసికం",
  "3వ త్రైమాసికం",
  "4వ త్రైమాసికం"]

};
var monthValues = {
  narrow: [
  "జ",
  "ఫి",
  "మా",
  "ఏ",
  "మే",
  "జూ",
  "జు",
  "ఆ",
  "సె",
  "అ",
  "న",
  "డి"],

  abbreviated: [
  "జన",
  "ఫిబ్ర",
  "మార్చి",
  "ఏప్రి",
  "మే",
  "జూన్",
  "జులై",
  "ఆగ",
  "సెప్టెం",
  "అక్టో",
  "నవం",
  "డిసెం"],

  wide: [
  "జనవరి",
  "ఫిబ్రవరి",
  "మార్చి",
  "ఏప్రిల్",
  "మే",
  "జూన్",
  "జులై",
  "ఆగస్టు",
  "సెప్టెంబర్",
  "అక్టోబర్",
  "నవంబర్",
  "డిసెంబర్"]

};
var dayValues = {
  narrow: [
  "ఆ",
  "సో",
  "మ",
  "బు",
  "గు",
  "శు",
  "శ"],

  short: [
  "ఆది",
  "సోమ",
  "మంగళ",
  "బుధ",
  "గురు",
  "శుక్ర",
  "శని"],

  abbreviated: [
  "ఆది",
  "సోమ",
  "మంగళ",
  "బుధ",
  "గురు",
  "శుక్ర",
  "శని"],

  wide: [
  "ఆదివారం",
  "సోమవారం",
  "మంగళవారం",
  "బుధవారం",
  "గురువారం",
  "శుక్రవారం",
  "శనివారం"]

};
var dayPeriodValues = {
  narrow: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి"
  },
  abbreviated: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి"
  },
  wide: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి"
  },
  abbreviated: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి"
  },
  wide: {
    am: "పూర్వాహ్నం",
    pm: "అపరాహ్నం",
    midnight: "అర్ధరాత్రి",
    noon: "మిట్టమధ్యాహ్నం",
    morning: "ఉదయం",
    afternoon: "మధ్యాహ్నం",
    evening: "సాయంత్రం",
    night: "రాత్రి"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  return Number(dirtyNumber) + "వ";
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
//#region dist/date-fns/locale/te.js
/**
* @category Locales
* @summary Telugu locale
* @language Telugu
* @iso-639-2 tel
* @author Kranthi Lakum [@kranthilakum](https://github.com/kranthilakum)
*/
var te = {
  code: "te",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(వ)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(క్రీ\.పూ\.|క్రీ\.శ\.)/i,
        abbreviated: /^(క్రీ\.?\s?పూ\.?|ప్ర\.?\s?శ\.?\s?పూ\.?|క్రీ\.?\s?శ\.?|సా\.?\s?శ\.?)/i,
        wide: /^(క్రీస్తు పూర్వం|ప్రస్తుత శకానికి పూర్వం|క్రీస్తు శకం|ప్రస్తుత శకం)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^(పూ|శ)/i, /^సా/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^త్రై[1234]/i,
        wide: /^[1234](వ)? త్రైమాసికం/i
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
        narrow: /^(జూ|జు|జ|ఫి|మా|ఏ|మే|ఆ|సె|అ|న|డి)/i,
        abbreviated: /^(జన|ఫిబ్ర|మార్చి|ఏప్రి|మే|జూన్|జులై|ఆగ|సెప్|అక్టో|నవ|డిసె)/i,
        wide: /^(జనవరి|ఫిబ్రవరి|మార్చి|ఏప్రిల్|మే|జూన్|జులై|ఆగస్టు|సెప్టెంబర్|అక్టోబర్|నవంబర్|డిసెంబర్)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^జ/i,
        /^ఫి/i,
        /^మా/i,
        /^ఏ/i,
        /^మే/i,
        /^జూ/i,
        /^జు/i,
        /^ఆ/i,
        /^సె/i,
        /^అ/i,
        /^న/i,
        /^డి/i],

        any: [
        /^జన/i,
        /^ఫి/i,
        /^మా/i,
        /^ఏ/i,
        /^మే/i,
        /^జూన్/i,
        /^జులై/i,
        /^ఆగ/i,
        /^సె/i,
        /^అ/i,
        /^న/i,
        /^డి/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(ఆ|సో|మ|బు|గు|శు|శ)/i,
        short: /^(ఆది|సోమ|మం|బుధ|గురు|శుక్ర|శని)/i,
        abbreviated: /^(ఆది|సోమ|మం|బుధ|గురు|శుక్ర|శని)/i,
        wide: /^(ఆదివారం|సోమవారం|మంగళవారం|బుధవారం|గురువారం|శుక్రవారం|శనివారం)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^ఆ/i,
        /^సో/i,
        /^మ/i,
        /^బు/i,
        /^గు/i,
        /^శు/i,
        /^శ/i],

        any: [
        /^ఆది/i,
        /^సోమ/i,
        /^మం/i,
        /^బుధ/i,
        /^గురు/i,
        /^శుక్ర/i,
        /^శని/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(పూర్వాహ్నం|అపరాహ్నం|అర్ధరాత్రి|మిట్టమధ్యాహ్నం|ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి)/i,
        any: /^(పూర్వాహ్నం|అపరాహ్నం|అర్ధరాత్రి|మిట్టమధ్యాహ్నం|ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^పూర్వాహ్నం/i,
          pm: /^అపరాహ్నం/i,
          midnight: /^అర్ధ/i,
          noon: /^మిట్ట/i,
          morning: /ఉదయం/i,
          afternoon: /మధ్యాహ్నం/i,
          evening: /సాయంత్రం/i,
          night: /రాత్రి/i
        } },
      defaultParseWidth: "any"
    })
  },
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
//#endregion
//#region dist/date-fns/_entries/locale/te/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    te: te }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();
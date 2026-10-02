(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/mn/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "секунд хүрэхгүй",
    other: "{{count}} секунд хүрэхгүй"
  },
  xSeconds: {
    one: "1 секунд",
    other: "{{count}} секунд"
  },
  halfAMinute: "хагас минут",
  lessThanXMinutes: {
    one: "минут хүрэхгүй",
    other: "{{count}} минут хүрэхгүй"
  },
  xMinutes: {
    one: "1 минут",
    other: "{{count}} минут"
  },
  aboutXHours: {
    one: "ойролцоогоор 1 цаг",
    other: "ойролцоогоор {{count}} цаг"
  },
  xHours: {
    one: "1 цаг",
    other: "{{count}} цаг"
  },
  xDays: {
    one: "1 өдөр",
    other: "{{count}} өдөр"
  },
  aboutXWeeks: {
    one: "ойролцоогоор 1 долоо хоног",
    other: "ойролцоогоор {{count}} долоо хоног"
  },
  xWeeks: {
    one: "1 долоо хоног",
    other: "{{count}} долоо хоног"
  },
  aboutXMonths: {
    one: "ойролцоогоор 1 сар",
    other: "ойролцоогоор {{count}} сар"
  },
  xMonths: {
    one: "1 сар",
    other: "{{count}} сар"
  },
  aboutXYears: {
    one: "ойролцоогоор 1 жил",
    other: "ойролцоогоор {{count}} жил"
  },
  xYears: {
    one: "1 жил",
    other: "{{count}} жил"
  },
  overXYears: {
    one: "1 жил гаран",
    other: "{{count}} жил гаран"
  },
  almostXYears: {
    one: "бараг 1 жил",
    other: "бараг {{count}} жил"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) {
    /**
    * Append genitive case
    */
    var words = result.split(" ");
    var lastword = words.pop();
    result = words.join(" ");
    switch (lastword) {
      case "секунд":
        result += " секундийн";
        break;
      case "минут":
        result += " минутын";
        break;
      case "цаг":
        result += " цагийн";
        break;
      case "өдөр":
        result += " өдрийн";
        break;
      case "сар":
        result += " сарын";
        break;
      case "жил":
        result += " жилийн";
        break;
      case "хоног":
        result += " хоногийн";
        break;
      case "гаран":
        result += " гараны";
        break;
      case "хүрэхгүй":
        result += " хүрэхгүй хугацааны";
        break;
      default:result += lastword + "-н";
    }
    if (options.comparison && options.comparison > 0) return result + " дараа";else
    return result + " өмнө";
  }
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
      full: "y 'оны' MMMM'ын' d, EEEE 'гараг'",
      long: "y 'оны' MMMM'ын' d",
      medium: "y 'оны' MMM'ын' d",
      short: "y.MM.dd"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "H:mm:ss zzzz",
      long: "H:mm:ss z",
      medium: "H:mm:ss",
      short: "H:mm"
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
//#region dist/date-fns/locale/mn/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'өнгөрсөн' eeee 'гарагийн' p 'цагт'",
  yesterday: "'өчигдөр' p 'цагт'",
  today: "'өнөөдөр' p 'цагт'",
  tomorrow: "'маргааш' p 'цагт'",
  nextWeek: "'ирэх' eeee 'гарагийн' p 'цагт'",
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
//#region dist/date-fns/locale/mn/_lib/localize.js
var eraValues = {
  narrow: ["НТӨ", "НТ"],
  abbreviated: ["НТӨ", "НТ"],
  wide: ["нийтийн тооллын өмнөх", "нийтийн тооллын"]
};
var quarterValues = {
  narrow: [
  "I",
  "II",
  "III",
  "IV"],

  abbreviated: [
  "I улирал",
  "II улирал",
  "III улирал",
  "IV улирал"],

  wide: [
  "1-р улирал",
  "2-р улирал",
  "3-р улирал",
  "4-р улирал"]

};
var monthValues = {
  narrow: [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII"],

  abbreviated: [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар"],

  wide: [
  "Нэгдүгээр сар",
  "Хоёрдугаар сар",
  "Гуравдугаар сар",
  "Дөрөвдүгээр сар",
  "Тавдугаар сар",
  "Зургаадугаар сар",
  "Долоодугаар сар",
  "Наймдугаар сар",
  "Есдүгээр сар",
  "Аравдугаар сар",
  "Арваннэгдүгээр сар",
  "Арван хоёрдугаар сар"]

};
var formattingMonthValues = {
  narrow: [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII"],

  abbreviated: [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар"],

  wide: [
  "нэгдүгээр сар",
  "хоёрдугаар сар",
  "гуравдугаар сар",
  "дөрөвдүгээр сар",
  "тавдугаар сар",
  "зургаадугаар сар",
  "долоодугаар сар",
  "наймдугаар сар",
  "есдүгээр сар",
  "аравдугаар сар",
  "арваннэгдүгээр сар",
  "арван хоёрдугаар сар"]

};
var dayValues = {
  narrow: [
  "Н",
  "Д",
  "М",
  "Л",
  "П",
  "Б",
  "Б"],

  short: [
  "Ня",
  "Да",
  "Мя",
  "Лх",
  "Пү",
  "Ба",
  "Бя"],

  abbreviated: [
  "Ням",
  "Дав",
  "Мяг",
  "Лха",
  "Пүр",
  "Баа",
  "Бям"],

  wide: [
  "Ням",
  "Даваа",
  "Мягмар",
  "Лхагва",
  "Пүрэв",
  "Баасан",
  "Бямба"]

};
var formattingDayValues = {
  narrow: [
  "Н",
  "Д",
  "М",
  "Л",
  "П",
  "Б",
  "Б"],

  short: [
  "Ня",
  "Да",
  "Мя",
  "Лх",
  "Пү",
  "Ба",
  "Бя"],

  abbreviated: [
  "Ням",
  "Дав",
  "Мяг",
  "Лха",
  "Пүр",
  "Баа",
  "Бям"],

  wide: [
  "ням",
  "даваа",
  "мягмар",
  "лхагва",
  "пүрэв",
  "баасан",
  "бямба"]

};
var dayPeriodValues = {
  narrow: {
    am: "ү.ө.",
    pm: "ү.х.",
    midnight: "шөнө дунд",
    noon: "үд дунд",
    morning: "өглөө",
    afternoon: "өдөр",
    evening: "орой",
    night: "шөнө"
  },
  abbreviated: {
    am: "ү.ө.",
    pm: "ү.х.",
    midnight: "шөнө дунд",
    noon: "үд дунд",
    morning: "өглөө",
    afternoon: "өдөр",
    evening: "орой",
    night: "шөнө"
  },
  wide: {
    am: "ү.ө.",
    pm: "ү.х.",
    midnight: "шөнө дунд",
    noon: "үд дунд",
    morning: "өглөө",
    afternoon: "өдөр",
    evening: "орой",
    night: "шөнө"
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
    defaultWidth: "wide",
    formattingValues: formattingMonthValues,
    defaultFormattingWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide",
    formattingValues: formattingDayValues,
    defaultFormattingWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide"
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
//#region dist/date-fns/locale/mn.js
/**
* @category Locales
* @summary Mongolian locale.
* @language Mongolian
* @iso-639-2 mon
* @author Bilguun Ochirbat [@bilguun0203](https://github.com/bilguun0203)
*/
var mn = {
  code: "mn",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /\d+/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(нтө|нт)/i,
        abbreviated: /^(нтө|нт)/i,
        wide: /^(нийтийн тооллын өмнө|нийтийн тооллын)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^(нтө|нийтийн тооллын өмнө)/i, /^(нт|нийтийн тооллын)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^(iv|iii|ii|i)/i,
        abbreviated: /^(iv|iii|ii|i) улирал/i,
        wide: /^[1-4]-р улирал/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /^(i(\s|$)|1)/i,
        /^(ii(\s|$)|2)/i,
        /^(iii(\s|$)|3)/i,
        /^(iv(\s|$)|4)/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)/i,
        abbreviated: /^(1-р сар|2-р сар|3-р сар|4-р сар|5-р сар|6-р сар|7-р сар|8-р сар|9-р сар|10-р сар|11-р сар|12-р сар)/i,
        wide: /^(нэгдүгээр сар|хоёрдугаар сар|гуравдугаар сар|дөрөвдүгээр сар|тавдугаар сар|зургаадугаар сар|долоодугаар сар|наймдугаар сар|есдүгээр сар|аравдугаар сар|арван нэгдүгээр сар|арван хоёрдугаар сар)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^i$/i,
        /^ii$/i,
        /^iii$/i,
        /^iv$/i,
        /^v$/i,
        /^vi$/i,
        /^vii$/i,
        /^viii$/i,
        /^ix$/i,
        /^x$/i,
        /^xi$/i,
        /^xii$/i],

        any: [
        /^(1|нэгдүгээр)/i,
        /^(2|хоёрдугаар)/i,
        /^(3|гуравдугаар)/i,
        /^(4|дөрөвдүгээр)/i,
        /^(5|тавдугаар)/i,
        /^(6|зургаадугаар)/i,
        /^(7|долоодугаар)/i,
        /^(8|наймдугаар)/i,
        /^(9|есдүгээр)/i,
        /^(10|аравдугаар)/i,
        /^(11|арван нэгдүгээр)/i,
        /^(12|арван хоёрдугаар)/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[ндмлпбб]/i,
        short: /^(ня|да|мя|лх|пү|ба|бя)/i,
        abbreviated: /^(ням|дав|мяг|лха|пүр|баа|бям)/i,
        wide: /^(ням|даваа|мягмар|лхагва|пүрэв|баасан|бямба)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^н/i,
        /^д/i,
        /^м/i,
        /^л/i,
        /^п/i,
        /^б/i,
        /^б/i],

        any: [
        /^ня/i,
        /^да/i,
        /^мя/i,
        /^лх/i,
        /^пү/i,
        /^ба/i,
        /^бя/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(ү\.ө\.|ү\.х\.|шөнө дунд|үд дунд|өглөө|өдөр|орой|шөнө)/i,
        any: /^(ү\.ө\.|ү\.х\.|шөнө дунд|үд дунд|өглөө|өдөр|орой|шөнө)/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^ү\.ө\./i,
          pm: /^ү\.х\./i,
          midnight: /^шөнө дунд/i,
          noon: /^үд дунд/i,
          morning: /өглөө/i,
          afternoon: /өдөр/i,
          evening: /орой/i,
          night: /шөнө/i
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
//#region dist/date-fns/_entries/locale/mn/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    mn: mn }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();
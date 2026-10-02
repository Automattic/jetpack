(() => {
var _window$dateFns;function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);} //#region dist/date-fns/locale/vi/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "dưới 1 giây",
    other: "dưới {{count}} giây"
  },
  xSeconds: {
    one: "1 giây",
    other: "{{count}} giây"
  },
  halfAMinute: "nửa phút",
  lessThanXMinutes: {
    one: "dưới 1 phút",
    other: "dưới {{count}} phút"
  },
  xMinutes: {
    one: "1 phút",
    other: "{{count}} phút"
  },
  aboutXHours: {
    one: "khoảng 1 giờ",
    other: "khoảng {{count}} giờ"
  },
  xHours: {
    one: "1 giờ",
    other: "{{count}} giờ"
  },
  xDays: {
    one: "1 ngày",
    other: "{{count}} ngày"
  },
  aboutXWeeks: {
    one: "khoảng 1 tuần",
    other: "khoảng {{count}} tuần"
  },
  xWeeks: {
    one: "1 tuần",
    other: "{{count}} tuần"
  },
  aboutXMonths: {
    one: "khoảng 1 tháng",
    other: "khoảng {{count}} tháng"
  },
  xMonths: {
    one: "1 tháng",
    other: "{{count}} tháng"
  },
  aboutXYears: {
    one: "khoảng 1 năm",
    other: "khoảng {{count}} năm"
  },
  xYears: {
    one: "1 năm",
    other: "{{count}} năm"
  },
  overXYears: {
    one: "hơn 1 năm",
    other: "hơn {{count}} năm"
  },
  almostXYears: {
    one: "gần 1 năm",
    other: "gần {{count}} năm"
  }
};
var formatDistance = function formatDistance(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", String(count));
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return result + " nữa";else
  return result + " trước";
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
      full: "EEEE, 'ngày' d MMMM 'năm' y",
      long: "'ngày' d MMMM 'năm' y",
      medium: "d MMM 'năm' y",
      short: "dd/MM/y"
    },
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: {
      full: "HH:mm:ss zzzz",
      long: "HH:mm:ss z",
      medium: "HH:mm:ss",
      short: "HH:mm"
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
//#region dist/date-fns/locale/vi/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "eeee 'tuần trước vào lúc' p",
  yesterday: "'hôm qua vào lúc' p",
  today: "'hôm nay vào lúc' p",
  tomorrow: "'ngày mai vào lúc' p",
  nextWeek: "eeee 'tới vào lúc' p",
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
//#region dist/date-fns/locale/vi/_lib/localize.js
var eraValues = {
  narrow: ["TCN", "SCN"],
  abbreviated: ["trước CN", "sau CN"],
  wide: ["trước Công Nguyên", "sau Công Nguyên"]
};
var quarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "Q1",
  "Q2",
  "Q3",
  "Q4"],

  wide: [
  "Quý 1",
  "Quý 2",
  "Quý 3",
  "Quý 4"]

};
var formattingQuarterValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4"],

  abbreviated: [
  "Q1",
  "Q2",
  "Q3",
  "Q4"],

  wide: [
  "quý I",
  "quý II",
  "quý III",
  "quý IV"]

};
var monthValues = {
  narrow: [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12"],

  abbreviated: [
  "Thg 1",
  "Thg 2",
  "Thg 3",
  "Thg 4",
  "Thg 5",
  "Thg 6",
  "Thg 7",
  "Thg 8",
  "Thg 9",
  "Thg 10",
  "Thg 11",
  "Thg 12"],

  wide: [
  "Tháng Một",
  "Tháng Hai",
  "Tháng Ba",
  "Tháng Tư",
  "Tháng Năm",
  "Tháng Sáu",
  "Tháng Bảy",
  "Tháng Tám",
  "Tháng Chín",
  "Tháng Mười",
  "Tháng Mười Một",
  "Tháng Mười Hai"]

};
var formattingMonthValues = {
  narrow: [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12"],

  abbreviated: [
  "thg 1",
  "thg 2",
  "thg 3",
  "thg 4",
  "thg 5",
  "thg 6",
  "thg 7",
  "thg 8",
  "thg 9",
  "thg 10",
  "thg 11",
  "thg 12"],

  wide: [
  "tháng 01",
  "tháng 02",
  "tháng 03",
  "tháng 04",
  "tháng 05",
  "tháng 06",
  "tháng 07",
  "tháng 08",
  "tháng 09",
  "tháng 10",
  "tháng 11",
  "tháng 12"]

};
var dayValues = {
  narrow: [
  "CN",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7"],

  short: [
  "CN",
  "Th 2",
  "Th 3",
  "Th 4",
  "Th 5",
  "Th 6",
  "Th 7"],

  abbreviated: [
  "CN",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7"],

  wide: [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy"]

};
var dayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "nửa đêm",
    noon: "tr",
    morning: "sg",
    afternoon: "ch",
    evening: "tối",
    night: "đêm"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "nửa đêm",
    noon: "trưa",
    morning: "sáng",
    afternoon: "chiều",
    evening: "tối",
    night: "đêm"
  },
  wide: {
    am: "SA",
    pm: "CH",
    midnight: "nửa đêm",
    noon: "trưa",
    morning: "sáng",
    afternoon: "chiều",
    evening: "tối",
    night: "đêm"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "am",
    pm: "pm",
    midnight: "nửa đêm",
    noon: "tr",
    morning: "sg",
    afternoon: "ch",
    evening: "tối",
    night: "đêm"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "nửa đêm",
    noon: "trưa",
    morning: "sáng",
    afternoon: "chiều",
    evening: "tối",
    night: "đêm"
  },
  wide: {
    am: "SA",
    pm: "CH",
    midnight: "nửa đêm",
    noon: "giữa trưa",
    morning: "vào buổi sáng",
    afternoon: "vào buổi chiều",
    evening: "vào buổi tối",
    night: "vào ban đêm"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
  var number = Number(dirtyNumber);
  var unit = options === null || options === void 0 ? void 0 : options.unit;
  if (unit === "quarter") switch (number) {
    case 1:return "I";
    case 2:return "II";
    case 3:return "III";
    case 4:return "IV";
  } else
  if (unit === "day") switch (number) {
    case 1:return "thứ 2";
    case 2:return "thứ 3";
    case 3:return "thứ 4";
    case 4:return "thứ 5";
    case 5:return "thứ 6";
    case 6:return "thứ 7";
    case 7:return "chủ nhật";
  } else
  if (unit === "week") {if (number === 1) return "thứ nhất";else
    return "thứ " + number;} else
  if (unit === "dayOfYear") if (number === 1) return "đầu tiên";else
  return "thứ " + number;
  return String(number);
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
    formattingValues: formattingQuarterValues,
    defaultFormattingWidth: "wide",
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
//#region dist/date-fns/locale/vi.js
/**
* @category Locales
* @summary Vietnamese locale (Vietnam).
* @language Vietnamese
* @iso-639-2 vie
* @author Thanh Tran [@trongthanh](https://github.com/trongthanh)
* @author Leroy Hopson [@lihop](https://github.com/lihop)
*/
var vi = {
  code: "vi",
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(tcn|scn)/i,
        abbreviated: /^(trước CN|sau CN)/i,
        wide: /^(trước Công Nguyên|sau Công Nguyên)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^t/i, /^s/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^([1234]|i{1,3}v?)/i,
        abbreviated: /^q([1234]|i{1,3}v?)/i,
        wide: /^quý ([1234]|i{1,3}v?)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [
        /(1|i)$/i,
        /(2|ii)$/i,
        /(3|iii)$/i,
        /(4|iv)$/i]
      },
      defaultParseWidth: "any",
      valueCallback: function valueCallback(index) {return index + 1;}
    }),
    month: buildMatchFn({
      matchPatterns: {
        narrow: /^(0?[2-9]|10|11|12|0?1)/i,
        abbreviated: /^thg[ _]?(0?[1-9](?!\d)|10|11|12)/i,
        wide: /^tháng ?(Một|Hai|Ba|Tư|Năm|Sáu|Bảy|Tám|Chín|Mười|Mười ?Một|Mười ?Hai|0?[1-9](?!\d)|10|11|12)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /0?1$/i,
        /0?2/i,
        /3/,
        /4/,
        /5/,
        /6/,
        /7/,
        /8/,
        /9/,
        /10/,
        /11/,
        /12/],

        abbreviated: [
        /^thg[ _]?0?1(?!\d)/i,
        /^thg[ _]?0?2/i,
        /^thg[ _]?0?3/i,
        /^thg[ _]?0?4/i,
        /^thg[ _]?0?5/i,
        /^thg[ _]?0?6/i,
        /^thg[ _]?0?7/i,
        /^thg[ _]?0?8/i,
        /^thg[ _]?0?9/i,
        /^thg[ _]?10/i,
        /^thg[ _]?11/i,
        /^thg[ _]?12/i],

        wide: [
        /^tháng ?(Một|0?1(?!\d))/i,
        /^tháng ?(Hai|0?2)/i,
        /^tháng ?(Ba|0?3)/i,
        /^tháng ?(Tư|0?4)/i,
        /^tháng ?(Năm|0?5)/i,
        /^tháng ?(Sáu|0?6)/i,
        /^tháng ?(Bảy|0?7)/i,
        /^tháng ?(Tám|0?8)/i,
        /^tháng ?(Chín|0?9)/i,
        /^tháng ?(Mười|10)/i,
        /^tháng ?(Mười ?Một|11)/i,
        /^tháng ?(Mười ?Hai|12)/i]

      },
      defaultParseWidth: "wide"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^(CN|T2|T3|T4|T5|T6|T7)/i,
        short: /^(CN|Th ?2|Th ?3|Th ?4|Th ?5|Th ?6|Th ?7)/i,
        abbreviated: /^(CN|Th ?2|Th ?3|Th ?4|Th ?5|Th ?6|Th ?7)/i,
        wide: /^(Chủ ?Nhật|Chúa ?Nhật|thứ ?Hai|thứ ?Ba|thứ ?Tư|thứ ?Năm|thứ ?Sáu|thứ ?Bảy)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /CN/i,
        /2/i,
        /3/i,
        /4/i,
        /5/i,
        /6/i,
        /7/i],

        short: [
        /CN/i,
        /2/i,
        /3/i,
        /4/i,
        /5/i,
        /6/i,
        /7/i],

        abbreviated: [
        /CN/i,
        /2/i,
        /3/i,
        /4/i,
        /5/i,
        /6/i,
        /7/i],

        wide: [
        /(Chủ|Chúa) ?Nhật/i,
        /Hai/i,
        /Ba/i,
        /Tư/i,
        /Năm/i,
        /Sáu/i,
        /Bảy/i]

      },
      defaultParseWidth: "wide"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i,
        abbreviated: /^(am|pm|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i,
        wide: /^(ch[^i]*|sa|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: {
          am: /^(a|sa)/i,
          pm: /^(p|ch[^i]*)/i,
          midnight: /nửa đêm/i,
          noon: /trưa/i,
          morning: /sáng/i,
          afternoon: /chiều/i,
          evening: /tối/i,
          night: /^đêm/i
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
//#region dist/date-fns/_entries/locale/vi/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  locale: _objectSpread(_objectSpread({}, (_window$dateFns =
  window.dateFns) === null || _window$dateFns === void 0 ? void 0 : _window$dateFns.locale), {}, {
    vi: vi }) });


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();
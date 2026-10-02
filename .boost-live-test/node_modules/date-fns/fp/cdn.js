(() => {
function _createForOfIteratorHelper(r, e) {var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];if (!t) {if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {t && (r = t);var _n = 0,F = function F() {};return { s: F, n: function n() {return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] };}, e: function e(r) {throw r;}, f: F };}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}var o,a = !0,u = !1;return { s: function s() {t = t.call(r);}, n: function n() {var r = t.next();return a = r.done, r;}, e: function e(r) {u = !0, o = r;}, f: function f() {try {a || null == t.return || t.return();} finally {if (u) throw o;}} };}function _callSuper(t, o, e) {return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));}function _possibleConstructorReturn(t, e) {if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");return _assertThisInitialized(t);}function _assertThisInitialized(e) {if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e;}function _isNativeReflectConstruct() {try {var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));} catch (t) {}return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {return !!t;})();}function _getPrototypeOf(t) {return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {return t.__proto__ || Object.getPrototypeOf(t);}, _getPrototypeOf(t);}function _inherits(t, e) {if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e);}function _setPrototypeOf(t, e) {return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {return t.__proto__ = e, t;}, _setPrototypeOf(t, e);}function _classCallCheck(a, n) {if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");}function _defineProperties(e, r) {for (var t = 0; t < r.length; t++) {var o = r[t];o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);}}function _createClass(e, r, t) {return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e;}function _toArray(r) {return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest();}function _slicedToArray(r, e) {return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();}function _nonIterableRest() {throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _iterableToArrayLimit(r, l) {var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];if (null != t) {var e,n,i,u,a = [],f = !0,o = !1;try {if (i = (t = t.call(r)).next, 0 === l) {if (Object(t) !== t) return;f = !1;} else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);} catch (r) {o = !0, n = r;} finally {try {if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;} finally {if (o) throw n;}}return a;}}function _arrayWithHoles(r) {if (Array.isArray(r)) return r;}function ownKeys(e, r) {var t = Object.keys(e);if (Object.getOwnPropertySymbols) {var o = Object.getOwnPropertySymbols(e);r && (o = o.filter(function (r) {return Object.getOwnPropertyDescriptor(e, r).enumerable;})), t.push.apply(t, o);}return t;}function _objectSpread(e) {for (var r = 1; r < arguments.length; r++) {var t = null != arguments[r] ? arguments[r] : {};r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {_defineProperty(e, r, t[r]);}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));});}return e;}function _defineProperty(e, r, t) {return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e;}function _toPropertyKey(t) {var i = _toPrimitive(t, "string");return "symbol" == _typeof(i) ? i : i + "";}function _toPrimitive(t, r) {if ("object" != _typeof(t) || !t) return t;var e = t[Symbol.toPrimitive];if (void 0 !== e) {var i = e.call(t, r || "default");if ("object" != _typeof(i)) return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return ("string" === r ? String : Number)(t);}function _toConsumableArray(r) {return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();}function _nonIterableSpread() {throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(r, a) {if (r) {if ("string" == typeof r) return _arrayLikeToArray(r, a);var t = {}.toString.call(r).slice(8, -1);return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;}}function _iterableToArray(r) {if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);}function _arrayWithoutHoles(r) {if (Array.isArray(r)) return _arrayLikeToArray(r);}function _arrayLikeToArray(r, a) {(null == a || a > r.length) && (a = r.length);for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];return n;}function _typeof(o) {"@babel/helpers - typeof";return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {return typeof o;} : function (o) {return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;}, _typeof(o);} //#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = function __exportAll(all, no_symbols) {
  var target = {};
  for (var name in all) __defProp(target, name, {
    get: all[name],
    enumerable: true
  });
  if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
  return target;
};
//#endregion
//#region dist/date-fns/constants.js
/**
* @constant
* @name daysInYear
* @summary Days in 1 year.
*
* @description
* How many days in a year.
*
* One years equals 365.2425 days according to the formula:
*
* > Leap year occurs every 4 years, except for years that are divisible by 100 and not divisible by 400.
* > 1 mean year = (365+1/4-1/100+1/400) days = 365.2425 days
*/
var daysInYear = 365.2425;
-(Math.pow(10, 8) * 24 * 60 * 60 * 1e3);
/**
* @constant
* @name millisecondsInWeek
* @summary Milliseconds in 1 week.
*/
var millisecondsInWeek = 6048e5;
/**
* @constant
* @name millisecondsInDay
* @summary Milliseconds in 1 day.
*/
var millisecondsInDay = 864e5;
/**
* @constant
* @name millisecondsInMinute
* @summary Milliseconds in 1 minute
*/
var millisecondsInMinute = 6e4;
/**
* @constant
* @name millisecondsInHour
* @summary Milliseconds in 1 hour
*/
var millisecondsInHour = 36e5;
/**
* @constant
* @name millisecondsInSecond
* @summary Milliseconds in 1 second
*/
var millisecondsInSecond = 1e3;
/**
* @constant
* @name minutesInYear
* @summary Minutes in 1 year.
*/
var minutesInYear = 525600;
/**
* @constant
* @name minutesInMonth
* @summary Minutes in 1 month.
*/
var minutesInMonth = 43200;
/**
* @constant
* @name minutesInDay
* @summary Minutes in 1 day.
*/
var minutesInDay = 1440;
/**
* @constant
* @name secondsInHour
* @summary Seconds in 1 hour.
*/
var secondsInHour = 3600;
/**
* @constant
* @name constructFromSymbol
* @summary Symbol enabling Date extensions to inherit properties from the reference date.
*
* The symbol is used to enable the `constructFrom` function to construct a date
* using a reference date and a value. It allows to transfer extra properties
* from the reference date to the new date. It's useful for extensions like
* [`TZDate`](https://github.com/date-fns/tz) that accept a time zone as
* a constructor argument.
*/
var constructFromSymbol = Symbol.for("constructDateFrom");
//#endregion
//#region dist/date-fns/constructFrom.js
/**
* @name constructFrom
* @category Generic Helpers
* @summary Constructs a date using the reference date and the value
*
* @description
* The function constructs a new date using the constructor from the reference
* date and the given value. It helps to build generic functions that accept
* date extensions.
*
* It defaults to `Date` if the passed reference date is a number or a string.
*
* Starting from v3.7.0, it allows to construct a date using `[Symbol.for("constructDateFrom")]`
* enabling to transfer extra properties from the reference date to the new date.
* It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
* that accept a time zone as a constructor argument.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
*
* @param date - The reference date to take constructor from
* @param value - The value to create the date
*
* @returns Date initialized using the given date and value
*
* @example
* import { constructFrom } from "./constructFrom/date-fns";
*
* // A function that clones a date preserving the original type
* function cloneDate<DateType extends Date>(date: DateType): DateType {
*   return constructFrom(
*     date, // Use constructor from the given date
*     date.getTime() // Use the date value to create a new date
*   );
* }
*/
function constructFrom$1(date, value) {
  if (typeof date === "function") return date(value);
  if (date && _typeof(date) === "object" && constructFromSymbol in date) return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}
//#endregion
//#region dist/date-fns/toDate.js
/**
* @name toDate
* @category Common Helpers
* @summary Convert the given argument to an instance of Date.
*
* @description
* Convert the given argument to an instance of Date.
*
* If the argument is an instance of Date, the function returns its clone.
*
* If the argument is a number, it is treated as a timestamp.
*
* If the argument is none of the above, the function returns Invalid Date.
*
* Starting from v3.7.0, it clones a date using `[Symbol.for("constructDateFrom")]`
* enabling to transfer extra properties from the reference date to the new date.
* It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
* that accept a time zone as a constructor argument.
*
* **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param argument - The value to convert
*
* @returns The parsed date in the local time zone
*
* @example
* // Clone the date:
* const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
* //=> Tue Feb 11 2014 11:30:30
*
* @example
* // Convert the timestamp to date:
* const result = toDate(1392098430000)
* //=> Tue Feb 11 2014 11:30:30
*/
function toDate$1(argument, context) {
  return constructFrom$1(context || argument, argument);
}
//#endregion
//#region dist/date-fns/addDays.js
/**
* The {@link addDays} function options.
*/
/**
* @name addDays
* @category Day Helpers
* @summary Add the specified number of days to the given date.
*
* @description
* Add the specified number of days to the given date.
*
* **You don't need date-fns\***:
*
* Temporal has a built-in `add` method on all its classes:
*
* - [`Temporal.Instant.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Instant/add)
* - [`Temporal.PlainDate.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate/add)
* - [`Temporal.PlainDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDateTime/add)
* - [`Temporal.PlainTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime/add)
* - [`Temporal.PlainYearMonth.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainYearMonth/add)
* - [`Temporal.ZonedDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/add)
*
* \* **Not really**, see: https://date-fns.org/you-dont-need-date-fns
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of days to be added.
* @param options - An object with options
*
* @returns The new date with the days added
*
* @example
* // Add 10 days to 1 September 2014:
* const result = addDays(new Date(2014, 8, 1), 10)
* //=> Thu Sep 11 2014 00:00:00
*
* @example
* // Using Temporal:
* // Add 10 days to 1 September 2014:
* Temporal.PlainDate.from("2014-09-01").add({ days: 10 }).toString();
* //=> "2014-09-11"
*/
function addDays$1(date, amount, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (isNaN(amount)) return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, NaN);
  if (!amount) return _date;
  _date.setDate(_date.getDate() + amount);
  return _date;
}
//#endregion
//#region dist/date-fns/addMonths.js
/**
* The {@link addMonths} function options.
*/
/**
* @name addMonths
* @category Month Helpers
* @summary Add the specified number of months to the given date.
*
* @description
* Add the specified number of months to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of months to be added.
* @param options - The options object
*
* @returns The new date with the months added
*
* @example
* // Add 5 months to 1 September 2014:
* const result = addMonths(new Date(2014, 8, 1), 5)
* //=> Sun Feb 01 2015 00:00:00
*
* // Add one month to 30 January 2023:
* const result = addMonths(new Date(2023, 0, 30), 1)
* //=> Tue Feb 28 2023 00:00:00
*/
function addMonths$1(date, amount, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (isNaN(amount)) return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, NaN);
  if (!amount) return _date;
  var dayOfMonth = _date.getDate();
  var endOfDesiredMonth = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, _date.getTime());
  endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
  if (dayOfMonth >= endOfDesiredMonth.getDate()) return endOfDesiredMonth;else
  {
    _date.setFullYear(endOfDesiredMonth.getFullYear(), endOfDesiredMonth.getMonth(), dayOfMonth);
    return _date;
  }
}
//#endregion
//#region dist/date-fns/add.js
/**
* The {@link add} function options.
*/
/**
* @name add
* @category Common Helpers
* @summary Add the specified years, months, weeks, days, hours, minutes, and seconds to the given date.
*
* @description
* Add the specified years, months, weeks, days, hours, minutes, and seconds to the given date.
*
* **You don't need date-fns\***:
*
* Temporal has a built-in `add` method on all its classes:
*
* - [`Temporal.Instant.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Instant/add)
* - [`Temporal.PlainDate.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate/add)
* - [`Temporal.PlainDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDateTime/add)
* - [`Temporal.PlainTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime/add)
* - [`Temporal.PlainYearMonth.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainYearMonth/add)
* - [`Temporal.ZonedDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/add)
*
* \* **Not really**, see: https://date-fns.org/you-dont-need-date-fns
*
* @typeParam DateType - The `Date` type the function operates on. Gets inferred from passed arguments. Allows using extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param duration - The object with years, months, weeks, days, hours, minutes, and seconds to be added.
* @param options - An object with options
*
* @returns The new date with the seconds added
*
* @example
* // Add the following duration to 1 September 2014, 10:19:50
* const result = add(new Date(2014, 8, 1, 10, 19, 50), {
*   years: 2,
*   months: 9,
*   weeks: 1,
*   days: 7,
*   hours: 5,
*   minutes: 9,
*   seconds: 30,
* })
* //=> Thu Jun 15 2017 15:29:20
*
* @example
* // Using Temporal:
* // Add the following duration to 1 September 2014, 10:19:50
* Temporal.PlainDateTime.from("2014-09-01T10:19:50")
*   .add({
*     years: 2,
*     months: 9,
*     weeks: 1,
*     days: 7,
*     hours: 5,
*     minutes: 9,
*     seconds: 30,
*   })
*   .toString();
* //=> "2017-06-15T15:29:20"
*/
function add$1(date, duration, options) {
  var _duration$years = duration.years,years = _duration$years === void 0 ? 0 : _duration$years,_duration$months = duration.months,months = _duration$months === void 0 ? 0 : _duration$months,_duration$weeks = duration.weeks,weeks = _duration$weeks === void 0 ? 0 : _duration$weeks,_duration$days = duration.days,days = _duration$days === void 0 ? 0 : _duration$days,_duration$hours = duration.hours,hours = _duration$hours === void 0 ? 0 : _duration$hours,_duration$minutes = duration.minutes,minutes = _duration$minutes === void 0 ? 0 : _duration$minutes,_duration$seconds = duration.seconds,seconds = _duration$seconds === void 0 ? 0 : _duration$seconds;
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var dateWithMonths = months || years ? addMonths$1(_date, months + years * 12) : _date;
  var dateWithDays = days || weeks ? addDays$1(dateWithMonths, days + weeks * 7) : dateWithMonths;
  var msToAdd = (seconds + (minutes + hours * 60) * 60) * 1e3;
  return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, +dateWithDays + msToAdd);
}
//#endregion
//#region dist/date-fns/fp/_lib/convertToFP.js
/**
* Converts a function to a curried function that accepts arguments in reverse
* order.
*
* @param fn - The function to convert to FP
* @param arity - The arity of the function
* @param curriedArgs - The curried arguments
*
* @returns FP version of the function
*
* @private
*/
function convertToFP(fn, arity) {var curriedArgs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  return curriedArgs.length >= arity ? fn.apply(void 0, _toConsumableArray(curriedArgs.slice(0, arity).reverse())) : function () {for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}return convertToFP(fn, arity, curriedArgs.concat(args));};
}
//#endregion
//#region dist/date-fns/fp/add.js
var _add = convertToFP(add$1, 2);
//#endregion
//#region dist/date-fns/isSaturday.js
/**
* The {@link isSaturday} function options.
*/
/**
* @name isSaturday
* @category Weekday Helpers
* @summary Is the given date Saturday?
*
* @description
* Is the given date Saturday?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is Saturday
*
* @example
* // Is 27 September 2014 Saturday?
* const result = isSaturday(new Date(2014, 8, 27))
* //=> true
*/
function isSaturday$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay() === 6;
}
//#endregion
//#region dist/date-fns/isSunday.js
/**
* The {@link isSunday} function options.
*/
/**
* @name isSunday
* @category Weekday Helpers
* @summary Is the given date Sunday?
*
* @description
* Is the given date Sunday?
*
* @param date - The date to check
* @param options - The options object
*
* @returns The date is Sunday
*
* @example
* // Is 21 September 2014 Sunday?
* const result = isSunday(new Date(2014, 8, 21))
* //=> true
*/
function isSunday$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay() === 0;
}
//#endregion
//#region dist/date-fns/isWeekend.js
/**
* The {@link isWeekend} function options.
*/
/**
* @name isWeekend
* @category Weekday Helpers
* @summary Does the given date fall on a weekend?
*
* @description
* Does the given date fall on a weekend? A weekend is either Saturday (`6`) or Sunday (`0`).
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date falls on a weekend
*
* @example
* // Does 5 October 2014 fall on a weekend?
* const result = isWeekend(new Date(2014, 9, 5))
* //=> true
*/
function isWeekend$1(date, options) {
  var day = toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay();
  return day === 0 || day === 6;
}
//#endregion
//#region dist/date-fns/addBusinessDays.js
/**
* The {@link addBusinessDays} function options.
*/
/**
* @name addBusinessDays
* @category Day Helpers
* @summary Add the specified number of business days (mon - fri) to the given date.
*
* @description
* Add the specified number of business days (mon - fri) to the given date, ignoring weekends.
*
* **You don't need date-fns\***:
*
* Temporal doesn't have built-in business day arithmetic, so you still need date-fns for this.
*
* \* **Not really**, see: https://date-fns.org/you-dont-need-date-fns
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of business days to be added.
* @param options - An object with options
*
* @returns The new date with the business days added
*
* @example
* // Add 10 business days to 1 September 2014:
* const result = addBusinessDays(new Date(2014, 8, 1), 10)
* //=> Mon Sep 15 2014 00:00:00 (skipped weekend days)
*/
function addBusinessDays$1(date, amount, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var startedOnWeekend = isWeekend$1(_date, options);
  if (isNaN(amount)) return constructFrom$1(options === null || options === void 0 ? void 0 : options.in, NaN);
  var hours = _date.getHours();
  var sign = amount < 0 ? -1 : 1;
  var fullWeeks = Math.trunc(amount / 5);
  _date.setDate(_date.getDate() + fullWeeks * 7);
  var restDays = Math.abs(amount % 5);
  while (restDays > 0) {
    _date.setDate(_date.getDate() + sign);
    if (!isWeekend$1(_date, options)) restDays -= 1;
  }
  if (startedOnWeekend && isWeekend$1(_date, options) && amount !== 0) {
    if (isSaturday$1(_date, options)) _date.setDate(_date.getDate() + (sign < 0 ? 2 : -1));
    if (isSunday$1(_date, options)) _date.setDate(_date.getDate() + (sign < 0 ? 1 : -2));
  }
  _date.setHours(hours);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/addBusinessDays.js
var _addBusinessDays = convertToFP(addBusinessDays$1, 2);
//#endregion
//#region dist/date-fns/fp/addBusinessDaysWithOptions.js
var _addBusinessDaysWithOptions = convertToFP(addBusinessDays$1, 3);
//#endregion
//#region dist/date-fns/fp/addDays.js
var _addDays = convertToFP(addDays$1, 2);
//#endregion
//#region dist/date-fns/fp/addDaysWithOptions.js
var _addDaysWithOptions = convertToFP(addDays$1, 3);
//#endregion
//#region dist/date-fns/addMilliseconds.js
/**
* The {@link addMilliseconds} function options.
*/
/**
* @name addMilliseconds
* @category Millisecond Helpers
* @summary Add the specified number of milliseconds to the given date.
*
* @description
* Add the specified number of milliseconds to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of milliseconds to be added.
* @param options - The options object
*
* @returns The new date with the milliseconds added
*
* @example
* // Add 750 milliseconds to 10 July 2014 12:45:30.000:
* const result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
* //=> Thu Jul 10 2014 12:45:30.750
*/
function addMilliseconds$1(date, amount, options) {
  return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, +toDate$1(date) + amount);
}
//#endregion
//#region dist/date-fns/addHours.js
/**
* The {@link addHours} function options.
*/
/**
* @name addHours
* @category Hour Helpers
* @summary Add the specified number of hours to the given date.
*
* @description
* Add the specified number of hours to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of hours to be added
* @param options - An object with options
*
* @returns The new date with the hours added
*
* @example
* // Add 2 hours to 10 July 2014 23:00:00:
* const result = addHours(new Date(2014, 6, 10, 23, 0), 2)
* //=> Fri Jul 11 2014 01:00:00
*/
function addHours$1(date, amount, options) {
  return addMilliseconds$1(date, amount * millisecondsInHour, options);
}
//#endregion
//#region dist/date-fns/fp/addHours.js
var _addHours = convertToFP(addHours$1, 2);
//#endregion
//#region dist/date-fns/fp/addHoursWithOptions.js
var _addHoursWithOptions = convertToFP(addHours$1, 3);
//#endregion
//#region dist/date-fns/_lib/defaultOptions.js
var defaultOptions = {};
function getDefaultOptions$1() {
  return defaultOptions;
}
//#endregion
//#region dist/date-fns/startOfWeek.js
/**
* The {@link startOfWeek} function options.
*/
/**
* @name startOfWeek
* @category Week Helpers
* @summary Return the start of a week for the given date.
*
* @description
* Return the start of a week for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of a week
*
* @example
* // The start of a week for 2 September 2014 11:55:00:
* const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
* //=> Sun Aug 31 2014 00:00:00
*
* @example
* // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
* const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
* //=> Mon Sep 01 2014 00:00:00
*/
function startOfWeek$1(date, options) {var _ref, _ref2, _ref3, _options$weekStartsOn, _options$locale, _defaultOptions$local;
  var defaultOptions = getDefaultOptions$1();
  var weekStartsOn = (_ref = (_ref2 = (_ref3 = (_options$weekStartsOn = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn !== void 0 ? _options$weekStartsOn : options === null || options === void 0 || (_options$locale = options.locale) === null || _options$locale === void 0 || (_options$locale = _options$locale.options) === null || _options$locale === void 0 ? void 0 : _options$locale.weekStartsOn) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.weekStartsOn) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 || (_defaultOptions$local = _defaultOptions$local.options) === null || _defaultOptions$local === void 0 ? void 0 : _defaultOptions$local.weekStartsOn) !== null && _ref !== void 0 ? _ref : 0;
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var day = _date.getDay();
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
//#endregion
//#region dist/date-fns/startOfISOWeek.js
/**
* The {@link startOfISOWeek} function options.
*/
/**
* @name startOfISOWeek
* @category ISO Week Helpers
* @summary Return the start of an ISO week for the given date.
*
* @description
* Return the start of an ISO week for the given date.
* The result will be in the local timezone.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of an ISO week
*
* @example
* // The start of an ISO week for 2 September 2014 11:55:00:
* const result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
* //=> Mon Sep 01 2014 00:00:00
*/
function startOfISOWeek$1(date, options) {
  return startOfWeek$1(date, _objectSpread(_objectSpread({},
  options), {}, {
    weekStartsOn: 1 })
  );
}
//#endregion
//#region dist/date-fns/getISOWeekYear.js
/**
* The {@link getISOWeekYear} function options.
*/
/**
* @name getISOWeekYear
* @category ISO Week-Numbering Year Helpers
* @summary Get the ISO week-numbering year of the given date.
*
* @description
* Get the ISO week-numbering year of the given date,
* which always starts 3 days before the year's first Thursday.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param date - The given date
*
* @returns The ISO week-numbering year
*
* @example
* // Which ISO-week numbering year is 2 January 2005?
* const result = getISOWeekYear(new Date(2005, 0, 2))
* //=> 2004
*/
function getISOWeekYear$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  var fourthOfJanuaryOfNextYear = constructFrom$1(_date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  var startOfNextYear = startOfISOWeek$1(fourthOfJanuaryOfNextYear);
  var fourthOfJanuaryOfThisYear = constructFrom$1(_date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  var startOfThisYear = startOfISOWeek$1(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) return year + 1;else
  if (_date.getTime() >= startOfThisYear.getTime()) return year;else
  return year - 1;
}
//#endregion
//#region dist/date-fns/_lib/getTimezoneOffsetInMilliseconds.js
/**
* Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
* They usually appear for dates that denote time before the timezones were introduced
* (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
* and GMT+01:00:00 after that date)
*
* Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
* which would lead to incorrect calculations.
*
* This function returns the timezone offset in milliseconds that takes seconds in account.
*/
function getTimezoneOffsetInMilliseconds(date) {
  var _date = toDate$1(date);
  var utcDate = new Date(Date.UTC(_date.getFullYear(), _date.getMonth(), _date.getDate(), _date.getHours(), _date.getMinutes(), _date.getSeconds(), _date.getMilliseconds()));
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}
//#endregion
//#region dist/date-fns/_lib/normalizeDates.js
function normalizeDates(context) {for (var _len2 = arguments.length, dates = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {dates[_key2 - 1] = arguments[_key2];}
  var normalize = constructFrom$1.bind(null, context || dates.find(function (date) {return _typeof(date) === "object";}));
  return dates.map(normalize);
}
//#endregion
//#region dist/date-fns/startOfDay.js
/**
* The {@link startOfDay} function options.
*/
/**
* @name startOfDay
* @category Day Helpers
* @summary Return the start of a day for the given date.
*
* @description
* Return the start of a day for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - The options
*
* @returns The start of a day
*
* @example
* // The start of a day for 2 September 2014 11:55:00:
* const result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
* //=> Tue Sep 02 2014 00:00:00
*/
function startOfDay$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
//#endregion
//#region dist/date-fns/differenceInCalendarDays.js
/**
* The {@link differenceInCalendarDays} function options.
*/
/**
* @name differenceInCalendarDays
* @category Day Helpers
* @summary Get the number of calendar days between the given dates.
*
* @description
* Get the number of calendar days between the given dates. This means that the times are removed
* from the dates and then the difference in days is calculated.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - The options object
*
* @returns The number of calendar days
*
* @example
* // How many calendar days are between
* // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
* const result = differenceInCalendarDays(
*   new Date(2012, 6, 2, 0, 0),
*   new Date(2011, 6, 2, 23, 0)
* )
* //=> 366
* // How many calendar days are between
* // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
* const result = differenceInCalendarDays(
*   new Date(2011, 6, 3, 0, 1),
*   new Date(2011, 6, 2, 23, 59)
* )
* //=> 1
*/
function differenceInCalendarDays$1(laterDate, earlierDate, options) {
  var _normalizeDates = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates2 = _slicedToArray(_normalizeDates, 2),laterDate_ = _normalizeDates2[0],earlierDate_ = _normalizeDates2[1];
  var laterStartOfDay = startOfDay$1(laterDate_);
  var earlierStartOfDay = startOfDay$1(earlierDate_);
  var laterTimestamp = +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  var earlierTimestamp = +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}
//#endregion
//#region dist/date-fns/startOfISOWeekYear.js
/**
* The {@link startOfISOWeekYear} function options.
*/
/**
* @name startOfISOWeekYear
* @category ISO Week-Numbering Year Helpers
* @summary Return the start of an ISO week-numbering year for the given date.
*
* @description
* Return the start of an ISO week-numbering year,
* which always starts 3 days before the year's first Thursday.
* The result will be in the local timezone.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of an ISO week-numbering year
*
* @example
* // The start of an ISO week-numbering year for 2 July 2005:
* const result = startOfISOWeekYear(new Date(2005, 6, 2))
* //=> Mon Jan 03 2005 00:00:00
*/
function startOfISOWeekYear$1(date, options) {
  var year = getISOWeekYear$1(date, options);
  var fourthOfJanuary = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek$1(fourthOfJanuary);
}
//#endregion
//#region dist/date-fns/setISOWeekYear.js
/**
* The {@link setISOWeekYear} function options.
*/
/**
* @name setISOWeekYear
* @category ISO Week-Numbering Year Helpers
* @summary Set the ISO week-numbering year to the given date.
*
* @description
* Set the ISO week-numbering year to the given date,
* saving the week number and the weekday number.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows using extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param weekYear - The ISO week-numbering year of the new date
* @param options - An object with options
*
* @returns The new date with the ISO week-numbering year set
*
* @example
* // Set ISO week-numbering year 2007 to 29 December 2008:
* const result = setISOWeekYear(new Date(2008, 11, 29), 2007)
* //=> Mon Jan 01 2007 00:00:00
*/
function setISOWeekYear$1(date, weekYear, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var diff = differenceInCalendarDays$1(_date, startOfISOWeekYear$1(_date, options));
  var fourthOfJanuary = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  fourthOfJanuary.setFullYear(weekYear, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  _date = startOfISOWeekYear$1(fourthOfJanuary);
  _date.setDate(_date.getDate() + diff);
  return _date;
}
//#endregion
//#region dist/date-fns/addISOWeekYears.js
/**
* The {@link addISOWeekYears} function options.
*/
/**
* @name addISOWeekYears
* @category ISO Week-Numbering Year Helpers
* @summary Add the specified number of ISO week-numbering years to the given date.
*
* @description
* Add the specified number of ISO week-numbering years to the given date.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
*
* @param date - The date to be changed
* @param amount - The amount of ISO week-numbering years to be added.
* @param options - An object with options
*
* @returns The new date with the ISO week-numbering years added
*
* @example
* // Add 5 ISO week-numbering years to 2 July 2010:
* const result = addISOWeekYears(new Date(2010, 6, 2), 5)
* //=> Fri Jun 26 2015 00:00:00
*/
function addISOWeekYears$1(date, amount, options) {
  return setISOWeekYear$1(date, getISOWeekYear$1(date, options) + amount, options);
}
//#endregion
//#region dist/date-fns/fp/addISOWeekYears.js
var _addISOWeekYears = convertToFP(addISOWeekYears$1, 2);
//#endregion
//#region dist/date-fns/fp/addISOWeekYearsWithOptions.js
var _addISOWeekYearsWithOptions = convertToFP(addISOWeekYears$1, 3);
//#endregion
//#region dist/date-fns/fp/addMilliseconds.js
var _addMilliseconds = convertToFP(addMilliseconds$1, 2);
//#endregion
//#region dist/date-fns/fp/addMillisecondsWithOptions.js
var _addMillisecondsWithOptions = convertToFP(addMilliseconds$1, 3);
//#endregion
//#region dist/date-fns/addMinutes.js
/**
* The {@link addMinutes} function options.
*/
/**
* @name addMinutes
* @category Minute Helpers
* @summary Add the specified number of minutes to the given date.
*
* @description
* Add the specified number of minutes to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of minutes to be added.
* @param options - An object with options
*
* @returns The new date with the minutes added
*
* @example
* // Add 30 minutes to 10 July 2014 12:00:00:
* const result = addMinutes(new Date(2014, 6, 10, 12, 0), 30)
* //=> Thu Jul 10 2014 12:30:00
*/
function addMinutes$1(date, amount, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setTime(_date.getTime() + amount * millisecondsInMinute);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/addMinutes.js
var _addMinutes = convertToFP(addMinutes$1, 2);
//#endregion
//#region dist/date-fns/fp/addMinutesWithOptions.js
var _addMinutesWithOptions = convertToFP(addMinutes$1, 3);
//#endregion
//#region dist/date-fns/fp/addMonths.js
var _addMonths = convertToFP(addMonths$1, 2);
//#endregion
//#region dist/date-fns/fp/addMonthsWithOptions.js
var _addMonthsWithOptions = convertToFP(addMonths$1, 3);
//#endregion
//#region dist/date-fns/addQuarters.js
/**
* The {@link addQuarters} function options.
*/
/**
* @name addQuarters
* @category Quarter Helpers
* @summary Add the specified number of year quarters to the given date.
*
* @description
* Add the specified number of year quarters to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of quarters to be added.
* @param options - An object with options
*
* @returns The new date with the quarters added
*
* @example
* // Add 1 quarter to 1 September 2014:
* const result = addQuarters(new Date(2014, 8, 1), 1)
* //=; Mon Dec 01 2014 00:00:00
*/
function addQuarters$1(date, amount, options) {
  return addMonths$1(date, amount * 3, options);
}
//#endregion
//#region dist/date-fns/fp/addQuarters.js
var _addQuarters = convertToFP(addQuarters$1, 2);
//#endregion
//#region dist/date-fns/fp/addQuartersWithOptions.js
var _addQuartersWithOptions = convertToFP(addQuarters$1, 3);
//#endregion
//#region dist/date-fns/addSeconds.js
/**
* The {@link addSeconds} function options.
*/
/**
* @name addSeconds
* @category Second Helpers
* @summary Add the specified number of seconds to the given date.
*
* @description
* Add the specified number of seconds to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of seconds to be added.
* @param options - An object with options
*
* @returns The new date with the seconds added
*
* @example
* // Add 30 seconds to 10 July 2014 12:45:00:
* const result = addSeconds(new Date(2014, 6, 10, 12, 45, 0), 30)
* //=> Thu Jul 10 2014 12:45:30
*/
function addSeconds$1(date, amount, options) {
  return addMilliseconds$1(date, amount * 1e3, options);
}
//#endregion
//#region dist/date-fns/fp/addSeconds.js
var _addSeconds = convertToFP(addSeconds$1, 2);
//#endregion
//#region dist/date-fns/fp/addSecondsWithOptions.js
var _addSecondsWithOptions = convertToFP(addSeconds$1, 3);
//#endregion
//#region dist/date-fns/addWeeks.js
/**
* The {@link addWeeks} function options.
*/
/**
* @name addWeeks
* @category Week Helpers
* @summary Add the specified number of weeks to the given date.
*
* @description
* Add the specified number of weeks to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of weeks to be added.
* @param options - An object with options
*
* @returns The new date with the weeks added
*
* @example
* // Add 4 weeks to 1 September 2014:
* const result = addWeeks(new Date(2014, 8, 1), 4)
* //=> Mon Sep 29 2014 00:00:00
*/
function addWeeks$1(date, amount, options) {
  return addDays$1(date, amount * 7, options);
}
//#endregion
//#region dist/date-fns/fp/addWeeks.js
var _addWeeks = convertToFP(addWeeks$1, 2);
//#endregion
//#region dist/date-fns/fp/addWeeksWithOptions.js
var _addWeeksWithOptions = convertToFP(addWeeks$1, 3);
//#endregion
//#region dist/date-fns/fp/addWithOptions.js
var _addWithOptions = convertToFP(add$1, 3);
//#endregion
//#region dist/date-fns/addYears.js
/**
* The {@link addYears} function options.
*/
/**
* @name addYears
* @category Year Helpers
* @summary Add the specified number of years to the given date.
*
* @description
* Add the specified number of years to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type.
*
* @param date - The date to be changed
* @param amount - The amount of years to be added.
* @param options - The options
*
* @returns The new date with the years added
*
* @example
* // Add 5 years to 1 September 2014:
* const result = addYears(new Date(2014, 8, 1), 5)
* //=> Sun Sep 01 2019 00:00:00
*/
function addYears$1(date, amount, options) {
  return addMonths$1(date, amount * 12, options);
}
//#endregion
//#region dist/date-fns/fp/addYears.js
var _addYears = convertToFP(addYears$1, 2);
//#endregion
//#region dist/date-fns/fp/addYearsWithOptions.js
var _addYearsWithOptions = convertToFP(addYears$1, 3);
//#endregion
//#region dist/date-fns/areIntervalsOverlapping.js
/**
* The {@link areIntervalsOverlapping} function options.
*/
/**
* @name areIntervalsOverlapping
* @category Interval Helpers
* @summary Is the given time interval overlapping with another time interval?
*
* @description
* Is the given time interval overlapping with another time interval? Adjacent intervals do not count as overlapping unless `inclusive` is set to `true`.
*
* @param intervalLeft - The first interval to compare.
* @param intervalRight - The second interval to compare.
* @param options - The object with options
*
* @returns Whether the time intervals are overlapping
*
* @example
* // For overlapping time intervals:
* areIntervalsOverlapping(
*   { start: new Date(2014, 0, 10), end: new Date(2014, 0, 20) },
*   { start: new Date(2014, 0, 17), end: new Date(2014, 0, 21) }
* )
* //=> true
*
* @example
* // For non-overlapping time intervals:
* areIntervalsOverlapping(
*   { start: new Date(2014, 0, 10), end: new Date(2014, 0, 20) },
*   { start: new Date(2014, 0, 21), end: new Date(2014, 0, 22) }
* )
* //=> false
*
* @example
* // For adjacent time intervals:
* areIntervalsOverlapping(
*   { start: new Date(2014, 0, 10), end: new Date(2014, 0, 20) },
*   { start: new Date(2014, 0, 20), end: new Date(2014, 0, 30) }
* )
* //=> false
*
* @example
* // Using the inclusive option:
* areIntervalsOverlapping(
*   { start: new Date(2014, 0, 10), end: new Date(2014, 0, 20) },
*   { start: new Date(2014, 0, 20), end: new Date(2014, 0, 24) },
*   { inclusive: true }
* )
* //=> true
*/
function areIntervalsOverlapping$1(intervalLeft, intervalRight, options) {
  var _sort = [+toDate$1(intervalLeft.start, options === null || options === void 0 ? void 0 : options.in), +toDate$1(intervalLeft.end, options === null || options === void 0 ? void 0 : options.in)].sort(function (a, b) {return a - b;}),_sort2 = _slicedToArray(_sort, 2),leftStartTime = _sort2[0],leftEndTime = _sort2[1];
  var _sort3 = [+toDate$1(intervalRight.start, options === null || options === void 0 ? void 0 : options.in), +toDate$1(intervalRight.end, options === null || options === void 0 ? void 0 : options.in)].sort(function (a, b) {return a - b;}),_sort4 = _slicedToArray(_sort3, 2),rightStartTime = _sort4[0],rightEndTime = _sort4[1];
  if (options !== null && options !== void 0 && options.inclusive) return leftStartTime <= rightEndTime && rightStartTime <= leftEndTime;
  return leftStartTime < rightEndTime && rightStartTime < leftEndTime;
}
//#endregion
//#region dist/date-fns/fp/areIntervalsOverlapping.js
var _areIntervalsOverlapping = convertToFP(areIntervalsOverlapping$1, 2);
//#endregion
//#region dist/date-fns/fp/areIntervalsOverlappingWithOptions.js
var _areIntervalsOverlappingWithOptions = convertToFP(areIntervalsOverlapping$1, 3);
//#endregion
//#region dist/date-fns/max.js
/**
* The {@link max} function options.
*/
/**
* @name max
* @category Common Helpers
* @summary Return the latest of the given dates.
*
* @description
* Return the latest of the given dates.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param dates - The dates to compare
*
* @returns The latest of the dates
*
* @example
* // Which of these dates is the latest?
* const result = max([
*   new Date(1989, 6, 10),
*   new Date(1987, 1, 11),
*   new Date(1995, 6, 2),
*   new Date(1990, 0, 1)
* ])
* //=> Sun Jul 02 1995 00:00:00
*/
function max$1(dates, options) {
  var result;
  var context = options === null || options === void 0 ? void 0 : options.in;
  dates.forEach(function (date) {
    if (!context && _typeof(date) === "object") context = constructFrom$1.bind(null, date);
    var date_ = toDate$1(date, context);
    if (!result || result < date_ || isNaN(+date_)) result = date_;
  });
  return constructFrom$1(context, result || NaN);
}
//#endregion
//#region dist/date-fns/min.js
/**
* The {@link min} function options.
*/
/**
* @name min
* @category Common Helpers
* @summary Returns the earliest of the given dates.
*
* @description
* Returns the earliest of the given dates.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param dates - The dates to compare
*
* @returns The earliest of the dates
*
* @example
* // Which of these dates is the earliest?
* const result = min([
*   new Date(1989, 6, 10),
*   new Date(1987, 1, 11),
*   new Date(1995, 6, 2),
*   new Date(1990, 0, 1)
* ])
* //=> Wed Feb 11 1987 00:00:00
*/
function min$1(dates, options) {
  var result;
  var context = options === null || options === void 0 ? void 0 : options.in;
  dates.forEach(function (date) {
    if (!context && _typeof(date) === "object") context = constructFrom$1.bind(null, date);
    var date_ = toDate$1(date, context);
    if (!result || result > date_ || isNaN(+date_)) result = date_;
  });
  return constructFrom$1(context, result || NaN);
}
//#endregion
//#region dist/date-fns/clamp.js
/**
* The {@link clamp} function options.
*/
/**
* The {@link clamp} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the date argument,
* then the start interval date, and finally the end interval date. If
* a context function is passed, it uses the context function return type.
*/
/**
* @name clamp
* @category Interval Helpers
* @summary Return a date bounded by the start and the end of the given interval.
*
* @description
* Clamps a date to the lower bound with the start of the interval and the upper
* bound with the end of the interval.
*
* - When the date is less than the start of the interval, the start is returned.
* - When the date is greater than the end of the interval, the end is returned.
* - Otherwise the date is returned.
*
* @typeParam DateType - Date argument type.
* @typeParam IntervalType - Interval argument type.
* @typeParam Options - Options type.
*
* @param date - The date to be bounded
* @param interval - The interval to bound to
* @param options - An object with options
*
* @returns The date bounded by the start and the end of the interval
*
* @example
* // What is Mar 21, 2021 bounded to an interval starting at Mar 22, 2021 and ending at Apr 01, 2021
* const result = clamp(new Date(2021, 2, 21), {
*   start: new Date(2021, 2, 22),
*   end: new Date(2021, 3, 1),
* })
* //=> Mon Mar 22 2021 00:00:00
*/
function clamp$1(date, interval, options) {
  var _normalizeDates3 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, date, interval.start, interval.end),_normalizeDates4 = _slicedToArray(_normalizeDates3, 3),date_ = _normalizeDates4[0],start = _normalizeDates4[1],end = _normalizeDates4[2];
  return min$1([max$1([date_, start], options), end], options);
}
//#endregion
//#region dist/date-fns/fp/clamp.js
var _clamp = convertToFP(clamp$1, 2);
//#endregion
//#region dist/date-fns/fp/clampWithOptions.js
var _clampWithOptions = convertToFP(clamp$1, 3);
//#endregion
//#region dist/date-fns/closestIndexTo.js
/**
* @name closestIndexTo
* @category Common Helpers
* @summary Return an index of the closest date from the array comparing to the given date.
*
* @description
* Return an index of the closest date from the array comparing to the given date.
*
* @param dateToCompare - The date to compare with
* @param dates - The array to search
*
* @returns An index of the date closest to the given date or undefined if no valid value is given
*
* @example
* // Which date is closer to 6 September 2015?
* const dateToCompare = new Date(2015, 8, 6)
* const datesArray = [
*   new Date(2015, 0, 1),
*   new Date(2016, 0, 1),
*   new Date(2017, 0, 1)
* ]
* const result = closestIndexTo(dateToCompare, datesArray)
* //=> 1
*/
function closestIndexTo$1(dateToCompare, dates) {
  var timeToCompare = +toDate$1(dateToCompare);
  if (isNaN(timeToCompare)) return NaN;
  var result;
  var minDistance;
  dates.forEach(function (date, index) {
    var date_ = toDate$1(date);
    if (isNaN(+date_)) {
      result = NaN;
      minDistance = NaN;
      return;
    }
    var distance = Math.abs(timeToCompare - +date_);
    if (result == null || distance < minDistance) {
      result = index;
      minDistance = distance;
    }
  });
  return result;
}
//#endregion
//#region dist/date-fns/fp/closestIndexTo.js
var _closestIndexTo = convertToFP(closestIndexTo$1, 2);
//#endregion
//#region dist/date-fns/closestTo.js
/**
* The {@link closestTo} function options.
*/
/**
* The {@link closestTo} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the date argument,
* then the start interval date, and finally the end interval date. If
* a context function is passed, it uses the context function return type.
*/
/**
* @name closestTo
* @category Common Helpers
* @summary Return a date from the array closest to the given date.
*
* @description
* Return a date from the array closest to the given date.
*
* @typeParam DateToCompare - Date to compare argument type.
* @typeParam DatesType - Dates array argument type.
* @typeParam Options - Options type.
*
* @param dateToCompare - The date to compare with
* @param dates - The array to search
*
* @returns The date from the array closest to the given date or undefined if no valid value is given
*
* @example
* // Which date is closer to 6 September 2015: 1 January 2000 or 1 January 2030?
* const dateToCompare = new Date(2015, 8, 6)
* const result = closestTo(dateToCompare, [
*   new Date(2000, 0, 1),
*   new Date(2030, 0, 1)
* ])
* //=> Tue Jan 01 2030 00:00:00
*/
function closestTo$1(dateToCompare, dates, options) {
  var _normalizeDates5 = normalizeDates.apply(void 0, [options === null || options === void 0 ? void 0 : options.in, dateToCompare].concat(_toConsumableArray(dates))),_normalizeDates6 = _toArray(_normalizeDates5),dateToCompare_ = _normalizeDates6[0],dates_ = _normalizeDates6.slice(1);
  var index = closestIndexTo$1(dateToCompare_, dates_);
  if (typeof index === "number" && isNaN(index)) return constructFrom$1(dateToCompare_, NaN);
  if (index !== void 0) return dates_[index];
}
//#endregion
//#region dist/date-fns/fp/closestTo.js
var _closestTo = convertToFP(closestTo$1, 2);
//#endregion
//#region dist/date-fns/fp/closestToWithOptions.js
var _closestToWithOptions = convertToFP(closestTo$1, 3);
//#endregion
//#region dist/date-fns/compareAsc.js
/**
* @name compareAsc
* @category Common Helpers
* @summary Compare the two dates and return -1, 0 or 1.
*
* @description
* Compare the two dates and return 1 if the first date is after the second,
* -1 if the first date is before the second or 0 if dates are equal.
*
* @param dateLeft - The first date to compare
* @param dateRight - The second date to compare
*
* @returns The result of the comparison
*
* @example
* // Compare 11 February 1987 and 10 July 1989:
* const result = compareAsc(new Date(1987, 1, 11), new Date(1989, 6, 10))
* //=> -1
*
* @example
* // Sort the array of dates:
* const result = [
*   new Date(1995, 6, 2),
*   new Date(1987, 1, 11),
*   new Date(1989, 6, 10)
* ].sort(compareAsc)
* //=> [
* //   Wed Feb 11 1987 00:00:00,
* //   Mon Jul 10 1989 00:00:00,
* //   Sun Jul 02 1995 00:00:00
* // ]
*/
function compareAsc$1(dateLeft, dateRight) {
  var diff = +toDate$1(dateLeft) - +toDate$1(dateRight);
  if (diff < 0) return -1;else
  if (diff > 0) return 1;
  return diff;
}
//#endregion
//#region dist/date-fns/fp/compareAsc.js
var _compareAsc = convertToFP(compareAsc$1, 2);
//#endregion
//#region dist/date-fns/compareDesc.js
/**
* @name compareDesc
* @category Common Helpers
* @summary Compare the two dates reverse chronologically and return -1, 0 or 1.
*
* @description
* Compare the two dates and return -1 if the first date is after the second,
* 1 if the first date is before the second or 0 if dates are equal.
*
* @param dateLeft - The first date to compare
* @param dateRight - The second date to compare
*
* @returns The result of the comparison
*
* @example
* // Compare 11 February 1987 and 10 July 1989 reverse chronologically:
* const result = compareDesc(new Date(1987, 1, 11), new Date(1989, 6, 10))
* //=> 1
*
* @example
* // Sort the array of dates in reverse chronological order:
* const result = [
*   new Date(1995, 6, 2),
*   new Date(1987, 1, 11),
*   new Date(1989, 6, 10)
* ].sort(compareDesc)
* //=> [
* //   Sun Jul 02 1995 00:00:00,
* //   Mon Jul 10 1989 00:00:00,
* //   Wed Feb 11 1987 00:00:00
* // ]
*/
function compareDesc$1(dateLeft, dateRight) {
  var diff = +toDate$1(dateLeft) - +toDate$1(dateRight);
  if (diff > 0) return -1;else
  if (diff < 0) return 1;
  return diff;
}
//#endregion
//#region dist/date-fns/fp/compareDesc.js
var _compareDesc = convertToFP(compareDesc$1, 2);
//#endregion
//#region dist/date-fns/fp/constructFrom.js
var _constructFrom = convertToFP(constructFrom$1, 2);
//#endregion
//#region dist/date-fns/daysToWeeks.js
/**
* @name daysToWeeks
* @category Conversion Helpers
* @summary Convert days to weeks.
*
* @description
* Convert a number of days to a full number of weeks.
*
* @param days - The number of days to be converted
*
* @returns The number of days converted in weeks
*
* @example
* // Convert 14 days to weeks:
* const result = daysToWeeks(14)
* //=> 2
*
* @example
* // It uses trunc rounding:
* const result = daysToWeeks(13)
* //=> 1
*/
function daysToWeeks$1(days) {
  var result = Math.trunc(days / 7);
  return result === 0 ? 0 : result;
}
//#endregion
//#region dist/date-fns/fp/daysToWeeks.js
var _daysToWeeks = convertToFP(daysToWeeks$1, 1);
//#endregion
//#region dist/date-fns/isSameDay.js
/**
* The {@link isSameDay} function options.
*/
/**
* @name isSameDay
* @category Day Helpers
* @summary Are the given dates in the same day (and year and month)?
*
* @description
* Are the given dates in the same day (and year and month)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same day (and year and month)
*
* @example
* // Are 4 September 06:00:00 and 4 September 18:00:00 in the same day?
* const result = isSameDay(new Date(2014, 8, 4, 6, 0), new Date(2014, 8, 4, 18, 0))
* //=> true
*
* @example
* // Are 4 September and 4 October in the same day?
* const result = isSameDay(new Date(2014, 8, 4), new Date(2014, 9, 4))
* //=> false
*
* @example
* // Are 4 September, 2014 and 4 September, 2015 in the same day?
* const result = isSameDay(new Date(2014, 8, 4), new Date(2015, 8, 4))
* //=> false
*/
function isSameDay$1(laterDate, earlierDate, options) {
  var _normalizeDates7 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates8 = _slicedToArray(_normalizeDates7, 2),dateLeft_ = _normalizeDates8[0],dateRight_ = _normalizeDates8[1];
  return +startOfDay$1(dateLeft_) === +startOfDay$1(dateRight_);
}
//#endregion
//#region dist/date-fns/isDate.js
/**
* @name isDate
* @category Common Helpers
* @summary Is the given value a date?
*
* @description
* Returns true if the given value is an instance of Date. The function works for dates transferred across iframes.
*
* @param value - The value to check
*
* @returns True if the given value is a date
*
* @example
* // For a valid date:
* const result = isDate(new Date())
* //=> true
*
* @example
* // For an invalid date:
* const result = isDate(new Date(NaN))
* //=> true
*
* @example
* // For some value:
* const result = isDate('2014-02-31')
* //=> false
*
* @example
* // For an object:
* const result = isDate({})
* //=> false
*/
function isDate$1(value) {
  return value instanceof Date || _typeof(value) === "object" && Object.prototype.toString.call(value) === "[object Date]";
}
//#endregion
//#region dist/date-fns/isValid.js
/**
* @name isValid
* @category Common Helpers
* @summary Is the given date valid?
*
* @description
* Returns false if argument is Invalid Date and true otherwise.
* Argument is converted to Date using `toDate`. See [toDate](https://date-fns.org/docs/toDate)
* Invalid Date is a Date, whose time value is NaN.
*
* Time value of Date: http://es5.github.io/#x15.9.1.1
*
* @param date - The date to check
*
* @returns The date is valid
*
* @example
* // For the valid date:
* const result = isValid(new Date(2014, 1, 31))
* //=> true
*
* @example
* // For the value, convertible into a date:
* const result = isValid(1393804800000)
* //=> true
*
* @example
* // For the invalid date:
* const result = isValid(new Date(''))
* //=> false
*/
function isValid$1(date) {
  return !(!isDate$1(date) && typeof date !== "number" || isNaN(+toDate$1(date)));
}
//#endregion
//#region dist/date-fns/differenceInBusinessDays.js
/**
* The {@link differenceInBusinessDays} function options.
*/
/**
* @name differenceInBusinessDays
* @category Day Helpers
* @summary Get the number of business days between the given dates.
*
* @description
* Get the number of business day periods between the given dates.
* Business days being days that aren't in the weekend.
* Like `differenceInCalendarDays`, the function removes the times from
* the dates before calculating the difference.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of business days
*
* @example
* // How many business days are between
* // 10 January 2014 and 20 July 2014?
* const result = differenceInBusinessDays(
*   new Date(2014, 6, 20),
*   new Date(2014, 0, 10)
* )
* //=> 136
*
* // How many business days are between
* // 30 November 2021 and 1 November 2021?
* const result = differenceInBusinessDays(
*   new Date(2021, 10, 30),
*   new Date(2021, 10, 1)
* )
* //=> 21
*
* // How many business days are between
* // 1 November 2021 and 1 December 2021?
* const result = differenceInBusinessDays(
*   new Date(2021, 10, 1),
*   new Date(2021, 11, 1)
* )
* //=> -22
*
* // How many business days are between
* // 1 November 2021 and 1 November 2021 ?
* const result = differenceInBusinessDays(
*   new Date(2021, 10, 1),
*   new Date(2021, 10, 1)
* )
* //=> 0
*/
function differenceInBusinessDays$1(laterDate, earlierDate, options) {
  var _normalizeDates9 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates0 = _slicedToArray(_normalizeDates9, 2),laterDate_ = _normalizeDates0[0],earlierDate_ = _normalizeDates0[1];
  if (!isValid$1(laterDate_) || !isValid$1(earlierDate_)) return NaN;
  var diff = differenceInCalendarDays$1(laterDate_, earlierDate_);
  var sign = diff < 0 ? -1 : 1;
  var weeks = Math.trunc(diff / 7);
  var result = weeks * 5;
  var movingDate = addDays$1(earlierDate_, weeks * 7);
  while (!isSameDay$1(laterDate_, movingDate)) {
    result += isWeekend$1(movingDate, options) ? 0 : sign;
    movingDate = addDays$1(movingDate, sign);
  }
  return result === 0 ? 0 : result;
}
//#endregion
//#region dist/date-fns/fp/differenceInBusinessDays.js
var _differenceInBusinessDays = convertToFP(differenceInBusinessDays$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInBusinessDaysWithOptions.js
var _differenceInBusinessDaysWithOptions = convertToFP(differenceInBusinessDays$1, 3);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarDays.js
var _differenceInCalendarDays = convertToFP(differenceInCalendarDays$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarDaysWithOptions.js
var _differenceInCalendarDaysWithOptions = convertToFP(differenceInCalendarDays$1, 3);
//#endregion
//#region dist/date-fns/differenceInCalendarISOWeekYears.js
/**
* The {@link differenceInCalendarISOWeekYears} function options.
*/
/**
* @name differenceInCalendarISOWeekYears
* @category ISO Week-Numbering Year Helpers
* @summary Get the number of calendar ISO week-numbering years between the given dates.
*
* @description
* Get the number of calendar ISO week-numbering years between the given dates.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of calendar ISO week-numbering years
*
* @example
* // How many calendar ISO week-numbering years are 1 January 2010 and 1 January 2012?
* const result = differenceInCalendarISOWeekYears(
*   new Date(2012, 0, 1),
*   new Date(2010, 0, 1)
* )
* //=> 2
*/
function differenceInCalendarISOWeekYears$1(laterDate, earlierDate, options) {
  var _normalizeDates1 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates10 = _slicedToArray(_normalizeDates1, 2),laterDate_ = _normalizeDates10[0],earlierDate_ = _normalizeDates10[1];
  return getISOWeekYear$1(laterDate_, options) - getISOWeekYear$1(earlierDate_, options);
}
//#endregion
//#region dist/date-fns/fp/differenceInCalendarISOWeekYears.js
var _differenceInCalendarISOWeekYears = convertToFP(differenceInCalendarISOWeekYears$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarISOWeekYearsWithOptions.js
var _differenceInCalendarISOWeekYearsWithOptions = convertToFP(differenceInCalendarISOWeekYears$1, 3);
//#endregion
//#region dist/date-fns/differenceInCalendarISOWeeks.js
/**
* The {@link differenceInCalendarISOWeeks} function options.
*/
/**
* @name differenceInCalendarISOWeeks
* @category ISO Week Helpers
* @summary Get the number of calendar ISO weeks between the given dates.
*
* @description
* Get the number of calendar ISO weeks between the given dates.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of calendar ISO weeks
*
* @example
* // How many calendar ISO weeks are between 6 July 2014 and 21 July 2014?
* const result = differenceInCalendarISOWeeks(
*   new Date(2014, 6, 21),
*   new Date(2014, 6, 6),
* );
* //=> 3
*/
function differenceInCalendarISOWeeks$1(laterDate, earlierDate, options) {
  var _normalizeDates11 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates12 = _slicedToArray(_normalizeDates11, 2),laterDate_ = _normalizeDates12[0],earlierDate_ = _normalizeDates12[1];
  var startOfISOWeekLeft = startOfISOWeek$1(laterDate_);
  var startOfISOWeekRight = startOfISOWeek$1(earlierDate_);
  var timestampLeft = +startOfISOWeekLeft - getTimezoneOffsetInMilliseconds(startOfISOWeekLeft);
  var timestampRight = +startOfISOWeekRight - getTimezoneOffsetInMilliseconds(startOfISOWeekRight);
  return Math.round((timestampLeft - timestampRight) / millisecondsInWeek);
}
//#endregion
//#region dist/date-fns/fp/differenceInCalendarISOWeeks.js
var _differenceInCalendarISOWeeks = convertToFP(differenceInCalendarISOWeeks$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarISOWeeksWithOptions.js
var _differenceInCalendarISOWeeksWithOptions = convertToFP(differenceInCalendarISOWeeks$1, 3);
//#endregion
//#region dist/date-fns/differenceInCalendarMonths.js
/**
* The {@link differenceInCalendarMonths} function options.
*/
/**
* @name differenceInCalendarMonths
* @category Month Helpers
* @summary Get the number of calendar months between the given dates.
*
* @description
* Get the number of calendar months between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of calendar months
*
* @example
* // How many calendar months are between 31 January 2014 and 1 September 2014?
* const result = differenceInCalendarMonths(
*   new Date(2014, 8, 1),
*   new Date(2014, 0, 31)
* )
* //=> 8
*/
function differenceInCalendarMonths$1(laterDate, earlierDate, options) {
  var _normalizeDates13 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates14 = _slicedToArray(_normalizeDates13, 2),laterDate_ = _normalizeDates14[0],earlierDate_ = _normalizeDates14[1];
  var yearsDiff = laterDate_.getFullYear() - earlierDate_.getFullYear();
  var monthsDiff = laterDate_.getMonth() - earlierDate_.getMonth();
  return yearsDiff * 12 + monthsDiff;
}
//#endregion
//#region dist/date-fns/fp/differenceInCalendarMonths.js
var _differenceInCalendarMonths = convertToFP(differenceInCalendarMonths$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarMonthsWithOptions.js
var _differenceInCalendarMonthsWithOptions = convertToFP(differenceInCalendarMonths$1, 3);
//#endregion
//#region dist/date-fns/getQuarter.js
/**
* The {@link getQuarter} function options.
*/
/**
* @name getQuarter
* @category Quarter Helpers
* @summary Get the year quarter of the given date.
*
* @description
* Get the year quarter of the given date.
*
* @param date - The given date
* @param options - An object with options
*
* @returns The quarter
*
* @example
* // Which quarter is 2 July 2014?
* const result = getQuarter(new Date(2014, 6, 2));
* //=> 3
*/
function getQuarter$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  return Math.trunc(_date.getMonth() / 3) + 1;
}
//#endregion
//#region dist/date-fns/differenceInCalendarQuarters.js
/**
* The {@link differenceInCalendarQuarters} function options.
*/
/**
* @name differenceInCalendarQuarters
* @category Quarter Helpers
* @summary Get the number of calendar quarters between the given dates.
*
* @description
* Get the number of calendar quarters between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of calendar quarters
*
* @example
* // How many calendar quarters are between 31 December 2013 and 2 July 2014?
* const result = differenceInCalendarQuarters(
*   new Date(2014, 6, 2),
*   new Date(2013, 11, 31)
* )
* //=> 3
*/
function differenceInCalendarQuarters$1(laterDate, earlierDate, options) {
  var _normalizeDates15 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates16 = _slicedToArray(_normalizeDates15, 2),laterDate_ = _normalizeDates16[0],earlierDate_ = _normalizeDates16[1];
  var yearsDiff = laterDate_.getFullYear() - earlierDate_.getFullYear();
  var quartersDiff = getQuarter$1(laterDate_) - getQuarter$1(earlierDate_);
  return yearsDiff * 4 + quartersDiff;
}
//#endregion
//#region dist/date-fns/fp/differenceInCalendarQuarters.js
var _differenceInCalendarQuarters = convertToFP(differenceInCalendarQuarters$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarQuartersWithOptions.js
var _differenceInCalendarQuartersWithOptions = convertToFP(differenceInCalendarQuarters$1, 3);
//#endregion
//#region dist/date-fns/differenceInCalendarWeeks.js
/**
* The {@link differenceInCalendarWeeks} function options.
*/
/**
* @name differenceInCalendarWeeks
* @category Week Helpers
* @summary Get the number of calendar weeks between the given dates.
*
* @description
* Get the number of calendar weeks between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options.
*
* @returns The number of calendar weeks
*
* @example
* // How many calendar weeks are between 5 July 2014 and 20 July 2014?
* const result = differenceInCalendarWeeks(
*   new Date(2014, 6, 20),
*   new Date(2014, 6, 5)
* )
* //=> 3
*
* @example
* // If the week starts on Monday,
* // how many calendar weeks are between 5 July 2014 and 20 July 2014?
* const result = differenceInCalendarWeeks(
*   new Date(2014, 6, 20),
*   new Date(2014, 6, 5),
*   { weekStartsOn: 1 }
* )
* //=> 2
*/
function differenceInCalendarWeeks$1(laterDate, earlierDate, options) {
  var _normalizeDates17 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates18 = _slicedToArray(_normalizeDates17, 2),laterDate_ = _normalizeDates18[0],earlierDate_ = _normalizeDates18[1];
  var laterStartOfWeek = startOfWeek$1(laterDate_, options);
  var earlierStartOfWeek = startOfWeek$1(earlierDate_, options);
  var laterTimestamp = +laterStartOfWeek - getTimezoneOffsetInMilliseconds(laterStartOfWeek);
  var earlierTimestamp = +earlierStartOfWeek - getTimezoneOffsetInMilliseconds(earlierStartOfWeek);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInWeek);
}
//#endregion
//#region dist/date-fns/fp/differenceInCalendarWeeks.js
var _differenceInCalendarWeeks = convertToFP(differenceInCalendarWeeks$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarWeeksWithOptions.js
var _differenceInCalendarWeeksWithOptions = convertToFP(differenceInCalendarWeeks$1, 3);
//#endregion
//#region dist/date-fns/differenceInCalendarYears.js
/**
* The {@link differenceInCalendarYears} function options.
*/
/**
* @name differenceInCalendarYears
* @category Year Helpers
* @summary Get the number of calendar years between the given dates.
*
* @description
* Get the number of calendar years between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options

* @returns The number of calendar years
*
* @example
* // How many calendar years are between 31 December 2013 and 11 February 2015?
* const result = differenceInCalendarYears(
*   new Date(2015, 1, 11),
*   new Date(2013, 11, 31)
* );
* //=> 2
*/
function differenceInCalendarYears$1(laterDate, earlierDate, options) {
  var _normalizeDates19 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates20 = _slicedToArray(_normalizeDates19, 2),laterDate_ = _normalizeDates20[0],earlierDate_ = _normalizeDates20[1];
  return laterDate_.getFullYear() - earlierDate_.getFullYear();
}
//#endregion
//#region dist/date-fns/fp/differenceInCalendarYears.js
var _differenceInCalendarYears = convertToFP(differenceInCalendarYears$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInCalendarYearsWithOptions.js
var _differenceInCalendarYearsWithOptions = convertToFP(differenceInCalendarYears$1, 3);
//#endregion
//#region dist/date-fns/differenceInDays.js
/**
* The {@link differenceInDays} function options.
*/
/**
* @name differenceInDays
* @category Day Helpers
* @summary Get the number of full days between the given dates.
*
* @description
* Get the number of full day periods between two dates. Fractional days are
* truncated towards zero.
*
* One "full day" is the distance between a local time in one day to the same
* local time on the next or previous day. A full day can sometimes be less than
* or more than 24 hours if a daylight savings change happens between two dates.
*
* To ignore DST and only measure exact 24-hour periods, use this instead:
* `Math.trunc(differenceInHours(dateLeft, dateRight)/24)|0`.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of full days according to the local timezone
*
* @example
* // How many full days are between
* // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
* const result = differenceInDays(
*   new Date(2012, 6, 2, 0, 0),
*   new Date(2011, 6, 2, 23, 0)
* )
* //=> 365
*
* @example
* // How many full days are between
* // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
* const result = differenceInDays(
*   new Date(2011, 6, 3, 0, 1),
*   new Date(2011, 6, 2, 23, 59)
* )
* //=> 0
*
* @example
* // How many full days are between
* // 1 March 2020 0:00 and 1 June 2020 0:00 ?
* // Note: because local time is used, the
* // result will always be 92 days, even in
* // time zones where DST starts and the
* // period has only 92*24-1 hours.
* const result = differenceInDays(
*   new Date(2020, 5, 1),
*   new Date(2020, 2, 1)
* )
* //=> 92
*/
function differenceInDays$1(laterDate, earlierDate, options) {
  var _normalizeDates21 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates22 = _slicedToArray(_normalizeDates21, 2),laterDate_ = _normalizeDates22[0],earlierDate_ = _normalizeDates22[1];
  var sign = compareLocalAsc(laterDate_, earlierDate_);
  var difference = Math.abs(differenceInCalendarDays$1(laterDate_, earlierDate_));
  laterDate_.setDate(laterDate_.getDate() - sign * difference);
  var result = sign * (difference - Number(compareLocalAsc(laterDate_, earlierDate_) === -sign));
  return result === 0 ? 0 : result;
}
function compareLocalAsc(laterDate, earlierDate) {
  var diff = laterDate.getFullYear() - earlierDate.getFullYear() || laterDate.getMonth() - earlierDate.getMonth() || laterDate.getDate() - earlierDate.getDate() || laterDate.getHours() - earlierDate.getHours() || laterDate.getMinutes() - earlierDate.getMinutes() || laterDate.getSeconds() - earlierDate.getSeconds() || laterDate.getMilliseconds() - earlierDate.getMilliseconds();
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return diff;
}
//#endregion
//#region dist/date-fns/fp/differenceInDays.js
var _differenceInDays = convertToFP(differenceInDays$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInDaysWithOptions.js
var _differenceInDaysWithOptions = convertToFP(differenceInDays$1, 3);
//#endregion
//#region dist/date-fns/_lib/getRoundingMethod.js
function getRoundingMethod(method) {
  return function (number) {
    var result = (method ? Math[method] : Math.trunc)(number);
    return result === 0 ? 0 : result;
  };
}
//#endregion
//#region dist/date-fns/differenceInHours.js
/**
* The {@link differenceInHours} function options.
*/
/**
* @name differenceInHours
* @category Hour Helpers
* @summary Get the number of hours between the given dates.
*
* @description
* Get the number of hours between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options.
*
* @returns The number of hours
*
* @example
* // How many hours are between 2 July 2014 06:50:00 and 2 July 2014 19:00:00?
* const result = differenceInHours(
*   new Date(2014, 6, 2, 19, 0),
*   new Date(2014, 6, 2, 6, 50)
* )
* //=> 12
*/
function differenceInHours$1(laterDate, earlierDate, options) {
  var _normalizeDates23 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates24 = _slicedToArray(_normalizeDates23, 2),laterDate_ = _normalizeDates24[0],earlierDate_ = _normalizeDates24[1];
  var diff = (+laterDate_ - +earlierDate_) / millisecondsInHour;
  return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
}
//#endregion
//#region dist/date-fns/fp/differenceInHours.js
var _differenceInHours = convertToFP(differenceInHours$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInHoursWithOptions.js
var _differenceInHoursWithOptions = convertToFP(differenceInHours$1, 3);
//#endregion
//#region dist/date-fns/subISOWeekYears.js
/**
* The {@link subISOWeekYears} function options.
*/
/**
* @name subISOWeekYears
* @category ISO Week-Numbering Year Helpers
* @summary Subtract the specified number of ISO week-numbering years from the given date.
*
* @description
* Subtract the specified number of ISO week-numbering years from the given date.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of ISO week-numbering years to be subtracted.
* @param options - The options
*
* @returns The new date with the ISO week-numbering years subtracted
*
* @example
* // Subtract 5 ISO week-numbering years from 1 September 2014:
* const result = subISOWeekYears(new Date(2014, 8, 1), 5)
* //=> Mon Aug 31 2009 00:00:00
*/
function subISOWeekYears$1(date, amount, options) {
  return addISOWeekYears$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/differenceInISOWeekYears.js
/**
* The {@link differenceInISOWeekYears} function options.
*/
/**
* @name differenceInISOWeekYears
* @category ISO Week-Numbering Year Helpers
* @summary Get the number of full ISO week-numbering years between the given dates.
*
* @description
* Get the number of full ISO week-numbering years between the given dates.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - The options
*
* @returns The number of full ISO week-numbering years
*
* @example
* // How many full ISO week-numbering years are between 1 January 2010 and 1 January 2012?
* const result = differenceInISOWeekYears(
*   new Date(2012, 0, 1),
*   new Date(2010, 0, 1)
* )
* // => 1
*/
function differenceInISOWeekYears$1(laterDate, earlierDate, options) {
  var _normalizeDates25 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates26 = _slicedToArray(_normalizeDates25, 2),laterDate_ = _normalizeDates26[0],earlierDate_ = _normalizeDates26[1];
  var sign = compareAsc$1(laterDate_, earlierDate_);
  var diff = Math.abs(differenceInCalendarISOWeekYears$1(laterDate_, earlierDate_, options));
  var adjustedDate = subISOWeekYears$1(laterDate_, sign * diff, options);
  var result = sign * (diff - Number(compareAsc$1(adjustedDate, earlierDate_) === -sign));
  return result === 0 ? 0 : result;
}
//#endregion
//#region dist/date-fns/fp/differenceInISOWeekYears.js
var _differenceInISOWeekYears = convertToFP(differenceInISOWeekYears$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInISOWeekYearsWithOptions.js
var _differenceInISOWeekYearsWithOptions = convertToFP(differenceInISOWeekYears$1, 3);
//#endregion
//#region dist/date-fns/differenceInMilliseconds.js
/**
* @name differenceInMilliseconds
* @category Millisecond Helpers
* @summary Get the number of milliseconds between the given dates.
*
* @description
* Get the number of milliseconds between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
*
* @returns The number of milliseconds
*
* @example
* // How many milliseconds are between
* // 2 July 2014 12:30:20.600 and 2 July 2014 12:30:21.700?
* const result = differenceInMilliseconds(
*   new Date(2014, 6, 2, 12, 30, 21, 700),
*   new Date(2014, 6, 2, 12, 30, 20, 600)
* )
* //=> 1100
*/
function differenceInMilliseconds$1(laterDate, earlierDate) {
  return +toDate$1(laterDate) - +toDate$1(earlierDate);
}
//#endregion
//#region dist/date-fns/fp/differenceInMilliseconds.js
var _differenceInMilliseconds = convertToFP(differenceInMilliseconds$1, 2);
//#endregion
//#region dist/date-fns/differenceInMinutes.js
/**
* The {@link differenceInMinutes} function options.
*/
/**
* @name differenceInMinutes
* @category Minute Helpers
* @summary Get the number of minutes between the given dates.
*
* @description
* Get the signed number of full (rounded towards 0) minutes between the given dates.
*
* @param dateLeft - The later date
* @param dateRight - The earlier date
* @param options - An object with options.
*
* @returns The number of minutes
*
* @example
* // How many minutes are between 2 July 2014 12:07:59 and 2 July 2014 12:20:00?
* const result = differenceInMinutes(
*   new Date(2014, 6, 2, 12, 20, 0),
*   new Date(2014, 6, 2, 12, 7, 59)
* )
* //=> 12
*
* @example
* // How many minutes are between 10:01:59 and 10:00:00
* const result = differenceInMinutes(
*   new Date(2000, 0, 1, 10, 0, 0),
*   new Date(2000, 0, 1, 10, 1, 59)
* )
* //=> -1
*/
function differenceInMinutes$1(dateLeft, dateRight, options) {
  var diff = differenceInMilliseconds$1(dateLeft, dateRight) / millisecondsInMinute;
  return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
}
//#endregion
//#region dist/date-fns/fp/differenceInMinutes.js
var _differenceInMinutes = convertToFP(differenceInMinutes$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInMinutesWithOptions.js
var _differenceInMinutesWithOptions = convertToFP(differenceInMinutes$1, 3);
//#endregion
//#region dist/date-fns/endOfDay.js
/**
* The {@link endOfDay} function options.
*/
/**
* @name endOfDay
* @category Day Helpers
* @summary Return the end of a day for the given date.
*
* @description
* Return the end of a day for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of a day
*
* @example
* // The end of a day for 2 September 2014 11:55:00:
* const result = endOfDay(new Date(2014, 8, 2, 11, 55, 0))
* //=> Tue Sep 02 2014 23:59:59.999
*/
function endOfDay$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/endOfMonth.js
/**
* The {@link endOfMonth} function options.
*/
/**
* @name endOfMonth
* @category Month Helpers
* @summary Return the end of a month for the given date.
*
* @description
* Return the end of a month for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of a month
*
* @example
* // The end of a month for 2 September 2014 11:55:00:
* const result = endOfMonth(new Date(2014, 8, 2, 11, 55, 0))
* //=> Tue Sep 30 2014 23:59:59.999
*/
function endOfMonth$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var month = _date.getMonth();
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/isLastDayOfMonth.js
/**
* @name isLastDayOfMonth
* @category Month Helpers
* @summary Is the given date the last day of a month?
*
* @description
* Is the given date the last day of a month?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is the last day of a month
*
* @example
* // Is 28 February 2014 the last day of a month?
* const result = isLastDayOfMonth(new Date(2014, 1, 28))
* //=> true
*/
function isLastDayOfMonth$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  return +endOfDay$1(_date, options) === +endOfMonth$1(_date, options);
}
//#endregion
//#region dist/date-fns/differenceInMonths.js
/**
* The {@link differenceInMonths} function options.
*/
/**
* @name differenceInMonths
* @category Month Helpers
* @summary Get the number of full months between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of full months
*
* @example
* // How many full months are between 31 January 2014 and 1 September 2014?
* const result = differenceInMonths(new Date(2014, 8, 1), new Date(2014, 0, 31))
* //=> 7
*/
function differenceInMonths$1(laterDate, earlierDate, options) {
  var _normalizeDates27 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, laterDate, earlierDate),_normalizeDates28 = _slicedToArray(_normalizeDates27, 3),laterDate_ = _normalizeDates28[0],workingLaterDate = _normalizeDates28[1],earlierDate_ = _normalizeDates28[2];
  var sign = compareAsc$1(workingLaterDate, earlierDate_);
  var difference = Math.abs(differenceInCalendarMonths$1(workingLaterDate, earlierDate_));
  if (difference < 1) return 0;
  if (workingLaterDate.getMonth() === 1 && workingLaterDate.getDate() > 27) workingLaterDate.setDate(30);
  workingLaterDate.setMonth(workingLaterDate.getMonth() - sign * difference);
  var isLastMonthNotFull = compareAsc$1(workingLaterDate, earlierDate_) === -sign;
  if (isLastDayOfMonth$1(laterDate_) && difference === 1 && compareAsc$1(laterDate_, earlierDate_) === 1) isLastMonthNotFull = false;
  var result = sign * (difference - +isLastMonthNotFull);
  return result === 0 ? 0 : result;
}
//#endregion
//#region dist/date-fns/fp/differenceInMonths.js
var _differenceInMonths = convertToFP(differenceInMonths$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInMonthsWithOptions.js
var _differenceInMonthsWithOptions = convertToFP(differenceInMonths$1, 3);
//#endregion
//#region dist/date-fns/differenceInQuarters.js
/**
* The {@link differenceInQuarters} function options.
*/
/**
* @name differenceInQuarters
* @category Quarter Helpers
* @summary Get the number of quarters between the given dates.
*
* @description
* Get the number of quarters between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options.
*
* @returns The number of full quarters
*
* @example
* // How many full quarters are between 31 December 2013 and 2 July 2014?
* const result = differenceInQuarters(new Date(2014, 6, 2), new Date(2013, 11, 31))
* //=> 2
*/
function differenceInQuarters$1(laterDate, earlierDate, options) {
  var diff = differenceInMonths$1(laterDate, earlierDate, options) / 3;
  return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
}
//#endregion
//#region dist/date-fns/fp/differenceInQuarters.js
var _differenceInQuarters = convertToFP(differenceInQuarters$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInQuartersWithOptions.js
var _differenceInQuartersWithOptions = convertToFP(differenceInQuarters$1, 3);
//#endregion
//#region dist/date-fns/differenceInSeconds.js
/**
* The {@link differenceInSeconds} function options.
*/
/**
* @name differenceInSeconds
* @category Second Helpers
* @summary Get the number of seconds between the given dates.
*
* @description
* Get the number of seconds between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options.
*
* @returns The number of seconds
*
* @example
* // How many seconds are between
* // 2 July 2014 12:30:07.999 and 2 July 2014 12:30:20.000?
* const result = differenceInSeconds(
*   new Date(2014, 6, 2, 12, 30, 20, 0),
*   new Date(2014, 6, 2, 12, 30, 7, 999)
* )
* //=> 12
*/
function differenceInSeconds$1(laterDate, earlierDate, options) {
  var diff = differenceInMilliseconds$1(laterDate, earlierDate) / 1e3;
  return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
}
//#endregion
//#region dist/date-fns/fp/differenceInSeconds.js
var _differenceInSeconds = convertToFP(differenceInSeconds$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInSecondsWithOptions.js
var _differenceInSecondsWithOptions = convertToFP(differenceInSeconds$1, 3);
//#endregion
//#region dist/date-fns/differenceInWeeks.js
/**
* The {@link differenceInWeeks} function options.
*/
/**
* @name differenceInWeeks
* @category Week Helpers
* @summary Get the number of full weeks between the given dates.
*
* @description
* Get the number of full weeks between two dates. Fractional weeks are
* truncated towards zero by default.
*
* One "full week" is the distance between a local time in one day to the same
* local time 7 days earlier or later. A full week can sometimes be less than
* or more than 7*24 hours if a daylight savings change happens between two dates.
*
* To ignore DST and only measure exact 7*24-hour periods, use this instead:
* `Math.trunc(differenceInHours(dateLeft, dateRight)/(7*24))|0`.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of full weeks
*
* @example
* // How many full weeks are between 5 July 2014 and 20 July 2014?
* const result = differenceInWeeks(new Date(2014, 6, 20), new Date(2014, 6, 5))
* //=> 2
*
* @example
* // How many full weeks are between
* // 1 March 2020 0:00 and 6 June 2020 0:00 ?
* // Note: because local time is used, the
* // result will always be 8 weeks (54 days),
* // even if DST starts and the period has
* // only 54*24-1 hours.
* const result = differenceInWeeks(
*   new Date(2020, 5, 1),
*   new Date(2020, 2, 6)
* )
* //=> 8
*/
function differenceInWeeks$1(laterDate, earlierDate, options) {
  var diff = differenceInDays$1(laterDate, earlierDate, options) / 7;
  return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
}
//#endregion
//#region dist/date-fns/fp/differenceInWeeks.js
var _differenceInWeeks = convertToFP(differenceInWeeks$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInWeeksWithOptions.js
var _differenceInWeeksWithOptions = convertToFP(differenceInWeeks$1, 3);
//#endregion
//#region dist/date-fns/differenceInYears.js
/**
* The {@link differenceInYears} function options.
*/
/**
* @name differenceInYears
* @category Year Helpers
* @summary Get the number of full years between the given dates.
*
* @description
* Get the number of full years between the given dates.
*
* @param laterDate - The later date
* @param earlierDate - The earlier date
* @param options - An object with options
*
* @returns The number of full years
*
* @example
* // How many full years are between 31 December 2013 and 11 February 2015?
* const result = differenceInYears(new Date(2015, 1, 11), new Date(2013, 11, 31))
* //=> 1
*/
function differenceInYears$1(laterDate, earlierDate, options) {
  var _normalizeDates29 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates30 = _slicedToArray(_normalizeDates29, 2),laterDate_ = _normalizeDates30[0],earlierDate_ = _normalizeDates30[1];
  var sign = compareAsc$1(laterDate_, earlierDate_);
  var diff = Math.abs(differenceInCalendarYears$1(laterDate_, earlierDate_));
  laterDate_.setFullYear(1584);
  earlierDate_.setFullYear(1584);
  var result = sign * (diff - +(compareAsc$1(laterDate_, earlierDate_) === -sign));
  return result === 0 ? 0 : result;
}
//#endregion
//#region dist/date-fns/fp/differenceInYears.js
var _differenceInYears = convertToFP(differenceInYears$1, 2);
//#endregion
//#region dist/date-fns/fp/differenceInYearsWithOptions.js
var _differenceInYearsWithOptions = convertToFP(differenceInYears$1, 3);
//#endregion
//#region dist/date-fns/_lib/normalizeInterval.js
function normalizeInterval(context, interval) {
  var _normalizeDates31 = normalizeDates(context, interval.start, interval.end),_normalizeDates32 = _slicedToArray(_normalizeDates31, 2),start = _normalizeDates32[0],end = _normalizeDates32[1];
  return {
    start: start,
    end: end
  };
}
//#endregion
//#region dist/date-fns/eachDayOfInterval.js
/**
* The {@link eachDayOfInterval} function options.
*/
/**
* The {@link eachDayOfInterval} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the date argument,
* then the start interval date, and finally the end interval date. If
* a context function is passed, it uses the context function return type.
*/
/**
* @name eachDayOfInterval
* @category Interval Helpers
* @summary Return the array of dates within the specified time interval.
*
* @description
* Return the array of dates within the specified time interval.
*
* @typeParam IntervalType - Interval type.
* @typeParam Options - Options type.
*
* @param interval - The interval.
* @param options - An object with options.
*
* @returns The array with starts of days from the day of the interval start to the day of the interval end
*
* @example
* // Each day between 6 October 2014 and 10 October 2014:
* const result = eachDayOfInterval({
*   start: new Date(2014, 9, 6),
*   end: new Date(2014, 9, 10)
* })
* //=> [
* //   Mon Oct 06 2014 00:00:00,
* //   Tue Oct 07 2014 00:00:00,
* //   Wed Oct 08 2014 00:00:00,
* //   Thu Oct 09 2014 00:00:00,
* //   Fri Oct 10 2014 00:00:00
* // ]
*/
function eachDayOfInterval$1(interval, options) {var _options$step;
  var _normalizeInterval = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval.start,end = _normalizeInterval.end;
  var reversed = +start > +end;
  var endTime = reversed ? +start : +end;
  var date = reversed ? end : start;
  date.setHours(0, 0, 0, 0);
  var step = (_options$step = options === null || options === void 0 ? void 0 : options.step) !== null && _options$step !== void 0 ? _options$step : 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  var dates = [];
  while (+date <= endTime) {
    dates.push(constructFrom$1(start, date));
    date.setDate(date.getDate() + step);
    date.setHours(0, 0, 0, 0);
  }
  return reversed ? dates.reverse() : dates;
}
//#endregion
//#region dist/date-fns/fp/eachDayOfInterval.js
var _eachDayOfInterval = convertToFP(eachDayOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachDayOfIntervalWithOptions.js
var _eachDayOfIntervalWithOptions = convertToFP(eachDayOfInterval$1, 2);
//#endregion
//#region dist/date-fns/eachHourOfInterval.js
/**
* The {@link eachHourOfInterval} function options.
*/
/**
* The {@link eachHourOfInterval} function result type.
* Resolves to the appropriate date type based on inputs.
*/
/**
* @name eachHourOfInterval
* @category Interval Helpers
* @summary Return the array of hours within the specified time interval.
*
* @description
* Return the array of hours within the specified time interval.
*
* @typeParam IntervalType - Interval type.
* @typeParam Options - Options type.
*
* @param interval - The interval.
* @param options - An object with options.
*
* @returns The array with starts of hours from the hour of the interval start to the hour of the interval end
*
* @example
* // Each hour between 6 October 2014, 12:00 and 6 October 2014, 15:00
* const result = eachHourOfInterval({
*   start: new Date(2014, 9, 6, 12),
*   end: new Date(2014, 9, 6, 15)
* });
* //=> [
* //   Mon Oct 06 2014 12:00:00,
* //   Mon Oct 06 2014 13:00:00,
* //   Mon Oct 06 2014 14:00:00,
* //   Mon Oct 06 2014 15:00:00
* // ]
*/
function eachHourOfInterval$1(interval, options) {var _options$step2;
  var _normalizeInterval2 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval2.start,end = _normalizeInterval2.end;
  var reversed = +start > +end;
  var endTime = reversed ? +start : +end;
  var date = reversed ? end : start;
  date.setMinutes(0, 0, 0);
  var step = (_options$step2 = options === null || options === void 0 ? void 0 : options.step) !== null && _options$step2 !== void 0 ? _options$step2 : 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  var dates = [];
  while (+date <= endTime) {
    dates.push(constructFrom$1(start, date));
    date.setHours(date.getHours() + step);
  }
  return reversed ? dates.reverse() : dates;
}
//#endregion
//#region dist/date-fns/fp/eachHourOfInterval.js
var _eachHourOfInterval = convertToFP(eachHourOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachHourOfIntervalWithOptions.js
var _eachHourOfIntervalWithOptions = convertToFP(eachHourOfInterval$1, 2);
//#endregion
//#region dist/date-fns/eachMinuteOfInterval.js
/**
* The {@link eachMinuteOfInterval} function options.
*/
/**
* The {@link eachMinuteOfInterval} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the date argument,
* then the start interval date, and finally the end interval date. If
* a context function is passed, it uses the context function return type.
*/
/**
* @name eachMinuteOfInterval
* @category Interval Helpers
* @summary Return the array of minutes within the specified time interval.
*
* @description
* Returns the array of minutes within the specified time interval.
*
* @typeParam IntervalType - Interval type.
* @typeParam Options - Options type.
*
* @param interval - The interval.
* @param options - An object with options.
*
* @returns The array with starts of minutes from the minute of the interval start to the minute of the interval end
*
* @example
* // Each minute between 14 October 2020, 13:00 and 14 October 2020, 13:03
* const result = eachMinuteOfInterval({
*   start: new Date(2014, 9, 14, 13),
*   end: new Date(2014, 9, 14, 13, 3)
* })
* //=> [
* //   Wed Oct 14 2014 13:00:00,
* //   Wed Oct 14 2014 13:01:00,
* //   Wed Oct 14 2014 13:02:00,
* //   Wed Oct 14 2014 13:03:00
* // ]
*/
function eachMinuteOfInterval$1(interval, options) {var _options$step3;
  var _normalizeInterval3 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval3.start,end = _normalizeInterval3.end;
  start.setSeconds(0, 0);
  var reversed = +start > +end;
  var endTime = reversed ? +start : +end;
  var date = reversed ? end : start;
  var step = (_options$step3 = options === null || options === void 0 ? void 0 : options.step) !== null && _options$step3 !== void 0 ? _options$step3 : 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  var dates = [];
  while (+date <= endTime) {
    dates.push(constructFrom$1(start, date));
    date = addMinutes$1(date, step);
  }
  return reversed ? dates.reverse() : dates;
}
//#endregion
//#region dist/date-fns/fp/eachMinuteOfInterval.js
var _eachMinuteOfInterval = convertToFP(eachMinuteOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachMinuteOfIntervalWithOptions.js
var _eachMinuteOfIntervalWithOptions = convertToFP(eachMinuteOfInterval$1, 2);
//#endregion
//#region dist/date-fns/eachMonthOfInterval.js
/**
* The {@link eachMonthOfInterval} function options.
*/
/**
* The {@link eachMonthOfInterval} function result type. It resolves the proper data type.
*/
/**
* @name eachMonthOfInterval
* @category Interval Helpers
* @summary Return the array of months within the specified time interval.
*
* @description
* Return the array of months within the specified time interval.
*
* @typeParam IntervalType - Interval type.
* @typeParam Options - Options type.
*
* @param interval - The interval.
* @param options - An object with options.
*
* @returns The array with starts of months from the month of the interval start to the month of the interval end
*
* @example
* // Each month between 6 February 2014 and 10 August 2014:
* const result = eachMonthOfInterval({
*   start: new Date(2014, 1, 6),
*   end: new Date(2014, 7, 10)
* })
* //=> [
* //   Sat Feb 01 2014 00:00:00,
* //   Sat Mar 01 2014 00:00:00,
* //   Tue Apr 01 2014 00:00:00,
* //   Thu May 01 2014 00:00:00,
* //   Sun Jun 01 2014 00:00:00,
* //   Tue Jul 01 2014 00:00:00,
* //   Fri Aug 01 2014 00:00:00
* // ]
*/
function eachMonthOfInterval$1(interval, options) {var _options$step4;
  var _normalizeInterval4 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval4.start,end = _normalizeInterval4.end;
  var reversed = +start > +end;
  var endTime = reversed ? +start : +end;
  var date = reversed ? end : start;
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  var step = (_options$step4 = options === null || options === void 0 ? void 0 : options.step) !== null && _options$step4 !== void 0 ? _options$step4 : 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  var dates = [];
  while (+date <= endTime) {
    dates.push(constructFrom$1(start, date));
    date.setMonth(date.getMonth() + step);
  }
  return reversed ? dates.reverse() : dates;
}
//#endregion
//#region dist/date-fns/fp/eachMonthOfInterval.js
var _eachMonthOfInterval = convertToFP(eachMonthOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachMonthOfIntervalWithOptions.js
var _eachMonthOfIntervalWithOptions = convertToFP(eachMonthOfInterval$1, 2);
//#endregion
//#region dist/date-fns/startOfQuarter.js
/**
* The {@link startOfQuarter} function options.
*/
/**
* @name startOfQuarter
* @category Quarter Helpers
* @summary Return the start of a year quarter for the given date.
*
* @description
* Return the start of a year quarter for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - The options
*
* @returns The start of a quarter
*
* @example
* // The start of a quarter for 2 September 2014 11:55:00:
* const result = startOfQuarter(new Date(2014, 8, 2, 11, 55, 0))
* //=> Tue Jul 01 2014 00:00:00
*/
function startOfQuarter$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var currentMonth = _date.getMonth();
  var month = currentMonth - currentMonth % 3;
  _date.setMonth(month, 1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
//#endregion
//#region dist/date-fns/eachQuarterOfInterval.js
/**
* The {@link eachQuarterOfInterval} function options.
*/
/**
* The {@link eachQuarterOfInterval} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the date argument,
* then the start interval date, and finally the end interval date. If
* a context function is passed, it uses the context function return type.
*/
/**
* @name eachQuarterOfInterval
* @category Interval Helpers
* @summary Return the array of quarters within the specified time interval.
*
* @description
* Return the array of quarters within the specified time interval.
*
* @typeParam IntervalType - Interval type.
* @typeParam Options - Options type.
*
* @param interval - The interval
* @param options - An object with options
*
* @returns The array with starts of quarters from the quarter of the interval start to the quarter of the interval end
*
* @example
* // Each quarter within interval 6 February 2014 - 10 August 2014:
* const result = eachQuarterOfInterval({
*   start: new Date(2014, 1, 6),
*   end: new Date(2014, 7, 10),
* })
* //=> [
* //   Wed Jan 01 2014 00:00:00,
* //   Tue Apr 01 2014 00:00:00,
* //   Tue Jul 01 2014 00:00:00,
* // ]
*/
function eachQuarterOfInterval$1(interval, options) {var _options$step5;
  var _normalizeInterval5 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval5.start,end = _normalizeInterval5.end;
  var reversed = +start > +end;
  var endTime = reversed ? +startOfQuarter$1(start) : +startOfQuarter$1(end);
  var date = reversed ? startOfQuarter$1(end) : startOfQuarter$1(start);
  var step = (_options$step5 = options === null || options === void 0 ? void 0 : options.step) !== null && _options$step5 !== void 0 ? _options$step5 : 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  var dates = [];
  while (+date <= endTime) {
    dates.push(constructFrom$1(start, date));
    date = addQuarters$1(date, step);
  }
  return reversed ? dates.reverse() : dates;
}
//#endregion
//#region dist/date-fns/fp/eachQuarterOfInterval.js
var _eachQuarterOfInterval = convertToFP(eachQuarterOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachQuarterOfIntervalWithOptions.js
var _eachQuarterOfIntervalWithOptions = convertToFP(eachQuarterOfInterval$1, 2);
//#endregion
//#region dist/date-fns/eachWeekOfInterval.js
/**
* The {@link eachWeekOfInterval} function options.
*/
/**
* The {@link eachWeekOfInterval} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the interval start date,
* then the end interval date. If a context function is passed, it uses the context function return type.
*/
/**
* @name eachWeekOfInterval
* @category Interval Helpers
* @summary Return the array of weeks within the specified time interval.
*
* @description
* Return the array of weeks within the specified time interval.
*
* @param interval - The interval.
* @param options - An object with options.
*
* @returns The array with starts of weeks from the week of the interval start to the week of the interval end
*
* @example
* // Each week within interval 6 October 2014 - 23 November 2014:
* const result = eachWeekOfInterval({
*   start: new Date(2014, 9, 6),
*   end: new Date(2014, 10, 23)
* })
* //=> [
* //   Sun Oct 05 2014 00:00:00,
* //   Sun Oct 12 2014 00:00:00,
* //   Sun Oct 19 2014 00:00:00,
* //   Sun Oct 26 2014 00:00:00,
* //   Sun Nov 02 2014 00:00:00,
* //   Sun Nov 09 2014 00:00:00,
* //   Sun Nov 16 2014 00:00:00,
* //   Sun Nov 23 2014 00:00:00
* // ]
*/
function eachWeekOfInterval$1(interval, options) {var _options$step6;
  var _normalizeInterval6 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval6.start,end = _normalizeInterval6.end;
  var reversed = +start > +end;
  var startDateWeek = reversed ? startOfWeek$1(end, options) : startOfWeek$1(start, options);
  var endDateWeek = reversed ? startOfWeek$1(start, options) : startOfWeek$1(end, options);
  startDateWeek.setHours(15);
  endDateWeek.setHours(15);
  var endTime = +endDateWeek.getTime();
  var currentDate = startDateWeek;
  var step = (_options$step6 = options === null || options === void 0 ? void 0 : options.step) !== null && _options$step6 !== void 0 ? _options$step6 : 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  var dates = [];
  while (+currentDate <= endTime) {
    currentDate.setHours(0);
    dates.push(constructFrom$1(start, currentDate));
    currentDate = addWeeks$1(currentDate, step);
    currentDate.setHours(15);
  }
  return reversed ? dates.reverse() : dates;
}
//#endregion
//#region dist/date-fns/fp/eachWeekOfInterval.js
var _eachWeekOfInterval = convertToFP(eachWeekOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachWeekOfIntervalWithOptions.js
var _eachWeekOfIntervalWithOptions = convertToFP(eachWeekOfInterval$1, 2);
//#endregion
//#region dist/date-fns/eachWeekendOfInterval.js
/**
* The {@link eachWeekendOfInterval} function options.
*/
/**
* The {@link eachWeekendOfInterval} function result type.
*/
/**
* @name eachWeekendOfInterval
* @category Interval Helpers
* @summary List all the Saturdays and Sundays in the given date interval.
*
* @description
* Get all the Saturdays and Sundays in the given date interval.
*
* @typeParam IntervalType - Interval type.
* @typeParam Options - Options type.
*
* @param interval - The given interval
* @param options - An object with options
*
* @returns An array containing all the Saturdays and Sundays
*
* @example
* // Lists all Saturdays and Sundays in the given date interval
* const result = eachWeekendOfInterval({
*   start: new Date(2018, 8, 17),
*   end: new Date(2018, 8, 30)
* })
* //=> [
* //   Sat Sep 22 2018 00:00:00,
* //   Sun Sep 23 2018 00:00:00,
* //   Sat Sep 29 2018 00:00:00,
* //   Sun Sep 30 2018 00:00:00
* // ]
*/
function eachWeekendOfInterval$1(interval, options) {
  var _normalizeInterval7 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval7.start,end = _normalizeInterval7.end;
  var dateInterval = eachDayOfInterval$1({
    start: start,
    end: end
  }, options);
  var weekends = [];
  var index = 0;
  while (index < dateInterval.length) {
    var date = dateInterval[index++];
    if (isWeekend$1(date)) weekends.push(constructFrom$1(start, date));
  }
  return weekends;
}
//#endregion
//#region dist/date-fns/fp/eachWeekendOfInterval.js
var _eachWeekendOfInterval = convertToFP(eachWeekendOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachWeekendOfIntervalWithOptions.js
var _eachWeekendOfIntervalWithOptions = convertToFP(eachWeekendOfInterval$1, 2);
//#endregion
//#region dist/date-fns/startOfMonth.js
/**
* The {@link startOfMonth} function options.
*/
/**
* @name startOfMonth
* @category Month Helpers
* @summary Return the start of a month for the given date.
*
* @description
* Return the start of a month for the given date. The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments.
* Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed,
* or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of a month
*
* @example
* // The start of a month for 2 September 2014 11:55:00:
* const result = startOfMonth(new Date(2014, 8, 2, 11, 55, 0))
* //=> Mon Sep 01 2014 00:00:00
*/
function startOfMonth$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setDate(1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
//#endregion
//#region dist/date-fns/eachWeekendOfMonth.js
/**
* The {@link eachWeekendOfMonth} function options.
*/
/**
* @name eachWeekendOfMonth
* @category Month Helpers
* @summary List all the Saturdays and Sundays in the given month.
*
* @description
* Get all the Saturdays and Sundays in the given month.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The given month
* @param options - An object with options
*
* @returns An array containing all the Saturdays and Sundays
*
* @example
* // Lists all Saturdays and Sundays in the given month
* const result = eachWeekendOfMonth(new Date(2022, 1, 1))
* //=> [
* //   Sat Feb 05 2022 00:00:00,
* //   Sun Feb 06 2022 00:00:00,
* //   Sat Feb 12 2022 00:00:00,
* //   Sun Feb 13 2022 00:00:00,
* //   Sat Feb 19 2022 00:00:00,
* //   Sun Feb 20 2022 00:00:00,
* //   Sat Feb 26 2022 00:00:00,
* //   Sun Feb 27 2022 00:00:00
* // ]
*/
function eachWeekendOfMonth$1(date, options) {
  return eachWeekendOfInterval$1({
    start: startOfMonth$1(date, options),
    end: endOfMonth$1(date, options)
  }, options);
}
//#endregion
//#region dist/date-fns/fp/eachWeekendOfMonth.js
var _eachWeekendOfMonth = convertToFP(eachWeekendOfMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/eachWeekendOfMonthWithOptions.js
var _eachWeekendOfMonthWithOptions = convertToFP(eachWeekendOfMonth$1, 2);
//#endregion
//#region dist/date-fns/endOfYear.js
/**
* The {@link endOfYear} function options.
*/
/**
* @name endOfYear
* @category Year Helpers
* @summary Return the end of a year for the given date.
*
* @description
* Return the end of a year for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - The options
*
* @returns The end of a year
*
* @example
* // The end of a year for 2 September 2014 11:55:00:
* const result = endOfYear(new Date(2014, 8, 2, 11, 55, 0))
* //=> Wed Dec 31 2014 23:59:59.999
*/
function endOfYear$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  _date.setFullYear(year + 1, 0, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/startOfYear.js
/**
* The {@link startOfYear} function options.
*/
/**
* @name startOfYear
* @category Year Helpers
* @summary Return the start of a year for the given date.
*
* @description
* Return the start of a year for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - The options
*
* @returns The start of a year
*
* @example
* // The start of a year for 2 September 2014 11:55:00:
* const result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
* //=> Wed Jan 01 2014 00:00:00
*/
function startOfYear$1(date, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}
//#endregion
//#region dist/date-fns/eachWeekendOfYear.js
/**
* The {@link eachWeekendOfYear} function options.
*/
/**
* @name eachWeekendOfYear
* @category Year Helpers
* @summary List all the Saturdays and Sundays in the year.
*
* @description
* Get all the Saturdays and Sundays in the year.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The given year
* @param options - An object with options
*
* @returns An array containing all the Saturdays and Sundays
*
* @example
* // Lists all Saturdays and Sundays in the year
* const result = eachWeekendOfYear(new Date(2020, 1, 1))
* //=> [
* //   Sat Jan 03 2020 00:00:00,
* //   Sun Jan 04 2020 00:00:00,
* //   ...
* //   Sun Dec 27 2020 00:00:00
* // ]
* ]
*/
function eachWeekendOfYear$1(date, options) {
  return eachWeekendOfInterval$1({
    start: startOfYear$1(date, options),
    end: endOfYear$1(date, options)
  }, options);
}
//#endregion
//#region dist/date-fns/fp/eachWeekendOfYear.js
var _eachWeekendOfYear = convertToFP(eachWeekendOfYear$1, 1);
//#endregion
//#region dist/date-fns/fp/eachWeekendOfYearWithOptions.js
var _eachWeekendOfYearWithOptions = convertToFP(eachWeekendOfYear$1, 2);
//#endregion
//#region dist/date-fns/eachYearOfInterval.js
/**
* The {@link eachYearOfInterval} function options.
*/
/**
* The {@link eachYearOfInterval} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the date argument,
* then the start interval date, and finally the end interval date. If
* a context function is passed, it uses the context function return type.
*/
/**
* @name eachYearOfInterval
* @category Interval Helpers
* @summary Return the array of yearly timestamps within the specified time interval.
*
* @description
* Return the array of yearly timestamps within the specified time interval.
*
* @typeParam IntervalType - Interval type.
* @typeParam Options - Options type.
*
* @param interval - The interval.
* @param options - An object with options.
*
* @returns The array with starts of yearly timestamps from the month of the interval start to the month of the interval end
*
* @example
* // Each year between 6 February 2014 and 10 August 2017:
* const result = eachYearOfInterval({
*   start: new Date(2014, 1, 6),
*   end: new Date(2017, 7, 10)
* })
* //=> [
* //   Wed Jan 01 2014 00:00:00,
* //   Thu Jan 01 2015 00:00:00,
* //   Fri Jan 01 2016 00:00:00,
* //   Sun Jan 01 2017 00:00:00
* // ]
*/
function eachYearOfInterval$1(interval, options) {var _options$step7;
  var _normalizeInterval8 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval8.start,end = _normalizeInterval8.end;
  var reversed = +start > +end;
  var endTime = reversed ? +start : +end;
  var date = reversed ? end : start;
  date.setHours(0, 0, 0, 0);
  date.setMonth(0, 1);
  var step = (_options$step7 = options === null || options === void 0 ? void 0 : options.step) !== null && _options$step7 !== void 0 ? _options$step7 : 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }
  var dates = [];
  while (+date <= endTime) {
    dates.push(constructFrom$1(start, date));
    date.setFullYear(date.getFullYear() + step);
  }
  return reversed ? dates.reverse() : dates;
}
//#endregion
//#region dist/date-fns/fp/eachYearOfInterval.js
var _eachYearOfInterval = convertToFP(eachYearOfInterval$1, 1);
//#endregion
//#region dist/date-fns/fp/eachYearOfIntervalWithOptions.js
var _eachYearOfIntervalWithOptions = convertToFP(eachYearOfInterval$1, 2);
//#endregion
//#region dist/date-fns/fp/endOfDay.js
var _endOfDay = convertToFP(endOfDay$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfDayWithOptions.js
var _endOfDayWithOptions = convertToFP(endOfDay$1, 2);
//#endregion
//#region dist/date-fns/endOfDecade.js
/**
* The {@link endOfDecade} function options.
*/
/**
* @name endOfDecade
* @category Decade Helpers
* @summary Return the end of a decade for the given date.
*
* @description
* Return the end of a decade for the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of a decade
*
* @example
* // The end of a decade for 12 May 1984 00:00:00:
* const result = endOfDecade(new Date(1984, 4, 12, 00, 00, 00))
* //=> Dec 31 1989 23:59:59.999
*/
function endOfDecade$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  var decade = 9 + Math.floor(year / 10) * 10;
  _date.setFullYear(decade, 11, 31);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/endOfDecade.js
var _endOfDecade = convertToFP(endOfDecade$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfDecadeWithOptions.js
var _endOfDecadeWithOptions = convertToFP(endOfDecade$1, 2);
//#endregion
//#region dist/date-fns/endOfHour.js
/**
* The {@link endOfHour} function options.
*/
/**
* @name endOfHour
* @category Hour Helpers
* @summary Return the end of an hour for the given date.
*
* @description
* Return the end of an hour for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of an hour
*
* @example
* // The end of an hour for 2 September 2014 11:55:00:
* const result = endOfHour(new Date(2014, 8, 2, 11, 55))
* //=> Tue Sep 02 2014 11:59:59.999
*/
function endOfHour$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setMinutes(59, 59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/endOfHour.js
var _endOfHour = convertToFP(endOfHour$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfHourWithOptions.js
var _endOfHourWithOptions = convertToFP(endOfHour$1, 2);
//#endregion
//#region dist/date-fns/endOfWeek.js
/**
* The {@link endOfWeek} function options.
*/
/**
* @name endOfWeek
* @category Week Helpers
* @summary Return the end of a week for the given date.
*
* @description
* Return the end of a week for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of a week
*
* @example
* // The end of a week for 2 September 2014 11:55:00:
* const result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0))
* //=> Sat Sep 06 2014 23:59:59.999
*
* @example
* // If the week starts on Monday, the end of the week for 2 September 2014 11:55:00:
* const result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
* //=> Sun Sep 07 2014 23:59:59.999
*/
function endOfWeek$1(date, options) {var _ref4, _ref5, _ref6, _options$weekStartsOn2, _options$locale2, _defaultOptions$local2;
  var defaultOptions = getDefaultOptions$1();
  var weekStartsOn = (_ref4 = (_ref5 = (_ref6 = (_options$weekStartsOn2 = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn2 !== void 0 ? _options$weekStartsOn2 : options === null || options === void 0 || (_options$locale2 = options.locale) === null || _options$locale2 === void 0 || (_options$locale2 = _options$locale2.options) === null || _options$locale2 === void 0 ? void 0 : _options$locale2.weekStartsOn) !== null && _ref6 !== void 0 ? _ref6 : defaultOptions.weekStartsOn) !== null && _ref5 !== void 0 ? _ref5 : (_defaultOptions$local2 = defaultOptions.locale) === null || _defaultOptions$local2 === void 0 || (_defaultOptions$local2 = _defaultOptions$local2.options) === null || _defaultOptions$local2 === void 0 ? void 0 : _defaultOptions$local2.weekStartsOn) !== null && _ref4 !== void 0 ? _ref4 : 0;
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var day = _date.getDay();
  var diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);
  _date.setDate(_date.getDate() + diff);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/endOfISOWeek.js
/**
* The {@link endOfISOWeek} function options.
*/
/**
* @name endOfISOWeek
* @category ISO Week Helpers
* @summary Return the end of an ISO week for the given date.
*
* @description
* Return the end of an ISO week for the given date.
* The result will be in the local timezone.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of an ISO week
*
* @example
* // The end of an ISO week for 2 September 2014 11:55:00:
* const result = endOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
* //=> Sun Sep 07 2014 23:59:59.999
*/
function endOfISOWeek$1(date, options) {
  return endOfWeek$1(date, _objectSpread(_objectSpread({},
  options), {}, {
    weekStartsOn: 1 })
  );
}
//#endregion
//#region dist/date-fns/fp/endOfISOWeek.js
var _endOfISOWeek = convertToFP(endOfISOWeek$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfISOWeekWithOptions.js
var _endOfISOWeekWithOptions = convertToFP(endOfISOWeek$1, 2);
//#endregion
//#region dist/date-fns/endOfISOWeekYear.js
/**
* The {@link endOfISOWeekYear} function options.
*/
/**
* @name endOfISOWeekYear
* @category ISO Week-Numbering Year Helpers
* @summary Return the end of an ISO week-numbering year for the given date.
*
* @description
* Return the end of an ISO week-numbering year,
* which always starts 3 days before the year's first Thursday.
* The result will be in the local timezone.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ContextDate - The `Date` type of the context function.
*
* @param date - The original date
* @param options - The options
*
* @returns The end of an ISO week-numbering year
*
* @example
* // The end of an ISO week-numbering year for 2 July 2005:
* const result = endOfISOWeekYear(new Date(2005, 6, 2))
* //=> Sun Jan 01 2006 23:59:59.999
*/
function endOfISOWeekYear$1(date, options) {
  var year = getISOWeekYear$1(date, options);
  var fourthOfJanuaryOfNextYear = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  var _date = startOfISOWeek$1(fourthOfJanuaryOfNextYear, options);
  _date.setMilliseconds(_date.getMilliseconds() - 1);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/endOfISOWeekYear.js
var _endOfISOWeekYear = convertToFP(endOfISOWeekYear$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfISOWeekYearWithOptions.js
var _endOfISOWeekYearWithOptions = convertToFP(endOfISOWeekYear$1, 2);
//#endregion
//#region dist/date-fns/endOfMinute.js
/**
* The {@link endOfMinute} function options.
*/
/**
* @name endOfMinute
* @category Minute Helpers
* @summary Return the end of a minute for the given date.
*
* @description
* Return the end of a minute for the given date.
* The result will be in the local timezone or the provided context.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of a minute
*
* @example
* // The end of a minute for 1 December 2014 22:15:45.400:
* const result = endOfMinute(new Date(2014, 11, 1, 22, 15, 45, 400))
* //=> Mon Dec 01 2014 22:15:59.999
*/
function endOfMinute$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setSeconds(59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/endOfMinute.js
var _endOfMinute = convertToFP(endOfMinute$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfMinuteWithOptions.js
var _endOfMinuteWithOptions = convertToFP(endOfMinute$1, 2);
//#endregion
//#region dist/date-fns/fp/endOfMonth.js
var _endOfMonth = convertToFP(endOfMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfMonthWithOptions.js
var _endOfMonthWithOptions = convertToFP(endOfMonth$1, 2);
//#endregion
//#region dist/date-fns/endOfQuarter.js
/**
* The {@link endOfQuarter} function options.
*/
/**
* @name endOfQuarter
* @category Quarter Helpers
* @summary Return the end of a year quarter for the given date.
*
* @description
* Return the end of a year quarter for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of a quarter
*
* @example
* // The end of a quarter for 2 September 2014 11:55:00:
* const result = endOfQuarter(new Date(2014, 8, 2, 11, 55, 0))
* //=> Tue Sep 30 2014 23:59:59.999
*/
function endOfQuarter$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var currentMonth = _date.getMonth();
  var month = currentMonth - currentMonth % 3 + 3;
  _date.setMonth(month, 0);
  _date.setHours(23, 59, 59, 999);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/endOfQuarter.js
var _endOfQuarter = convertToFP(endOfQuarter$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfQuarterWithOptions.js
var _endOfQuarterWithOptions = convertToFP(endOfQuarter$1, 2);
//#endregion
//#region dist/date-fns/endOfSecond.js
/**
* The {@link endOfSecond} function options.
*/
/**
* @name endOfSecond
* @category Second Helpers
* @summary Return the end of a second for the given date.
*
* @description
* Return the end of a second for the given date.
* The result will be in the local timezone if no `in` option is specified.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of a second
*
* @example
* // The end of a second for 1 December 2014 22:15:45.400:
* const result = endOfSecond(new Date(2014, 11, 1, 22, 15, 45, 400))
* //=> Mon Dec 01 2014 22:15:45.999
*/
function endOfSecond$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setMilliseconds(999);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/endOfSecond.js
var _endOfSecond = convertToFP(endOfSecond$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfSecondWithOptions.js
var _endOfSecondWithOptions = convertToFP(endOfSecond$1, 2);
//#endregion
//#region dist/date-fns/fp/endOfWeek.js
var _endOfWeek = convertToFP(endOfWeek$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfWeekWithOptions.js
var _endOfWeekWithOptions = convertToFP(endOfWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/endOfYear.js
var _endOfYear = convertToFP(endOfYear$1, 1);
//#endregion
//#region dist/date-fns/fp/endOfYearWithOptions.js
var _endOfYearWithOptions = convertToFP(endOfYear$1, 2);
//#endregion
//#region dist/date-fns/locale/en-US/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance$2 = function formatDistance$2(token, count, options) {
  var result;
  var tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") result = tokenValue;else
  if (count === 1) result = tokenValue.one;else
  result = tokenValue.other.replace("{{count}}", count.toString());
  if (options !== null && options !== void 0 && options.addSuffix) if (options.comparison && options.comparison > 0) return "in " + result;else
  return result + " ago";
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
      full: "EEEE, MMMM do, y",
      long: "MMMM do, y",
      medium: "MMM d, y",
      short: "MM/dd/yyyy"
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
      full: "{{date}} 'at' {{time}}",
      long: "{{date}} 'at' {{time}}",
      medium: "{{date}}, {{time}}",
      short: "{{date}}, {{time}}"
    },
    defaultWidth: "full"
  })
};
//#endregion
//#region dist/date-fns/locale/en-US/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative$2 = function formatRelative$2(token, _date, _baseDate, _options) {return formatRelativeLocale[token];};
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
//#region dist/date-fns/locale/en-US/_lib/localize.js
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
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
  "1st quarter",
  "2nd quarter",
  "3rd quarter",
  "4th quarter"]

};
var monthValues = {
  narrow: [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D"],

  abbreviated: [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"],

  wide: [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"]

};
var dayValues = {
  narrow: [
  "S",
  "M",
  "T",
  "W",
  "T",
  "F",
  "S"],

  short: [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa"],

  abbreviated: [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"],

  wide: [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"]

};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = function ordinalNumber(dirtyNumber, _options) {
  var number = Number(dirtyNumber);
  var rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) switch (rem100 % 10) {
    case 1:return number + "st";
    case 2:return number + "nd";
    case 3:return number + "rd";
  }
  return number + "th";
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
//#region dist/date-fns/locale/en-US.js
/**
* @category Locales
* @summary English locale (United States).
* @language English
* @iso-639-2 eng
* @author Sasha Koss [@kossnocorp](https://github.com/kossnocorp)
* @author Lesha Koss [@leshakoss](https://github.com/leshakoss)
*/
var enUS = {
  code: "en-US",
  formatDistance: formatDistance$2,
  formatLong: formatLong,
  formatRelative: formatRelative$2,
  localize: localize,
  match: {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: /^(\d+)(th|st|nd|rd)?/i,
      parsePattern: /\d+/i,
      valueCallback: function valueCallback(value) {return parseInt(value, 10);}
    }),
    era: buildMatchFn({
      matchPatterns: {
        narrow: /^(b|a)/i,
        abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
        wide: /^(before christ|before common era|anno domini|common era)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: { any: [/^b/i, /^(a|c)/i] },
      defaultParseWidth: "any"
    }),
    quarter: buildMatchFn({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](th|st|nd|rd)? quarter/i
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
        narrow: /^[jfmasond]/i,
        abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
        wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^j/i,
        /^f/i,
        /^m/i,
        /^a/i,
        /^m/i,
        /^j/i,
        /^j/i,
        /^a/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i],

        any: [
        /^ja/i,
        /^f/i,
        /^mar/i,
        /^ap/i,
        /^may/i,
        /^jun/i,
        /^jul/i,
        /^au/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i]

      },
      defaultParseWidth: "any"
    }),
    day: buildMatchFn({
      matchPatterns: {
        narrow: /^[smtwf]/i,
        short: /^(su|mo|tu|we|th|fr|sa)/i,
        abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
        wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
      },
      defaultMatchWidth: "wide",
      parsePatterns: {
        narrow: [
        /^s/i,
        /^m/i,
        /^t/i,
        /^w/i,
        /^t/i,
        /^f/i,
        /^s/i],

        any: [
        /^su/i,
        /^m/i,
        /^tu/i,
        /^w/i,
        /^th/i,
        /^f/i,
        /^sa/i]

      },
      defaultParseWidth: "any"
    }),
    dayPeriod: buildMatchFn({
      matchPatterns: {
        narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
        any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
      },
      defaultMatchWidth: "any",
      parsePatterns: { any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^mi/i,
          noon: /^no/i,
          morning: /morning/i,
          afternoon: /afternoon/i,
          evening: /evening/i,
          night: /night/i
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
//#region dist/date-fns/getDayOfYear.js
/**
* The {@link getDayOfYear} function options.
*/
/**
* @name getDayOfYear
* @category Day Helpers
* @summary Get the day of the year of the given date.
*
* @description
* Get the day of the year of the given date.
*
* @param date - The given date
* @param options - The options
*
* @returns The day of year
*
* @example
* // Which day of the year is 2 July 2014?
* const result = getDayOfYear(new Date(2014, 6, 2))
* //=> 183
*/
function getDayOfYear$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  return differenceInCalendarDays$1(_date, startOfYear$1(_date)) + 1;
}
//#endregion
//#region dist/date-fns/getISOWeek.js
/**
* The {@link getISOWeek} function options.
*/
/**
* @name getISOWeek
* @category ISO Week Helpers
* @summary Get the ISO week of the given date.
*
* @description
* Get the ISO week of the given date.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param date - The given date
* @param options - The options
*
* @returns The ISO week
*
* @example
* // Which week of the ISO-week numbering year is 2 January 2005?
* const result = getISOWeek(new Date(2005, 0, 2))
* //=> 53
*/
function getISOWeek$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var diff = +startOfISOWeek$1(_date) - +startOfISOWeekYear$1(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}
//#endregion
//#region dist/date-fns/getWeekYear.js
/**
* The {@link getWeekYear} function options.
*/
/**
* @name getWeekYear
* @category Week-Numbering Year Helpers
* @summary Get the local week-numbering year of the given date.
*
* @description
* Get the local week-numbering year of the given date.
* The exact calculation depends on the values of
* `options.weekStartsOn` (which is the index of the first day of the week)
* and `options.firstWeekContainsDate` (which is the day of January, which is always in
* the first week of the week-numbering year)
*
* Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
*
* @param date - The given date
* @param options - An object with options.
*
* @returns The local week-numbering year
*
* @example
* // Which week numbering year is 26 December 2004 with the default settings?
* const result = getWeekYear(new Date(2004, 11, 26))
* //=> 2005
*
* @example
* // Which week numbering year is 26 December 2004 if week starts on Saturday?
* const result = getWeekYear(new Date(2004, 11, 26), { weekStartsOn: 6 })
* //=> 2004
*
* @example
* // Which week numbering year is 26 December 2004 if the first week contains 4 January?
* const result = getWeekYear(new Date(2004, 11, 26), { firstWeekContainsDate: 4 })
* //=> 2004
*/
function getWeekYear$1(date, options) {var _ref7, _ref8, _ref9, _options$firstWeekCon, _options$locale3, _defaultOptions$local3;
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  var defaultOptions = getDefaultOptions$1();
  var firstWeekContainsDate = (_ref7 = (_ref8 = (_ref9 = (_options$firstWeekCon = options === null || options === void 0 ? void 0 : options.firstWeekContainsDate) !== null && _options$firstWeekCon !== void 0 ? _options$firstWeekCon : options === null || options === void 0 || (_options$locale3 = options.locale) === null || _options$locale3 === void 0 || (_options$locale3 = _options$locale3.options) === null || _options$locale3 === void 0 ? void 0 : _options$locale3.firstWeekContainsDate) !== null && _ref9 !== void 0 ? _ref9 : defaultOptions.firstWeekContainsDate) !== null && _ref8 !== void 0 ? _ref8 : (_defaultOptions$local3 = defaultOptions.locale) === null || _defaultOptions$local3 === void 0 || (_defaultOptions$local3 = _defaultOptions$local3.options) === null || _defaultOptions$local3 === void 0 ? void 0 : _defaultOptions$local3.firstWeekContainsDate) !== null && _ref7 !== void 0 ? _ref7 : 1;
  var firstWeekOfNextYear = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  var startOfNextYear = startOfWeek$1(firstWeekOfNextYear, options);
  var firstWeekOfThisYear = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  var startOfThisYear = startOfWeek$1(firstWeekOfThisYear, options);
  if (+_date >= +startOfNextYear) return year + 1;else
  if (+_date >= +startOfThisYear) return year;else
  return year - 1;
}
//#endregion
//#region dist/date-fns/startOfWeekYear.js
/**
* The {@link startOfWeekYear} function options.
*/
/**
* @name startOfWeekYear
* @category Week-Numbering Year Helpers
* @summary Return the start of a local week-numbering year for the given date.
*
* @description
* Return the start of a local week-numbering year.
* The exact calculation depends on the values of
* `options.weekStartsOn` (which is the index of the first day of the week)
* and `options.firstWeekContainsDate` (which is the day of January, which is always in
* the first week of the week-numbering year)
*
* Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of a week-numbering year
*
* @example
* // The start of an a week-numbering year for 2 July 2005 with default settings:
* const result = startOfWeekYear(new Date(2005, 6, 2))
* //=> Sun Dec 26 2004 00:00:00
*
* @example
* // The start of a week-numbering year for 2 July 2005
* // if Monday is the first day of week
* // and 4 January is always in the first week of the year:
* const result = startOfWeekYear(new Date(2005, 6, 2), {
*   weekStartsOn: 1,
*   firstWeekContainsDate: 4
* })
* //=> Mon Jan 03 2005 00:00:00
*/
function startOfWeekYear$1(date, options) {var _ref0, _ref1, _ref10, _options$firstWeekCon2, _options$locale4, _defaultOptions$local4;
  var defaultOptions = getDefaultOptions$1();
  var firstWeekContainsDate = (_ref0 = (_ref1 = (_ref10 = (_options$firstWeekCon2 = options === null || options === void 0 ? void 0 : options.firstWeekContainsDate) !== null && _options$firstWeekCon2 !== void 0 ? _options$firstWeekCon2 : options === null || options === void 0 || (_options$locale4 = options.locale) === null || _options$locale4 === void 0 || (_options$locale4 = _options$locale4.options) === null || _options$locale4 === void 0 ? void 0 : _options$locale4.firstWeekContainsDate) !== null && _ref10 !== void 0 ? _ref10 : defaultOptions.firstWeekContainsDate) !== null && _ref1 !== void 0 ? _ref1 : (_defaultOptions$local4 = defaultOptions.locale) === null || _defaultOptions$local4 === void 0 || (_defaultOptions$local4 = _defaultOptions$local4.options) === null || _defaultOptions$local4 === void 0 ? void 0 : _defaultOptions$local4.firstWeekContainsDate) !== null && _ref0 !== void 0 ? _ref0 : 1;
  var year = getWeekYear$1(date, options);
  var firstWeek = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  return startOfWeek$1(firstWeek, options);
}
//#endregion
//#region dist/date-fns/getWeek.js
/**
* The {@link getWeek} function options.
*/
/**
* @name getWeek
* @category Week Helpers
* @summary Get the local week index of the given date.
*
* @description
* Get the local week index of the given date.
* The exact calculation depends on the values of
* `options.weekStartsOn` (which is the index of the first day of the week)
* and `options.firstWeekContainsDate` (which is the day of January, which is always in
* the first week of the week-numbering year)
*
* Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
*
* @param date - The given date
* @param options - An object with options
*
* @returns The week
*
* @example
* // Which week of the local week numbering year is 2 January 2005 with default options?
* const result = getWeek(new Date(2005, 0, 2))
* //=> 2
*
* @example
* // Which week of the local week numbering year is 2 January 2005,
* // if Monday is the first day of the week,
* // and the first week of the year always contains 4 January?
* const result = getWeek(new Date(2005, 0, 2), {
*   weekStartsOn: 1,
*   firstWeekContainsDate: 4
* })
* //=> 53
*/
function getWeek$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var diff = +startOfWeek$1(_date, options) - +startOfWeekYear$1(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}
//#endregion
//#region dist/date-fns/_lib/addLeadingZeros.js
function addLeadingZeros(number, targetLength) {
  return (number < 0 ? "-" : "") + Math.abs(number).toString().padStart(targetLength, "0");
}
//#endregion
//#region dist/date-fns/_lib/format/lightFormatters.js
var lightFormatters = {
  y: function y(date, token) {
    var signedYear = date.getFullYear();
    var year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  M: function M(date, token) {
    var month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  d: function d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  a: function a(date, token) {
    var dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":return dayPeriodEnumValue.toUpperCase();
      case "aaa":return dayPeriodEnumValue;
      case "aaaaa":return dayPeriodEnumValue[0];
      default:return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  h: function h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  H: function H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  m: function m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  s: function s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  S: function S(date, token) {
    var numberOfDigits = token.length;
    var milliseconds = date.getMilliseconds();
    return addLeadingZeros(Math.trunc(milliseconds * Math.pow(10, numberOfDigits - 3)), token.length);
  }
};
//#endregion
//#region dist/date-fns/_lib/format/formatters.js
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
var formatters = {
  G: function G(date, token, localize) {
    var era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      case "G":
      case "GG":
      case "GGG":return localize.era(era, { width: "abbreviated" });
      case "GGGGG":return localize.era(era, { width: "narrow" });
      default:return localize.era(era, { width: "wide" });
    }
  },
  y: function y(date, token, localize) {
    if (token === "yo") {
      var signedYear = date.getFullYear();
      var year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  Y: function Y(date, token, localize, options) {
    var signedWeekYear = getWeekYear$1(date, options);
    var weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") return addLeadingZeros(weekYear % 100, 2);
    if (token === "Yo") return localize.ordinalNumber(weekYear, { unit: "year" });
    return addLeadingZeros(weekYear, token.length);
  },
  R: function R(date, token) {
    return addLeadingZeros(getISOWeekYear$1(date), token.length);
  },
  u: function u(date, token) {
    return addLeadingZeros(date.getFullYear(), token.length);
  },
  Q: function Q(date, token, localize) {
    var quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "Q":return String(quarter);
      case "QQ":return addLeadingZeros(quarter, 2);
      case "Qo":return localize.ordinalNumber(quarter, { unit: "quarter" });
      case "QQQ":return localize.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      case "QQQQQ":return localize.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      default:return localize.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  q: function q(date, token, localize) {
    var quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "q":return String(quarter);
      case "qq":return addLeadingZeros(quarter, 2);
      case "qo":return localize.ordinalNumber(quarter, { unit: "quarter" });
      case "qqq":return localize.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      case "qqqqq":return localize.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      default:return localize.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  M: function M(date, token, localize) {
    var month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":return lightFormatters.M(date, token);
      case "Mo":return localize.ordinalNumber(month + 1, { unit: "month" });
      case "MMM":return localize.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      case "MMMMM":return localize.month(month, {
          width: "narrow",
          context: "formatting"
        });
      default:return localize.month(month, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  L: function L(date, token, localize) {
    var month = date.getMonth();
    switch (token) {
      case "L":return String(month + 1);
      case "LL":return addLeadingZeros(month + 1, 2);
      case "Lo":return localize.ordinalNumber(month + 1, { unit: "month" });
      case "LLL":return localize.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      case "LLLLL":return localize.month(month, {
          width: "narrow",
          context: "standalone"
        });
      default:return localize.month(month, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  w: function w(date, token, localize, options) {
    var week = getWeek$1(date, options);
    if (token === "wo") return localize.ordinalNumber(week, { unit: "week" });
    return addLeadingZeros(week, token.length);
  },
  I: function I(date, token, localize) {
    var isoWeek = getISOWeek$1(date);
    if (token === "Io") return localize.ordinalNumber(isoWeek, { unit: "week" });
    return addLeadingZeros(isoWeek, token.length);
  },
  d: function d(date, token, localize) {
    if (token === "do") return localize.ordinalNumber(date.getDate(), { unit: "date" });
    return lightFormatters.d(date, token);
  },
  D: function D(date, token, localize) {
    var dayOfYear = getDayOfYear$1(date);
    if (token === "Do") return localize.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    return addLeadingZeros(dayOfYear, token.length);
  },
  E: function E(date, token, localize) {
    var dayOfWeek = date.getDay();
    switch (token) {
      case "E":
      case "EE":
      case "EEE":return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "EEEEE":return localize.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":return localize.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      default:return localize.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  e: function e(date, token, localize, options) {
    var dayOfWeek = date.getDay();
    var localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "e":return String(localDayOfWeek);
      case "ee":return addLeadingZeros(localDayOfWeek, 2);
      case "eo":return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "eeeee":return localize.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":return localize.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      default:return localize.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  c: function c(date, token, localize, options) {
    var dayOfWeek = date.getDay();
    var localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "c":return String(localDayOfWeek);
      case "cc":return addLeadingZeros(localDayOfWeek, token.length);
      case "co":return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      case "ccccc":return localize.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":return localize.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      default:return localize.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  i: function i(date, token, localize) {
    var dayOfWeek = date.getDay();
    var isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      case "i":return String(isoDayOfWeek);
      case "ii":return addLeadingZeros(isoDayOfWeek, token.length);
      case "io":return localize.ordinalNumber(isoDayOfWeek, { unit: "day" });
      case "iii":return localize.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "iiiii":return localize.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "iiiiii":return localize.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      default:return localize.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  a: function a(date, token, localize) {
    var dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      default:return localize.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  b: function b(date, token, localize) {
    var hours = date.getHours();
    var dayPeriodEnumValue;
    if (hours === 12) dayPeriodEnumValue = dayPeriodEnum.noon;else
    if (hours === 0) dayPeriodEnumValue = dayPeriodEnum.midnight;else
    dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "b":
      case "bb":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      default:return localize.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  B: function B(date, token, localize) {
    var hours = date.getHours();
    var dayPeriodEnumValue;
    if (hours >= 17) dayPeriodEnumValue = dayPeriodEnum.evening;else
    if (hours >= 12) dayPeriodEnumValue = dayPeriodEnum.afternoon;else
    if (hours >= 4) dayPeriodEnumValue = dayPeriodEnum.morning;else
    dayPeriodEnumValue = dayPeriodEnum.night;
    switch (token) {
      case "B":
      case "BB":
      case "BBB":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":return localize.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      default:return localize.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  h: function h(date, token, localize) {
    if (token === "ho") {
      var hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  H: function H(date, token, localize) {
    if (token === "Ho") return localize.ordinalNumber(date.getHours(), { unit: "hour" });
    return lightFormatters.H(date, token);
  },
  K: function K(date, token, localize) {
    var hours = date.getHours() % 12;
    if (token === "Ko") return localize.ordinalNumber(hours, { unit: "hour" });
    return addLeadingZeros(hours, token.length);
  },
  k: function k(date, token, localize) {
    var hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") return localize.ordinalNumber(hours, { unit: "hour" });
    return addLeadingZeros(hours, token.length);
  },
  m: function m(date, token, localize) {
    if (token === "mo") return localize.ordinalNumber(date.getMinutes(), { unit: "minute" });
    return lightFormatters.m(date, token);
  },
  s: function s(date, token, localize) {
    if (token === "so") return localize.ordinalNumber(date.getSeconds(), { unit: "second" });
    return lightFormatters.s(date, token);
  },
  S: function S(date, token) {
    return lightFormatters.S(date, token);
  },
  X: function X(date, token, _localize) {
    var timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) return "Z";
    switch (token) {
      case "X":return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "XXXX":
      case "XX":return formatTimezone(timezoneOffset);
      default:return formatTimezone(timezoneOffset, ":");
    }
  },
  x: function x(date, token, _localize) {
    var timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "x":return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "xxxx":
      case "xx":return formatTimezone(timezoneOffset);
      default:return formatTimezone(timezoneOffset, ":");
    }
  },
  O: function O(date, token, _localize) {
    var timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "O":
      case "OO":
      case "OOO":return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      default:return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  z: function z(date, token, _localize) {
    var timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "z":
      case "zz":
      case "zzz":return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      default:return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  t: function t(date, token, _localize) {
    return addLeadingZeros(Math.trunc(+date / 1e3), token.length);
  },
  T: function T(date, token, _localize) {
    return addLeadingZeros(+date, token.length);
  }
};
function formatTimezoneShort(offset) {var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var sign = offset > 0 ? "-" : "+";
  var absOffset = Math.abs(offset);
  var hours = Math.trunc(absOffset / 60);
  var minutes = absOffset % 60;
  if (minutes === 0) return sign + String(hours);
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) return (offset > 0 ? "-" : "+") + addLeadingZeros(Math.abs(offset) / 60, 2);
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset) {var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var sign = offset > 0 ? "-" : "+";
  var absOffset = Math.abs(offset);
  var hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  var minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}
//#endregion
//#region dist/date-fns/_lib/format/longFormatters.js
var dateLongFormatter = function dateLongFormatter(pattern, formatLong) {
  switch (pattern) {
    case "P":return formatLong.date({ width: "short" });
    case "PP":return formatLong.date({ width: "medium" });
    case "PPP":return formatLong.date({ width: "long" });
    default:return formatLong.date({ width: "full" });
  }
};
var timeLongFormatter = function timeLongFormatter(pattern, formatLong) {
  switch (pattern) {
    case "p":return formatLong.time({ width: "short" });
    case "pp":return formatLong.time({ width: "medium" });
    case "ppp":return formatLong.time({ width: "long" });
    default:return formatLong.time({ width: "full" });
  }
};
var dateTimeLongFormatter = function dateTimeLongFormatter(pattern, formatLong) {
  var matchResult = pattern.match(/(P+)(p+)?/) || [];
  var datePattern = matchResult[1];
  var timePattern = matchResult[2];
  if (!timePattern) return dateLongFormatter(pattern, formatLong);
  var dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong.dateTime({ width: "long" });
      break;
    default:
      dateTimeFormat = formatLong.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong)).replace("{{time}}", timeLongFormatter(timePattern, formatLong));
};
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};
//#endregion
//#region dist/date-fns/_lib/protectedTokens.js
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = [
"D",
"DD",
"YY",
"YYYY"];

function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format, input) {
  var _message = message(token, format, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format, input) {
  var subject = token[0] === "Y" ? "years" : "days of the month";
  return "Use `".concat(token.toLowerCase(), "` instead of `").concat(token, "` (in `").concat(format, "`) for formatting ").concat(subject, " to the input `").concat(input, "`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md");
}
//#endregion
//#region dist/date-fns/format.js
var formattingTokensRegExp$2 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp$1 = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp$2 = /^'([^]*?)'?$/;
var doubleQuoteRegExp$2 = /''/g;
var unescapedLatinCharacterRegExp$2 = /[a-zA-Z]/;
/**
* The {@link format} function options.
*/
/**
* @name format
* @alias formatDate
* @category Common Helpers
* @summary Format the date.
*
* @description
* Return the formatted date string in the given format. The result may vary by locale.
*
* > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
* > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* The characters wrapped between two single quotes characters (') are escaped.
* Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
* (see the last example)
*
* Format of the string is based on Unicode Technical Standard #35:
* https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
* with a few additions (see note 7 below the table).
*
* Accepted patterns:
* | Unit                            | Pattern | Result examples                   | Notes |
* |---------------------------------|---------|-----------------------------------|-------|
* | Era                             | G..GGG  | AD, BC                            |       |
* |                                 | GGGG    | Anno Domini, Before Christ        | 2     |
* |                                 | GGGGG   | A, B                              |       |
* | Calendar year                   | y       | 44, 1, 1900, 2017                 | 5     |
* |                                 | yo      | 44th, 1st, 0th, 17th              | 5,7   |
* |                                 | yy      | 44, 01, 00, 17                    | 5     |
* |                                 | yyy     | 044, 001, 1900, 2017              | 5     |
* |                                 | yyyy    | 0044, 0001, 1900, 2017            | 5     |
* |                                 | yyyyy   | ...                               | 3,5   |
* | Local week-numbering year       | Y       | 44, 1, 1900, 2017                 | 5     |
* |                                 | Yo      | 44th, 1st, 1900th, 2017th         | 5,7   |
* |                                 | YY      | 44, 01, 00, 17                    | 5,8   |
* |                                 | YYY     | 044, 001, 1900, 2017              | 5     |
* |                                 | YYYY    | 0044, 0001, 1900, 2017            | 5,8   |
* |                                 | YYYYY   | ...                               | 3,5   |
* | ISO week-numbering year         | R       | -43, 0, 1, 1900, 2017             | 5,7   |
* |                                 | RR      | -43, 00, 01, 1900, 2017           | 5,7   |
* |                                 | RRR     | -043, 000, 001, 1900, 2017        | 5,7   |
* |                                 | RRRR    | -0043, 0000, 0001, 1900, 2017     | 5,7   |
* |                                 | RRRRR   | ...                               | 3,5,7 |
* | Extended year                   | u       | -43, 0, 1, 1900, 2017             | 5     |
* |                                 | uu      | -43, 01, 1900, 2017               | 5     |
* |                                 | uuu     | -043, 001, 1900, 2017             | 5     |
* |                                 | uuuu    | -0043, 0001, 1900, 2017           | 5     |
* |                                 | uuuuu   | ...                               | 3,5   |
* | Quarter (formatting)            | Q       | 1, 2, 3, 4                        |       |
* |                                 | Qo      | 1st, 2nd, 3rd, 4th                | 7     |
* |                                 | QQ      | 01, 02, 03, 04                    |       |
* |                                 | QQQ     | Q1, Q2, Q3, Q4                    |       |
* |                                 | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
* |                                 | QQQQQ   | 1, 2, 3, 4                        | 4     |
* | Quarter (stand-alone)           | q       | 1, 2, 3, 4                        |       |
* |                                 | qo      | 1st, 2nd, 3rd, 4th                | 7     |
* |                                 | qq      | 01, 02, 03, 04                    |       |
* |                                 | qqq     | Q1, Q2, Q3, Q4                    |       |
* |                                 | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
* |                                 | qqqqq   | 1, 2, 3, 4                        | 4     |
* | Month (formatting)              | M       | 1, 2, ..., 12                     |       |
* |                                 | Mo      | 1st, 2nd, ..., 12th               | 7     |
* |                                 | MM      | 01, 02, ..., 12                   |       |
* |                                 | MMM     | Jan, Feb, ..., Dec                |       |
* |                                 | MMMM    | January, February, ..., December  | 2     |
* |                                 | MMMMM   | J, F, ..., D                      |       |
* | Month (stand-alone)             | L       | 1, 2, ..., 12                     |       |
* |                                 | Lo      | 1st, 2nd, ..., 12th               | 7     |
* |                                 | LL      | 01, 02, ..., 12                   |       |
* |                                 | LLL     | Jan, Feb, ..., Dec                |       |
* |                                 | LLLL    | January, February, ..., December  | 2     |
* |                                 | LLLLL   | J, F, ..., D                      |       |
* | Local week of year              | w       | 1, 2, ..., 53                     |       |
* |                                 | wo      | 1st, 2nd, ..., 53th               | 7     |
* |                                 | ww      | 01, 02, ..., 53                   |       |
* | ISO week of year                | I       | 1, 2, ..., 53                     | 7     |
* |                                 | Io      | 1st, 2nd, ..., 53th               | 7     |
* |                                 | II      | 01, 02, ..., 53                   | 7     |
* | Day of month                    | d       | 1, 2, ..., 31                     |       |
* |                                 | do      | 1st, 2nd, ..., 31st               | 7     |
* |                                 | dd      | 01, 02, ..., 31                   |       |
* | Day of year                     | D       | 1, 2, ..., 365, 366               | 9     |
* |                                 | Do      | 1st, 2nd, ..., 365th, 366th       | 7     |
* |                                 | DD      | 01, 02, ..., 365, 366             | 9     |
* |                                 | DDD     | 001, 002, ..., 365, 366           |       |
* |                                 | DDDD    | ...                               | 3     |
* | Day of week (formatting)        | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
* |                                 | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 | EEEEE   | M, T, W, T, F, S, S               |       |
* |                                 | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | ISO day of week (formatting)    | i       | 1, 2, 3, ..., 7                   | 7     |
* |                                 | io      | 1st, 2nd, ..., 7th                | 7     |
* |                                 | ii      | 01, 02, ..., 07                   | 7     |
* |                                 | iii     | Mon, Tue, Wed, ..., Sun           | 7     |
* |                                 | iiii    | Monday, Tuesday, ..., Sunday      | 2,7   |
* |                                 | iiiii   | M, T, W, T, F, S, S               | 7     |
* |                                 | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 7     |
* | Local day of week (formatting)  | e       | 2, 3, 4, ..., 1                   |       |
* |                                 | eo      | 2nd, 3rd, ..., 1st                | 7     |
* |                                 | ee      | 02, 03, ..., 01                   |       |
* |                                 | eee     | Mon, Tue, Wed, ..., Sun           |       |
* |                                 | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 | eeeee   | M, T, W, T, F, S, S               |       |
* |                                 | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | Local day of week (stand-alone) | c       | 2, 3, 4, ..., 1                   |       |
* |                                 | co      | 2nd, 3rd, ..., 1st                | 7     |
* |                                 | cc      | 02, 03, ..., 01                   |       |
* |                                 | ccc     | Mon, Tue, Wed, ..., Sun           |       |
* |                                 | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 | ccccc   | M, T, W, T, F, S, S               |       |
* |                                 | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | AM, PM                          | a..aa   | AM, PM                            |       |
* |                                 | aaa     | am, pm                            |       |
* |                                 | aaaa    | a.m., p.m.                        | 2     |
* |                                 | aaaaa   | a, p                              |       |
* | AM, PM, noon, midnight          | b..bb   | AM, PM, noon, midnight            |       |
* |                                 | bbb     | am, pm, noon, midnight            |       |
* |                                 | bbbb    | a.m., p.m., noon, midnight        | 2     |
* |                                 | bbbbb   | a, p, n, mi                       |       |
* | Flexible day period             | B..BBB  | at night, in the morning, ...     |       |
* |                                 | BBBB    | at night, in the morning, ...     | 2     |
* |                                 | BBBBB   | at night, in the morning, ...     |       |
* | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |       |
* |                                 | ho      | 1st, 2nd, ..., 11th, 12th         | 7     |
* |                                 | hh      | 01, 02, ..., 11, 12               |       |
* | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |       |
* |                                 | Ho      | 0th, 1st, 2nd, ..., 23rd          | 7     |
* |                                 | HH      | 00, 01, 02, ..., 23               |       |
* | Hour [0-11]                     | K       | 1, 2, ..., 11, 0                  |       |
* |                                 | Ko      | 1st, 2nd, ..., 11th, 0th          | 7     |
* |                                 | KK      | 01, 02, ..., 11, 00               |       |
* | Hour [1-24]                     | k       | 24, 1, 2, ..., 23                 |       |
* |                                 | ko      | 24th, 1st, 2nd, ..., 23rd         | 7     |
* |                                 | kk      | 24, 01, 02, ..., 23               |       |
* | Minute                          | m       | 0, 1, ..., 59                     |       |
* |                                 | mo      | 0th, 1st, ..., 59th               | 7     |
* |                                 | mm      | 00, 01, ..., 59                   |       |
* | Second                          | s       | 0, 1, ..., 59                     |       |
* |                                 | so      | 0th, 1st, ..., 59th               | 7     |
* |                                 | ss      | 00, 01, ..., 59                   |       |
* | Fraction of second              | S       | 0, 1, ..., 9                      |       |
* |                                 | SS      | 00, 01, ..., 99                   |       |
* |                                 | SSS     | 000, 001, ..., 999                |       |
* |                                 | SSSS    | ...                               | 3     |
* | Timezone (ISO-8601 w/ Z)        | X       | -08, +0530, Z                     |       |
* |                                 | XX      | -0800, +0530, Z                   |       |
* |                                 | XXX     | -08:00, +05:30, Z                 |       |
* |                                 | XXXX    | -0800, +0530, Z, +123456          | 2     |
* |                                 | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
* | Timezone (ISO-8601 w/o Z)       | x       | -08, +0530, +00                   |       |
* |                                 | xx      | -0800, +0530, +0000               |       |
* |                                 | xxx     | -08:00, +05:30, +00:00            | 2     |
* |                                 | xxxx    | -0800, +0530, +0000, +123456      |       |
* |                                 | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
* | Timezone (GMT)                  | O...OOO | GMT-8, GMT+5:30, GMT+0            |       |
* |                                 | OOOO    | GMT-08:00, GMT+05:30, GMT+00:00   | 2     |
* | Timezone (specific non-locat.)  | z...zzz | GMT-8, GMT+5:30, GMT+0            | 6     |
* |                                 | zzzz    | GMT-08:00, GMT+05:30, GMT+00:00   | 2,6   |
* | Seconds timestamp               | t       | 512969520                         | 7     |
* |                                 | tt      | ...                               | 3,7   |
* | Milliseconds timestamp          | T       | 512969520900                      | 7     |
* |                                 | TT      | ...                               | 3,7   |
* | Long localized date             | P       | 04/29/1453                        | 7     |
* |                                 | PP      | Apr 29, 1453                      | 7     |
* |                                 | PPP     | April 29th, 1453                  | 7     |
* |                                 | PPPP    | Friday, April 29th, 1453          | 2,7   |
* | Long localized time             | p       | 12:00 AM                          | 7     |
* |                                 | pp      | 12:00:00 AM                       | 7     |
* |                                 | ppp     | 12:00:00 AM GMT+2                 | 7     |
* |                                 | pppp    | 12:00:00 AM GMT+02:00             | 2,7   |
* | Combination of date and time    | Pp      | 04/29/1453, 12:00 AM              | 7     |
* |                                 | PPpp    | Apr 29, 1453, 12:00:00 AM         | 7     |
* |                                 | PPPppp  | April 29th, 1453 at ...           | 7     |
* |                                 | PPPPpppp| Friday, April 29th, 1453 at ...   | 2,7   |
* Notes:
* 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
*    are the same as "stand-alone" units, but are different in some languages.
*    "Formatting" units are declined according to the rules of the language
*    in the context of a date. "Stand-alone" units are always nominative singular:
*
*    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
*
*    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
*
* 2. Any sequence of the identical letters is a pattern, unless it is escaped by
*    the single quote characters (see below).
*    If the sequence is longer than listed in table (e.g. `EEEEEEEEEEE`)
*    the output will be the same as default pattern for this unit, usually
*    the longest one (in case of ISO weekdays, `EEEE`). Default patterns for units
*    are marked with "2" in the last column of the table.
*
*    `format(new Date(2017, 10, 6), 'MMM') //=> 'Nov'`
*
*    `format(new Date(2017, 10, 6), 'MMMM') //=> 'November'`
*
*    `format(new Date(2017, 10, 6), 'MMMMM') //=> 'N'`
*
*    `format(new Date(2017, 10, 6), 'MMMMMM') //=> 'November'`
*
*    `format(new Date(2017, 10, 6), 'MMMMMMM') //=> 'November'`
*
* 3. Some patterns could be unlimited length (such as `yyyyyyyy`).
*    The output will be padded with zeros to match the length of the pattern.
*
*    `format(new Date(2017, 10, 6), 'yyyyyyyy') //=> '00002017'`
*
* 4. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
*    These tokens represent the shortest form of the quarter.
*
* 5. The main difference between `y` and `u` patterns are B.C. years:
*
*    | Year | `y` | `u` |
*    |------|-----|-----|
*    | AC 1 |   1 |   1 |
*    | BC 1 |   1 |   0 |
*    | BC 2 |   2 |  -1 |
*
*    Also `yy` always returns the last two digits of a year,
*    while `uu` pads single digit years to 2 characters and returns other years unchanged:
*
*    | Year | `yy` | `uu` |
*    |------|------|------|
*    | 1    |   01 |   01 |
*    | 14   |   14 |   14 |
*    | 376  |   76 |  376 |
*    | 1453 |   53 | 1453 |
*
*    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
*    except local week-numbering years are dependent on `options.weekStartsOn`
*    and `options.firstWeekContainsDate` (compare [getISOWeekYear](https://date-fns.org/docs/getISOWeekYear)
*    and [getWeekYear](https://date-fns.org/docs/getWeekYear)).
*
* 6. Specific non-location timezones are currently unavailable in `date-fns`,
*    so right now these tokens fall back to GMT timezones.
*
* 7. These patterns are not in the Unicode Technical Standard #35:
*    - `i`: ISO day of week
*    - `I`: ISO week of year
*    - `R`: ISO week-numbering year
*    - `t`: seconds timestamp
*    - `T`: milliseconds timestamp
*    - `o`: ordinal number modifier
*    - `P`: long localized date
*    - `p`: long localized time
*
* 8. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
*    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* 9. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
*    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* @param date - The original date
* @param format - The string of tokens
* @param options - An object with options
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
* @throws `options.locale` must contain `localize` property
* @throws `options.locale` must contain `formatLong` property
* @throws use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws format string contains an unescaped latin alphabet character
*
* @example
* // Represent 11 February 2014 in middle-endian format:
* const result = format(new Date(2014, 1, 11), 'MM/dd/yyyy')
* //=> '02/11/2014'
*
* @example
* // Represent 2 July 2014 in Esperanto:
* import { eoLocale } from 'date-fns/locale/eo'
* const result = format(new Date(2014, 6, 2), "do 'de' MMMM yyyy", {
*   locale: eoLocale
* })
* //=> '2-a de julio 2014'
*
* @example
* // Escape string by single quote characters:
* const result = format(new Date(2014, 6, 2, 15), "h 'o''clock'")
* //=> "3 o'clock"
*/
function format$1(date, formatStr, options) {var _ref11, _options$locale5, _ref12, _ref13, _ref14, _options$firstWeekCon3, _options$locale6, _defaultOptions$local5, _ref15, _ref16, _ref17, _options$weekStartsOn3, _options$locale7, _defaultOptions$local6;
  var defaultOptions = getDefaultOptions$1();
  var locale = (_ref11 = (_options$locale5 = options === null || options === void 0 ? void 0 : options.locale) !== null && _options$locale5 !== void 0 ? _options$locale5 : defaultOptions.locale) !== null && _ref11 !== void 0 ? _ref11 : enUS;
  var firstWeekContainsDate = (_ref12 = (_ref13 = (_ref14 = (_options$firstWeekCon3 = options === null || options === void 0 ? void 0 : options.firstWeekContainsDate) !== null && _options$firstWeekCon3 !== void 0 ? _options$firstWeekCon3 : options === null || options === void 0 || (_options$locale6 = options.locale) === null || _options$locale6 === void 0 || (_options$locale6 = _options$locale6.options) === null || _options$locale6 === void 0 ? void 0 : _options$locale6.firstWeekContainsDate) !== null && _ref14 !== void 0 ? _ref14 : defaultOptions.firstWeekContainsDate) !== null && _ref13 !== void 0 ? _ref13 : (_defaultOptions$local5 = defaultOptions.locale) === null || _defaultOptions$local5 === void 0 || (_defaultOptions$local5 = _defaultOptions$local5.options) === null || _defaultOptions$local5 === void 0 ? void 0 : _defaultOptions$local5.firstWeekContainsDate) !== null && _ref12 !== void 0 ? _ref12 : 1;
  var weekStartsOn = (_ref15 = (_ref16 = (_ref17 = (_options$weekStartsOn3 = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn3 !== void 0 ? _options$weekStartsOn3 : options === null || options === void 0 || (_options$locale7 = options.locale) === null || _options$locale7 === void 0 || (_options$locale7 = _options$locale7.options) === null || _options$locale7 === void 0 ? void 0 : _options$locale7.weekStartsOn) !== null && _ref17 !== void 0 ? _ref17 : defaultOptions.weekStartsOn) !== null && _ref16 !== void 0 ? _ref16 : (_defaultOptions$local6 = defaultOptions.locale) === null || _defaultOptions$local6 === void 0 || (_defaultOptions$local6 = _defaultOptions$local6.options) === null || _defaultOptions$local6 === void 0 ? void 0 : _defaultOptions$local6.weekStartsOn) !== null && _ref15 !== void 0 ? _ref15 : 0;
  var originalDate = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (!isValid$1(originalDate)) throw new RangeError("Invalid time value");
  var parts = formatStr.match(longFormattingTokensRegExp$1).map(function (substring) {
    var firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      var longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp$2).map(function (substring) {
    if (substring === "''") return {
      isToken: false,
      value: "'"
    };
    var firstCharacter = substring[0];
    if (firstCharacter === "'") return {
      isToken: false,
      value: cleanEscapedString$2(substring)
    };
    if (formatters[firstCharacter]) return {
      isToken: true,
      value: substring
    };
    if (firstCharacter.match(unescapedLatinCharacterRegExp$2)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + firstCharacter + "`");
    return {
      isToken: false,
      value: substring
    };
  });
  if (locale.localize.preprocessor) parts = locale.localize.preprocessor(originalDate, parts);
  var formatterOptions = {
    firstWeekContainsDate: firstWeekContainsDate,
    weekStartsOn: weekStartsOn,
    locale: locale
  };
  return parts.map(function (part) {
    if (!part.isToken) return part.value;
    var token = part.value;
    if (!(options !== null && options !== void 0 && options.useAdditionalWeekYearTokens) && isProtectedWeekYearToken(token) || !(options !== null && options !== void 0 && options.useAdditionalDayOfYearTokens) && isProtectedDayOfYearToken(token)) warnOrThrowProtectedError(token, formatStr, String(date));
    var formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString$2(input) {
  var matched = input.match(escapedStringRegExp$2);
  if (!matched) return input;
  return matched[1].replace(doubleQuoteRegExp$2, "'");
}
//#endregion
//#region dist/date-fns/fp/format.js
var _format = convertToFP(format$1, 2);
//#endregion
//#region dist/date-fns/formatDistance.js
/**
* The {@link formatDistance} function options.
*/
/**
* @name formatDistance
* @category Common Helpers
* @summary Return the distance between the given dates in words.
*
* @description
* Return the distance between the given dates in words.
*
* | Distance between dates                                            | Result              |
* |-------------------------------------------------------------------|---------------------|
* | 0 ... 30 secs                                                     | less than a minute  |
* | 30 secs ... 1 min 30 secs                                         | 1 minute            |
* | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
* | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
* | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
* | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
* | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
* | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
* | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
* | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
* | 1 yr ... 1 yr 3 months                                            | about 1 year        |
* | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
* | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
* | N yrs ... N yrs 3 months                                          | about N years       |
* | N yrs 3 months ... N yrs 9 months                                 | over N years        |
* | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
*
* With `options.includeSeconds == true`:
* | Distance between dates | Result               |
* |------------------------|----------------------|
* | 0 secs ... 5 secs      | less than 5 seconds  |
* | 5 secs ... 10 secs     | less than 10 seconds |
* | 10 secs ... 20 secs    | less than 20 seconds |
* | 20 secs ... 40 secs    | half a minute        |
* | 40 secs ... 60 secs    | less than a minute   |
* | 60 secs ... 90 secs    | 1 minute             |
*
* @param laterDate - The date
* @param earlierDate - The date to compare with
* @param options - An object with options
*
* @returns The distance in words
*
* @throws `date` must not be Invalid Date
* @throws `baseDate` must not be Invalid Date
* @throws `options.locale` must contain `formatDistance` property
*
* @example
* // What is the distance between 2 July 2014 and 1 January 2015?
* const result = formatDistance(new Date(2014, 6, 2), new Date(2015, 0, 1))
* //=> '6 months'
*
* @example
* // What is the distance between 1 January 2015 00:00:15
* // and 1 January 2015 00:00:00, including seconds?
* const result = formatDistance(
*   new Date(2015, 0, 1, 0, 0, 15),
*   new Date(2015, 0, 1, 0, 0, 0),
*   { includeSeconds: true }
* )
* //=> 'less than 20 seconds'
*
* @example
* // What is the distance from 1 January 2016
* // to 1 January 2015, with a suffix?
* const result = formatDistance(new Date(2015, 0, 1), new Date(2016, 0, 1), {
*   addSuffix: true
* })
* //=> 'about 1 year ago'
*
* @example
* // What is the distance between 1 August 2016 and 1 January 2015 in Esperanto?
* import { eoLocale } from 'date-fns/locale/eo'
* const result = formatDistance(new Date(2016, 7, 1), new Date(2015, 0, 1), {
*   locale: eoLocale
* })
* //=> 'pli ol 1 jaro'
*/
function formatDistance$1(laterDate, earlierDate, options) {var _ref18, _options$locale8;
  var defaultOptions = getDefaultOptions$1();
  var locale = (_ref18 = (_options$locale8 = options === null || options === void 0 ? void 0 : options.locale) !== null && _options$locale8 !== void 0 ? _options$locale8 : defaultOptions.locale) !== null && _ref18 !== void 0 ? _ref18 : enUS;
  var minutesInAlmostTwoDays = 2520;
  var comparison = compareAsc$1(laterDate, earlierDate);
  if (isNaN(comparison)) throw new RangeError("Invalid time value");
  var localizeOptions = Object.assign({}, options, {
    addSuffix: options === null || options === void 0 ? void 0 : options.addSuffix,
    comparison: comparison
  });
  var _normalizeDates33 = normalizeDates.apply(void 0, [options === null || options === void 0 ? void 0 : options.in].concat(_toConsumableArray(comparison > 0 ? [earlierDate, laterDate] : [laterDate, earlierDate]))),_normalizeDates34 = _slicedToArray(_normalizeDates33, 2),laterDate_ = _normalizeDates34[0],earlierDate_ = _normalizeDates34[1];
  var seconds = differenceInSeconds$1(earlierDate_, laterDate_);
  var offsetInSeconds = (getTimezoneOffsetInMilliseconds(earlierDate_) - getTimezoneOffsetInMilliseconds(laterDate_)) / 1e3;
  var minutes = Math.round((seconds - offsetInSeconds) / 60);
  var months;
  if (minutes < 2) {if (options !== null && options !== void 0 && options.includeSeconds) {if (seconds < 5) return locale.formatDistance("lessThanXSeconds", 5, localizeOptions);else
      if (seconds < 10) return locale.formatDistance("lessThanXSeconds", 10, localizeOptions);else
      if (seconds < 20) return locale.formatDistance("lessThanXSeconds", 20, localizeOptions);else
      if (seconds < 40) return locale.formatDistance("halfAMinute", 0, localizeOptions);else
      if (seconds < 60) return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);else
      return locale.formatDistance("xMinutes", 1, localizeOptions);} else
    if (minutes === 0) return locale.formatDistance("lessThanXMinutes", 1, localizeOptions);else
    return locale.formatDistance("xMinutes", minutes, localizeOptions);} else
  if (minutes < 45) return locale.formatDistance("xMinutes", minutes, localizeOptions);else
  if (minutes < 90) return locale.formatDistance("aboutXHours", 1, localizeOptions);else
  if (minutes < 1440) {
    var hours = Math.round(minutes / 60);
    return locale.formatDistance("aboutXHours", hours, localizeOptions);
  } else if (minutes < minutesInAlmostTwoDays) return locale.formatDistance("xDays", 1, localizeOptions);else
  if (minutes < 43200) {
    var _days = Math.round(minutes / minutesInDay);
    return locale.formatDistance("xDays", _days, localizeOptions);
  } else if (minutes < 43200 * 2) {
    months = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("aboutXMonths", months, localizeOptions);
  }
  months = differenceInMonths$1(earlierDate_, laterDate_);
  if (months < 12) {
    var nearestMonth = Math.round(minutes / minutesInMonth);
    return locale.formatDistance("xMonths", nearestMonth, localizeOptions);
  } else {
    var monthsSinceStartOfYear = months % 12;
    var years = Math.trunc(months / 12);
    if (monthsSinceStartOfYear < 3) return locale.formatDistance("aboutXYears", years, localizeOptions);else
    if (monthsSinceStartOfYear < 9) return locale.formatDistance("overXYears", years, localizeOptions);else
    return locale.formatDistance("almostXYears", years + 1, localizeOptions);
  }
}
//#endregion
//#region dist/date-fns/fp/formatDistance.js
var _formatDistance = convertToFP(formatDistance$1, 2);
//#endregion
//#region dist/date-fns/formatDistanceStrict.js
/**
* The {@link formatDistanceStrict} function options.
*/
/**
* The unit used to format the distance in {@link formatDistanceStrict}.
*/
/**
* @name formatDistanceStrict
* @category Common Helpers
* @summary Return the distance between the given dates in words.
*
* @description
* Return the distance between the given dates in words, using strict units.
* This is like `formatDistance`, but does not use helpers like 'almost', 'over',
* 'less than' and the like.
*
* | Distance between dates | Result              |
* |------------------------|---------------------|
* | 0 ... 59 secs          | [0..59] seconds     |
* | 1 ... 59 mins          | [1..59] minutes     |
* | 1 ... 23 hrs           | [1..23] hours       |
* | 1 ... 29 days          | [1..29] days        |
* | 1 ... 11 months        | [1..11] months      |
* | 1 ... N years          | [1..N]  years       |
*
* @param laterDate - The date
* @param earlierDate - The date to compare with
* @param options - An object with options
*
* @returns The distance in words
*
* @throws `date` must not be Invalid Date
* @throws `baseDate` must not be Invalid Date
* @throws `options.unit` must be 'second', 'minute', 'hour', 'day', 'month' or 'year'
* @throws `options.locale` must contain `formatDistance` property
*
* @example
* // What is the distance between 2 July 2014 and 1 January 2015?
* const result = formatDistanceStrict(new Date(2014, 6, 2), new Date(2015, 0, 2))
* //=> '6 months'
*
* @example
* // What is the distance between 1 January 2015 00:00:15
* // and 1 January 2015 00:00:00?
* const result = formatDistanceStrict(
*   new Date(2015, 0, 1, 0, 0, 15),
*   new Date(2015, 0, 1, 0, 0, 0)
* )
* //=> '15 seconds'
*
* @example
* // What is the distance from 1 January 2016
* // to 1 January 2015, with a suffix?
* const result = formatDistanceStrict(new Date(2015, 0, 1), new Date(2016, 0, 1), {
*   addSuffix: true
* })
* //=> '1 year ago'
*
* @example
* // What is the distance from 1 January 2016
* // to 1 January 2015, in minutes?
* const result = formatDistanceStrict(new Date(2016, 0, 1), new Date(2015, 0, 1), {
*   unit: 'minute'
* })
* //=> '525600 minutes'
*
* @example
* // What is the distance from 1 January 2015
* // to 28 January 2015, in months, rounded up?
* const result = formatDistanceStrict(new Date(2015, 0, 28), new Date(2015, 0, 1), {
*   unit: 'month',
*   roundingMethod: 'ceil'
* })
* //=> '1 month'
*
* @example
* // What is the distance between 1 August 2016 and 1 January 2015 in Esperanto?
* import { eoLocale } from 'date-fns/locale/eo'
* const result = formatDistanceStrict(new Date(2016, 7, 1), new Date(2015, 0, 1), {
*   locale: eoLocale
* })
* //=> '1 jaro'
*/
function formatDistanceStrict$1(laterDate, earlierDate, options) {var _ref19, _options$locale9, _options$roundingMeth;
  var defaultOptions = getDefaultOptions$1();
  var locale = (_ref19 = (_options$locale9 = options === null || options === void 0 ? void 0 : options.locale) !== null && _options$locale9 !== void 0 ? _options$locale9 : defaultOptions.locale) !== null && _ref19 !== void 0 ? _ref19 : enUS;
  var comparison = compareAsc$1(laterDate, earlierDate);
  if (isNaN(comparison)) throw new RangeError("Invalid time value");
  var localizeOptions = Object.assign({}, options, {
    addSuffix: options === null || options === void 0 ? void 0 : options.addSuffix,
    comparison: comparison
  });
  var _normalizeDates35 = normalizeDates.apply(void 0, [options === null || options === void 0 ? void 0 : options.in].concat(_toConsumableArray(comparison > 0 ? [earlierDate, laterDate] : [laterDate, earlierDate]))),_normalizeDates36 = _slicedToArray(_normalizeDates35, 2),laterDate_ = _normalizeDates36[0],earlierDate_ = _normalizeDates36[1];
  var roundingMethod = getRoundingMethod((_options$roundingMeth = options === null || options === void 0 ? void 0 : options.roundingMethod) !== null && _options$roundingMeth !== void 0 ? _options$roundingMeth : "round");
  var milliseconds = earlierDate_.getTime() - laterDate_.getTime();
  var minutes = milliseconds / millisecondsInMinute;
  var dstNormalizedMinutes = (milliseconds - (getTimezoneOffsetInMilliseconds(earlierDate_) - getTimezoneOffsetInMilliseconds(laterDate_))) / millisecondsInMinute;
  var defaultUnit = options === null || options === void 0 ? void 0 : options.unit;
  var unit;
  if (!defaultUnit) {if (minutes < 1) unit = "second";else
    if (minutes < 60) unit = "minute";else
    if (minutes < 1440) unit = "hour";else
    if (dstNormalizedMinutes < 43200) unit = "day";else
    if (dstNormalizedMinutes < 525600) unit = "month";else
    unit = "year";} else
  unit = defaultUnit;
  if (unit === "second") {
    var seconds = roundingMethod(milliseconds / 1e3);
    return locale.formatDistance("xSeconds", seconds, localizeOptions);
  } else if (unit === "minute") {
    var roundedMinutes = roundingMethod(minutes);
    return locale.formatDistance("xMinutes", roundedMinutes, localizeOptions);
  } else if (unit === "hour") {
    var hours = roundingMethod(minutes / 60);
    return locale.formatDistance("xHours", hours, localizeOptions);
  } else if (unit === "day") {
    var _days2 = roundingMethod(dstNormalizedMinutes / minutesInDay);
    return locale.formatDistance("xDays", _days2, localizeOptions);
  } else if (unit === "month") {
    var _months = roundingMethod(dstNormalizedMinutes / minutesInMonth);
    return _months === 12 && defaultUnit !== "month" ? locale.formatDistance("xYears", 1, localizeOptions) : locale.formatDistance("xMonths", _months, localizeOptions);
  } else {
    var years = roundingMethod(dstNormalizedMinutes / minutesInYear);
    return locale.formatDistance("xYears", years, localizeOptions);
  }
}
//#endregion
//#region dist/date-fns/fp/formatDistanceStrict.js
var _formatDistanceStrict = convertToFP(formatDistanceStrict$1, 2);
//#endregion
//#region dist/date-fns/fp/formatDistanceStrictWithOptions.js
var _formatDistanceStrictWithOptions = convertToFP(formatDistanceStrict$1, 3);
//#endregion
//#region dist/date-fns/fp/formatDistanceWithOptions.js
var _formatDistanceWithOptions = convertToFP(formatDistance$1, 3);
//#endregion
//#region dist/date-fns/formatDuration.js
/**
* The {@link formatDuration} function options.
*/
var defaultFormat = [
"years",
"months",
"weeks",
"days",
"hours",
"minutes",
"seconds"];

/**
* @name formatDuration
* @category Common Helpers
* @summary Formats a duration in human-readable format
*
* @description
* Return human-readable duration string i.e. "9 months 2 days"
*
* @param duration - The duration to format
* @param options - An object with options.
*
* @returns The formatted date string
*
* @example
* // Format full duration
* formatDuration({
*   years: 2,
*   months: 9,
*   weeks: 1,
*   days: 7,
*   hours: 5,
*   minutes: 9,
*   seconds: 30
* })
* //=> '2 years 9 months 1 week 7 days 5 hours 9 minutes 30 seconds'
*
* @example
* // Format partial duration
* formatDuration({ months: 9, days: 2 })
* //=> '9 months 2 days'
*
* @example
* // Customize the format
* formatDuration(
*   {
*     years: 2,
*     months: 9,
*     weeks: 1,
*     days: 7,
*     hours: 5,
*     minutes: 9,
*     seconds: 30
*   },
*   { format: ['months', 'weeks'] }
* ) === '9 months 1 week'
*
* @example
* // Customize the zeros presence
* formatDuration({ years: 0, months: 9 })
* //=> '9 months'
* formatDuration({ years: 0, months: 9 }, { zero: true })
* //=> '0 years 9 months'
*
* @example
* // Customize the delimiter
* formatDuration({ years: 2, months: 9, weeks: 3 }, { delimiter: ', ' })
* //=> '2 years, 9 months, 3 weeks'
*/
function formatDuration$1(duration, options) {var _ref20, _options$locale0, _options$format, _options$zero, _options$delimiter;
  var defaultOptions = getDefaultOptions$1();
  var locale = (_ref20 = (_options$locale0 = options === null || options === void 0 ? void 0 : options.locale) !== null && _options$locale0 !== void 0 ? _options$locale0 : defaultOptions.locale) !== null && _ref20 !== void 0 ? _ref20 : enUS;
  var format = (_options$format = options === null || options === void 0 ? void 0 : options.format) !== null && _options$format !== void 0 ? _options$format : defaultFormat;
  var zero = (_options$zero = options === null || options === void 0 ? void 0 : options.zero) !== null && _options$zero !== void 0 ? _options$zero : false;
  var delimiter = (_options$delimiter = options === null || options === void 0 ? void 0 : options.delimiter) !== null && _options$delimiter !== void 0 ? _options$delimiter : " ";
  if (!locale.formatDistance) return "";
  return format.reduce(function (acc, unit) {
    var token = "x".concat(unit.replace(/(^.)/, function (m) {return m.toUpperCase();}));
    var value = duration[unit];
    if (value !== void 0 && (zero || duration[unit])) return acc.concat(locale.formatDistance(token, value));
    return acc;
  }, []).join(delimiter);
}
//#endregion
//#region dist/date-fns/fp/formatDuration.js
var _formatDuration = convertToFP(formatDuration$1, 1);
//#endregion
//#region dist/date-fns/fp/formatDurationWithOptions.js
var _formatDurationWithOptions = convertToFP(formatDuration$1, 2);
//#endregion
//#region dist/date-fns/formatISO.js
/**
* The {@link formatISO} function options.
*/
/**
* @name formatISO
* @category Common Helpers
* @summary Format the date according to the ISO 8601 standard (https://support.sas.com/documentation/cdl/en/lrdict/64316/HTML/default/viewer.htm#a003169814.htm).
*
* @description
* Return the formatted date string in ISO 8601 format. Options may be passed to control the parts and notations of the date.
*
* @param date - The original date
* @param options - An object with options.
*
* @returns The formatted date string (in local time zone)
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 18 September 2019 in ISO 8601 format (local time zone is UTC):
* const result = formatISO(new Date(2019, 8, 18, 19, 0, 52))
* //=> '2019-09-18T19:00:52Z'
*
* @example
* // Represent 18 September 2019 in ISO 8601, short format (local time zone is UTC):
* const result = formatISO(new Date(2019, 8, 18, 19, 0, 52), { format: 'basic' })
* //=> '20190918T190052'
*
* @example
* // Represent 18 September 2019 in ISO 8601 format, date only:
* const result = formatISO(new Date(2019, 8, 18, 19, 0, 52), { representation: 'date' })
* //=> '2019-09-18'
*
* @example
* // Represent 18 September 2019 in ISO 8601 format, time only (local time zone is UTC):
* const result = formatISO(new Date(2019, 8, 18, 19, 0, 52), { representation: 'time' })
* //=> '19:00:52Z'
*/
function formatISO$1(date, options) {var _options$format2, _options$representati;
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (isNaN(+date_)) throw new RangeError("Invalid time value");
  var format = (_options$format2 = options === null || options === void 0 ? void 0 : options.format) !== null && _options$format2 !== void 0 ? _options$format2 : "extended";
  var representation = (_options$representati = options === null || options === void 0 ? void 0 : options.representation) !== null && _options$representati !== void 0 ? _options$representati : "complete";
  var result = "";
  var tzOffset = "";
  var dateDelimiter = format === "extended" ? "-" : "";
  var timeDelimiter = format === "extended" ? ":" : "";
  if (representation !== "time") {
    var day = addLeadingZeros(date_.getDate(), 2);
    var month = addLeadingZeros(date_.getMonth() + 1, 2);
    result = "".concat(addLeadingZeros(date_.getFullYear(), 4)).concat(dateDelimiter).concat(month).concat(dateDelimiter).concat(day);
  }
  if (representation !== "date") {
    var offset = date_.getTimezoneOffset();
    if (offset !== 0) {
      var absoluteOffset = Math.abs(offset);
      var hourOffset = addLeadingZeros(Math.trunc(absoluteOffset / 60), 2);
      var minuteOffset = addLeadingZeros(absoluteOffset % 60, 2);
      tzOffset = "".concat(offset < 0 ? "+" : "-").concat(hourOffset, ":").concat(minuteOffset);
    } else tzOffset = "Z";
    var hour = addLeadingZeros(date_.getHours(), 2);
    var minute = addLeadingZeros(date_.getMinutes(), 2);
    var second = addLeadingZeros(date_.getSeconds(), 2);
    var separator = result === "" ? "" : "T";
    var time = [
    hour,
    minute,
    second].
    join(timeDelimiter);
    result = "".concat(result).concat(separator).concat(time).concat(tzOffset);
  }
  return result;
}
//#endregion
//#region dist/date-fns/fp/formatISO.js
var _formatISO = convertToFP(formatISO$1, 1);
//#endregion
//#region dist/date-fns/formatISO9075.js
/**
* The {@link formatISO9075} function options.
*/
/**
* @name formatISO9075
* @category Common Helpers
* @summary Format the date according to the ISO 9075 standard (https://dev.mysql.com/doc/refman/5.7/en/date-and-time-functions.html#function_get-format).
*
* @description
* Return the formatted date string in ISO 9075 format. Options may be passed to control the parts and notations of the date.
*
* @param date - The original date
* @param options - An object with options.
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 18 September 2019 in ISO 9075 format:
* const result = formatISO9075(new Date(2019, 8, 18, 19, 0, 52))
* //=> '2019-09-18 19:00:52'
*
* @example
* // Represent 18 September 2019 in ISO 9075, short format:
* const result = formatISO9075(new Date(2019, 8, 18, 19, 0, 52), { format: 'basic' })
* //=> '20190918 190052'
*
* @example
* // Represent 18 September 2019 in ISO 9075 format, date only:
* const result = formatISO9075(new Date(2019, 8, 18, 19, 0, 52), { representation: 'date' })
* //=> '2019-09-18'
*
* @example
* // Represent 18 September 2019 in ISO 9075 format, time only:
* const result = formatISO9075(new Date(2019, 8, 18, 19, 0, 52), { representation: 'time' })
* //=> '19:00:52'
*/
function formatISO9075$1(date, options) {var _options$format3, _options$representati2;
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (!isValid$1(date_)) throw new RangeError("Invalid time value");
  var format = (_options$format3 = options === null || options === void 0 ? void 0 : options.format) !== null && _options$format3 !== void 0 ? _options$format3 : "extended";
  var representation = (_options$representati2 = options === null || options === void 0 ? void 0 : options.representation) !== null && _options$representati2 !== void 0 ? _options$representati2 : "complete";
  var result = "";
  var dateDelimiter = format === "extended" ? "-" : "";
  var timeDelimiter = format === "extended" ? ":" : "";
  if (representation !== "time") {
    var day = addLeadingZeros(date_.getDate(), 2);
    var month = addLeadingZeros(date_.getMonth() + 1, 2);
    result = "".concat(addLeadingZeros(date_.getFullYear(), 4)).concat(dateDelimiter).concat(month).concat(dateDelimiter).concat(day);
  }
  if (representation !== "date") {
    var hour = addLeadingZeros(date_.getHours(), 2);
    var minute = addLeadingZeros(date_.getMinutes(), 2);
    var second = addLeadingZeros(date_.getSeconds(), 2);
    result = "".concat(result).concat(result === "" ? "" : " ").concat(hour).concat(timeDelimiter).concat(minute).concat(timeDelimiter).concat(second);
  }
  return result;
}
//#endregion
//#region dist/date-fns/fp/formatISO9075.js
var _formatISO2 = convertToFP(formatISO9075$1, 1);
//#endregion
//#region dist/date-fns/fp/formatISO9075WithOptions.js
var _formatISO9075WithOptions = convertToFP(formatISO9075$1, 2);
//#endregion
//#region dist/date-fns/formatISODuration.js
/**
* @name formatISODuration
* @category Common Helpers
* @summary Format a duration object according as ISO 8601 duration string
*
* @description
* Format a duration object according to the ISO 8601 duration standard (https://www.digi.com/resources/documentation/digidocs//90001488-13/reference/r_iso_8601_duration_format.htm)
*
* @param duration - The duration to format
*
* @returns The ISO 8601 duration string
*
* @example
* // Format the given duration as ISO 8601 string
* const result = formatISODuration({
*   years: 39,
*   months: 2,
*   days: 20,
*   hours: 7,
*   minutes: 5,
*   seconds: 0
* })
* //=> 'P39Y2M20DT0H0M0S'
*/
function formatISODuration$1(duration) {
  var _duration$years2 = duration.years,years = _duration$years2 === void 0 ? 0 : _duration$years2,_duration$months2 = duration.months,months = _duration$months2 === void 0 ? 0 : _duration$months2,_duration$days2 = duration.days,days = _duration$days2 === void 0 ? 0 : _duration$days2,_duration$hours2 = duration.hours,hours = _duration$hours2 === void 0 ? 0 : _duration$hours2,_duration$minutes2 = duration.minutes,minutes = _duration$minutes2 === void 0 ? 0 : _duration$minutes2,_duration$seconds2 = duration.seconds,seconds = _duration$seconds2 === void 0 ? 0 : _duration$seconds2;
  return "P".concat(years, "Y").concat(months, "M").concat(days, "DT").concat(hours, "H").concat(minutes, "M").concat(seconds, "S");
}
//#endregion
//#region dist/date-fns/fp/formatISODuration.js
var _formatISODuration = convertToFP(formatISODuration$1, 1);
//#endregion
//#region dist/date-fns/fp/formatISOWithOptions.js
var _formatISOWithOptions = convertToFP(formatISO$1, 2);
//#endregion
//#region dist/date-fns/formatRFC3339.js
/**
* The {@link formatRFC3339} function options.
*/
/**
* @name formatRFC3339
* @category Common Helpers
* @summary Format the date according to the RFC 3339 standard (https://tools.ietf.org/html/rfc3339#section-5.6).
*
* @description
* Return the formatted date string in RFC 3339 format. Options may be passed to control the parts and notations of the date.
*
* @param date - The original date
* @param options - An object with options.
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 18 September 2019 in RFC 3339 format:
* formatRFC3339(new Date(2019, 8, 18, 19, 0, 52))
* //=> '2019-09-18T19:00:52Z'
*
* @example
* // Represent 18 September 2019 in RFC 3339 format, 3 digits of second fraction
* formatRFC3339(new Date(2019, 8, 18, 19, 0, 52, 234), {
*   fractionDigits: 3
* })
* //=> '2019-09-18T19:00:52.234Z'
*/
function formatRFC3339$1(date, options) {var _options$fractionDigi;
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (!isValid$1(date_)) throw new RangeError("Invalid time value");
  var fractionDigits = (_options$fractionDigi = options === null || options === void 0 ? void 0 : options.fractionDigits) !== null && _options$fractionDigi !== void 0 ? _options$fractionDigi : 0;
  var day = addLeadingZeros(date_.getDate(), 2);
  var month = addLeadingZeros(date_.getMonth() + 1, 2);
  var year = date_.getFullYear();
  var hour = addLeadingZeros(date_.getHours(), 2);
  var minute = addLeadingZeros(date_.getMinutes(), 2);
  var second = addLeadingZeros(date_.getSeconds(), 2);
  var fractionalSecond = "";
  if (fractionDigits > 0) {
    var _milliseconds = date_.getMilliseconds();
    fractionalSecond = "." + addLeadingZeros(Math.trunc(_milliseconds * Math.pow(10, fractionDigits - 3)), fractionDigits);
  }
  var offset = "";
  var tzOffset = date_.getTimezoneOffset();
  if (tzOffset !== 0) {
    var absoluteOffset = Math.abs(tzOffset);
    var hourOffset = addLeadingZeros(Math.trunc(absoluteOffset / 60), 2);
    var minuteOffset = addLeadingZeros(absoluteOffset % 60, 2);
    offset = "".concat(tzOffset < 0 ? "+" : "-").concat(hourOffset, ":").concat(minuteOffset);
  } else offset = "Z";
  return "".concat(year, "-").concat(month, "-").concat(day, "T").concat(hour, ":").concat(minute, ":").concat(second).concat(fractionalSecond).concat(offset);
}
//#endregion
//#region dist/date-fns/fp/formatRFC3339.js
var _formatRFC = convertToFP(formatRFC3339$1, 1);
//#endregion
//#region dist/date-fns/fp/formatRFC3339WithOptions.js
var _formatRFC3339WithOptions = convertToFP(formatRFC3339$1, 2);
//#endregion
//#region dist/date-fns/formatRFC7231.js
var days = [
"Sun",
"Mon",
"Tue",
"Wed",
"Thu",
"Fri",
"Sat"];

var months = [
"Jan",
"Feb",
"Mar",
"Apr",
"May",
"Jun",
"Jul",
"Aug",
"Sep",
"Oct",
"Nov",
"Dec"];

/**
* @name formatRFC7231
* @category Common Helpers
* @summary Format the date according to the RFC 7231 standard (https://tools.ietf.org/html/rfc7231#section-7.1.1.1).
*
* @description
* Return the formatted date string in RFC 7231 format.
* The result will always be in UTC timezone.
*
* @param date - The original date
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 18 September 2019 in RFC 7231 format:
* const result = formatRFC7231(new Date(2019, 8, 18, 19, 0, 52))
* //=> 'Wed, 18 Sep 2019 19:00:52 GMT'
*/
function formatRFC7231$1(date) {
  var _date = toDate$1(date);
  if (!isValid$1(_date)) throw new RangeError("Invalid time value");
  return "".concat(days[_date.getUTCDay()], ", ").concat(addLeadingZeros(_date.getUTCDate(), 2), " ").concat(months[_date.getUTCMonth()], " ").concat(_date.getUTCFullYear(), " ").concat(addLeadingZeros(_date.getUTCHours(), 2), ":").concat(addLeadingZeros(_date.getUTCMinutes(), 2), ":").concat(addLeadingZeros(_date.getUTCSeconds(), 2), " GMT");
}
//#endregion
//#region dist/date-fns/fp/formatRFC7231.js
var _formatRFC2 = convertToFP(formatRFC7231$1, 1);
//#endregion
//#region dist/date-fns/formatRelative.js
/**
* The {@link formatRelative} function options.
*/
/**
* @name formatRelative
* @category Common Helpers
* @summary Represent the date in words relative to the given base date.
*
* @description
* Represent the date in words relative to the given base date.
*
* | Distance to the base date | Result                    |
* |---------------------------|---------------------------|
* | Previous 6 days           | last Sunday at 04:30 AM   |
* | Last day                  | yesterday at 04:30 AM     |
* | Same day                  | today at 04:30 AM         |
* | Next day                  | tomorrow at 04:30 AM      |
* | Next 6 days               | Sunday at 04:30 AM        |
* | Other                     | 12/31/2017                |
*
* @param date - The date to format
* @param baseDate - The date to compare with
* @param options - An object with options
*
* @returns The date in words
*
* @throws `date` must not be Invalid Date
* @throws `baseDate` must not be Invalid Date
* @throws `options.locale` must contain `localize` property
* @throws `options.locale` must contain `formatLong` property
* @throws `options.locale` must contain `formatRelative` property
*
* @example
* // Represent the date of 6 days ago in words relative to the given base date. In this example, today is Wednesday
* const result = formatRelative(subDays(new Date(), 6), new Date())
* //=> "last Thursday at 12:45 AM"
*/
function formatRelative$1(date, baseDate, options) {var _ref21, _options$locale1, _ref22, _ref23, _ref24, _options$weekStartsOn4, _options$locale10, _defaultOptions$local7;
  var _normalizeDates37 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, date, baseDate),_normalizeDates38 = _slicedToArray(_normalizeDates37, 2),date_ = _normalizeDates38[0],baseDate_ = _normalizeDates38[1];
  var defaultOptions = getDefaultOptions$1();
  var locale = (_ref21 = (_options$locale1 = options === null || options === void 0 ? void 0 : options.locale) !== null && _options$locale1 !== void 0 ? _options$locale1 : defaultOptions.locale) !== null && _ref21 !== void 0 ? _ref21 : enUS;
  var weekStartsOn = (_ref22 = (_ref23 = (_ref24 = (_options$weekStartsOn4 = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn4 !== void 0 ? _options$weekStartsOn4 : options === null || options === void 0 || (_options$locale10 = options.locale) === null || _options$locale10 === void 0 || (_options$locale10 = _options$locale10.options) === null || _options$locale10 === void 0 ? void 0 : _options$locale10.weekStartsOn) !== null && _ref24 !== void 0 ? _ref24 : defaultOptions.weekStartsOn) !== null && _ref23 !== void 0 ? _ref23 : (_defaultOptions$local7 = defaultOptions.locale) === null || _defaultOptions$local7 === void 0 || (_defaultOptions$local7 = _defaultOptions$local7.options) === null || _defaultOptions$local7 === void 0 ? void 0 : _defaultOptions$local7.weekStartsOn) !== null && _ref22 !== void 0 ? _ref22 : 0;
  var diff = differenceInCalendarDays$1(date_, baseDate_);
  if (isNaN(diff)) throw new RangeError("Invalid time value");
  var token;
  if (diff < -6) token = "other";else
  if (diff < -1) token = "lastWeek";else
  if (diff < 0) token = "yesterday";else
  if (diff < 1) token = "today";else
  if (diff < 2) token = "tomorrow";else
  if (diff < 7) token = "nextWeek";else
  token = "other";
  return format$1(date_, locale.formatRelative(token, date_, baseDate_, {
    locale: locale,
    weekStartsOn: weekStartsOn
  }), {
    locale: locale,
    weekStartsOn: weekStartsOn
  });
}
//#endregion
//#region dist/date-fns/fp/formatRelative.js
var _formatRelative = convertToFP(formatRelative$1, 2);
//#endregion
//#region dist/date-fns/fp/formatRelativeWithOptions.js
var _formatRelativeWithOptions = convertToFP(formatRelative$1, 3);
//#endregion
//#region dist/date-fns/fp/formatWithOptions.js
var _formatWithOptions = convertToFP(format$1, 3);
//#endregion
//#region dist/date-fns/fromUnixTime.js
/**
* The {@link fromUnixTime} function options.
*/
/**
* @name fromUnixTime
* @category Timestamp Helpers
* @summary Create a date from a Unix timestamp.
*
* @description
* Create a date from a Unix timestamp (in seconds). Decimal values will be discarded.
*
* @param unixTime - The given Unix timestamp (in seconds)
* @param options - An object with options. Allows to pass a context.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
*
* @returns The date
*
* @example
* // Create the date 29 February 2012 11:45:05:
* const result = fromUnixTime(1330515905)
* //=> Wed Feb 29 2012 11:45:05
*/
function fromUnixTime$1(unixTime, options) {
  return toDate$1(unixTime * 1e3, options === null || options === void 0 ? void 0 : options.in);
}
//#endregion
//#region dist/date-fns/fp/fromUnixTime.js
var _fromUnixTime = convertToFP(fromUnixTime$1, 1);
//#endregion
//#region dist/date-fns/fp/fromUnixTimeWithOptions.js
var _fromUnixTimeWithOptions = convertToFP(fromUnixTime$1, 2);
//#endregion
//#region dist/date-fns/getDate.js
/**
* The {@link getDate} function options.
*/
/**
* @name getDate
* @category Day Helpers
* @summary Get the day of the month of the given date.
*
* @description
* Get the day of the month of the given date.
*
* @param date - The given date
* @param options - An object with options.
*
* @returns The day of month
*
* @example
* // Which day of the month is 29 February 2012?
* const result = getDate(new Date(2012, 1, 29))
* //=> 29
*/
function getDate$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDate();
}
//#endregion
//#region dist/date-fns/fp/getDate.js
var _getDate = convertToFP(getDate$1, 1);
//#endregion
//#region dist/date-fns/fp/getDateWithOptions.js
var _getDateWithOptions = convertToFP(getDate$1, 2);
//#endregion
//#region dist/date-fns/getDay.js
/**
* The {@link getDay} function options.
*/
/**
* @name getDay
* @category Weekday Helpers
* @summary Get the day of the week of the given date.
*
* @description
* Get the day of the week of the given date.
*
* @param date - The given date
* @param options - The options
*
* @returns The day of week, 0 represents Sunday
*
* @example
* // Which day of the week is 29 February 2012?
* const result = getDay(new Date(2012, 1, 29))
* //=> 3
*/
function getDay$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay();
}
//#endregion
//#region dist/date-fns/fp/getDay.js
var _getDay = convertToFP(getDay$1, 1);
//#endregion
//#region dist/date-fns/fp/getDayOfYear.js
var _getDayOfYear = convertToFP(getDayOfYear$1, 1);
//#endregion
//#region dist/date-fns/fp/getDayOfYearWithOptions.js
var _getDayOfYearWithOptions = convertToFP(getDayOfYear$1, 2);
//#endregion
//#region dist/date-fns/fp/getDayWithOptions.js
var _getDayWithOptions = convertToFP(getDay$1, 2);
//#endregion
//#region dist/date-fns/getDaysInMonth.js
/**
* The {@link getDaysInMonth} function options.
*/
/**
* @name getDaysInMonth
* @category Month Helpers
* @summary Get the number of days in a month of the given date.
*
* @description
* Get the number of days in a month of the given date, considering the context if provided.
*
* @param date - The given date
* @param options - An object with options
*
* @returns The number of days in a month
*
* @example
* // How many days are in February 2000?
* const result = getDaysInMonth(new Date(2000, 1))
* //=> 29
*/
function getDaysInMonth$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  var monthIndex = _date.getMonth();
  var lastDayOfMonth = constructFrom$1(_date, 0);
  lastDayOfMonth.setFullYear(year, monthIndex + 1, 0);
  lastDayOfMonth.setHours(0, 0, 0, 0);
  return lastDayOfMonth.getDate();
}
//#endregion
//#region dist/date-fns/fp/getDaysInMonth.js
var _getDaysInMonth = convertToFP(getDaysInMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/getDaysInMonthWithOptions.js
var _getDaysInMonthWithOptions = convertToFP(getDaysInMonth$1, 2);
//#endregion
//#region dist/date-fns/isLeapYear.js
/**
* @name isLeapYear
* @category Year Helpers
* @summary Is the given date in the leap year?
*
* @description
* Is the given date in the leap year?
*
* @param date - The date to check
* @param options - The options object
*
* @returns The date is in the leap year
*
* @example
* // Is 1 September 2012 in the leap year?
* const result = isLeapYear(new Date(2012, 8, 1))
* //=> true
*/
function isLeapYear$1(date, options) {
  var year = toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getFullYear();
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}
//#endregion
//#region dist/date-fns/getDaysInYear.js
/**
* The {@link getDaysInYear} function options.
*/
/**
* @name getDaysInYear
* @category Year Helpers
* @summary Get the number of days in a year of the given date.
*
* @description
* Get the number of days in a year of the given date.
*
* @param date - The given date
* @param options - An object with options
*
* @returns The number of days in a year
*
* @example
* // How many days are in 2012?
* const result = getDaysInYear(new Date(2012, 0, 1))
* //=> 366
*/
function getDaysInYear$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (Number.isNaN(+_date)) return NaN;
  return isLeapYear$1(_date) ? 366 : 365;
}
//#endregion
//#region dist/date-fns/fp/getDaysInYear.js
var _getDaysInYear = convertToFP(getDaysInYear$1, 1);
//#endregion
//#region dist/date-fns/fp/getDaysInYearWithOptions.js
var _getDaysInYearWithOptions = convertToFP(getDaysInYear$1, 2);
//#endregion
//#region dist/date-fns/getDecade.js
/**
* The {@link getDecade} function options.
*/
/**
* @name getDecade
* @category Decade Helpers
* @summary Get the decade of the given date.
*
* @description
* Get the decade of the given date.
*
* @param date - The given date
* @param options - An object with options
*
* @returns The year of decade
*
* @example
* // Which decade belongs 27 November 1942?
* const result = getDecade(new Date(1942, 10, 27))
* //=> 1940
*/
function getDecade$1(date, options) {
  var year = toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getFullYear();
  return Math.floor(year / 10) * 10;
}
//#endregion
//#region dist/date-fns/fp/getDecade.js
var _getDecade = convertToFP(getDecade$1, 1);
//#endregion
//#region dist/date-fns/fp/getDecadeWithOptions.js
var _getDecadeWithOptions = convertToFP(getDecade$1, 2);
//#endregion
//#region dist/date-fns/getHours.js
/**
* The {@link getHours} function options.
*/
/**
* @name getHours
* @category Hour Helpers
* @summary Get the hours of the given date.
*
* @description
* Get the hours of the given date.
*
* @param date - The given date
* @param options - An object with options
*
* @returns The hours
*
* @example
* // Get the hours of 29 February 2012 11:45:00:
* const result = getHours(new Date(2012, 1, 29, 11, 45))
* //=> 11
*/
function getHours$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getHours();
}
//#endregion
//#region dist/date-fns/fp/getHours.js
var _getHours = convertToFP(getHours$1, 1);
//#endregion
//#region dist/date-fns/fp/getHoursWithOptions.js
var _getHoursWithOptions = convertToFP(getHours$1, 2);
//#endregion
//#region dist/date-fns/getISODay.js
/**
* The {@link getISODay} function options.
*/
/**
* @name getISODay
* @category Weekday Helpers
* @summary Get the day of the ISO week of the given date.
*
* @description
* Get the day of the ISO week of the given date,
* which is 7 for Sunday, 1 for Monday etc.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param date - The given date
* @param options - An object with options
*
* @returns The day of ISO week
*
* @example
* // Which day of the ISO week is 26 February 2012?
* const result = getISODay(new Date(2012, 1, 26))
* //=> 7
*/
function getISODay$1(date, options) {
  var day = toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay();
  return day === 0 ? 7 : day;
}
//#endregion
//#region dist/date-fns/fp/getISODay.js
var _getISODay = convertToFP(getISODay$1, 1);
//#endregion
//#region dist/date-fns/fp/getISODayWithOptions.js
var _getISODayWithOptions = convertToFP(getISODay$1, 2);
//#endregion
//#region dist/date-fns/fp/getISOWeek.js
var _getISOWeek = convertToFP(getISOWeek$1, 1);
//#endregion
//#region dist/date-fns/fp/getISOWeekWithOptions.js
var _getISOWeekWithOptions = convertToFP(getISOWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/getISOWeekYear.js
var _getISOWeekYear = convertToFP(getISOWeekYear$1, 1);
//#endregion
//#region dist/date-fns/fp/getISOWeekYearWithOptions.js
var _getISOWeekYearWithOptions = convertToFP(getISOWeekYear$1, 2);
//#endregion
//#region dist/date-fns/getISOWeeksInYear.js
/**
* The {@link getISOWeeksInYear} function options.
*/
/**
* @name getISOWeeksInYear
* @category ISO Week-Numbering Year Helpers
* @summary Get the number of weeks in an ISO week-numbering year of the given date.
*
* @description
* Get the number of weeks in an ISO week-numbering year of the given date.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param date - The given date
* @param options - An object with options
*
* @returns The number of ISO weeks in a year
*
* @example
* // How many weeks are in ISO week-numbering year 2015?
* const result = getISOWeeksInYear(new Date(2015, 1, 11))
* //=> 53
*/
function getISOWeeksInYear$1(date, options) {
  var thisYear = startOfISOWeekYear$1(date, options);
  var diff = +startOfISOWeekYear$1(addWeeks$1(thisYear, 60)) - +thisYear;
  return Math.round(diff / millisecondsInWeek);
}
//#endregion
//#region dist/date-fns/fp/getISOWeeksInYear.js
var _getISOWeeksInYear = convertToFP(getISOWeeksInYear$1, 1);
//#endregion
//#region dist/date-fns/fp/getISOWeeksInYearWithOptions.js
var _getISOWeeksInYearWithOptions = convertToFP(getISOWeeksInYear$1, 2);
//#endregion
//#region dist/date-fns/getMilliseconds.js
/**
* @name getMilliseconds
* @category Millisecond Helpers
* @summary Get the milliseconds of the given date.
*
* @description
* Get the milliseconds of the given date.
*
* @param date - The given date
*
* @returns The milliseconds
*
* @example
* // Get the milliseconds of 29 February 2012 11:45:05.123:
* const result = getMilliseconds(new Date(2012, 1, 29, 11, 45, 5, 123))
* //=> 123
*/
function getMilliseconds$1(date) {
  return toDate$1(date).getMilliseconds();
}
//#endregion
//#region dist/date-fns/fp/getMilliseconds.js
var _getMilliseconds = convertToFP(getMilliseconds$1, 1);
//#endregion
//#region dist/date-fns/getMinutes.js
/**
* The {@link getMinutes} function options.
*/
/**
* @name getMinutes
* @category Minute Helpers
* @summary Get the minutes of the given date.
*
* @description
* Get the minutes of the given date.
*
* @param date - The given date
* @param options - The options
*
* @returns The minutes
*
* @example
* // Get the minutes of 29 February 2012 11:45:05:
* const result = getMinutes(new Date(2012, 1, 29, 11, 45, 5))
* //=> 45
*/
function getMinutes$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getMinutes();
}
//#endregion
//#region dist/date-fns/fp/getMinutes.js
var _getMinutes = convertToFP(getMinutes$1, 1);
//#endregion
//#region dist/date-fns/fp/getMinutesWithOptions.js
var _getMinutesWithOptions = convertToFP(getMinutes$1, 2);
//#endregion
//#region dist/date-fns/getMonth.js
/**
* The {@link getMonth} function options.
*/
/**
* @name getMonth
* @category Month Helpers
* @summary Get the month of the given date.
*
* @description
* Get the month of the given date.
*
* @param date - The given date
* @param options - An object with options
*
* @returns The month index (0-11)
*
* @example
* // Which month is 29 February 2012?
* const result = getMonth(new Date(2012, 1, 29))
* //=> 1
*/
function getMonth$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getMonth();
}
//#endregion
//#region dist/date-fns/fp/getMonth.js
var _getMonth = convertToFP(getMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/getMonthWithOptions.js
var _getMonthWithOptions = convertToFP(getMonth$1, 2);
//#endregion
//#region dist/date-fns/getOverlappingDaysInIntervals.js
/**
* @name getOverlappingDaysInIntervals
* @category Interval Helpers
* @summary Get the number of days that overlap in two time intervals
*
* @description
* Get the number of days that overlap in two time intervals. It uses the time
* between dates to calculate the number of days, rounding it up to include
* partial days.
*
* Two equal 0-length intervals will result in 0. Two equal 1ms intervals will
* result in 1.
*
* @param intervalLeft - The first interval to compare.
* @param intervalRight - The second interval to compare.
* @param options - An object with options
*
* @returns The number of days that overlap in two time intervals
*
* @example
* // For overlapping time intervals adds 1 for each started overlapping day:
* getOverlappingDaysInIntervals(
*   { start: new Date(2014, 0, 10), end: new Date(2014, 0, 20) },
*   { start: new Date(2014, 0, 17), end: new Date(2014, 0, 21) }
* )
* //=> 3
*
* @example
* // For non-overlapping time intervals returns 0:
* getOverlappingDaysInIntervals(
*   { start: new Date(2014, 0, 10), end: new Date(2014, 0, 20) },
*   { start: new Date(2014, 0, 21), end: new Date(2014, 0, 22) }
* )
* //=> 0
*/
function getOverlappingDaysInIntervals$1(intervalLeft, intervalRight) {
  var _sort5 = [+toDate$1(intervalLeft.start), +toDate$1(intervalLeft.end)].sort(function (a, b) {return a - b;}),_sort6 = _slicedToArray(_sort5, 2),leftStart = _sort6[0],leftEnd = _sort6[1];
  var _sort7 = [+toDate$1(intervalRight.start), +toDate$1(intervalRight.end)].sort(function (a, b) {return a - b;}),_sort8 = _slicedToArray(_sort7, 2),rightStart = _sort8[0],rightEnd = _sort8[1];
  if (!(leftStart < rightEnd && rightStart < leftEnd)) return 0;
  var overlapLeft = rightStart < leftStart ? leftStart : rightStart;
  var left = overlapLeft - getTimezoneOffsetInMilliseconds(overlapLeft);
  var overlapRight = rightEnd > leftEnd ? leftEnd : rightEnd;
  var right = overlapRight - getTimezoneOffsetInMilliseconds(overlapRight);
  return Math.ceil((right - left) / millisecondsInDay);
}
//#endregion
//#region dist/date-fns/fp/getOverlappingDaysInIntervals.js
var _getOverlappingDaysInIntervals = convertToFP(getOverlappingDaysInIntervals$1, 2);
//#endregion
//#region dist/date-fns/fp/getQuarter.js
var _getQuarter = convertToFP(getQuarter$1, 1);
//#endregion
//#region dist/date-fns/fp/getQuarterWithOptions.js
var _getQuarterWithOptions = convertToFP(getQuarter$1, 2);
//#endregion
//#region dist/date-fns/getSeconds.js
/**
* @name getSeconds
* @category Second Helpers
* @summary Get the seconds of the given date.
*
* @description
* Get the seconds of the given date.
*
* @param date - The given date
*
* @returns The seconds
*
* @example
* // Get the seconds of 29 February 2012 11:45:05.123:
* const result = getSeconds(new Date(2012, 1, 29, 11, 45, 5, 123))
* //=> 5
*/
function getSeconds$1(date) {
  return toDate$1(date).getSeconds();
}
//#endregion
//#region dist/date-fns/fp/getSeconds.js
var _getSeconds = convertToFP(getSeconds$1, 1);
//#endregion
//#region dist/date-fns/getTime.js
/**
* @name getTime
* @category Timestamp Helpers
* @summary Get the milliseconds timestamp of the given date.
*
* @description
* Get the milliseconds timestamp of the given date.
*
* @param date - The given date
*
* @returns The timestamp
*
* @example
* // Get the timestamp of 29 February 2012 11:45:05.123:
* const result = getTime(new Date(2012, 1, 29, 11, 45, 5, 123))
* //=> 1330515905123
*/
function getTime$1(date) {
  return +toDate$1(date);
}
//#endregion
//#region dist/date-fns/fp/getTime.js
var _getTime = convertToFP(getTime$1, 1);
//#endregion
//#region dist/date-fns/getUnixTime.js
/**
* @name getUnixTime
* @category Timestamp Helpers
* @summary Get the seconds timestamp of the given date.
*
* @description
* Get the seconds timestamp of the given date.
*
* @param date - The given date
*
* @returns The timestamp
*
* @example
* // Get the timestamp of 29 February 2012 11:45:05 CET:
* const result = getUnixTime(new Date(2012, 1, 29, 11, 45, 5))
* //=> 1330512305
*/
function getUnixTime$1(date) {
  return Math.trunc(+toDate$1(date) / 1e3);
}
//#endregion
//#region dist/date-fns/fp/getUnixTime.js
var _getUnixTime = convertToFP(getUnixTime$1, 1);
//#endregion
//#region dist/date-fns/fp/getWeek.js
var _getWeek = convertToFP(getWeek$1, 1);
//#endregion
//#region dist/date-fns/getWeekOfMonth.js
/**
* The {@link getWeekOfMonth} function options.
*/
/**
* @name getWeekOfMonth
* @category Week Helpers
* @summary Get the week of the month of the given date.
*
* @description
* Get the week of the month of the given date.
*
* @param date - The given date
* @param options - An object with options.
*
* @returns The week of month
*
* @example
* // Which week of the month is 9 November 2017?
* const result = getWeekOfMonth(new Date(2017, 10, 9))
* //=> 2
*/
function getWeekOfMonth$1(date, options) {var _ref25, _ref26, _ref27, _options$weekStartsOn5, _options$locale11, _defaultOptions$local8;
  var defaultOptions = getDefaultOptions$1();
  var weekStartsOn = (_ref25 = (_ref26 = (_ref27 = (_options$weekStartsOn5 = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn5 !== void 0 ? _options$weekStartsOn5 : options === null || options === void 0 || (_options$locale11 = options.locale) === null || _options$locale11 === void 0 || (_options$locale11 = _options$locale11.options) === null || _options$locale11 === void 0 ? void 0 : _options$locale11.weekStartsOn) !== null && _ref27 !== void 0 ? _ref27 : defaultOptions.weekStartsOn) !== null && _ref26 !== void 0 ? _ref26 : (_defaultOptions$local8 = defaultOptions.locale) === null || _defaultOptions$local8 === void 0 || (_defaultOptions$local8 = _defaultOptions$local8.options) === null || _defaultOptions$local8 === void 0 ? void 0 : _defaultOptions$local8.weekStartsOn) !== null && _ref25 !== void 0 ? _ref25 : 0;
  var currentDayOfMonth = getDate$1(toDate$1(date, options === null || options === void 0 ? void 0 : options.in));
  if (isNaN(currentDayOfMonth)) return NaN;
  var lastDayOfFirstWeek = weekStartsOn - getDay$1(startOfMonth$1(date, options));
  if (lastDayOfFirstWeek <= 0) lastDayOfFirstWeek += 7;
  var remainingDaysAfterFirstWeek = currentDayOfMonth - lastDayOfFirstWeek;
  return Math.ceil(remainingDaysAfterFirstWeek / 7) + 1;
}
//#endregion
//#region dist/date-fns/fp/getWeekOfMonth.js
var _getWeekOfMonth = convertToFP(getWeekOfMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/getWeekOfMonthWithOptions.js
var _getWeekOfMonthWithOptions = convertToFP(getWeekOfMonth$1, 2);
//#endregion
//#region dist/date-fns/fp/getWeekWithOptions.js
var _getWeekWithOptions = convertToFP(getWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/getWeekYear.js
var _getWeekYear = convertToFP(getWeekYear$1, 1);
//#endregion
//#region dist/date-fns/fp/getWeekYearWithOptions.js
var _getWeekYearWithOptions = convertToFP(getWeekYear$1, 2);
//#endregion
//#region dist/date-fns/lastDayOfMonth.js
/**
* The {@link lastDayOfMonth} function options.
*/
/**
* @name lastDayOfMonth
* @category Month Helpers
* @summary Return the last day of a month for the given date.
*
* @description
* Return the last day of a month for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The last day of a month
*
* @example
* // The last day of a month for 2 September 2014 11:55:00:
* const result = lastDayOfMonth(new Date(2014, 8, 2, 11, 55, 0))
* //=> Tue Sep 30 2014 00:00:00
*/
function lastDayOfMonth$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var month = _date.getMonth();
  _date.setFullYear(_date.getFullYear(), month + 1, 0);
  _date.setHours(0, 0, 0, 0);
  return toDate$1(_date, options === null || options === void 0 ? void 0 : options.in);
}
//#endregion
//#region dist/date-fns/getWeeksInMonth.js
/**
* The {@link getWeeksInMonth} function options.
*/
/**
* @name getWeeksInMonth
* @category Week Helpers
* @summary Get the number of calendar weeks a month spans.
*
* @description
* Get the number of calendar weeks the month in the given date spans.
*
* @param date - The given date
* @param options - An object with options.
*
* @returns The number of calendar weeks
*
* @example
* // How many calendar weeks does February 2015 span?
* const result = getWeeksInMonth(new Date(2015, 1, 8))
* //=> 4
*
* @example
* // If the week starts on Monday,
* // how many calendar weeks does July 2017 span?
* const result = getWeeksInMonth(new Date(2017, 6, 5), { weekStartsOn: 1 })
* //=> 6
*/
function getWeeksInMonth$1(date, options) {
  var contextDate = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  return differenceInCalendarWeeks$1(lastDayOfMonth$1(contextDate, options), startOfMonth$1(contextDate, options), options) + 1;
}
//#endregion
//#region dist/date-fns/fp/getWeeksInMonth.js
var _getWeeksInMonth = convertToFP(getWeeksInMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/getWeeksInMonthWithOptions.js
var _getWeeksInMonthWithOptions = convertToFP(getWeeksInMonth$1, 2);
//#endregion
//#region dist/date-fns/getYear.js
/**
* The {@link getYear} function options.
*/
/**
* @name getYear
* @category Year Helpers
* @summary Get the year of the given date.
*
* @description
* Get the year of the given date.
*
* @param date - The given date
* @param options - An object with options
*
* @returns The year
*
* @example
* // Which year is 2 July 2014?
* const result = getYear(new Date(2014, 6, 2))
* //=> 2014
*/
function getYear$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getFullYear();
}
//#endregion
//#region dist/date-fns/fp/getYear.js
var _getYear = convertToFP(getYear$1, 1);
//#endregion
//#region dist/date-fns/fp/getYearWithOptions.js
var _getYearWithOptions = convertToFP(getYear$1, 2);
//#endregion
//#region dist/date-fns/hoursToMilliseconds.js
/**
* @name hoursToMilliseconds
* @category  Conversion Helpers
* @summary Convert hours to milliseconds.
*
* @description
* Convert a number of hours to a full number of milliseconds.
*
* @param hours - number of hours to be converted
*
* @returns The number of hours converted to milliseconds
*
* @example
* // Convert 2 hours to milliseconds:
* const result = hoursToMilliseconds(2)
* //=> 7200000
*/
function hoursToMilliseconds$1(hours) {
  return Math.trunc(hours * millisecondsInHour);
}
//#endregion
//#region dist/date-fns/fp/hoursToMilliseconds.js
var _hoursToMilliseconds = convertToFP(hoursToMilliseconds$1, 1);
//#endregion
//#region dist/date-fns/hoursToMinutes.js
/**
* @name hoursToMinutes
* @category Conversion Helpers
* @summary Convert hours to minutes.
*
* @description
* Convert a number of hours to a full number of minutes.
*
* @param hours - number of hours to be converted
*
* @returns The number of hours converted in minutes
*
* @example
* // Convert 2 hours to minutes:
* const result = hoursToMinutes(2)
* //=> 120
*/
function hoursToMinutes$1(hours) {
  return Math.trunc(hours * 60);
}
//#endregion
//#region dist/date-fns/fp/hoursToMinutes.js
var _hoursToMinutes = convertToFP(hoursToMinutes$1, 1);
//#endregion
//#region dist/date-fns/hoursToSeconds.js
/**
* @name hoursToSeconds
* @category Conversion Helpers
* @summary Convert hours to seconds.
*
* @description
* Convert a number of hours to a full number of seconds.
*
* @param hours - The number of hours to be converted
*
* @returns The number of hours converted in seconds
*
* @example
* // Convert 2 hours to seconds:
* const result = hoursToSeconds(2)
* //=> 7200
*/
function hoursToSeconds$1(hours) {
  return Math.trunc(hours * secondsInHour);
}
//#endregion
//#region dist/date-fns/fp/hoursToSeconds.js
var _hoursToSeconds = convertToFP(hoursToSeconds$1, 1);
//#endregion
//#region dist/date-fns/interval.js
/**
* The {@link interval} function options.
*/
/**
* The {@link interval} function result type. It resolves the proper data type.
* It uses the first argument date object type, starting from the start argument,
* then the end interval date. If a context function is passed, it uses the context
* function return type.
*/
/**
* @name interval
* @category Interval Helpers
* @summary Creates an interval object and validates its values.
*
* @description
* Creates a normalized interval object and validates its values. If the interval is invalid, an exception is thrown.
*
* @typeParam StartDate - Start date type.
* @typeParam EndDate - End date type.
* @typeParam Options - Options type.
*
* @param start - The start of the interval.
* @param end - The end of the interval.
* @param options - The options object.
*
* @throws `Start date is invalid` when `start` is invalid.
* @throws `End date is invalid` when `end` is invalid.
* @throws `End date must be after start date` when end is before `start` and `options.assertPositive` is true.
*
* @returns The normalized and validated interval object.
*/
function interval$1(start, end, options) {
  var _normalizeDates39 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, start, end),_normalizeDates40 = _slicedToArray(_normalizeDates39, 2),_start = _normalizeDates40[0],_end = _normalizeDates40[1];
  if (isNaN(+_start)) throw new TypeError("Start date is invalid");
  if (isNaN(+_end)) throw new TypeError("End date is invalid");
  if (options !== null && options !== void 0 && options.assertPositive && +_start > +_end) throw new TypeError("End date must be after start date");
  return {
    start: _start,
    end: _end
  };
}
//#endregion
//#region dist/date-fns/fp/interval.js
var _interval = convertToFP(interval$1, 2);
//#endregion
//#region dist/date-fns/intervalToDuration.js
/**
* The {@link intervalToDuration} function options.
*/
/**
* @name intervalToDuration
* @category Common Helpers
* @summary Convert interval to duration
*
* @description
* Convert an interval object to a duration object.
*
* @param interval - The interval to convert to duration
* @param options - The context options
*
* @returns The duration object
*
* @example
* // Get the duration between January 15, 1929 and April 4, 1968.
* intervalToDuration({
*   start: new Date(1929, 0, 15, 12, 0, 0),
*   end: new Date(1968, 3, 4, 19, 5, 0)
* });
* //=> { years: 39, months: 2, days: 20, hours: 7, minutes: 5, seconds: 0 }
*/
function intervalToDuration$1(interval, options) {
  var _normalizeInterval9 = normalizeInterval(options === null || options === void 0 ? void 0 : options.in, interval),start = _normalizeInterval9.start,end = _normalizeInterval9.end;
  var duration = {};
  var years = differenceInYears$1(end, start);
  if (years) duration.years = years;
  var remainingMonths = add$1(start, { years: duration.years });
  var months = differenceInMonths$1(end, remainingMonths);
  if (months) duration.months = months;
  var remainingDays = add$1(remainingMonths, { months: duration.months });
  var days = differenceInDays$1(end, remainingDays);
  if (days) duration.days = days;
  var remainingHours = add$1(remainingDays, { days: duration.days });
  var hours = differenceInHours$1(end, remainingHours);
  if (hours) duration.hours = hours;
  var remainingMinutes = add$1(remainingHours, { hours: duration.hours });
  var minutes = differenceInMinutes$1(end, remainingMinutes);
  if (minutes) duration.minutes = minutes;
  var seconds = differenceInSeconds$1(end, add$1(remainingMinutes, { minutes: duration.minutes }));
  if (seconds) duration.seconds = seconds;
  return duration;
}
//#endregion
//#region dist/date-fns/fp/intervalToDuration.js
var _intervalToDuration = convertToFP(intervalToDuration$1, 1);
//#endregion
//#region dist/date-fns/fp/intervalToDurationWithOptions.js
var _intervalToDurationWithOptions = convertToFP(intervalToDuration$1, 2);
//#endregion
//#region dist/date-fns/fp/intervalWithOptions.js
var _intervalWithOptions = convertToFP(interval$1, 3);
//#endregion
//#region dist/date-fns/intlFormat.js
/**
* The locale string (see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument).
* @deprecated
*
* [TODO] Remove in v4
*/
/**
* The format options (see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options)
*/
/**
* The locale options.
*/
/**
* @name intlFormat
* @category Common Helpers
* @summary Format the date with Intl.DateTimeFormat (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
*
* @description
* Return the formatted date string in the given format.
* The method uses [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) inside.
* formatOptions are the same as [`Intl.DateTimeFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options)
*
* > ⚠️ Please note that before Node version 13.0.0, only the locale data for en-US is available by default.
*
* @param date - The date to format
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 4 October 2019 in middle-endian format:
* const result = intlFormat(new Date(2019, 9, 4, 12, 30, 13, 456))
* //=> 10/4/2019
*/
/**
* @param date - The date to format
* @param localeOptions - An object with locale
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 4 October 2019 in Korean.
* // Convert the date with locale's options.
* const result = intlFormat(new Date(2019, 9, 4, 12, 30, 13, 456), {
*   locale: 'ko-KR',
* })
* //=> 2019. 10. 4.
*/
/**
* @param date - The date to format
* @param formatOptions - The format options
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 4 October 2019.
* // Convert the date with format's options.
* const result = intlFormat.default(new Date(2019, 9, 4, 12, 30, 13, 456), {
*   year: 'numeric',
*   month: 'numeric',
*   day: 'numeric',
*   hour: 'numeric',
* })
* //=> 10/4/2019, 12 PM
*/
/**
* @param date - The date to format
* @param formatOptions - The format options
* @param localeOptions - An object with locale
*
* @returns The formatted date string
*
* @throws `date` must not be Invalid Date
*
* @example
* // Represent 4 October 2019 in German.
* // Convert the date with format's options and locale's options.
* const result = intlFormat(new Date(2019, 9, 4, 12, 30, 13, 456), {
*   weekday: 'long',
*   year: 'numeric',
*   month: 'long',
*   day: 'numeric',
* }, {
*   locale: 'de-DE',
* })
* //=> Freitag, 4. Oktober 2019
*/
function intlFormat$1(date, formatOrLocale, localeOptions) {var _localeOptions;
  var formatOptions;
  if (isFormatOptions(formatOrLocale)) formatOptions = formatOrLocale;else
  localeOptions = formatOrLocale;
  return new Intl.DateTimeFormat((_localeOptions = localeOptions) === null || _localeOptions === void 0 ? void 0 : _localeOptions.locale, formatOptions).format(toDate$1(date));
}
function isFormatOptions(opts) {
  return opts !== void 0 && !("locale" in opts);
}
//#endregion
//#region dist/date-fns/fp/intlFormat.js
var _intlFormat = convertToFP(intlFormat$1, 3);
//#endregion
//#region dist/date-fns/intlFormatDistance.js
/**
* The {@link intlFormatDistance} function options.
*/
/**
* The unit used to format the distance in {@link intlFormatDistance}.
*/
/**
* @name intlFormatDistance
* @category Common Helpers
* @summary Formats distance between two dates in a human-readable format
* @description
* The function calculates the difference between two dates and formats it as a human-readable string.
*
* The function will pick the most appropriate unit depending on the distance between dates. For example, if the distance is a few hours, it might return `x hours`. If the distance is a few months, it might return `x months`.
*
* You can also specify a unit to force using it regardless of the distance to get a result like `123456 hours`.
*
* See the table below for the unit picking logic:
*
* | Distance between dates | Result (past)  | Result (future) |
* | ---------------------- | -------------- | --------------- |
* | 0 seconds              | now            | now             |
* | 1-59 seconds           | X seconds ago  | in X seconds    |
* | 1-59 minutes           | X minutes ago  | in X minutes    |
* | 1-23 hours             | X hours ago    | in X hours      |
* | 1 day                  | yesterday      | tomorrow        |
* | 2-6 days               | X days ago     | in X days       |
* | 7 days                 | last week      | next week       |
* | 8 days-1 month         | X weeks ago    | in X weeks      |
* | 1 month                | last month     | next month      |
* | 2-3 months             | X months ago   | in X months     |
* | 1 quarter              | last quarter   | next quarter    |
* | 2-3 quarters           | X quarters ago | in X quarters   |
* | 1 year                 | last year      | next year       |
* | 2+ years               | X years ago    | in X years      |
*
* @param laterDate - The date
* @param earlierDate - The date to compare with.
* @param options - An object with options.
* See MDN for details [Locale identification and negotiation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
* The narrow one could be similar to the short one for some locales.
*
* @returns The distance in words according to language-sensitive relative time formatting.
*
* @throws `date` must not be Invalid Date
* @throws `baseDate` must not be Invalid Date
* @throws `options.unit` must not be invalid Unit
* @throws `options.locale` must not be invalid locale
* @throws `options.localeMatcher` must not be invalid localeMatcher
* @throws `options.numeric` must not be invalid numeric
* @throws `options.style` must not be invalid style
*
* @example
* // What is the distance between the dates when the fist date is after the second?
* intlFormatDistance(
*   new Date(1986, 3, 4, 11, 30, 0),
*   new Date(1986, 3, 4, 10, 30, 0)
* )
* //=> 'in 1 hour'
*
* // What is the distance between the dates when the fist date is before the second?
* intlFormatDistance(
*   new Date(1986, 3, 4, 10, 30, 0),
*   new Date(1986, 3, 4, 11, 30, 0)
* )
* //=> '1 hour ago'
*
* @example
* // Use the unit option to force the function to output the result in quarters. Without setting it, the example would return "next year"
* intlFormatDistance(
*   new Date(1987, 6, 4, 10, 30, 0),
*   new Date(1986, 3, 4, 10, 30, 0),
*   { unit: 'quarter' }
* )
* //=> 'in 5 quarters'
*
* @example
* // Use the locale option to get the result in Spanish. Without setting it, the example would return "in 1 hour".
* intlFormatDistance(
*   new Date(1986, 3, 4, 11, 30, 0),
*   new Date(1986, 3, 4, 10, 30, 0),
*   { locale: 'es' }
* )
* //=> 'dentro de 1 hora'
*
* @example
* // Use the numeric option to force the function to use numeric values. Without setting it, the example would return "tomorrow".
* intlFormatDistance(
*   new Date(1986, 3, 5, 11, 30, 0),
*   new Date(1986, 3, 4, 11, 30, 0),
*   { numeric: 'always' }
* )
* //=> 'in 1 day'
*
* @example
* // Use the style option to force the function to use short values. Without setting it, the example would return "in 2 years".
* intlFormatDistance(
*   new Date(1988, 3, 4, 11, 30, 0),
*   new Date(1986, 3, 4, 11, 30, 0),
*   { style: 'short' }
* )
* //=> 'in 2 yr'
*/
function intlFormatDistance$1(laterDate, earlierDate, options) {
  var value = 0;
  var unit;
  var _normalizeDates41 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates42 = _slicedToArray(_normalizeDates41, 2),laterDate_ = _normalizeDates42[0],earlierDate_ = _normalizeDates42[1];
  if (!(options !== null && options !== void 0 && options.unit)) {
    var diffInSeconds = differenceInSeconds$1(laterDate_, earlierDate_);
    if (Math.abs(diffInSeconds) < 60) {
      value = differenceInSeconds$1(laterDate_, earlierDate_);
      unit = "second";
    } else if (Math.abs(diffInSeconds) < 3600) {
      value = differenceInMinutes$1(laterDate_, earlierDate_);
      unit = "minute";
    } else if (Math.abs(diffInSeconds) < 86400 && Math.abs(differenceInCalendarDays$1(laterDate_, earlierDate_)) < 1) {
      value = differenceInHours$1(laterDate_, earlierDate_);
      unit = "hour";
    } else if (Math.abs(diffInSeconds) < 604800 && (value = differenceInCalendarDays$1(laterDate_, earlierDate_)) && Math.abs(value) < 7) unit = "day";else
    if (Math.abs(diffInSeconds) < 2629746) {
      value = differenceInCalendarWeeks$1(laterDate_, earlierDate_);
      unit = "week";
    } else if (Math.abs(diffInSeconds) < 7889238) {
      value = differenceInCalendarMonths$1(laterDate_, earlierDate_);
      unit = "month";
    } else if (Math.abs(diffInSeconds) < 31556952) {if (differenceInCalendarQuarters$1(laterDate_, earlierDate_) < 4) {
        value = differenceInCalendarQuarters$1(laterDate_, earlierDate_);
        unit = "quarter";
      } else {
        value = differenceInCalendarYears$1(laterDate_, earlierDate_);
        unit = "year";
      }} else
    {
      value = differenceInCalendarYears$1(laterDate_, earlierDate_);
      unit = "year";
    }
  } else {
    unit = options === null || options === void 0 ? void 0 : options.unit;
    if (unit === "second") value = differenceInSeconds$1(laterDate_, earlierDate_);else
    if (unit === "minute") value = differenceInMinutes$1(laterDate_, earlierDate_);else
    if (unit === "hour") value = differenceInHours$1(laterDate_, earlierDate_);else
    if (unit === "day") value = differenceInCalendarDays$1(laterDate_, earlierDate_);else
    if (unit === "week") value = differenceInCalendarWeeks$1(laterDate_, earlierDate_);else
    if (unit === "month") value = differenceInCalendarMonths$1(laterDate_, earlierDate_);else
    if (unit === "quarter") value = differenceInCalendarQuarters$1(laterDate_, earlierDate_);else
    if (unit === "year") value = differenceInCalendarYears$1(laterDate_, earlierDate_);
  }
  return new Intl.RelativeTimeFormat(options === null || options === void 0 ? void 0 : options.locale, _objectSpread({
    numeric: "auto" },
  options)
  ).format(value, unit);
}
//#endregion
//#region dist/date-fns/fp/intlFormatDistance.js
var _intlFormatDistance = convertToFP(intlFormatDistance$1, 2);
//#endregion
//#region dist/date-fns/fp/intlFormatDistanceWithOptions.js
var _intlFormatDistanceWithOptions = convertToFP(intlFormatDistance$1, 3);
//#endregion
//#region dist/date-fns/isAfter.js
/**
* @name isAfter
* @category Common Helpers
* @summary Is the first date after the second one?
*
* @description
* Is the first date after the second one?
*
* @param date - The date that should be after the other one to return true
* @param dateToCompare - The date to compare with
*
* @returns The first date is after the second date
*
* @example
* // Is 10 July 1989 after 11 February 1987?
* const result = isAfter(new Date(1989, 6, 10), new Date(1987, 1, 11))
* //=> true
*/
function isAfter$1(date, dateToCompare) {
  return +toDate$1(date) > +toDate$1(dateToCompare);
}
//#endregion
//#region dist/date-fns/fp/isAfter.js
var _isAfter = convertToFP(isAfter$1, 2);
//#endregion
//#region dist/date-fns/isBefore.js
/**
* @name isBefore
* @category Common Helpers
* @summary Is the first date before the second one?
*
* @description
* Is the first date before the second one?
*
* @param date - The date that should be before the other one to return true
* @param dateToCompare - The date to compare with
*
* @returns The first date is before the second date
*
* @example
* // Is 10 July 1989 before 11 February 1987?
* const result = isBefore(new Date(1989, 6, 10), new Date(1987, 1, 11))
* //=> false
*/
function isBefore$1(date, dateToCompare) {
  return +toDate$1(date) < +toDate$1(dateToCompare);
}
//#endregion
//#region dist/date-fns/fp/isBefore.js
var _isBefore = convertToFP(isBefore$1, 2);
//#endregion
//#region dist/date-fns/fp/isDate.js
var _isDate = convertToFP(isDate$1, 1);
//#endregion
//#region dist/date-fns/isEqual.js
/**
* @name isEqual
* @category Common Helpers
* @summary Are the given dates equal?
*
* @description
* Are the given dates equal?
*
* @param dateLeft - The first date to compare
* @param dateRight - The second date to compare
*
* @returns The dates are equal
*
* @example
* // Are 2 July 2014 06:30:45.000 and 2 July 2014 06:30:45.500 equal?
* const result = isEqual(
*   new Date(2014, 6, 2, 6, 30, 45, 0),
*   new Date(2014, 6, 2, 6, 30, 45, 500)
* )
* //=> false
*/
function isEqual$1(leftDate, rightDate) {
  return +toDate$1(leftDate) === +toDate$1(rightDate);
}
//#endregion
//#region dist/date-fns/fp/isEqual.js
var _isEqual = convertToFP(isEqual$1, 2);
//#endregion
//#region dist/date-fns/isExists.js
/**
* @name isExists
* @category Common Helpers
* @summary Is the given date exists?
*
* @description
* Checks if the given arguments convert to an existing date.
*
* @param year - The year of the date to check
* @param month - The month of the date to check
* @param day - The day of the date to check
*
* @returns `true` if the date exists
*
* @example
* // For the valid date:
* const result = isExists(2018, 0, 31)
* //=> true
*
* @example
* // For the invalid date:
* const result = isExists(2018, 1, 31)
* //=> false
*/
function isExists$1(year, month, day) {
  var date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}
//#endregion
//#region dist/date-fns/fp/isExists.js
var _isExists = convertToFP(isExists$1, 3);
//#endregion
//#region dist/date-fns/isFirstDayOfMonth.js
/**
* The {@link isFirstDayOfMonth} function options.
*/
/**
* @name isFirstDayOfMonth
* @category Month Helpers
* @summary Is the given date the first day of a month?
*
* @description
* Is the given date the first day of a month?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is the first day of a month
*
* @example
* // Is 1 September 2014 the first day of a month?
* const result = isFirstDayOfMonth(new Date(2014, 8, 1))
* //=> true
*/
function isFirstDayOfMonth$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDate() === 1;
}
//#endregion
//#region dist/date-fns/fp/isFirstDayOfMonth.js
var _isFirstDayOfMonth = convertToFP(isFirstDayOfMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/isFirstDayOfMonthWithOptions.js
var _isFirstDayOfMonthWithOptions = convertToFP(isFirstDayOfMonth$1, 2);
//#endregion
//#region dist/date-fns/isFriday.js
/**
* The {@link isFriday} function options.
*/
/**
* @name isFriday
* @category Weekday Helpers
* @summary Is the given date Friday?
*
* @description
* Is the given date Friday?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is Friday
*
* @example
* // Is 26 September 2014 Friday?
* const result = isFriday(new Date(2014, 8, 26))
* //=> true
*/
function isFriday$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay() === 5;
}
//#endregion
//#region dist/date-fns/fp/isFriday.js
var _isFriday = convertToFP(isFriday$1, 1);
//#endregion
//#region dist/date-fns/fp/isFridayWithOptions.js
var _isFridayWithOptions = convertToFP(isFriday$1, 2);
//#endregion
//#region dist/date-fns/fp/isLastDayOfMonth.js
var _isLastDayOfMonth = convertToFP(isLastDayOfMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/isLastDayOfMonthWithOptions.js
var _isLastDayOfMonthWithOptions = convertToFP(isLastDayOfMonth$1, 2);
//#endregion
//#region dist/date-fns/fp/isLeapYear.js
var _isLeapYear = convertToFP(isLeapYear$1, 1);
//#endregion
//#region dist/date-fns/fp/isLeapYearWithOptions.js
var _isLeapYearWithOptions = convertToFP(isLeapYear$1, 2);
//#endregion
//#region dist/date-fns/getDefaultOptions.js
/**
* @name getDefaultOptions
* @category Common Helpers
* @summary Get default options.
* @pure false
*
* @description
* Returns an object that contains defaults for
* `options.locale`, `options.weekStartsOn` and `options.firstWeekContainsDate`
* arguments for all functions.
*
* You can change these with [setDefaultOptions](https://date-fns.org/docs/setDefaultOptions).
*
* @returns The default options
*
* @example
* const result = getDefaultOptions()
* //=> {}
*
* @example
* setDefaultOptions({ weekStarsOn: 1, firstWeekContainsDate: 4 })
* const result = getDefaultOptions()
* //=> { weekStarsOn: 1, firstWeekContainsDate: 4 }
*/
function getDefaultOptions() {
  return Object.assign({}, getDefaultOptions$1());
}
//#endregion
//#region dist/date-fns/transpose.js
/**
* @name transpose
* @category Generic Helpers
* @summary Transpose the date to the given constructor.
*
* @description
* The function transposes the date to the given constructor. It helps you
* to transpose the date in the system time zone to say `UTCDate` or any other
* date extension.
*
* @typeParam InputDate - The input `Date` type derived from the passed argument.
* @typeParam ResultDate - The result `Date` type derived from the passed constructor.
*
* @param date - The date to use values from
* @param constructor - The date constructor to use
*
* @returns Date transposed to the given constructor
*
* @example
* // Create July 10, 2022 00:00 in locale time zone
* const date = new Date(2022, 6, 10)
* //=> 'Sun Jul 10 2022 00:00:00 GMT+0800 (Singapore Standard Time)'
*
* @example
* // Transpose the date to July 10, 2022 00:00 in UTC
* transpose(date, UTCDate)
* //=> 'Sun Jul 10 2022 00:00:00 GMT+0000 (Coordinated Universal Time)'
*/
function transpose$1(date, constructor) {
  var date_ = isConstructor(constructor) ? new constructor(0) : constructFrom$1(constructor, 0);
  date_.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  date_.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  return date_;
}
function isConstructor(constructor) {var _constructor$prototyp;
  return typeof constructor === "function" && ((_constructor$prototyp = constructor.prototype) === null || _constructor$prototyp === void 0 ? void 0 : _constructor$prototyp.constructor) === constructor;
}
//#endregion
//#region dist/date-fns/parse/_lib/Setter.js
var TIMEZONE_UNIT_PRIORITY = 10;
var Setter = /*#__PURE__*/function () {function Setter() {_classCallCheck(this, Setter);_defineProperty(this, "subPriority",
    0);}return _createClass(Setter, [{ key: "validate", value:
    function validate(_utcDate, _options) {
      return true;
    } }]);}();

var ValueSetter = /*#__PURE__*/function (_Setter) {
  function ValueSetter(value, validateValue, setValue, priority, subPriority) {var _this;_classCallCheck(this, ValueSetter);
    _this = _callSuper(this, ValueSetter);
    _this.value = value;
    _this.validateValue = validateValue;
    _this.setValue = setValue;
    _this.priority = priority;
    if (subPriority) _this.subPriority = subPriority;return _this;
  }_inherits(ValueSetter, _Setter);return _createClass(ValueSetter, [{ key: "validate", value:
    function validate(date, options) {
      return this.validateValue(date, this.value, options);
    } }, { key: "set", value:
    function set(date, flags, options) {
      return this.setValue(date, flags, this.value, options);
    } }]);}(Setter);

var DateTimezoneSetter = /*#__PURE__*/function (_Setter2) {


  function DateTimezoneSetter(context, reference) {var _this2;_classCallCheck(this, DateTimezoneSetter);
    _this2 = _callSuper(this, DateTimezoneSetter);_defineProperty(_this2, "priority", TIMEZONE_UNIT_PRIORITY);_defineProperty(_this2, "subPriority", -1);
    _this2.context = context || function (date) {return constructFrom$1(reference, date);};return _this2;
  }_inherits(DateTimezoneSetter, _Setter2);return _createClass(DateTimezoneSetter, [{ key: "set", value:
    function set(date, flags) {
      if (flags.timestampIsSet) return date;
      return constructFrom$1(date, transpose$1(date, this.context));
    } }]);}(Setter);

//#endregion
//#region dist/date-fns/parse/_lib/Parser.js
var Parser = /*#__PURE__*/function () {function Parser() {_classCallCheck(this, Parser);}return _createClass(Parser, [{ key: "run", value:
    function run(dateString, token, match, options) {
      var result = this.parse(dateString, token, match, options);
      if (!result) return null;
      return {
        setter: new ValueSetter(result.value, this.validate, this.set, this.priority, this.subPriority),
        rest: result.rest
      };
    } }, { key: "validate", value:
    function validate(_utcDate, _value, _options) {
      return true;
    } }]);}();

//#endregion
//#region dist/date-fns/parse/_lib/parsers/EraParser.js
var EraParser = /*#__PURE__*/function (_Parser) {function EraParser() {var _this3;_classCallCheck(this, EraParser);for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {args[_key3] = arguments[_key3];}_this3 = _callSuper(this, EraParser, [].concat(args));_defineProperty(_this3, "priority",
    140);_defineProperty(_this3, "incompatibleTokens",















    [
    "R",
    "u",
    "t",
    "T"]);return _this3;}_inherits(EraParser, _Parser);return _createClass(EraParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "G":case "GG":case "GGG":return match.era(dateString, { width: "abbreviated" }) || match.era(dateString, { width: "narrow" });case "GGGGG":return match.era(dateString, { width: "narrow" });default:return match.era(dateString, { width: "wide" }) || match.era(dateString, { width: "abbreviated" }) || match.era(dateString, { width: "narrow" });}} }, { key: "set", value: function set(date, flags, value) {flags.era = value;date.setFullYear(value, 0, 1);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/constants.js
var numericPatterns = {
  month: /^(1[0-2]|0?\d)/,
  date: /^(3[0-1]|[0-2]?\d)/,
  dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
  week: /^(5[0-3]|[0-4]?\d)/,
  hour23h: /^(2[0-3]|[0-1]?\d)/,
  hour24h: /^(2[0-4]|[0-1]?\d)/,
  hour11h: /^(1[0-1]|0?\d)/,
  hour12h: /^(1[0-2]|0?\d)/,
  minute: /^[0-5]?\d/,
  second: /^[0-5]?\d/,
  singleDigit: /^\d/,
  twoDigits: /^\d{1,2}/,
  threeDigits: /^\d{1,3}/,
  fourDigits: /^\d{1,4}/,
  anyDigitsSigned: /^-?\d+/,
  singleDigitSigned: /^-?\d/,
  twoDigitsSigned: /^-?\d{1,2}/,
  threeDigitsSigned: /^-?\d{1,3}/,
  fourDigitsSigned: /^-?\d{1,4}/
};
var timezonePatterns = {
  basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
  basic: /^([+-])(\d{2})(\d{2})|Z/,
  basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
  extended: /^([+-])(\d{2}):(\d{2})|Z/,
  extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
};
//#endregion
//#region dist/date-fns/parse/_lib/utils.js
function mapValue(parseFnResult, mapFn) {
  if (!parseFnResult) return parseFnResult;
  return {
    value: mapFn(parseFnResult.value),
    rest: parseFnResult.rest
  };
}
function parseNumericPattern(pattern, dateString) {
  var matchResult = dateString.match(pattern);
  if (!matchResult) return null;
  return {
    value: parseInt(matchResult[0], 10),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseTimezonePattern(pattern, dateString) {
  var matchResult = dateString.match(pattern);
  if (!matchResult) return null;
  if (matchResult[0] === "Z") return {
    value: 0,
    rest: dateString.slice(1)
  };
  var sign = matchResult[1] === "+" ? 1 : -1;
  var hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
  var minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
  var seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;
  return {
    value: sign * (hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * millisecondsInSecond),
    rest: dateString.slice(matchResult[0].length)
  };
}
function parseAnyDigitsSigned(dateString) {
  return parseNumericPattern(numericPatterns.anyDigitsSigned, dateString);
}
function parseNDigits(n, dateString) {
  switch (n) {
    case 1:return parseNumericPattern(numericPatterns.singleDigit, dateString);
    case 2:return parseNumericPattern(numericPatterns.twoDigits, dateString);
    case 3:return parseNumericPattern(numericPatterns.threeDigits, dateString);
    case 4:return parseNumericPattern(numericPatterns.fourDigits, dateString);
    default:return parseNumericPattern(new RegExp("^\\d{1," + n + "}"), dateString);
  }
}
function parseNDigitsSigned(n, dateString) {
  switch (n) {
    case 1:return parseNumericPattern(numericPatterns.singleDigitSigned, dateString);
    case 2:return parseNumericPattern(numericPatterns.twoDigitsSigned, dateString);
    case 3:return parseNumericPattern(numericPatterns.threeDigitsSigned, dateString);
    case 4:return parseNumericPattern(numericPatterns.fourDigitsSigned, dateString);
    default:return parseNumericPattern(new RegExp("^-?\\d{1," + n + "}"), dateString);
  }
}
function dayPeriodEnumToHours(dayPeriod) {
  switch (dayPeriod) {
    case "morning":return 4;
    case "evening":return 17;
    case "pm":
    case "noon":
    case "afternoon":return 12;
    default:return 0;
  }
}
function normalizeTwoDigitYear(twoDigitYear, currentYear) {
  var isCommonEra = currentYear > 0;
  var absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;
  var result;
  if (absCurrentYear <= 50) result = twoDigitYear || 100;else
  {
    var rangeEnd = absCurrentYear + 50;
    var rangeEndCentury = Math.trunc(rangeEnd / 100) * 100;
    var isPreviousCentury = twoDigitYear >= rangeEnd % 100;
    result = twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
  }
  return isCommonEra ? result : 1 - result;
}
function isLeapYearIndex$1(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}
//#endregion
//#region dist/date-fns/parse/_lib/parsers/YearParser.js
var YearParser = /*#__PURE__*/function (_Parser2) {function YearParser() {var _this4;_classCallCheck(this, YearParser);for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {args[_key4] = arguments[_key4];}_this4 = _callSuper(this, YearParser, [].concat(args));_defineProperty(_this4, "priority",
    130);_defineProperty(_this4, "incompatibleTokens",
    [
    "Y",
    "R",
    "u",
    "w",
    "I",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this4;}_inherits(YearParser, _Parser2);return _createClass(YearParser, [{ key: "parse", value:

    function parse(dateString, token, match) {
      var valueCallback = function valueCallback(year) {return {
          year: year,
          isTwoDigitYear: token === "yy"
        };};
      switch (token) {
        case "y":return mapValue(parseNDigits(4, dateString), valueCallback);
        case "yo":return mapValue(match.ordinalNumber(dateString, { unit: "year" }), valueCallback);
        default:return mapValue(parseNDigits(token.length, dateString), valueCallback);
      }
    } }, { key: "validate", value:
    function validate(_date, value) {
      return value.isTwoDigitYear || value.year > 0;
    } }, { key: "set", value:
    function set(date, flags, value) {
      var currentYear = date.getFullYear();
      if (value.isTwoDigitYear) {
        var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);
        date.setFullYear(normalizedTwoDigitYear, 0, 1);
        date.setHours(0, 0, 0, 0);
        return date;
      }
      var year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;
      date.setFullYear(year, 0, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    } }]);}(Parser);

//#endregion
//#region dist/date-fns/parse/_lib/parsers/LocalWeekYearParser.js
var LocalWeekYearParser = /*#__PURE__*/function (_Parser3) {function LocalWeekYearParser() {var _this5;_classCallCheck(this, LocalWeekYearParser);for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {args[_key5] = arguments[_key5];}_this5 = _callSuper(this, LocalWeekYearParser, [].concat(args));_defineProperty(_this5, "priority",
    130);_defineProperty(_this5, "incompatibleTokens",



























    [
    "y",
    "R",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"]);return _this5;}_inherits(LocalWeekYearParser, _Parser3);return _createClass(LocalWeekYearParser, [{ key: "parse", value: function parse(dateString, token, match) {var valueCallback = function valueCallback(year) {return { year: year, isTwoDigitYear: token === "YY" };};switch (token) {case "Y":return mapValue(parseNDigits(4, dateString), valueCallback);case "Yo":return mapValue(match.ordinalNumber(dateString, { unit: "year" }), valueCallback);default:return mapValue(parseNDigits(token.length, dateString), valueCallback);}} }, { key: "validate", value: function validate(_date, value) {return value.isTwoDigitYear || value.year > 0;} }, { key: "set", value: function set(date, flags, value, options) {var currentYear = getWeekYear$1(date, options);if (value.isTwoDigitYear) {var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);date.setFullYear(normalizedTwoDigitYear, 0, options.firstWeekContainsDate);date.setHours(0, 0, 0, 0);return startOfWeek$1(date, options);}var year = !("era" in flags) || flags.era === 1 ? value.year : 1 - value.year;date.setFullYear(year, 0, options.firstWeekContainsDate);date.setHours(0, 0, 0, 0);return startOfWeek$1(date, options);} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/ISOWeekYearParser.js
var ISOWeekYearParser = /*#__PURE__*/function (_Parser4) {function ISOWeekYearParser() {var _this6;_classCallCheck(this, ISOWeekYearParser);for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {args[_key6] = arguments[_key6];}_this6 = _callSuper(this, ISOWeekYearParser, [].concat(args));_defineProperty(_this6, "priority",
    130);_defineProperty(_this6, "incompatibleTokens",










    [
    "G",
    "y",
    "Y",
    "u",
    "Q",
    "q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"]);return _this6;}_inherits(ISOWeekYearParser, _Parser4);return _createClass(ISOWeekYearParser, [{ key: "parse", value: function parse(dateString, token) {if (token === "R") return parseNDigitsSigned(4, dateString);return parseNDigitsSigned(token.length, dateString);} }, { key: "set", value: function set(date, _flags, value) {var firstWeekOfYear = constructFrom$1(date, 0);firstWeekOfYear.setFullYear(value, 0, 4);firstWeekOfYear.setHours(0, 0, 0, 0);return startOfISOWeek$1(firstWeekOfYear);} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/ExtendedYearParser.js
var ExtendedYearParser = /*#__PURE__*/function (_Parser5) {function ExtendedYearParser() {var _this7;_classCallCheck(this, ExtendedYearParser);for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {args[_key7] = arguments[_key7];}_this7 = _callSuper(this, ExtendedYearParser, [].concat(args));_defineProperty(_this7, "priority",
    130);_defineProperty(_this7, "incompatibleTokens",









    [
    "G",
    "y",
    "Y",
    "R",
    "w",
    "I",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this7;}_inherits(ExtendedYearParser, _Parser5);return _createClass(ExtendedYearParser, [{ key: "parse", value: function parse(dateString, token) {if (token === "u") return parseNDigitsSigned(4, dateString);return parseNDigitsSigned(token.length, dateString);} }, { key: "set", value: function set(date, _flags, value) {date.setFullYear(value, 0, 1);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/QuarterParser.js
var QuarterParser = /*#__PURE__*/function (_Parser6) {function QuarterParser() {var _this8;_classCallCheck(this, QuarterParser);for (var _len8 = arguments.length, args = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {args[_key8] = arguments[_key8];}_this8 = _callSuper(this, QuarterParser, [].concat(args));_defineProperty(_this8, "priority",
    120);_defineProperty(_this8, "incompatibleTokens",




































    [
    "Y",
    "R",
    "q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this8;}_inherits(QuarterParser, _Parser6);return _createClass(QuarterParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "Q":case "QQ":return parseNDigits(token.length, dateString);case "Qo":return match.ordinalNumber(dateString, { unit: "quarter" });case "QQQ":return match.quarter(dateString, { width: "abbreviated", context: "formatting" }) || match.quarter(dateString, { width: "narrow", context: "formatting" });case "QQQQQ":return match.quarter(dateString, { width: "narrow", context: "formatting" });default:return match.quarter(dateString, { width: "wide", context: "formatting" }) || match.quarter(dateString, { width: "abbreviated", context: "formatting" }) || match.quarter(dateString, { width: "narrow", context: "formatting" });}} }, { key: "validate", value: function validate(_date, value) {return value >= 1 && value <= 4;} }, { key: "set", value: function set(date, _flags, value) {date.setMonth((value - 1) * 3, 1);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/StandAloneQuarterParser.js
var StandAloneQuarterParser = /*#__PURE__*/function (_Parser7) {function StandAloneQuarterParser() {var _this9;_classCallCheck(this, StandAloneQuarterParser);for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {args[_key9] = arguments[_key9];}_this9 = _callSuper(this, StandAloneQuarterParser, [].concat(args));_defineProperty(_this9, "priority",
    120);_defineProperty(_this9, "incompatibleTokens",




































    [
    "Y",
    "R",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this9;}_inherits(StandAloneQuarterParser, _Parser7);return _createClass(StandAloneQuarterParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "q":case "qq":return parseNDigits(token.length, dateString);case "qo":return match.ordinalNumber(dateString, { unit: "quarter" });case "qqq":return match.quarter(dateString, { width: "abbreviated", context: "standalone" }) || match.quarter(dateString, { width: "narrow", context: "standalone" });case "qqqqq":return match.quarter(dateString, { width: "narrow", context: "standalone" });default:return match.quarter(dateString, { width: "wide", context: "standalone" }) || match.quarter(dateString, { width: "abbreviated", context: "standalone" }) || match.quarter(dateString, { width: "narrow", context: "standalone" });}} }, { key: "validate", value: function validate(_date, value) {return value >= 1 && value <= 4;} }, { key: "set", value: function set(date, _flags, value) {date.setMonth((value - 1) * 3, 1);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/MonthParser.js
var MonthParser = /*#__PURE__*/function (_Parser8) {function MonthParser() {var _this0;_classCallCheck(this, MonthParser);for (var _len0 = arguments.length, args = new Array(_len0), _key0 = 0; _key0 < _len0; _key0++) {args[_key0] = arguments[_key0];}_this0 = _callSuper(this, MonthParser, [].concat(args));_defineProperty(_this0, "incompatibleTokens",
    [
    "Y",
    "R",
    "q",
    "Q",
    "L",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"]);_defineProperty(_this0, "priority",

    110);return _this0;}_inherits(MonthParser, _Parser8);return _createClass(MonthParser, [{ key: "parse", value:
    function parse(dateString, token, match) {
      var valueCallback = function valueCallback(value) {return value - 1;};
      switch (token) {
        case "M":return mapValue(parseNumericPattern(numericPatterns.month, dateString), valueCallback);
        case "MM":return mapValue(parseNDigits(2, dateString), valueCallback);
        case "Mo":return mapValue(match.ordinalNumber(dateString, { unit: "month" }), valueCallback);
        case "MMM":return match.month(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match.month(dateString, {
            width: "narrow",
            context: "formatting"
          });
        case "MMMMM":return match.month(dateString, {
            width: "narrow",
            context: "formatting"
          });
        default:return match.month(dateString, {
            width: "wide",
            context: "formatting"
          }) || match.month(dateString, {
            width: "abbreviated",
            context: "formatting"
          }) || match.month(dateString, {
            width: "narrow",
            context: "formatting"
          });
      }
    } }, { key: "validate", value:
    function validate(_date, value) {
      return value >= 0 && value <= 11;
    } }, { key: "set", value:
    function set(date, _flags, value) {
      date.setMonth(value, 1);
      date.setHours(0, 0, 0, 0);
      return date;
    } }]);}(Parser);

//#endregion
//#region dist/date-fns/parse/_lib/parsers/StandAloneMonthParser.js
var StandAloneMonthParser = /*#__PURE__*/function (_Parser9) {function StandAloneMonthParser() {var _this1;_classCallCheck(this, StandAloneMonthParser);for (var _len1 = arguments.length, args = new Array(_len1), _key1 = 0; _key1 < _len1; _key1++) {args[_key1] = arguments[_key1];}_this1 = _callSuper(this, StandAloneMonthParser, [].concat(args));_defineProperty(_this1, "priority",
    110);_defineProperty(_this1, "incompatibleTokens",





































    [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this1;}_inherits(StandAloneMonthParser, _Parser9);return _createClass(StandAloneMonthParser, [{ key: "parse", value: function parse(dateString, token, match) {var valueCallback = function valueCallback(value) {return value - 1;};switch (token) {case "L":return mapValue(parseNumericPattern(numericPatterns.month, dateString), valueCallback);case "LL":return mapValue(parseNDigits(2, dateString), valueCallback);case "Lo":return mapValue(match.ordinalNumber(dateString, { unit: "month" }), valueCallback);case "LLL":return match.month(dateString, { width: "abbreviated", context: "standalone" }) || match.month(dateString, { width: "narrow", context: "standalone" });case "LLLLL":return match.month(dateString, { width: "narrow", context: "standalone" });default:return match.month(dateString, { width: "wide", context: "standalone" }) || match.month(dateString, { width: "abbreviated", context: "standalone" }) || match.month(dateString, { width: "narrow", context: "standalone" });}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 11;} }, { key: "set", value: function set(date, _flags, value) {date.setMonth(value, 1);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/setWeek.js
/**
* The {@link setWeek} function options.
*/
/**
* @name setWeek
* @category Week Helpers
* @summary Set the local week to the given date.
*
* @description
* Set the local week to the given date, saving the weekday number.
* The exact calculation depends on the values of
* `options.weekStartsOn` (which is the index of the first day of the week)
* and `options.firstWeekContainsDate` (which is the day of January, which is always in
* the first week of the week-numbering year)
*
* Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param week - The week of the new date
* @param options - An object with options
*
* @returns The new date with the local week set
*
* @example
* // Set the 1st week to 2 January 2005 with default options:
* const result = setWeek(new Date(2005, 0, 2), 1)
* //=> Sun Dec 26 2004 00:00:00
*
* @example
* // Set the 1st week to 2 January 2005,
* // if Monday is the first day of the week,
* // and the first week of the year always contains 4 January:
* const result = setWeek(new Date(2005, 0, 2), 1, {
*   weekStartsOn: 1,
*   firstWeekContainsDate: 4
* })
* //=> Sun Jan 4 2004 00:00:00
*/
function setWeek$1(date, week, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var diff = getWeek$1(date_, options) - week;
  date_.setDate(date_.getDate() - diff * 7);
  return toDate$1(date_, options === null || options === void 0 ? void 0 : options.in);
}
//#endregion
//#region dist/date-fns/parse/_lib/parsers/LocalWeekParser.js
var LocalWeekParser = /*#__PURE__*/function (_Parser0) {function LocalWeekParser() {var _this10;_classCallCheck(this, LocalWeekParser);for (var _len10 = arguments.length, args = new Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {args[_key10] = arguments[_key10];}_this10 = _callSuper(this, LocalWeekParser, [].concat(args));_defineProperty(_this10, "priority",
    100);_defineProperty(_this10, "incompatibleTokens",













    [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "i",
    "t",
    "T"]);return _this10;}_inherits(LocalWeekParser, _Parser0);return _createClass(LocalWeekParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "w":return parseNumericPattern(numericPatterns.week, dateString);case "wo":return match.ordinalNumber(dateString, { unit: "week" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 1 && value <= 53;} }, { key: "set", value: function set(date, _flags, value, options) {return startOfWeek$1(setWeek$1(date, value, options), options);} }]);}(Parser);


//#endregion
//#region dist/date-fns/setISOWeek.js
/**
* The {@link setISOWeek} function options.
*/
/**
* @name setISOWeek
* @category ISO Week Helpers
* @summary Set the ISO week to the given date.
*
* @description
* Set the ISO week to the given date, saving the weekday number.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The `Date` type of the context function.
*
* @param date - The date to be changed
* @param week - The ISO week of the new date
* @param options - An object with options
*
* @returns The new date with the ISO week set
*
* @example
* // Set the 53rd ISO week to 7 August 2004:
* const result = setISOWeek(new Date(2004, 7, 7), 53)
* //=> Sat Jan 01 2005 00:00:00
*/
function setISOWeek$1(date, week, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var diff = getISOWeek$1(_date, options) - week;
  _date.setDate(_date.getDate() - diff * 7);
  return _date;
}
//#endregion
//#region dist/date-fns/parse/_lib/parsers/ISOWeekParser.js
var ISOWeekParser = /*#__PURE__*/function (_Parser1) {function ISOWeekParser() {var _this11;_classCallCheck(this, ISOWeekParser);for (var _len11 = arguments.length, args = new Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {args[_key11] = arguments[_key11];}_this11 = _callSuper(this, ISOWeekParser, [].concat(args));_defineProperty(_this11, "priority",
    100);_defineProperty(_this11, "incompatibleTokens",













    [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "e",
    "c",
    "t",
    "T"]);return _this11;}_inherits(ISOWeekParser, _Parser1);return _createClass(ISOWeekParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "I":return parseNumericPattern(numericPatterns.week, dateString);case "Io":return match.ordinalNumber(dateString, { unit: "week" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 1 && value <= 53;} }, { key: "set", value: function set(date, _flags, value) {return startOfISOWeek$1(setISOWeek$1(date, value));} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/DateParser.js
var DAYS_IN_MONTH = [
31,
28,
31,
30,
31,
30,
31,
31,
30,
31,
30,
31];

var DAYS_IN_MONTH_LEAP_YEAR = [
31,
29,
31,
30,
31,
30,
31,
31,
30,
31,
30,
31];

var DateParser = /*#__PURE__*/function (_Parser10) {function DateParser() {var _this12;_classCallCheck(this, DateParser);for (var _len12 = arguments.length, args = new Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {args[_key12] = arguments[_key12];}_this12 = _callSuper(this, DateParser, [].concat(args));_defineProperty(_this12, "priority",
    90);_defineProperty(_this12, "subPriority",
    1);_defineProperty(_this12, "incompatibleTokens",


















    [
    "Y",
    "R",
    "q",
    "Q",
    "w",
    "I",
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this12;}_inherits(DateParser, _Parser10);return _createClass(DateParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "d":return parseNumericPattern(numericPatterns.date, dateString);case "do":return match.ordinalNumber(dateString, { unit: "date" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(date, value) {var isLeapYear = isLeapYearIndex$1(date.getFullYear());var month = date.getMonth();if (isLeapYear) return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];else return value >= 1 && value <= DAYS_IN_MONTH[month];} }, { key: "set", value: function set(date, _flags, value) {date.setDate(value);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/DayOfYearParser.js
var DayOfYearParser = /*#__PURE__*/function (_Parser11) {function DayOfYearParser() {var _this13;_classCallCheck(this, DayOfYearParser);for (var _len13 = arguments.length, args = new Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {args[_key13] = arguments[_key13];}_this13 = _callSuper(this, DayOfYearParser, [].concat(args));_defineProperty(_this13, "priority",
    90);_defineProperty(_this13, "subpriority",
    1);_defineProperty(_this13, "incompatibleTokens",

















    [
    "Y",
    "R",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "I",
    "d",
    "E",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this13;}_inherits(DayOfYearParser, _Parser11);return _createClass(DayOfYearParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "D":case "DD":return parseNumericPattern(numericPatterns.dayOfYear, dateString);case "Do":return match.ordinalNumber(dateString, { unit: "date" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(date, value) {if (isLeapYearIndex$1(date.getFullYear())) return value >= 1 && value <= 366;else return value >= 1 && value <= 365;} }, { key: "set", value: function set(date, _flags, value) {date.setMonth(0, value);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/setDay.js
/**
* The {@link setDay} function options.
*/
/**
* @name setDay
* @category Weekday Helpers
* @summary Set the day of the week to the given date.
*
* @description
* Set the day of the week to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param day - The day of the week of the new date
* @param options - An object with options.
*
* @returns The new date with the day of the week set
*
* @example
* // Set week day to Sunday, with the default weekStartsOn of Sunday:
* const result = setDay(new Date(2014, 8, 1), 0)
* //=> Sun Aug 31 2014 00:00:00
*
* @example
* // Set week day to Sunday, with a weekStartsOn of Monday:
* const result = setDay(new Date(2014, 8, 1), 0, { weekStartsOn: 1 })
* //=> Sun Sep 07 2014 00:00:00
*/
function setDay$1(date, day, options) {var _ref28, _ref29, _ref30, _options$weekStartsOn6, _options$locale12, _defaultOptions$local9;
  var defaultOptions = getDefaultOptions$1();
  var weekStartsOn = (_ref28 = (_ref29 = (_ref30 = (_options$weekStartsOn6 = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn6 !== void 0 ? _options$weekStartsOn6 : options === null || options === void 0 || (_options$locale12 = options.locale) === null || _options$locale12 === void 0 || (_options$locale12 = _options$locale12.options) === null || _options$locale12 === void 0 ? void 0 : _options$locale12.weekStartsOn) !== null && _ref30 !== void 0 ? _ref30 : defaultOptions.weekStartsOn) !== null && _ref29 !== void 0 ? _ref29 : (_defaultOptions$local9 = defaultOptions.locale) === null || _defaultOptions$local9 === void 0 || (_defaultOptions$local9 = _defaultOptions$local9.options) === null || _defaultOptions$local9 === void 0 ? void 0 : _defaultOptions$local9.weekStartsOn) !== null && _ref28 !== void 0 ? _ref28 : 0;
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var currentDay = date_.getDay();
  var dayIndex = (day % 7 + 7) % 7;
  var delta = 7 - weekStartsOn;
  return addDays$1(date_, day < 0 || day > 6 ? day - (currentDay + delta) % 7 : (dayIndex + delta) % 7 - (currentDay + delta) % 7, options);
}
//#endregion
//#region dist/date-fns/parse/_lib/parsers/DayParser.js
var DayParser = /*#__PURE__*/function (_Parser12) {function DayParser() {var _this14;_classCallCheck(this, DayParser);for (var _len14 = arguments.length, args = new Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {args[_key14] = arguments[_key14];}_this14 = _callSuper(this, DayParser, [].concat(args));_defineProperty(_this14, "priority",
    90);_defineProperty(_this14, "incompatibleTokens",
















































    [
    "D",
    "i",
    "e",
    "c",
    "t",
    "T"]);return _this14;}_inherits(DayParser, _Parser12);return _createClass(DayParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "E":case "EE":case "EEE":return match.day(dateString, { width: "abbreviated", context: "formatting" }) || match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" });case "EEEEE":return match.day(dateString, { width: "narrow", context: "formatting" });case "EEEEEE":return match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" });default:return match.day(dateString, { width: "wide", context: "formatting" }) || match.day(dateString, { width: "abbreviated", context: "formatting" }) || match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" });}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 6;} }, { key: "set", value: function set(date, _flags, value, options) {date = setDay$1(date, value, options);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/LocalDayParser.js
var LocalDayParser = /*#__PURE__*/function (_Parser13) {function LocalDayParser() {var _this15;_classCallCheck(this, LocalDayParser);for (var _len15 = arguments.length, args = new Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {args[_key15] = arguments[_key15];}_this15 = _callSuper(this, LocalDayParser, [].concat(args));_defineProperty(_this15, "priority",
    90);_defineProperty(_this15, "incompatibleTokens",





















































    [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "c",
    "t",
    "T"]);return _this15;}_inherits(LocalDayParser, _Parser13);return _createClass(LocalDayParser, [{ key: "parse", value: function parse(dateString, token, match, options) {var valueCallback = function valueCallback(value) {var wholeWeekDays = Math.floor((value - 1) / 7) * 7;return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;};switch (token) {case "e":case "ee":return mapValue(parseNDigits(token.length, dateString), valueCallback);case "eo":return mapValue(match.ordinalNumber(dateString, { unit: "day" }), valueCallback);case "eee":return match.day(dateString, { width: "abbreviated", context: "formatting" }) || match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" });case "eeeee":return match.day(dateString, { width: "narrow", context: "formatting" });case "eeeeee":return match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" });default:return match.day(dateString, { width: "wide", context: "formatting" }) || match.day(dateString, { width: "abbreviated", context: "formatting" }) || match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" });}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 6;} }, { key: "set", value: function set(date, _flags, value, options) {date = setDay$1(date, value, options);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/StandAloneLocalDayParser.js
var StandAloneLocalDayParser = /*#__PURE__*/function (_Parser14) {function StandAloneLocalDayParser() {var _this16;_classCallCheck(this, StandAloneLocalDayParser);for (var _len16 = arguments.length, args = new Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {args[_key16] = arguments[_key16];}_this16 = _callSuper(this, StandAloneLocalDayParser, [].concat(args));_defineProperty(_this16, "priority",
    90);_defineProperty(_this16, "incompatibleTokens",





















































    [
    "y",
    "R",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "I",
    "d",
    "D",
    "E",
    "i",
    "e",
    "t",
    "T"]);return _this16;}_inherits(StandAloneLocalDayParser, _Parser14);return _createClass(StandAloneLocalDayParser, [{ key: "parse", value: function parse(dateString, token, match, options) {var valueCallback = function valueCallback(value) {var wholeWeekDays = Math.floor((value - 1) / 7) * 7;return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;};switch (token) {case "c":case "cc":return mapValue(parseNDigits(token.length, dateString), valueCallback);case "co":return mapValue(match.ordinalNumber(dateString, { unit: "day" }), valueCallback);case "ccc":return match.day(dateString, { width: "abbreviated", context: "standalone" }) || match.day(dateString, { width: "short", context: "standalone" }) || match.day(dateString, { width: "narrow", context: "standalone" });case "ccccc":return match.day(dateString, { width: "narrow", context: "standalone" });case "cccccc":return match.day(dateString, { width: "short", context: "standalone" }) || match.day(dateString, { width: "narrow", context: "standalone" });default:return match.day(dateString, { width: "wide", context: "standalone" }) || match.day(dateString, { width: "abbreviated", context: "standalone" }) || match.day(dateString, { width: "short", context: "standalone" }) || match.day(dateString, { width: "narrow", context: "standalone" });}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 6;} }, { key: "set", value: function set(date, _flags, value, options) {date = setDay$1(date, value, options);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/setISODay.js
/**
* The {@link setISODay} function options.
*/
/**
* @name setISODay
* @category Weekday Helpers
* @summary Set the day of the ISO week to the given date.
*
* @description
* Set the day of the ISO week to the given date.
* ISO week starts with Monday.
* 7 is the index of Sunday, 1 is the index of Monday, etc.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param day - The day of the ISO week of the new date
* @param options - An object with options
*
* @returns The new date with the day of the ISO week set
*
* @example
* // Set Sunday to 1 September 2014:
* const result = setISODay(new Date(2014, 8, 1), 7)
* //=> Sun Sep 07 2014 00:00:00
*/
function setISODay$1(date, day, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  return addDays$1(date_, day - getISODay$1(date_, options), options);
}
//#endregion
//#region dist/date-fns/parse/_lib/parsers/ISODayParser.js
var ISODayParser = /*#__PURE__*/function (_Parser15) {function ISODayParser() {var _this17;_classCallCheck(this, ISODayParser);for (var _len17 = arguments.length, args = new Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {args[_key17] = arguments[_key17];}_this17 = _callSuper(this, ISODayParser, [].concat(args));_defineProperty(_this17, "priority",
    90);_defineProperty(_this17, "incompatibleTokens",





















































    [
    "y",
    "Y",
    "u",
    "q",
    "Q",
    "M",
    "L",
    "w",
    "d",
    "D",
    "E",
    "e",
    "c",
    "t",
    "T"]);return _this17;}_inherits(ISODayParser, _Parser15);return _createClass(ISODayParser, [{ key: "parse", value: function parse(dateString, token, match) {var valueCallback = function valueCallback(value) {if (value === 0) return 7;return value;};switch (token) {case "i":case "ii":return parseNDigits(token.length, dateString);case "io":return match.ordinalNumber(dateString, { unit: "day" });case "iii":return mapValue(match.day(dateString, { width: "abbreviated", context: "formatting" }) || match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" }), valueCallback);case "iiiii":return mapValue(match.day(dateString, { width: "narrow", context: "formatting" }), valueCallback);case "iiiiii":return mapValue(match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" }), valueCallback);default:return mapValue(match.day(dateString, { width: "wide", context: "formatting" }) || match.day(dateString, { width: "abbreviated", context: "formatting" }) || match.day(dateString, { width: "short", context: "formatting" }) || match.day(dateString, { width: "narrow", context: "formatting" }), valueCallback);}} }, { key: "validate", value: function validate(_date, value) {return value >= 1 && value <= 7;} }, { key: "set", value: function set(date, _flags, value) {date = setISODay$1(date, value);date.setHours(0, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/AMPMParser.js
var AMPMParser = /*#__PURE__*/function (_Parser16) {function AMPMParser() {var _this18;_classCallCheck(this, AMPMParser);for (var _len18 = arguments.length, args = new Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {args[_key18] = arguments[_key18];}_this18 = _callSuper(this, AMPMParser, [].concat(args));_defineProperty(_this18, "priority",
    80);_defineProperty(_this18, "incompatibleTokens",































    [
    "b",
    "B",
    "H",
    "k",
    "t",
    "T"]);return _this18;}_inherits(AMPMParser, _Parser16);return _createClass(AMPMParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "a":case "aa":case "aaa":return match.dayPeriod(dateString, { width: "abbreviated", context: "formatting" }) || match.dayPeriod(dateString, { width: "narrow", context: "formatting" });case "aaaaa":return match.dayPeriod(dateString, { width: "narrow", context: "formatting" });default:return match.dayPeriod(dateString, { width: "wide", context: "formatting" }) || match.dayPeriod(dateString, { width: "abbreviated", context: "formatting" }) || match.dayPeriod(dateString, { width: "narrow", context: "formatting" });}} }, { key: "set", value: function set(date, _flags, value) {date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/AMPMMidnightParser.js
var AMPMMidnightParser = /*#__PURE__*/function (_Parser17) {function AMPMMidnightParser() {var _this19;_classCallCheck(this, AMPMMidnightParser);for (var _len19 = arguments.length, args = new Array(_len19), _key19 = 0; _key19 < _len19; _key19++) {args[_key19] = arguments[_key19];}_this19 = _callSuper(this, AMPMMidnightParser, [].concat(args));_defineProperty(_this19, "priority",
    80);_defineProperty(_this19, "incompatibleTokens",































    [
    "a",
    "B",
    "H",
    "k",
    "t",
    "T"]);return _this19;}_inherits(AMPMMidnightParser, _Parser17);return _createClass(AMPMMidnightParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "b":case "bb":case "bbb":return match.dayPeriod(dateString, { width: "abbreviated", context: "formatting" }) || match.dayPeriod(dateString, { width: "narrow", context: "formatting" });case "bbbbb":return match.dayPeriod(dateString, { width: "narrow", context: "formatting" });default:return match.dayPeriod(dateString, { width: "wide", context: "formatting" }) || match.dayPeriod(dateString, { width: "abbreviated", context: "formatting" }) || match.dayPeriod(dateString, { width: "narrow", context: "formatting" });}} }, { key: "set", value: function set(date, _flags, value) {date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/DayPeriodParser.js
var DayPeriodParser = /*#__PURE__*/function (_Parser18) {function DayPeriodParser() {var _this20;_classCallCheck(this, DayPeriodParser);for (var _len20 = arguments.length, args = new Array(_len20), _key20 = 0; _key20 < _len20; _key20++) {args[_key20] = arguments[_key20];}_this20 = _callSuper(this, DayPeriodParser, [].concat(args));_defineProperty(_this20, "priority",
    80);_defineProperty(_this20, "incompatibleTokens",































    [
    "a",
    "b",
    "t",
    "T"]);return _this20;}_inherits(DayPeriodParser, _Parser18);return _createClass(DayPeriodParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "B":case "BB":case "BBB":return match.dayPeriod(dateString, { width: "abbreviated", context: "formatting" }) || match.dayPeriod(dateString, { width: "narrow", context: "formatting" });case "BBBBB":return match.dayPeriod(dateString, { width: "narrow", context: "formatting" });default:return match.dayPeriod(dateString, { width: "wide", context: "formatting" }) || match.dayPeriod(dateString, { width: "abbreviated", context: "formatting" }) || match.dayPeriod(dateString, { width: "narrow", context: "formatting" });}} }, { key: "set", value: function set(date, _flags, value) {date.setHours(dayPeriodEnumToHours(value), 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/Hour1to12Parser.js
var Hour1to12Parser = /*#__PURE__*/function (_Parser19) {function Hour1to12Parser() {var _this21;_classCallCheck(this, Hour1to12Parser);for (var _len21 = arguments.length, args = new Array(_len21), _key21 = 0; _key21 < _len21; _key21++) {args[_key21] = arguments[_key21];}_this21 = _callSuper(this, Hour1to12Parser, [].concat(args));_defineProperty(_this21, "priority",
    70);_defineProperty(_this21, "incompatibleTokens",

















    [
    "H",
    "K",
    "k",
    "t",
    "T"]);return _this21;}_inherits(Hour1to12Parser, _Parser19);return _createClass(Hour1to12Parser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "h":return parseNumericPattern(numericPatterns.hour12h, dateString);case "ho":return match.ordinalNumber(dateString, { unit: "hour" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 1 && value <= 12;} }, { key: "set", value: function set(date, _flags, value) {var isPM = date.getHours() >= 12;if (isPM && value < 12) date.setHours(value + 12, 0, 0, 0);else if (!isPM && value === 12) date.setHours(0, 0, 0, 0);else date.setHours(value, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/Hour0to23Parser.js
var Hour0to23Parser = /*#__PURE__*/function (_Parser20) {function Hour0to23Parser() {var _this22;_classCallCheck(this, Hour0to23Parser);for (var _len22 = arguments.length, args = new Array(_len22), _key22 = 0; _key22 < _len22; _key22++) {args[_key22] = arguments[_key22];}_this22 = _callSuper(this, Hour0to23Parser, [].concat(args));_defineProperty(_this22, "priority",
    70);_defineProperty(_this22, "incompatibleTokens",














    [
    "a",
    "b",
    "h",
    "K",
    "k",
    "t",
    "T"]);return _this22;}_inherits(Hour0to23Parser, _Parser20);return _createClass(Hour0to23Parser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "H":return parseNumericPattern(numericPatterns.hour23h, dateString);case "Ho":return match.ordinalNumber(dateString, { unit: "hour" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 23;} }, { key: "set", value: function set(date, _flags, value) {date.setHours(value, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/Hour0To11Parser.js
var Hour0To11Parser = /*#__PURE__*/function (_Parser21) {function Hour0To11Parser() {var _this23;_classCallCheck(this, Hour0To11Parser);for (var _len23 = arguments.length, args = new Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {args[_key23] = arguments[_key23];}_this23 = _callSuper(this, Hour0To11Parser, [].concat(args));_defineProperty(_this23, "priority",
    70);_defineProperty(_this23, "incompatibleTokens",















    [
    "h",
    "H",
    "k",
    "t",
    "T"]);return _this23;}_inherits(Hour0To11Parser, _Parser21);return _createClass(Hour0To11Parser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "K":return parseNumericPattern(numericPatterns.hour11h, dateString);case "Ko":return match.ordinalNumber(dateString, { unit: "hour" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 11;} }, { key: "set", value: function set(date, _flags, value) {if (date.getHours() >= 12 && value < 12) date.setHours(value + 12, 0, 0, 0);else date.setHours(value, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/Hour1To24Parser.js
var Hour1To24Parser = /*#__PURE__*/function (_Parser22) {function Hour1To24Parser() {var _this24;_classCallCheck(this, Hour1To24Parser);for (var _len24 = arguments.length, args = new Array(_len24), _key24 = 0; _key24 < _len24; _key24++) {args[_key24] = arguments[_key24];}_this24 = _callSuper(this, Hour1To24Parser, [].concat(args));_defineProperty(_this24, "priority",
    70);_defineProperty(_this24, "incompatibleTokens",















    [
    "a",
    "b",
    "h",
    "H",
    "K",
    "t",
    "T"]);return _this24;}_inherits(Hour1To24Parser, _Parser22);return _createClass(Hour1To24Parser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "k":return parseNumericPattern(numericPatterns.hour24h, dateString);case "ko":return match.ordinalNumber(dateString, { unit: "hour" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 1 && value <= 24;} }, { key: "set", value: function set(date, _flags, value) {var hours = value <= 24 ? value % 24 : value;date.setHours(hours, 0, 0, 0);return date;} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/MinuteParser.js
var MinuteParser = /*#__PURE__*/function (_Parser23) {function MinuteParser() {var _this25;_classCallCheck(this, MinuteParser);for (var _len25 = arguments.length, args = new Array(_len25), _key25 = 0; _key25 < _len25; _key25++) {args[_key25] = arguments[_key25];}_this25 = _callSuper(this, MinuteParser, [].concat(args));_defineProperty(_this25, "priority",
    60);_defineProperty(_this25, "incompatibleTokens",














    ["t", "T"]);return _this25;}_inherits(MinuteParser, _Parser23);return _createClass(MinuteParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "m":return parseNumericPattern(numericPatterns.minute, dateString);case "mo":return match.ordinalNumber(dateString, { unit: "minute" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 59;} }, { key: "set", value: function set(date, _flags, value) {date.setMinutes(value, 0, 0);return date;} }]);}(Parser);

//#endregion
//#region dist/date-fns/parse/_lib/parsers/SecondParser.js
var SecondParser = /*#__PURE__*/function (_Parser24) {function SecondParser() {var _this26;_classCallCheck(this, SecondParser);for (var _len26 = arguments.length, args = new Array(_len26), _key26 = 0; _key26 < _len26; _key26++) {args[_key26] = arguments[_key26];}_this26 = _callSuper(this, SecondParser, [].concat(args));_defineProperty(_this26, "priority",
    50);_defineProperty(_this26, "incompatibleTokens",














    ["t", "T"]);return _this26;}_inherits(SecondParser, _Parser24);return _createClass(SecondParser, [{ key: "parse", value: function parse(dateString, token, match) {switch (token) {case "s":return parseNumericPattern(numericPatterns.second, dateString);case "so":return match.ordinalNumber(dateString, { unit: "second" });default:return parseNDigits(token.length, dateString);}} }, { key: "validate", value: function validate(_date, value) {return value >= 0 && value <= 59;} }, { key: "set", value: function set(date, _flags, value) {date.setSeconds(value, 0);return date;} }]);}(Parser);

//#endregion
//#region dist/date-fns/parse/_lib/parsers/FractionOfSecondParser.js
var FractionOfSecondParser = /*#__PURE__*/function (_Parser25) {function FractionOfSecondParser() {var _this27;_classCallCheck(this, FractionOfSecondParser);for (var _len27 = arguments.length, args = new Array(_len27), _key27 = 0; _key27 < _len27; _key27++) {args[_key27] = arguments[_key27];}_this27 = _callSuper(this, FractionOfSecondParser, [].concat(args));_defineProperty(_this27, "priority",
    30);_defineProperty(_this27, "incompatibleTokens",








    ["t", "T"]);return _this27;}_inherits(FractionOfSecondParser, _Parser25);return _createClass(FractionOfSecondParser, [{ key: "parse", value: function parse(dateString, token) {var valueCallback = function valueCallback(value) {return Math.trunc(value * Math.pow(10, -token.length + 3));};return mapValue(parseNDigits(token.length, dateString), valueCallback);} }, { key: "set", value: function set(date, _flags, value) {date.setMilliseconds(value);return date;} }]);}(Parser);

//#endregion
//#region dist/date-fns/parse/_lib/parsers/ISOTimezoneWithZParser.js
var ISOTimezoneWithZParser = /*#__PURE__*/function (_Parser26) {function ISOTimezoneWithZParser() {var _this28;_classCallCheck(this, ISOTimezoneWithZParser);for (var _len28 = arguments.length, args = new Array(_len28), _key28 = 0; _key28 < _len28; _key28++) {args[_key28] = arguments[_key28];}_this28 = _callSuper(this, ISOTimezoneWithZParser, [].concat(args));_defineProperty(_this28, "priority",
    10);_defineProperty(_this28, "incompatibleTokens",













    [
    "t",
    "T",
    "x"]);return _this28;}_inherits(ISOTimezoneWithZParser, _Parser26);return _createClass(ISOTimezoneWithZParser, [{ key: "parse", value: function parse(dateString, token) {switch (token) {case "X":return parseTimezonePattern(timezonePatterns.basicOptionalMinutes, dateString);case "XX":return parseTimezonePattern(timezonePatterns.basic, dateString);case "XXXX":return parseTimezonePattern(timezonePatterns.basicOptionalSeconds, dateString);case "XXXXX":return parseTimezonePattern(timezonePatterns.extendedOptionalSeconds, dateString);default:return parseTimezonePattern(timezonePatterns.extended, dateString);}} }, { key: "set", value: function set(date, flags, value) {if (flags.timestampIsSet) return date;return constructFrom$1(date, date.getTime() - getTimezoneOffsetInMilliseconds(date) - value);} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/ISOTimezoneParser.js
var ISOTimezoneParser = /*#__PURE__*/function (_Parser27) {function ISOTimezoneParser() {var _this29;_classCallCheck(this, ISOTimezoneParser);for (var _len29 = arguments.length, args = new Array(_len29), _key29 = 0; _key29 < _len29; _key29++) {args[_key29] = arguments[_key29];}_this29 = _callSuper(this, ISOTimezoneParser, [].concat(args));_defineProperty(_this29, "priority",
    10);_defineProperty(_this29, "incompatibleTokens",













    [
    "t",
    "T",
    "X"]);return _this29;}_inherits(ISOTimezoneParser, _Parser27);return _createClass(ISOTimezoneParser, [{ key: "parse", value: function parse(dateString, token) {switch (token) {case "x":return parseTimezonePattern(timezonePatterns.basicOptionalMinutes, dateString);case "xx":return parseTimezonePattern(timezonePatterns.basic, dateString);case "xxxx":return parseTimezonePattern(timezonePatterns.basicOptionalSeconds, dateString);case "xxxxx":return parseTimezonePattern(timezonePatterns.extendedOptionalSeconds, dateString);default:return parseTimezonePattern(timezonePatterns.extended, dateString);}} }, { key: "set", value: function set(date, flags, value) {if (flags.timestampIsSet) return date;return constructFrom$1(date, date.getTime() - getTimezoneOffsetInMilliseconds(date) - value);} }]);}(Parser);


//#endregion
//#region dist/date-fns/parse/_lib/parsers/TimestampSecondsParser.js
var TimestampSecondsParser = /*#__PURE__*/function (_Parser28) {function TimestampSecondsParser() {var _this30;_classCallCheck(this, TimestampSecondsParser);for (var _len30 = arguments.length, args = new Array(_len30), _key30 = 0; _key30 < _len30; _key30++) {args[_key30] = arguments[_key30];}_this30 = _callSuper(this, TimestampSecondsParser, [].concat(args));_defineProperty(_this30, "priority",
    40);_defineProperty(_this30, "incompatibleTokens",






    "*");return _this30;}_inherits(TimestampSecondsParser, _Parser28);return _createClass(TimestampSecondsParser, [{ key: "parse", value: function parse(dateString) {return parseAnyDigitsSigned(dateString);} }, { key: "set", value: function set(date, _flags, value) {return [constructFrom$1(date, value * 1e3), { timestampIsSet: true }];} }]);}(Parser);

//#endregion
//#region dist/date-fns/parse/_lib/parsers/TimestampMillisecondsParser.js
var TimestampMillisecondsParser = /*#__PURE__*/function (_Parser29) {function TimestampMillisecondsParser() {var _this31;_classCallCheck(this, TimestampMillisecondsParser);for (var _len31 = arguments.length, args = new Array(_len31), _key31 = 0; _key31 < _len31; _key31++) {args[_key31] = arguments[_key31];}_this31 = _callSuper(this, TimestampMillisecondsParser, [].concat(args));_defineProperty(_this31, "priority",
    20);_defineProperty(_this31, "incompatibleTokens",






    "*");return _this31;}_inherits(TimestampMillisecondsParser, _Parser29);return _createClass(TimestampMillisecondsParser, [{ key: "parse", value: function parse(dateString) {return parseAnyDigitsSigned(dateString);} }, { key: "set", value: function set(date, _flags, value) {return [constructFrom$1(date, value), { timestampIsSet: true }];} }]);}(Parser);

//#endregion
//#region dist/date-fns/parse/_lib/parsers.js
var parsers = {
  G: new EraParser(),
  y: new YearParser(),
  Y: new LocalWeekYearParser(),
  R: new ISOWeekYearParser(),
  u: new ExtendedYearParser(),
  Q: new QuarterParser(),
  q: new StandAloneQuarterParser(),
  M: new MonthParser(),
  L: new StandAloneMonthParser(),
  w: new LocalWeekParser(),
  I: new ISOWeekParser(),
  d: new DateParser(),
  D: new DayOfYearParser(),
  E: new DayParser(),
  e: new LocalDayParser(),
  c: new StandAloneLocalDayParser(),
  i: new ISODayParser(),
  a: new AMPMParser(),
  b: new AMPMMidnightParser(),
  B: new DayPeriodParser(),
  h: new Hour1to12Parser(),
  H: new Hour0to23Parser(),
  K: new Hour0To11Parser(),
  k: new Hour1To24Parser(),
  m: new MinuteParser(),
  s: new SecondParser(),
  S: new FractionOfSecondParser(),
  X: new ISOTimezoneWithZParser(),
  x: new ISOTimezoneParser(),
  t: new TimestampSecondsParser(),
  T: new TimestampMillisecondsParser()
};
//#endregion
//#region dist/date-fns/parse.js
/**
* The {@link parse} function options.
*/
var formattingTokensRegExp$1 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp$1 = /^'([^]*?)'?$/;
var doubleQuoteRegExp$1 = /''/g;
var notWhitespaceRegExp = /\S/;
var unescapedLatinCharacterRegExp$1 = /[a-zA-Z]/;
/**
* @name parse
* @category Common Helpers
* @summary Parse the date.
*
* @description
* Return the date parsed from string using the given format string.
*
* > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
* > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* The characters in the format string wrapped between two single quotes characters (') are escaped.
* Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
*
* Format of the format string is based on Unicode Technical Standard #35:
* https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
* with a few additions (see note 5 below the table).
*
* Not all tokens are compatible. Combinations that don't make sense or could lead to bugs are prohibited
* and will throw `RangeError`. For example usage of 24-hour format token with AM/PM token will throw an exception:
*
* ```javascript
* parse('23 AM', 'HH a', new Date())
* //=> RangeError: The format string mustn't contain `HH` and `a` at the same time
* ```
*
* See the compatibility table: https://docs.google.com/spreadsheets/d/e/2PACX-1vQOPU3xUhplll6dyoMmVUXHKl_8CRDs6_ueLmex3SoqwhuolkuN3O05l4rqx5h1dKX8eb46Ul-CCSrq/pubhtml?gid=0&single=true
*
* Accepted format string patterns:
* | Unit                            |Prior| Pattern | Result examples                   | Notes |
* |---------------------------------|-----|---------|-----------------------------------|-------|
* | Era                             | 140 | G..GGG  | AD, BC                            |       |
* |                                 |     | GGGG    | Anno Domini, Before Christ        | 2     |
* |                                 |     | GGGGG   | A, B                              |       |
* | Calendar year                   | 130 | y       | 44, 1, 1900, 2017, 9999           | 4     |
* |                                 |     | yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
* |                                 |     | yy      | 44, 01, 00, 17                    | 4     |
* |                                 |     | yyy     | 044, 001, 123, 999                | 4     |
* |                                 |     | yyyy    | 0044, 0001, 1900, 2017            | 4     |
* |                                 |     | yyyyy   | ...                               | 2,4   |
* | Local week-numbering year       | 130 | Y       | 44, 1, 1900, 2017, 9000           | 4     |
* |                                 |     | Yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
* |                                 |     | YY      | 44, 01, 00, 17                    | 4,6   |
* |                                 |     | YYY     | 044, 001, 123, 999                | 4     |
* |                                 |     | YYYY    | 0044, 0001, 1900, 2017            | 4,6   |
* |                                 |     | YYYYY   | ...                               | 2,4   |
* | ISO week-numbering year         | 130 | R       | -43, 1, 1900, 2017, 9999, -9999   | 4,5   |
* |                                 |     | RR      | -43, 01, 00, 17                   | 4,5   |
* |                                 |     | RRR     | -043, 001, 123, 999, -999         | 4,5   |
* |                                 |     | RRRR    | -0043, 0001, 2017, 9999, -9999    | 4,5   |
* |                                 |     | RRRRR   | ...                               | 2,4,5 |
* | Extended year                   | 130 | u       | -43, 1, 1900, 2017, 9999, -999    | 4     |
* |                                 |     | uu      | -43, 01, 99, -99                  | 4     |
* |                                 |     | uuu     | -043, 001, 123, 999, -999         | 4     |
* |                                 |     | uuuu    | -0043, 0001, 2017, 9999, -9999    | 4     |
* |                                 |     | uuuuu   | ...                               | 2,4   |
* | Quarter (formatting)            | 120 | Q       | 1, 2, 3, 4                        |       |
* |                                 |     | Qo      | 1st, 2nd, 3rd, 4th                | 5     |
* |                                 |     | QQ      | 01, 02, 03, 04                    |       |
* |                                 |     | QQQ     | Q1, Q2, Q3, Q4                    |       |
* |                                 |     | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
* |                                 |     | QQQQQ   | 1, 2, 3, 4                        | 4     |
* | Quarter (stand-alone)           | 120 | q       | 1, 2, 3, 4                        |       |
* |                                 |     | qo      | 1st, 2nd, 3rd, 4th                | 5     |
* |                                 |     | qq      | 01, 02, 03, 04                    |       |
* |                                 |     | qqq     | Q1, Q2, Q3, Q4                    |       |
* |                                 |     | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
* |                                 |     | qqqqq   | 1, 2, 3, 4                        | 3     |
* | Month (formatting)              | 110 | M       | 1, 2, ..., 12                     |       |
* |                                 |     | Mo      | 1st, 2nd, ..., 12th               | 5     |
* |                                 |     | MM      | 01, 02, ..., 12                   |       |
* |                                 |     | MMM     | Jan, Feb, ..., Dec                |       |
* |                                 |     | MMMM    | January, February, ..., December  | 2     |
* |                                 |     | MMMMM   | J, F, ..., D                      |       |
* | Month (stand-alone)             | 110 | L       | 1, 2, ..., 12                     |       |
* |                                 |     | Lo      | 1st, 2nd, ..., 12th               | 5     |
* |                                 |     | LL      | 01, 02, ..., 12                   |       |
* |                                 |     | LLL     | Jan, Feb, ..., Dec                |       |
* |                                 |     | LLLL    | January, February, ..., December  | 2     |
* |                                 |     | LLLLL   | J, F, ..., D                      |       |
* | Local week of year              | 100 | w       | 1, 2, ..., 53                     |       |
* |                                 |     | wo      | 1st, 2nd, ..., 53th               | 5     |
* |                                 |     | ww      | 01, 02, ..., 53                   |       |
* | ISO week of year                | 100 | I       | 1, 2, ..., 53                     | 5     |
* |                                 |     | Io      | 1st, 2nd, ..., 53th               | 5     |
* |                                 |     | II      | 01, 02, ..., 53                   | 5     |
* | Day of month                    |  90 | d       | 1, 2, ..., 31                     |       |
* |                                 |     | do      | 1st, 2nd, ..., 31st               | 5     |
* |                                 |     | dd      | 01, 02, ..., 31                   |       |
* | Day of year                     |  90 | D       | 1, 2, ..., 365, 366               | 7     |
* |                                 |     | Do      | 1st, 2nd, ..., 365th, 366th       | 5     |
* |                                 |     | DD      | 01, 02, ..., 365, 366             | 7     |
* |                                 |     | DDD     | 001, 002, ..., 365, 366           |       |
* |                                 |     | DDDD    | ...                               | 2     |
* | Day of week (formatting)        |  90 | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
* |                                 |     | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 |     | EEEEE   | M, T, W, T, F, S, S               |       |
* |                                 |     | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | ISO day of week (formatting)    |  90 | i       | 1, 2, 3, ..., 7                   | 5     |
* |                                 |     | io      | 1st, 2nd, ..., 7th                | 5     |
* |                                 |     | ii      | 01, 02, ..., 07                   | 5     |
* |                                 |     | iii     | Mon, Tue, Wed, ..., Sun           | 5     |
* |                                 |     | iiii    | Monday, Tuesday, ..., Sunday      | 2,5   |
* |                                 |     | iiiii   | M, T, W, T, F, S, S               | 5     |
* |                                 |     | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 5     |
* | Local day of week (formatting)  |  90 | e       | 2, 3, 4, ..., 1                   |       |
* |                                 |     | eo      | 2nd, 3rd, ..., 1st                | 5     |
* |                                 |     | ee      | 02, 03, ..., 01                   |       |
* |                                 |     | eee     | Mon, Tue, Wed, ..., Sun           |       |
* |                                 |     | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 |     | eeeee   | M, T, W, T, F, S, S               |       |
* |                                 |     | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | Local day of week (stand-alone) |  90 | c       | 2, 3, 4, ..., 1                   |       |
* |                                 |     | co      | 2nd, 3rd, ..., 1st                | 5     |
* |                                 |     | cc      | 02, 03, ..., 01                   |       |
* |                                 |     | ccc     | Mon, Tue, Wed, ..., Sun           |       |
* |                                 |     | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 |     | ccccc   | M, T, W, T, F, S, S               |       |
* |                                 |     | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | AM, PM                          |  80 | a..aaa  | AM, PM                            |       |
* |                                 |     | aaaa    | a.m., p.m.                        | 2     |
* |                                 |     | aaaaa   | a, p                              |       |
* | AM, PM, noon, midnight          |  80 | b..bbb  | AM, PM, noon, midnight            |       |
* |                                 |     | bbbb    | a.m., p.m., noon, midnight        | 2     |
* |                                 |     | bbbbb   | a, p, n, mi                       |       |
* | Flexible day period             |  80 | B..BBB  | at night, in the morning, ...     |       |
* |                                 |     | BBBB    | at night, in the morning, ...     | 2     |
* |                                 |     | BBBBB   | at night, in the morning, ...     |       |
* | Hour [1-12]                     |  70 | h       | 1, 2, ..., 11, 12                 |       |
* |                                 |     | ho      | 1st, 2nd, ..., 11th, 12th         | 5     |
* |                                 |     | hh      | 01, 02, ..., 11, 12               |       |
* | Hour [0-23]                     |  70 | H       | 0, 1, 2, ..., 23                  |       |
* |                                 |     | Ho      | 0th, 1st, 2nd, ..., 23rd          | 5     |
* |                                 |     | HH      | 00, 01, 02, ..., 23               |       |
* | Hour [0-11]                     |  70 | K       | 1, 2, ..., 11, 0                  |       |
* |                                 |     | Ko      | 1st, 2nd, ..., 11th, 0th          | 5     |
* |                                 |     | KK      | 01, 02, ..., 11, 00               |       |
* | Hour [1-24]                     |  70 | k       | 24, 1, 2, ..., 23                 |       |
* |                                 |     | ko      | 24th, 1st, 2nd, ..., 23rd         | 5     |
* |                                 |     | kk      | 24, 01, 02, ..., 23               |       |
* | Minute                          |  60 | m       | 0, 1, ..., 59                     |       |
* |                                 |     | mo      | 0th, 1st, ..., 59th               | 5     |
* |                                 |     | mm      | 00, 01, ..., 59                   |       |
* | Second                          |  50 | s       | 0, 1, ..., 59                     |       |
* |                                 |     | so      | 0th, 1st, ..., 59th               | 5     |
* |                                 |     | ss      | 00, 01, ..., 59                   |       |
* | Seconds timestamp               |  40 | t       | 512969520                         |       |
* |                                 |     | tt      | ...                               | 2     |
* | Fraction of second              |  30 | S       | 0, 1, ..., 9                      |       |
* |                                 |     | SS      | 00, 01, ..., 99                   |       |
* |                                 |     | SSS     | 000, 001, ..., 999                |       |
* |                                 |     | SSSS    | ...                               | 2     |
* | Milliseconds timestamp          |  20 | T       | 512969520900                      |       |
* |                                 |     | TT      | ...                               | 2     |
* | Timezone (ISO-8601 w/ Z)        |  10 | X       | -08, +0530, Z                     |       |
* |                                 |     | XX      | -0800, +0530, Z                   |       |
* |                                 |     | XXX     | -08:00, +05:30, Z                 |       |
* |                                 |     | XXXX    | -0800, +0530, Z, +123456          | 2     |
* |                                 |     | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
* | Timezone (ISO-8601 w/o Z)       |  10 | x       | -08, +0530, +00                   |       |
* |                                 |     | xx      | -0800, +0530, +0000               |       |
* |                                 |     | xxx     | -08:00, +05:30, +00:00            | 2     |
* |                                 |     | xxxx    | -0800, +0530, +0000, +123456      |       |
* |                                 |     | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
* | Long localized date             |  NA | P       | 05/29/1453                        | 5,8   |
* |                                 |     | PP      | May 29, 1453                      |       |
* |                                 |     | PPP     | May 29th, 1453                    |       |
* |                                 |     | PPPP    | Sunday, May 29th, 1453            | 2,5,8 |
* | Long localized time             |  NA | p       | 12:00 AM                          | 5,8   |
* |                                 |     | pp      | 12:00:00 AM                       |       |
* | Combination of date and time    |  NA | Pp      | 05/29/1453, 12:00 AM              |       |
* |                                 |     | PPpp    | May 29, 1453, 12:00:00 AM         |       |
* |                                 |     | PPPpp   | May 29th, 1453 at ...             |       |
* |                                 |     | PPPPpp  | Sunday, May 29th, 1453 at ...     | 2,5,8 |
* Notes:
* 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
*    are the same as "stand-alone" units, but are different in some languages.
*    "Formatting" units are declined according to the rules of the language
*    in the context of a date. "Stand-alone" units are always nominative singular.
*    In `format` function, they will produce different result:
*
*    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
*
*    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
*
*    `parse` will try to match both formatting and stand-alone units interchangeably.
*
* 2. Any sequence of the identical letters is a pattern, unless it is escaped by
*    the single quote characters (see below).
*    If the sequence is longer than listed in table:
*    - for numerical units (`yyyyyyyy`) `parse` will try to match a number
*      as wide as the sequence
*    - for text units (`MMMMMMMM`) `parse` will try to match the widest variation of the unit.
*      These variations are marked with "2" in the last column of the table.
*
* 3. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
*    These tokens represent the shortest form of the quarter.
*
* 4. The main difference between `y` and `u` patterns are B.C. years:
*
*    | Year | `y` | `u` |
*    |------|-----|-----|
*    | AC 1 |   1 |   1 |
*    | BC 1 |   1 |   0 |
*    | BC 2 |   2 |  -1 |
*
*    Also `yy` will try to guess the century of two digit year by proximity with `referenceDate`:
*
*    `parse('50', 'yy', new Date(2018, 0, 1)) //=> Sat Jan 01 2050 00:00:00`
*
*    `parse('75', 'yy', new Date(2018, 0, 1)) //=> Wed Jan 01 1975 00:00:00`
*
*    while `uu` will just assign the year as is:
*
*    `parse('50', 'uu', new Date(2018, 0, 1)) //=> Sat Jan 01 0050 00:00:00`
*
*    `parse('75', 'uu', new Date(2018, 0, 1)) //=> Tue Jan 01 0075 00:00:00`
*
*    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
*    except local week-numbering years are dependent on `options.weekStartsOn`
*    and `options.firstWeekContainsDate` (compare [setISOWeekYear](https://date-fns.org/docs/setISOWeekYear)
*    and [setWeekYear](https://date-fns.org/docs/setWeekYear)).
*
* 5. These patterns are not in the Unicode Technical Standard #35:
*    - `i`: ISO day of week
*    - `I`: ISO week of year
*    - `R`: ISO week-numbering year
*    - `o`: ordinal number modifier
*    - `P`: long localized date
*    - `p`: long localized time
*
* 6. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
*    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* 7. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
*    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* 8. `P+` tokens do not have a defined priority since they are merely aliases to other tokens based
*    on the given locale.
*
*    using `en-US` locale: `P` => `MM/dd/yyyy`
*    using `en-US` locale: `p` => `hh:mm a`
*    using `pt-BR` locale: `P` => `dd/MM/yyyy`
*    using `pt-BR` locale: `p` => `HH:mm`
*
* Values will be assigned to the date in the descending order of its unit's priority.
* Units of an equal priority overwrite each other in the order of appearance.
*
* If no values of higher priority are parsed (e.g. when parsing string 'January 1st' without a year),
* the values will be taken from 3rd argument `referenceDate` which works as a context of parsing.
*
* `referenceDate` must be passed for correct work of the function.
* If you're not sure which `referenceDate` to supply, create a new instance of Date:
* `parse('02/11/2014', 'MM/dd/yyyy', new Date())`
* In this case parsing will be done in the context of the current date.
* If `referenceDate` is `Invalid Date` or a value not convertible to valid `Date`,
* then `Invalid Date` will be returned.
*
* The result may vary by locale.
*
* If `formatString` matches with `dateString` but does not provides tokens, `referenceDate` will be returned.
*
* If parsing failed, `Invalid Date` will be returned.
* Invalid Date is a Date, whose time value is NaN.
* Time value of Date: http://es5.github.io/#x15.9.1.1
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param dateStr - The string to parse
* @param formatStr - The string of tokens
* @param referenceDate - defines values missing from the parsed dateString
* @param options - An object with options.
*   see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*   see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* @returns The parsed date
*
* @throws `options.locale` must contain `match` property
* @throws use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws format string contains an unescaped latin alphabet character
*
* @example
* // Parse 11 February 2014 from middle-endian format:
* var result = parse('02/11/2014', 'MM/dd/yyyy', new Date())
* //=> Tue Feb 11 2014 00:00:00
*
* @example
* // Parse 28th of February in Esperanto locale in the context of 2010 year:
* import eo from 'date-fns/locale/eo'
* var result = parse('28-a de februaro', "do 'de' MMMM", new Date(2010, 0, 1), {
*   locale: eo
* })
* //=> Sun Feb 28 2010 00:00:00
*/
function parse$1(dateStr, formatStr, referenceDate, options) {var _ref31, _options$locale13, _ref32, _ref33, _ref34, _options$firstWeekCon4, _options$locale14, _defaultOptions$local0, _ref35, _ref36, _ref37, _options$weekStartsOn7, _options$locale15, _defaultOptions$local1;
  var invalidDate = function invalidDate() {return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || referenceDate, NaN);};
  var defaultOptions = getDefaultOptions();
  var locale = (_ref31 = (_options$locale13 = options === null || options === void 0 ? void 0 : options.locale) !== null && _options$locale13 !== void 0 ? _options$locale13 : defaultOptions.locale) !== null && _ref31 !== void 0 ? _ref31 : enUS;
  var firstWeekContainsDate = (_ref32 = (_ref33 = (_ref34 = (_options$firstWeekCon4 = options === null || options === void 0 ? void 0 : options.firstWeekContainsDate) !== null && _options$firstWeekCon4 !== void 0 ? _options$firstWeekCon4 : options === null || options === void 0 || (_options$locale14 = options.locale) === null || _options$locale14 === void 0 || (_options$locale14 = _options$locale14.options) === null || _options$locale14 === void 0 ? void 0 : _options$locale14.firstWeekContainsDate) !== null && _ref34 !== void 0 ? _ref34 : defaultOptions.firstWeekContainsDate) !== null && _ref33 !== void 0 ? _ref33 : (_defaultOptions$local0 = defaultOptions.locale) === null || _defaultOptions$local0 === void 0 || (_defaultOptions$local0 = _defaultOptions$local0.options) === null || _defaultOptions$local0 === void 0 ? void 0 : _defaultOptions$local0.firstWeekContainsDate) !== null && _ref32 !== void 0 ? _ref32 : 1;
  var weekStartsOn = (_ref35 = (_ref36 = (_ref37 = (_options$weekStartsOn7 = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn7 !== void 0 ? _options$weekStartsOn7 : options === null || options === void 0 || (_options$locale15 = options.locale) === null || _options$locale15 === void 0 || (_options$locale15 = _options$locale15.options) === null || _options$locale15 === void 0 ? void 0 : _options$locale15.weekStartsOn) !== null && _ref37 !== void 0 ? _ref37 : defaultOptions.weekStartsOn) !== null && _ref36 !== void 0 ? _ref36 : (_defaultOptions$local1 = defaultOptions.locale) === null || _defaultOptions$local1 === void 0 || (_defaultOptions$local1 = _defaultOptions$local1.options) === null || _defaultOptions$local1 === void 0 ? void 0 : _defaultOptions$local1.weekStartsOn) !== null && _ref35 !== void 0 ? _ref35 : 0;
  if (!formatStr) return dateStr ? invalidDate() : toDate$1(referenceDate, options === null || options === void 0 ? void 0 : options.in);
  var subFnOptions = {
    firstWeekContainsDate: firstWeekContainsDate,
    weekStartsOn: weekStartsOn,
    locale: locale
  };
  var setters = [new DateTimezoneSetter(options === null || options === void 0 ? void 0 : options.in, referenceDate)];
  var tokens = formatStr.match(longFormattingTokensRegExp).map(function (substring) {
    var firstCharacter = substring[0];
    if (firstCharacter in longFormatters) {
      var longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp$1);
  var usedTokens = [];var _iterator = _createForOfIteratorHelper(
      tokens),_step;try {var _loop = function _loop() {var token = _step.value;
        if (!(options !== null && options !== void 0 && options.useAdditionalWeekYearTokens) && isProtectedWeekYearToken(token)) warnOrThrowProtectedError(token, formatStr, dateStr);
        if (!(options !== null && options !== void 0 && options.useAdditionalDayOfYearTokens) && isProtectedDayOfYearToken(token)) warnOrThrowProtectedError(token, formatStr, dateStr);
        var firstCharacter = token[0];
        var parser = parsers[firstCharacter];
        if (parser) {
          var incompatibleTokens = parser.incompatibleTokens;
          if (Array.isArray(incompatibleTokens)) {
            var incompatibleToken = usedTokens.find(function (usedToken) {return incompatibleTokens.includes(usedToken.token) || usedToken.token === firstCharacter;});
            if (incompatibleToken) throw new RangeError("The format string mustn't contain `".concat(incompatibleToken.fullToken, "` and `").concat(token, "` at the same time"));
          } else if (parser.incompatibleTokens === "*" && usedTokens.length > 0) throw new RangeError("The format string mustn't contain `".concat(token, "` and any other token at the same time"));
          usedTokens.push({
            token: firstCharacter,
            fullToken: token
          });
          var parseResult = parser.run(dateStr, token, locale.match, subFnOptions);
          if (!parseResult) return { v: invalidDate() };
          setters.push(parseResult.setter);
          dateStr = parseResult.rest;
        } else {
          if (firstCharacter.match(unescapedLatinCharacterRegExp$1)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + firstCharacter + "`");
          if (token === "''") token = "'";else
          if (firstCharacter === "'") token = cleanEscapedString$1(token);
          if (dateStr.indexOf(token) === 0) dateStr = dateStr.slice(token.length);else return { v:
            invalidDate() };
        }
      },_ret;for (_iterator.s(); !(_step = _iterator.n()).done;) {_ret = _loop();if (_ret) return _ret.v;}} catch (err) {_iterator.e(err);} finally {_iterator.f();}
  if (dateStr.length > 0 && notWhitespaceRegExp.test(dateStr)) return invalidDate();
  var uniquePrioritySetters = setters.map(function (setter) {return setter.priority;}).sort(function (a, b) {return b - a;}).filter(function (priority, index, array) {return array.indexOf(priority) === index;}).map(function (priority) {return setters.filter(function (setter) {return setter.priority === priority;}).sort(function (a, b) {return b.subPriority - a.subPriority;});}).map(function (setterArray) {return setterArray[0];});
  var date = toDate$1(referenceDate, options === null || options === void 0 ? void 0 : options.in);
  if (isNaN(+date)) return invalidDate();
  var flags = {};var _iterator2 = _createForOfIteratorHelper(
      uniquePrioritySetters),_step2;try {for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {var setter = _step2.value;
      if (!setter.validate(date, subFnOptions)) return invalidDate();
      var result = setter.set(date, flags, subFnOptions);
      if (Array.isArray(result)) {
        date = result[0];
        Object.assign(flags, result[1]);
      } else date = result;
    }} catch (err) {_iterator2.e(err);} finally {_iterator2.f();}
  return date;
}
function cleanEscapedString$1(input) {
  return input.match(escapedStringRegExp$1)[1].replace(doubleQuoteRegExp$1, "'");
}
//#endregion
//#region dist/date-fns/isMatch.js
/**
* The {@link isMatch} function options.
*/
/**
* @name isMatch
* @category Common Helpers
* @summary validates the date string against given formats
*
* @description
* Return the true if given date is string correct against the given format else
* will return false.
*
* > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
* > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* The characters in the format string wrapped between two single quotes characters (') are escaped.
* Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
*
* Format of the format string is based on Unicode Technical Standard #35:
* https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
* with a few additions (see note 5 below the table).
*
* Not all tokens are compatible. Combinations that don't make sense or could lead to bugs are prohibited
* and will throw `RangeError`. For example usage of 24-hour format token with AM/PM token will throw an exception:
*
* ```javascript
* isMatch('23 AM', 'HH a')
* //=> RangeError: The format string mustn't contain `HH` and `a` at the same time
* ```
*
* See the compatibility table: https://docs.google.com/spreadsheets/d/e/2PACX-1vQOPU3xUhplll6dyoMmVUXHKl_8CRDs6_ueLmex3SoqwhuolkuN3O05l4rqx5h1dKX8eb46Ul-CCSrq/pubhtml?gid=0&single=true
*
* Accepted format string patterns:
* | Unit                            |Prior| Pattern | Result examples                   | Notes |
* |---------------------------------|-----|---------|-----------------------------------|-------|
* | Era                             | 140 | G..GGG  | AD, BC                            |       |
* |                                 |     | GGGG    | Anno Domini, Before Christ        | 2     |
* |                                 |     | GGGGG   | A, B                              |       |
* | Calendar year                   | 130 | y       | 44, 1, 1900, 2017, 9999           | 4     |
* |                                 |     | yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
* |                                 |     | yy      | 44, 01, 00, 17                    | 4     |
* |                                 |     | yyy     | 044, 001, 123, 999                | 4     |
* |                                 |     | yyyy    | 0044, 0001, 1900, 2017            | 4     |
* |                                 |     | yyyyy   | ...                               | 2,4   |
* | Local week-numbering year       | 130 | Y       | 44, 1, 1900, 2017, 9000           | 4     |
* |                                 |     | Yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
* |                                 |     | YY      | 44, 01, 00, 17                    | 4,6   |
* |                                 |     | YYY     | 044, 001, 123, 999                | 4     |
* |                                 |     | YYYY    | 0044, 0001, 1900, 2017            | 4,6   |
* |                                 |     | YYYYY   | ...                               | 2,4   |
* | ISO week-numbering year         | 130 | R       | -43, 1, 1900, 2017, 9999, -9999   | 4,5   |
* |                                 |     | RR      | -43, 01, 00, 17                   | 4,5   |
* |                                 |     | RRR     | -043, 001, 123, 999, -999         | 4,5   |
* |                                 |     | RRRR    | -0043, 0001, 2017, 9999, -9999    | 4,5   |
* |                                 |     | RRRRR   | ...                               | 2,4,5 |
* | Extended year                   | 130 | u       | -43, 1, 1900, 2017, 9999, -999    | 4     |
* |                                 |     | uu      | -43, 01, 99, -99                  | 4     |
* |                                 |     | uuu     | -043, 001, 123, 999, -999         | 4     |
* |                                 |     | uuuu    | -0043, 0001, 2017, 9999, -9999    | 4     |
* |                                 |     | uuuuu   | ...                               | 2,4   |
* | Quarter (formatting)            | 120 | Q       | 1, 2, 3, 4                        |       |
* |                                 |     | Qo      | 1st, 2nd, 3rd, 4th                | 5     |
* |                                 |     | QQ      | 01, 02, 03, 04                    |       |
* |                                 |     | QQQ     | Q1, Q2, Q3, Q4                    |       |
* |                                 |     | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
* |                                 |     | QQQQQ   | 1, 2, 3, 4                        | 4     |
* | Quarter (stand-alone)           | 120 | q       | 1, 2, 3, 4                        |       |
* |                                 |     | qo      | 1st, 2nd, 3rd, 4th                | 5     |
* |                                 |     | qq      | 01, 02, 03, 04                    |       |
* |                                 |     | qqq     | Q1, Q2, Q3, Q4                    |       |
* |                                 |     | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
* |                                 |     | qqqqq   | 1, 2, 3, 4                        | 3     |
* | Month (formatting)              | 110 | M       | 1, 2, ..., 12                     |       |
* |                                 |     | Mo      | 1st, 2nd, ..., 12th               | 5     |
* |                                 |     | MM      | 01, 02, ..., 12                   |       |
* |                                 |     | MMM     | Jan, Feb, ..., Dec                |       |
* |                                 |     | MMMM    | January, February, ..., December  | 2     |
* |                                 |     | MMMMM   | J, F, ..., D                      |       |
* | Month (stand-alone)             | 110 | L       | 1, 2, ..., 12                     |       |
* |                                 |     | Lo      | 1st, 2nd, ..., 12th               | 5     |
* |                                 |     | LL      | 01, 02, ..., 12                   |       |
* |                                 |     | LLL     | Jan, Feb, ..., Dec                |       |
* |                                 |     | LLLL    | January, February, ..., December  | 2     |
* |                                 |     | LLLLL   | J, F, ..., D                      |       |
* | Local week of year              | 100 | w       | 1, 2, ..., 53                     |       |
* |                                 |     | wo      | 1st, 2nd, ..., 53th               | 5     |
* |                                 |     | ww      | 01, 02, ..., 53                   |       |
* | ISO week of year                | 100 | I       | 1, 2, ..., 53                     | 5     |
* |                                 |     | Io      | 1st, 2nd, ..., 53th               | 5     |
* |                                 |     | II      | 01, 02, ..., 53                   | 5     |
* | Day of month                    |  90 | d       | 1, 2, ..., 31                     |       |
* |                                 |     | do      | 1st, 2nd, ..., 31st               | 5     |
* |                                 |     | dd      | 01, 02, ..., 31                   |       |
* | Day of year                     |  90 | D       | 1, 2, ..., 365, 366               | 7     |
* |                                 |     | Do      | 1st, 2nd, ..., 365th, 366th       | 5     |
* |                                 |     | DD      | 01, 02, ..., 365, 366             | 7     |
* |                                 |     | DDD     | 001, 002, ..., 365, 366           |       |
* |                                 |     | DDDD    | ...                               | 2     |
* | Day of week (formatting)        |  90 | E..EEE  | Mon, Tue, Wed, ..., Su            |       |
* |                                 |     | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 |     | EEEEE   | M, T, W, T, F, S, S               |       |
* |                                 |     | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | ISO day of week (formatting)    |  90 | i       | 1, 2, 3, ..., 7                   | 5     |
* |                                 |     | io      | 1st, 2nd, ..., 7th                | 5     |
* |                                 |     | ii      | 01, 02, ..., 07                   | 5     |
* |                                 |     | iii     | Mon, Tue, Wed, ..., Su            | 5     |
* |                                 |     | iiii    | Monday, Tuesday, ..., Sunday      | 2,5   |
* |                                 |     | iiiii   | M, T, W, T, F, S, S               | 5     |
* |                                 |     | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 5     |
* | Local day of week (formatting)  |  90 | e       | 2, 3, 4, ..., 1                   |       |
* |                                 |     | eo      | 2nd, 3rd, ..., 1st                | 5     |
* |                                 |     | ee      | 02, 03, ..., 01                   |       |
* |                                 |     | eee     | Mon, Tue, Wed, ..., Su            |       |
* |                                 |     | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 |     | eeeee   | M, T, W, T, F, S, S               |       |
* |                                 |     | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | Local day of week (stand-alone) |  90 | c       | 2, 3, 4, ..., 1                   |       |
* |                                 |     | co      | 2nd, 3rd, ..., 1st                | 5     |
* |                                 |     | cc      | 02, 03, ..., 01                   |       |
* |                                 |     | ccc     | Mon, Tue, Wed, ..., Su            |       |
* |                                 |     | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
* |                                 |     | ccccc   | M, T, W, T, F, S, S               |       |
* |                                 |     | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
* | AM, PM                          |  80 | a..aaa  | AM, PM                            |       |
* |                                 |     | aaaa    | a.m., p.m.                        | 2     |
* |                                 |     | aaaaa   | a, p                              |       |
* | AM, PM, noon, midnight          |  80 | b..bbb  | AM, PM, noon, midnight            |       |
* |                                 |     | bbbb    | a.m., p.m., noon, midnight        | 2     |
* |                                 |     | bbbbb   | a, p, n, mi                       |       |
* | Flexible day period             |  80 | B..BBB  | at night, in the morning, ...     |       |
* |                                 |     | BBBB    | at night, in the morning, ...     | 2     |
* |                                 |     | BBBBB   | at night, in the morning, ...     |       |
* | Hour [1-12]                     |  70 | h       | 1, 2, ..., 11, 12                 |       |
* |                                 |     | ho      | 1st, 2nd, ..., 11th, 12th         | 5     |
* |                                 |     | hh      | 01, 02, ..., 11, 12               |       |
* | Hour [0-23]                     |  70 | H       | 0, 1, 2, ..., 23                  |       |
* |                                 |     | Ho      | 0th, 1st, 2nd, ..., 23rd          | 5     |
* |                                 |     | HH      | 00, 01, 02, ..., 23               |       |
* | Hour [0-11]                     |  70 | K       | 1, 2, ..., 11, 0                  |       |
* |                                 |     | Ko      | 1st, 2nd, ..., 11th, 0th          | 5     |
* |                                 |     | KK      | 01, 02, ..., 11, 00               |       |
* | Hour [1-24]                     |  70 | k       | 24, 1, 2, ..., 23                 |       |
* |                                 |     | ko      | 24th, 1st, 2nd, ..., 23rd         | 5     |
* |                                 |     | kk      | 24, 01, 02, ..., 23               |       |
* | Minute                          |  60 | m       | 0, 1, ..., 59                     |       |
* |                                 |     | mo      | 0th, 1st, ..., 59th               | 5     |
* |                                 |     | mm      | 00, 01, ..., 59                   |       |
* | Second                          |  50 | s       | 0, 1, ..., 59                     |       |
* |                                 |     | so      | 0th, 1st, ..., 59th               | 5     |
* |                                 |     | ss      | 00, 01, ..., 59                   |       |
* | Seconds timestamp               |  40 | t       | 512969520                         |       |
* |                                 |     | tt      | ...                               | 2     |
* | Fraction of second              |  30 | S       | 0, 1, ..., 9                      |       |
* |                                 |     | SS      | 00, 01, ..., 99                   |       |
* |                                 |     | SSS     | 000, 001, ..., 999                |       |
* |                                 |     | SSSS    | ...                               | 2     |
* | Milliseconds timestamp          |  20 | T       | 512969520900                      |       |
* |                                 |     | TT      | ...                               | 2     |
* | Timezone (ISO-8601 w/ Z)        |  10 | X       | -08, +0530, Z                     |       |
* |                                 |     | XX      | -0800, +0530, Z                   |       |
* |                                 |     | XXX     | -08:00, +05:30, Z                 |       |
* |                                 |     | XXXX    | -0800, +0530, Z, +123456          | 2     |
* |                                 |     | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
* | Timezone (ISO-8601 w/o Z)       |  10 | x       | -08, +0530, +00                   |       |
* |                                 |     | xx      | -0800, +0530, +0000               |       |
* |                                 |     | xxx     | -08:00, +05:30, +00:00            | 2     |
* |                                 |     | xxxx    | -0800, +0530, +0000, +123456      |       |
* |                                 |     | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
* | Long localized date             |  NA | P       | 05/29/1453                        | 5,8   |
* |                                 |     | PP      | May 29, 1453                      |       |
* |                                 |     | PPP     | May 29th, 1453                    |       |
* |                                 |     | PPPP    | Sunday, May 29th, 1453            | 2,5,8 |
* | Long localized time             |  NA | p       | 12:00 AM                          | 5,8   |
* |                                 |     | pp      | 12:00:00 AM                       |       |
* | Combination of date and time    |  NA | Pp      | 05/29/1453, 12:00 AM              |       |
* |                                 |     | PPpp    | May 29, 1453, 12:00:00 AM         |       |
* |                                 |     | PPPpp   | May 29th, 1453 at ...             |       |
* |                                 |     | PPPPpp  | Sunday, May 29th, 1453 at ...     | 2,5,8 |
* Notes:
* 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
*    are the same as "stand-alone" units, but are different in some languages.
*    "Formatting" units are declined according to the rules of the language
*    in the context of a date. "Stand-alone" units are always nominative singular.
*    In `format` function, they will produce different result:
*
*    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
*
*    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
*
*    `isMatch` will try to match both formatting and stand-alone units interchangeably.
*
* 2. Any sequence of the identical letters is a pattern, unless it is escaped by
*    the single quote characters (see below).
*    If the sequence is longer than listed in table:
*    - for numerical units (`yyyyyyyy`) `isMatch` will try to match a number
*      as wide as the sequence
*    - for text units (`MMMMMMMM`) `isMatch` will try to match the widest variation of the unit.
*      These variations are marked with "2" in the last column of the table.
*
* 3. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
*    These tokens represent the shortest form of the quarter.
*
* 4. The main difference between `y` and `u` patterns are B.C. years:
*
*    | Year | `y` | `u` |
*    |------|-----|-----|
*    | AC 1 |   1 |   1 |
*    | BC 1 |   1 |   0 |
*    | BC 2 |   2 |  -1 |
*
*    Also `yy` will try to guess the century of two digit year by proximity with `referenceDate`:
*
*    `isMatch('50', 'yy') //=> true`
*
*    `isMatch('75', 'yy') //=> true`
*
*    while `uu` will use the year as is:
*
*    `isMatch('50', 'uu') //=> true`
*
*    `isMatch('75', 'uu') //=> true`
*
*    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
*    except local week-numbering years are dependent on `options.weekStartsOn`
*    and `options.firstWeekContainsDate` (compare [setISOWeekYear](https://date-fns.org/docs/setISOWeekYear)
*    and [setWeekYear](https://date-fns.org/docs/setWeekYear)).
*
* 5. These patterns are not in the Unicode Technical Standard #35:
*    - `i`: ISO day of week
*    - `I`: ISO week of year
*    - `R`: ISO week-numbering year
*    - `o`: ordinal number modifier
*    - `P`: long localized date
*    - `p`: long localized time
*
* 6. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
*    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* 7. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
*    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* 8. `P+` tokens do not have a defined priority since they are merely aliases to other tokens based
*    on the given locale.
*
*    using `en-US` locale: `P` => `MM/dd/yyyy`
*    using `en-US` locale: `p` => `hh:mm a`
*    using `pt-BR` locale: `P` => `dd/MM/yyyy`
*    using `pt-BR` locale: `p` => `HH:mm`
*
* Values will be checked in the descending order of its unit's priority.
* Units of an equal priority overwrite each other in the order of appearance.
*
* If no values of higher priority are matched (e.g. when matching string 'January 1st' without a year),
* the values will be taken from today's using `new Date()` date which works as a context of parsing.
*
* The result may vary by locale.
*
* If `formatString` matches with `dateString` but does not provides tokens, `referenceDate` will be returned.
*
* @param dateStr - The date string to verify
* @param format - The string of tokens
* @param options - An object with options.
*   see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*   see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* @returns Is format string a match for date string?
*
* @throws `options.locale` must contain `match` property
* @throws use `yyyy` instead of `YYYY` for formatting years; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `yy` instead of `YY` for formatting years; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `d` instead of `D` for formatting days of the month; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws use `dd` instead of `DD` for formatting days of the month; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
* @throws format string contains an unescaped latin alphabet character
*
* @example
* // Match 11 February 2014 from middle-endian format:
* const result = isMatch('02/11/2014', 'MM/dd/yyyy')
* //=> true
*
* @example
* // Match 28th of February in Esperanto locale in the context of 2010 year:
* import eo from 'date-fns/locale/eo'
* const result = isMatch('28-a de februaro', "do 'de' MMMM", {
*   locale: eo
* })
* //=> true
*/
function isMatch$1(dateStr, formatStr, options) {
  return isValid$1(parse$1(dateStr, formatStr, /* @__PURE__ */new Date(), options));
}
//#endregion
//#region dist/date-fns/fp/isMatch.js
var _isMatch = convertToFP(isMatch$1, 2);
//#endregion
//#region dist/date-fns/fp/isMatchWithOptions.js
var _isMatchWithOptions = convertToFP(isMatch$1, 3);
//#endregion
//#region dist/date-fns/isMonday.js
/**
* The {@link isMonday} function options.
*/
/**
* @name isMonday
* @category Weekday Helpers
* @summary Is the given date Monday?
*
* @description
* Is the given date Monday?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is Monday
*
* @example
* // Is 22 September 2014 Monday?
* const result = isMonday(new Date(2014, 8, 22))
* //=> true
*/
function isMonday$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay() === 1;
}
//#endregion
//#region dist/date-fns/fp/isMonday.js
var _isMonday = convertToFP(isMonday$1, 1);
//#endregion
//#region dist/date-fns/fp/isMondayWithOptions.js
var _isMondayWithOptions = convertToFP(isMonday$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameDay.js
var _isSameDay = convertToFP(isSameDay$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameDayWithOptions.js
var _isSameDayWithOptions = convertToFP(isSameDay$1, 3);
//#endregion
//#region dist/date-fns/startOfHour.js
/**
* The {@link startOfHour} function options.
*/
/**
* @name startOfHour
* @category Hour Helpers
* @summary Return the start of an hour for the given date.
*
* @description
* Return the start of an hour for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of an hour
*
* @example
* // The start of an hour for 2 September 2014 11:55:00:
* const result = startOfHour(new Date(2014, 8, 2, 11, 55))
* //=> Tue Sep 02 2014 11:00:00
*/
function startOfHour$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setMinutes(0, 0, 0);
  return _date;
}
//#endregion
//#region dist/date-fns/isSameHour.js
/**
* The {@link isSameHour} function options.
*/
/**
* @name isSameHour
* @category Hour Helpers
* @summary Are the given dates in the same hour (and same day)?
*
* @description
* Are the given dates in the same hour (and same day)?
*
* @param dateLeft - The first date to check
* @param dateRight - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same hour (and same day)
*
* @example
* // Are 4 September 2014 06:00:00 and 4 September 06:30:00 in the same hour?
* const result = isSameHour(new Date(2014, 8, 4, 6, 0), new Date(2014, 8, 4, 6, 30))
* //=> true
*
* @example
* // Are 4 September 2014 06:00:00 and 5 September 06:00:00 in the same hour?
* const result = isSameHour(new Date(2014, 8, 4, 6, 0), new Date(2014, 8, 5, 6, 0))
* //=> false
*/
function isSameHour$1(dateLeft, dateRight, options) {
  var _normalizeDates43 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, dateLeft, dateRight),_normalizeDates44 = _slicedToArray(_normalizeDates43, 2),dateLeft_ = _normalizeDates44[0],dateRight_ = _normalizeDates44[1];
  return +startOfHour$1(dateLeft_) === +startOfHour$1(dateRight_);
}
//#endregion
//#region dist/date-fns/fp/isSameHour.js
var _isSameHour = convertToFP(isSameHour$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameHourWithOptions.js
var _isSameHourWithOptions = convertToFP(isSameHour$1, 3);
//#endregion
//#region dist/date-fns/isSameWeek.js
/**
* The {@link isSameWeek} function options.
*/
/**
* @name isSameWeek
* @category Week Helpers
* @summary Are the given dates in the same week (and month and year)?
*
* @description
* Are the given dates in the same week (and month and year)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same week (and month and year)
*
* @example
* // Are 31 August 2014 and 4 September 2014 in the same week?
* const result = isSameWeek(new Date(2014, 7, 31), new Date(2014, 8, 4))
* //=> true
*
* @example
* // If week starts with Monday,
* // are 31 August 2014 and 4 September 2014 in the same week?
* const result = isSameWeek(new Date(2014, 7, 31), new Date(2014, 8, 4), {
*   weekStartsOn: 1
* })
* //=> false
*
* @example
* // Are 1 January 2014 and 1 January 2015 in the same week?
* const result = isSameWeek(new Date(2014, 0, 1), new Date(2015, 0, 1))
* //=> false
*/
function isSameWeek$1(laterDate, earlierDate, options) {
  var _normalizeDates45 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates46 = _slicedToArray(_normalizeDates45, 2),laterDate_ = _normalizeDates46[0],earlierDate_ = _normalizeDates46[1];
  return +startOfWeek$1(laterDate_, options) === +startOfWeek$1(earlierDate_, options);
}
//#endregion
//#region dist/date-fns/isSameISOWeek.js
/**
* The {@link isSameISOWeek} function options.
*/
/**
* @name isSameISOWeek
* @category ISO Week Helpers
* @summary Are the given dates in the same ISO week (and year)?
*
* @description
* Are the given dates in the same ISO week (and year)?
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same ISO week (and year)
*
* @example
* // Are 1 September 2014 and 7 September 2014 in the same ISO week?
* const result = isSameISOWeek(new Date(2014, 8, 1), new Date(2014, 8, 7))
* //=> true
*
* @example
* // Are 1 September 2014 and 1 September 2015 in the same ISO week?
* const result = isSameISOWeek(new Date(2014, 8, 1), new Date(2015, 8, 1))
* //=> false
*/
function isSameISOWeek$1(laterDate, earlierDate, options) {
  return isSameWeek$1(laterDate, earlierDate, _objectSpread(_objectSpread({},
  options), {}, {
    weekStartsOn: 1 })
  );
}
//#endregion
//#region dist/date-fns/fp/isSameISOWeek.js
var _isSameISOWeek = convertToFP(isSameISOWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameISOWeekWithOptions.js
var _isSameISOWeekWithOptions = convertToFP(isSameISOWeek$1, 3);
//#endregion
//#region dist/date-fns/isSameISOWeekYear.js
/**
* The {@link isSameISOWeekYear} function options.
*/
/**
* @name isSameISOWeekYear
* @category ISO Week-Numbering Year Helpers
* @summary Are the given dates in the same ISO week-numbering year?
*
* @description
* Are the given dates in the same ISO week-numbering year?
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same ISO week-numbering year
*
* @example
* // Are 29 December 2003 and 2 January 2005 in the same ISO week-numbering year?
* const result = isSameISOWeekYear(new Date(2003, 11, 29), new Date(2005, 0, 2))
* //=> true
*/
function isSameISOWeekYear$1(laterDate, earlierDate, options) {
  var _normalizeDates47 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates48 = _slicedToArray(_normalizeDates47, 2),laterDate_ = _normalizeDates48[0],earlierDate_ = _normalizeDates48[1];
  return +startOfISOWeekYear$1(laterDate_) === +startOfISOWeekYear$1(earlierDate_);
}
//#endregion
//#region dist/date-fns/fp/isSameISOWeekYear.js
var _isSameISOWeekYear = convertToFP(isSameISOWeekYear$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameISOWeekYearWithOptions.js
var _isSameISOWeekYearWithOptions = convertToFP(isSameISOWeekYear$1, 3);
//#endregion
//#region dist/date-fns/startOfMinute.js
/**
* The {@link startOfMinute} function options.
*/
/**
* @name startOfMinute
* @category Minute Helpers
* @summary Return the start of a minute for the given date.
*
* @description
* Return the start of a minute for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of a minute
*
* @example
* // The start of a minute for 1 December 2014 22:15:45.400:
* const result = startOfMinute(new Date(2014, 11, 1, 22, 15, 45, 400))
* //=> Mon Dec 01 2014 22:15:00
*/
function startOfMinute$1(date, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  date_.setSeconds(0, 0);
  return date_;
}
//#endregion
//#region dist/date-fns/isSameMinute.js
/**
* @name isSameMinute
* @category Minute Helpers
* @summary Are the given dates in the same minute (and hour and day)?
*
* @description
* Are the given dates in the same minute (and hour and day)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
*
* @returns The dates are in the same minute (and hour and day)
*
* @example
* // Are 4 September 2014 06:30:00 and 4 September 2014 06:30:15 in the same minute?
* const result = isSameMinute(
*   new Date(2014, 8, 4, 6, 30),
*   new Date(2014, 8, 4, 6, 30, 15)
* )
* //=> true
*
* @example
* // Are 4 September 2014 06:30:00 and 5 September 2014 06:30:00 in the same minute?
* const result = isSameMinute(
*   new Date(2014, 8, 4, 6, 30),
*   new Date(2014, 8, 5, 6, 30)
* )
* //=> false
*/
function isSameMinute$1(laterDate, earlierDate) {
  return +startOfMinute$1(laterDate) === +startOfMinute$1(earlierDate);
}
//#endregion
//#region dist/date-fns/fp/isSameMinute.js
var _isSameMinute = convertToFP(isSameMinute$1, 2);
//#endregion
//#region dist/date-fns/isSameMonth.js
/**
* The {@link isSameMonth} function options.
*/
/**
* @name isSameMonth
* @category Month Helpers
* @summary Are the given dates in the same month (and year)?
*
* @description
* Are the given dates in the same month (and year)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same month (and year)
*
* @example
* // Are 2 September 2014 and 25 September 2014 in the same month?
* const result = isSameMonth(new Date(2014, 8, 2), new Date(2014, 8, 25))
* //=> true
*
* @example
* // Are 2 September 2014 and 25 September 2015 in the same month?
* const result = isSameMonth(new Date(2014, 8, 2), new Date(2015, 8, 25))
* //=> false
*/
function isSameMonth$1(laterDate, earlierDate, options) {
  var _normalizeDates49 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates50 = _slicedToArray(_normalizeDates49, 2),laterDate_ = _normalizeDates50[0],earlierDate_ = _normalizeDates50[1];
  return laterDate_.getFullYear() === earlierDate_.getFullYear() && laterDate_.getMonth() === earlierDate_.getMonth();
}
//#endregion
//#region dist/date-fns/fp/isSameMonth.js
var _isSameMonth = convertToFP(isSameMonth$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameMonthWithOptions.js
var _isSameMonthWithOptions = convertToFP(isSameMonth$1, 3);
//#endregion
//#region dist/date-fns/isSameQuarter.js
/**
* The {@link isSameQuarter} function options.
*/
/**
* @name isSameQuarter
* @category Quarter Helpers
* @summary Are the given dates in the same quarter (and year)?
*
* @description
* Are the given dates in the same quarter (and year)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same quarter (and year)
*
* @example
* // Are 1 January 2014 and 8 March 2014 in the same quarter?
* const result = isSameQuarter(new Date(2014, 0, 1), new Date(2014, 2, 8))
* //=> true
*
* @example
* // Are 1 January 2014 and 1 January 2015 in the same quarter?
* const result = isSameQuarter(new Date(2014, 0, 1), new Date(2015, 0, 1))
* //=> false
*/
function isSameQuarter$1(laterDate, earlierDate, options) {
  var _normalizeDates51 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates52 = _slicedToArray(_normalizeDates51, 2),dateLeft_ = _normalizeDates52[0],dateRight_ = _normalizeDates52[1];
  return +startOfQuarter$1(dateLeft_) === +startOfQuarter$1(dateRight_);
}
//#endregion
//#region dist/date-fns/fp/isSameQuarter.js
var _isSameQuarter = convertToFP(isSameQuarter$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameQuarterWithOptions.js
var _isSameQuarterWithOptions = convertToFP(isSameQuarter$1, 3);
//#endregion
//#region dist/date-fns/startOfSecond.js
/**
* The {@link startOfSecond} function options.
*/
/**
* @name startOfSecond
* @category Second Helpers
* @summary Return the start of a second for the given date.
*
* @description
* Return the start of a second for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - The options
*
* @returns The start of a second
*
* @example
* // The start of a second for 1 December 2014 22:15:45.400:
* const result = startOfSecond(new Date(2014, 11, 1, 22, 15, 45, 400))
* //=> Mon Dec 01 2014 22:15:45.000
*/
function startOfSecond$1(date, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  date_.setMilliseconds(0);
  return date_;
}
//#endregion
//#region dist/date-fns/isSameSecond.js
/**
* @name isSameSecond
* @category Second Helpers
* @summary Are the given dates in the same second (and hour and day)?
*
* @description
* Are the given dates in the same second (and hour and day)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
*
* @returns The dates are in the same second (and hour and day)
*
* @example
* // Are 4 September 2014 06:30:15.000 and 4 September 2014 06:30.15.500 in the same second?
* const result = isSameSecond(
*   new Date(2014, 8, 4, 6, 30, 15),
*   new Date(2014, 8, 4, 6, 30, 15, 500)
* )
* //=> true
*
* @example
* // Are 4 September 2014 06:00:15.000 and 4 September 2014 06:01.15.000 in the same second?
* const result = isSameSecond(
*   new Date(2014, 8, 4, 6, 0, 15),
*   new Date(2014, 8, 4, 6, 1, 15)
* )
* //=> false
*
* @example
* // Are 4 September 2014 06:00:15.000 and 5 September 2014 06:00.15.000 in the same second?
* const result = isSameSecond(
*   new Date(2014, 8, 4, 6, 0, 15),
*   new Date(2014, 8, 5, 6, 0, 15)
* )
* //=> false
*/
function isSameSecond$1(laterDate, earlierDate) {
  return +startOfSecond$1(laterDate) === +startOfSecond$1(earlierDate);
}
//#endregion
//#region dist/date-fns/fp/isSameSecond.js
var _isSameSecond = convertToFP(isSameSecond$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameWeek.js
var _isSameWeek = convertToFP(isSameWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameWeekWithOptions.js
var _isSameWeekWithOptions = convertToFP(isSameWeek$1, 3);
//#endregion
//#region dist/date-fns/isSameYear.js
/**
* The {@link isSameYear} function options.
*/
/**
* @name isSameYear
* @category Year Helpers
* @summary Are the given dates in the same year?
*
* @description
* Are the given dates in the same year?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same year
*
* @example
* // Are 2 September 2014 and 25 September 2014 in the same year?
* const result = isSameYear(new Date(2014, 8, 2), new Date(2014, 8, 25))
* //=> true
*/
function isSameYear$1(laterDate, earlierDate, options) {
  var _normalizeDates53 = normalizeDates(options === null || options === void 0 ? void 0 : options.in, laterDate, earlierDate),_normalizeDates54 = _slicedToArray(_normalizeDates53, 2),laterDate_ = _normalizeDates54[0],earlierDate_ = _normalizeDates54[1];
  return laterDate_.getFullYear() === earlierDate_.getFullYear();
}
//#endregion
//#region dist/date-fns/fp/isSameYear.js
var _isSameYear = convertToFP(isSameYear$1, 2);
//#endregion
//#region dist/date-fns/fp/isSameYearWithOptions.js
var _isSameYearWithOptions = convertToFP(isSameYear$1, 3);
//#endregion
//#region dist/date-fns/fp/isSaturday.js
var _isSaturday = convertToFP(isSaturday$1, 1);
//#endregion
//#region dist/date-fns/fp/isSaturdayWithOptions.js
var _isSaturdayWithOptions = convertToFP(isSaturday$1, 2);
//#endregion
//#region dist/date-fns/fp/isSunday.js
var _isSunday = convertToFP(isSunday$1, 1);
//#endregion
//#region dist/date-fns/fp/isSundayWithOptions.js
var _isSundayWithOptions = convertToFP(isSunday$1, 2);
//#endregion
//#region dist/date-fns/isThursday.js
/**
* The {@link isThursday} function options.
*/
/**
* @name isThursday
* @category Weekday Helpers
* @summary Is the given date Thursday?
*
* @description
* Is the given date Thursday?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is Thursday
*
* @example
* // Is 25 September 2014 Thursday?
* const result = isThursday(new Date(2014, 8, 25))
* //=> true
*/
function isThursday$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay() === 4;
}
//#endregion
//#region dist/date-fns/fp/isThursday.js
var _isThursday = convertToFP(isThursday$1, 1);
//#endregion
//#region dist/date-fns/fp/isThursdayWithOptions.js
var _isThursdayWithOptions = convertToFP(isThursday$1, 2);
//#endregion
//#region dist/date-fns/isTuesday.js
/**
* The {@link isTuesday} function options.
*/
/**
* @name isTuesday
* @category Weekday Helpers
* @summary Is the given date Tuesday?
*
* @description
* Is the given date Tuesday?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is Tuesday
*
* @example
* // Is 23 September 2014 Tuesday?
* const result = isTuesday(new Date(2014, 8, 23))
* //=> true
*/
function isTuesday$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay() === 2;
}
//#endregion
//#region dist/date-fns/fp/isTuesday.js
var _isTuesday = convertToFP(isTuesday$1, 1);
//#endregion
//#region dist/date-fns/fp/isTuesdayWithOptions.js
var _isTuesdayWithOptions = convertToFP(isTuesday$1, 2);
//#endregion
//#region dist/date-fns/fp/isValid.js
var _isValid = convertToFP(isValid$1, 1);
//#endregion
//#region dist/date-fns/isWednesday.js
/**
* The {@link isWednesday} function options.
*/
/**
* @name isWednesday
* @category Weekday Helpers
* @summary Is the given date Wednesday?
*
* @description
* Is the given date Wednesday?
*
* @param date - The date to check
* @param options - An object with options
*
* @returns The date is Wednesday
*
* @example
* // Is 24 September 2014 Wednesday?
* const result = isWednesday(new Date(2014, 8, 24))
* //=> true
*/
function isWednesday$1(date, options) {
  return toDate$1(date, options === null || options === void 0 ? void 0 : options.in).getDay() === 3;
}
//#endregion
//#region dist/date-fns/fp/isWednesday.js
var _isWednesday = convertToFP(isWednesday$1, 1);
//#endregion
//#region dist/date-fns/fp/isWednesdayWithOptions.js
var _isWednesdayWithOptions = convertToFP(isWednesday$1, 2);
//#endregion
//#region dist/date-fns/fp/isWeekend.js
var _isWeekend = convertToFP(isWeekend$1, 1);
//#endregion
//#region dist/date-fns/fp/isWeekendWithOptions.js
var _isWeekendWithOptions = convertToFP(isWeekend$1, 2);
//#endregion
//#region dist/date-fns/isWithinInterval.js
/**
* The {@link isWithinInterval} function options.
*/
/**
* @name isWithinInterval
* @category Interval Helpers
* @summary Is the given date within the interval?
*
* @description
* Is the given date within the interval? (Including start and end.)
*
* @param date - The date to check
* @param interval - The interval to check
* @param options - An object with options
*
* @returns The date is within the interval
*
* @example
* // For the date within the interval:
* isWithinInterval(new Date(2014, 0, 3), {
*   start: new Date(2014, 0, 1),
*   end: new Date(2014, 0, 7)
* })
* // => true
*
* @example
* // For the date outside of the interval:
* isWithinInterval(new Date(2014, 0, 10), {
*   start: new Date(2014, 0, 1),
*   end: new Date(2014, 0, 7)
* })
* // => false
*
* @example
* // For date equal to the interval start:
* isWithinInterval(date, { start, end: date })
* // => true
*
* @example
* // For date equal to the interval end:
* isWithinInterval(date, { start: date, end })
* // => true
*/
function isWithinInterval$1(date, interval, options) {
  var time = +toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var _sort9 = [+toDate$1(interval.start, options === null || options === void 0 ? void 0 : options.in), +toDate$1(interval.end, options === null || options === void 0 ? void 0 : options.in)].sort(function (a, b) {return a - b;}),_sort0 = _slicedToArray(_sort9, 2),startTime = _sort0[0],endTime = _sort0[1];
  return time >= startTime && time <= endTime;
}
//#endregion
//#region dist/date-fns/fp/isWithinInterval.js
var _isWithinInterval = convertToFP(isWithinInterval$1, 2);
//#endregion
//#region dist/date-fns/fp/isWithinIntervalWithOptions.js
var _isWithinIntervalWithOptions = convertToFP(isWithinInterval$1, 3);
//#endregion
//#region dist/date-fns/lastDayOfDecade.js
/**
* The {@link lastDayOfDecade} function options.
*/
/**
* @name lastDayOfDecade
* @category Decade Helpers
* @summary Return the last day of a decade for the given date.
*
* @description
* Return the last day of a decade for the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows using extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type; inferred from arguments or specified by context.
*
* @param date - The original date
* @param options - The options
*
* @returns The last day of a decade
*
* @example
* // The last day of a decade for 21 December 2012 21:12:00:
* const result = lastDayOfDecade(new Date(2012, 11, 21, 21, 12, 00))
* //=> Wed Dec 31 2019 00:00:00
*/
function lastDayOfDecade$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  var decade = 9 + Math.floor(year / 10) * 10;
  _date.setFullYear(decade + 1, 0, 0);
  _date.setHours(0, 0, 0, 0);
  return toDate$1(_date, options === null || options === void 0 ? void 0 : options.in);
}
//#endregion
//#region dist/date-fns/fp/lastDayOfDecade.js
var _lastDayOfDecade = convertToFP(lastDayOfDecade$1, 1);
//#endregion
//#region dist/date-fns/fp/lastDayOfDecadeWithOptions.js
var _lastDayOfDecadeWithOptions = convertToFP(lastDayOfDecade$1, 2);
//#endregion
//#region dist/date-fns/lastDayOfWeek.js
/**
* The {@link lastDayOfWeek} function options.
*/
/**
* @name lastDayOfWeek
* @category Week Helpers
* @summary Return the last day of a week for the given date.
*
* @description
* Return the last day of a week for the given date.
* The result will be in the local timezone unless a context is specified.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The last day of a week
*/
function lastDayOfWeek$1(date, options) {var _ref38, _ref39, _ref40, _options$weekStartsOn8, _options$locale16, _defaultOptions$local10;
  var defaultOptions = getDefaultOptions$1();
  var weekStartsOn = (_ref38 = (_ref39 = (_ref40 = (_options$weekStartsOn8 = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn8 !== void 0 ? _options$weekStartsOn8 : options === null || options === void 0 || (_options$locale16 = options.locale) === null || _options$locale16 === void 0 || (_options$locale16 = _options$locale16.options) === null || _options$locale16 === void 0 ? void 0 : _options$locale16.weekStartsOn) !== null && _ref40 !== void 0 ? _ref40 : defaultOptions.weekStartsOn) !== null && _ref39 !== void 0 ? _ref39 : (_defaultOptions$local10 = defaultOptions.locale) === null || _defaultOptions$local10 === void 0 || (_defaultOptions$local10 = _defaultOptions$local10.options) === null || _defaultOptions$local10 === void 0 ? void 0 : _defaultOptions$local10.weekStartsOn) !== null && _ref38 !== void 0 ? _ref38 : 0;
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var day = _date.getDay();
  var diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);
  _date.setHours(0, 0, 0, 0);
  _date.setDate(_date.getDate() + diff);
  return _date;
}
//#endregion
//#region dist/date-fns/lastDayOfISOWeek.js
/**
* The {@link lastDayOfISOWeek} function options.
*/
/**
* @name lastDayOfISOWeek
* @category ISO Week Helpers
* @summary Return the last day of an ISO week for the given date.
*
* @description
* Return the last day of an ISO week for the given date.
* The result will be in the local timezone.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The Date type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [UTCDate](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The last day of an ISO week
*
* @example
* // The last day of an ISO week for 2 September 2014 11:55:00:
* const result = lastDayOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
* //=> Sun Sep 07 2014 00:00:00
*/
function lastDayOfISOWeek$1(date, options) {
  return lastDayOfWeek$1(date, _objectSpread(_objectSpread({},
  options), {}, {
    weekStartsOn: 1 })
  );
}
//#endregion
//#region dist/date-fns/fp/lastDayOfISOWeek.js
var _lastDayOfISOWeek = convertToFP(lastDayOfISOWeek$1, 1);
//#endregion
//#region dist/date-fns/fp/lastDayOfISOWeekWithOptions.js
var _lastDayOfISOWeekWithOptions = convertToFP(lastDayOfISOWeek$1, 2);
//#endregion
//#region dist/date-fns/lastDayOfISOWeekYear.js
/**
* The {@link lastDayOfISOWeekYear} function options.
*/
/**
* @name lastDayOfISOWeekYear
* @category ISO Week-Numbering Year Helpers
* @summary Return the last day of an ISO week-numbering year for the given date.
*
* @description
* Return the last day of an ISO week-numbering year,
* which always starts 3 days before the year's first Thursday.
* The result will be in the local timezone.
*
* ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The end of an ISO week-numbering year
*
* @example
* // The last day of an ISO week-numbering year for 2 July 2005:
* const result = lastDayOfISOWeekYear(new Date(2005, 6, 2))
* //=> Sun Jan 01 2006 00:00:00
*/
function lastDayOfISOWeekYear$1(date, options) {
  var year = getISOWeekYear$1(date, options);
  var fourthOfJanuary = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  fourthOfJanuary.setFullYear(year + 1, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  var date_ = startOfISOWeek$1(fourthOfJanuary, options);
  date_.setDate(date_.getDate() - 1);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/lastDayOfISOWeekYear.js
var _lastDayOfISOWeekYear = convertToFP(lastDayOfISOWeekYear$1, 1);
//#endregion
//#region dist/date-fns/fp/lastDayOfISOWeekYearWithOptions.js
var _lastDayOfISOWeekYearWithOptions = convertToFP(lastDayOfISOWeekYear$1, 2);
//#endregion
//#region dist/date-fns/fp/lastDayOfMonth.js
var _lastDayOfMonth = convertToFP(lastDayOfMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/lastDayOfMonthWithOptions.js
var _lastDayOfMonthWithOptions = convertToFP(lastDayOfMonth$1, 2);
//#endregion
//#region dist/date-fns/lastDayOfQuarter.js
/**
* The {@link lastDayOfQuarter} function options.
*/
/**
* @name lastDayOfQuarter
* @category Quarter Helpers
* @summary Return the last day of a year quarter for the given date.
*
* @description
* Return the last day of a year quarter for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - The options
*
* @returns The last day of a quarter
*
* @example
* // The last day of a quarter for 2 September 2014 11:55:00:
* const result = lastDayOfQuarter(new Date(2014, 8, 2, 11, 55, 0))
* //=> Tue Sep 30 2014 00:00:00
*/
function lastDayOfQuarter$1(date, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var currentMonth = date_.getMonth();
  var month = currentMonth - currentMonth % 3 + 3;
  date_.setMonth(month, 0);
  date_.setHours(0, 0, 0, 0);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/lastDayOfQuarter.js
var _lastDayOfQuarter = convertToFP(lastDayOfQuarter$1, 1);
//#endregion
//#region dist/date-fns/fp/lastDayOfQuarterWithOptions.js
var _lastDayOfQuarterWithOptions = convertToFP(lastDayOfQuarter$1, 2);
//#endregion
//#region dist/date-fns/fp/lastDayOfWeek.js
var _lastDayOfWeek = convertToFP(lastDayOfWeek$1, 1);
//#endregion
//#region dist/date-fns/fp/lastDayOfWeekWithOptions.js
var _lastDayOfWeekWithOptions = convertToFP(lastDayOfWeek$1, 2);
//#endregion
//#region dist/date-fns/lastDayOfYear.js
/**
* The {@link lastDayOfYear} function options.
*/
/**
* @name lastDayOfYear
* @category Year Helpers
* @summary Return the last day of a year for the given date.
*
* @description
* Return the last day of a year for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The last day of a year
*
* @example
* // The last day of a year for 2 September 2014 11:55:00:
* const result = lastDayOfYear(new Date(2014, 8, 2, 11, 55, 00))
* //=> Wed Dec 31 2014 00:00:00
*/
function lastDayOfYear$1(date, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = date_.getFullYear();
  date_.setFullYear(year + 1, 0, 0);
  date_.setHours(0, 0, 0, 0);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/lastDayOfYear.js
var _lastDayOfYear = convertToFP(lastDayOfYear$1, 1);
//#endregion
//#region dist/date-fns/fp/lastDayOfYearWithOptions.js
var _lastDayOfYearWithOptions = convertToFP(lastDayOfYear$1, 2);
//#endregion
//#region dist/date-fns/lightFormat.js
var formattingTokensRegExp = /(\w)\1*|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
/**
* @private
*/
/**
* @name lightFormat
* @category Common Helpers
* @summary Format the date.
*
* @description
* Return the formatted date string in the given format. Unlike `format`,
* `lightFormat` doesn't use locales and outputs date using the most popular tokens.
*
* > ⚠️ Please note that the `lightFormat` tokens differ from Moment.js and other libraries.
* > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
*
* The characters wrapped between two single quotes characters (') are escaped.
* Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
*
* Format of the string is based on Unicode Technical Standard #35:
* https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
*
* Accepted patterns:
* | Unit                            | Pattern | Result examples                   |
* |---------------------------------|---------|-----------------------------------|
* | AM, PM                          | a..aaa  | AM, PM                            |
* |                                 | aaaa    | a.m., p.m.                        |
* |                                 | aaaaa   | a, p                              |
* | Calendar year                   | y       | 44, 1, 1900, 2017                 |
* |                                 | yy      | 44, 01, 00, 17                    |
* |                                 | yyy     | 044, 001, 000, 017                |
* |                                 | yyyy    | 0044, 0001, 1900, 2017            |
* | Month (formatting)              | M       | 1, 2, ..., 12                     |
* |                                 | MM      | 01, 02, ..., 12                   |
* | Day of month                    | d       | 1, 2, ..., 31                     |
* |                                 | dd      | 01, 02, ..., 31                   |
* | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |
* |                                 | hh      | 01, 02, ..., 11, 12               |
* | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |
* |                                 | HH      | 00, 01, 02, ..., 23               |
* | Minute                          | m       | 0, 1, ..., 59                     |
* |                                 | mm      | 00, 01, ..., 59                   |
* | Second                          | s       | 0, 1, ..., 59                     |
* |                                 | ss      | 00, 01, ..., 59                   |
* | Fraction of second              | S       | 0, 1, ..., 9                      |
* |                                 | SS      | 00, 01, ..., 99                   |
* |                                 | SSS     | 000, 001, ..., 999                |
* |                                 | SSSS    | ...                               |
*
* @param date - The original date
* @param format - The string of tokens
*
* @returns The formatted date string
*
* @throws `Invalid time value` if the date is invalid
* @throws format string contains an unescaped latin alphabet character
*
* @example
* const result = lightFormat(new Date(2014, 1, 11), 'yyyy-MM-dd')
* //=> '2014-02-11'
*/
function lightFormat$1(date, formatStr) {
  var date_ = toDate$1(date);
  if (!isValid$1(date_)) throw new RangeError("Invalid time value");
  var tokens = formatStr.match(formattingTokensRegExp);
  if (!tokens) return "";
  return tokens.map(function (substring) {
    if (substring === "''") return "'";
    var firstCharacter = substring[0];
    if (firstCharacter === "'") return cleanEscapedString(substring);
    var formatter = lightFormatters[firstCharacter];
    if (formatter) return formatter(date_, substring);
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) throw new RangeError("Format string contains an unescaped latin alphabet character `" + firstCharacter + "`");
    return substring;
  }).join("");
}
function cleanEscapedString(input) {
  var matches = input.match(escapedStringRegExp);
  if (!matches) return input;
  return matches[1].replace(doubleQuoteRegExp, "'");
}
//#endregion
//#region dist/date-fns/fp/lightFormat.js
var _lightFormat = convertToFP(lightFormat$1, 2);
//#endregion
//#region dist/date-fns/fp/max.js
var _max = convertToFP(max$1, 1);
//#endregion
//#region dist/date-fns/fp/maxWithOptions.js
var _maxWithOptions = convertToFP(max$1, 2);
//#endregion
//#region dist/date-fns/milliseconds.js
/**
* @name milliseconds
* @category Millisecond Helpers
* @summary
* Returns the number of milliseconds in the specified, years, months, weeks, days, hours, minutes and seconds.
*
* @description
* Returns the number of milliseconds in the specified, years, months, weeks, days, hours, minutes and seconds.
*
* One years equals 365.2425 days according to the formula:
*
* > Leap year occurs every 4 years, except for years that are divisible by 100 and not divisible by 400.
* > 1 mean year = (365+1/4-1/100+1/400) days = 365.2425 days
*
* One month is a year divided by 12.
*
* @param duration - The object with years, months, weeks, days, hours, minutes and seconds to be added.
*
* @returns The milliseconds
*
* @example
* // 1 year in milliseconds
* milliseconds({ years: 1 })
* //=> 31556952000
*
* // 3 months in milliseconds
* milliseconds({ months: 3 })
* //=> 7889238000
*/
function milliseconds$1(_ref41) {var years = _ref41.years,months = _ref41.months,weeks = _ref41.weeks,days = _ref41.days,hours = _ref41.hours,minutes = _ref41.minutes,seconds = _ref41.seconds;
  var totalDays = 0;
  if (years) totalDays += years * daysInYear;
  if (months) totalDays += months * (daysInYear / 12);
  if (weeks) totalDays += weeks * 7;
  if (days) totalDays += days;
  var totalSeconds = totalDays * 24 * 60 * 60;
  if (hours) totalSeconds += hours * 60 * 60;
  if (minutes) totalSeconds += minutes * 60;
  if (seconds) totalSeconds += seconds;
  return Math.trunc(totalSeconds * 1e3);
}
//#endregion
//#region dist/date-fns/fp/milliseconds.js
var _milliseconds2 = convertToFP(milliseconds$1, 1);
//#endregion
//#region dist/date-fns/millisecondsToHours.js
/**
* @name millisecondsToHours
* @category Conversion Helpers
* @summary Convert milliseconds to hours.
*
* @description
* Convert a number of milliseconds to a full number of hours.
*
* @param milliseconds - The number of milliseconds to be converted
*
* @returns The number of milliseconds converted in hours
*
* @example
* // Convert 7200000 milliseconds to hours:
* const result = millisecondsToHours(7200000)
* //=> 2
*
* @example
* // It uses floor rounding:
* const result = millisecondsToHours(7199999)
* //=> 1
*/
function millisecondsToHours$1(milliseconds) {
  var hours = milliseconds / millisecondsInHour;
  return Math.trunc(hours);
}
//#endregion
//#region dist/date-fns/fp/millisecondsToHours.js
var _millisecondsToHours = convertToFP(millisecondsToHours$1, 1);
//#endregion
//#region dist/date-fns/millisecondsToMinutes.js
/**
* @name millisecondsToMinutes
* @category Conversion Helpers
* @summary Convert milliseconds to minutes.
*
* @description
* Convert a number of milliseconds to a full number of minutes.
*
* @param milliseconds - The number of milliseconds to be converted
*
* @returns The number of milliseconds converted in minutes
*
* @example
* // Convert 60000 milliseconds to minutes:
* const result = millisecondsToMinutes(60000)
* //=> 1
*
* @example
* // It uses floor rounding:
* const result = millisecondsToMinutes(119999)
* //=> 1
*/
function millisecondsToMinutes$1(milliseconds) {
  var minutes = milliseconds / millisecondsInMinute;
  return Math.trunc(minutes);
}
//#endregion
//#region dist/date-fns/fp/millisecondsToMinutes.js
var _millisecondsToMinutes = convertToFP(millisecondsToMinutes$1, 1);
//#endregion
//#region dist/date-fns/millisecondsToSeconds.js
/**
* @name millisecondsToSeconds
* @category Conversion Helpers
* @summary Convert milliseconds to seconds.
*
* @description
* Convert a number of milliseconds to a full number of seconds.
*
* @param milliseconds - The number of milliseconds to be converted
*
* @returns The number of milliseconds converted in seconds
*
* @example
* // Convert 1000 milliseconds to seconds:
* const result = millisecondsToSeconds(1000)
* //=> 1
*
* @example
* // It uses floor rounding:
* const result = millisecondsToSeconds(1999)
* //=> 1
*/
function millisecondsToSeconds$1(milliseconds) {
  var seconds = milliseconds / millisecondsInSecond;
  return Math.trunc(seconds);
}
//#endregion
//#region dist/date-fns/fp/millisecondsToSeconds.js
var _millisecondsToSeconds = convertToFP(millisecondsToSeconds$1, 1);
//#endregion
//#region dist/date-fns/fp/min.js
var _min = convertToFP(min$1, 1);
//#endregion
//#region dist/date-fns/fp/minWithOptions.js
var _minWithOptions = convertToFP(min$1, 2);
//#endregion
//#region dist/date-fns/minutesToHours.js
/**
* @name minutesToHours
* @category Conversion Helpers
* @summary Convert minutes to hours.
*
* @description
* Convert a number of minutes to a full number of hours.
*
* @param minutes - The number of minutes to be converted
*
* @returns The number of minutes converted in hours
*
* @example
* // Convert 140 minutes to hours:
* const result = minutesToHours(120)
* //=> 2
*
* @example
* // It uses floor rounding:
* const result = minutesToHours(179)
* //=> 2
*/
function minutesToHours$1(minutes) {
  var hours = minutes / 60;
  return Math.trunc(hours);
}
//#endregion
//#region dist/date-fns/fp/minutesToHours.js
var _minutesToHours = convertToFP(minutesToHours$1, 1);
//#endregion
//#region dist/date-fns/minutesToMilliseconds.js
/**
* @name minutesToMilliseconds
* @category Conversion Helpers
* @summary Convert minutes to milliseconds.
*
* @description
* Convert a number of minutes to a full number of milliseconds.
*
* @param minutes - The number of minutes to be converted
*
* @returns The number of minutes converted in milliseconds
*
* @example
* // Convert 2 minutes to milliseconds
* const result = minutesToMilliseconds(2)
* //=> 120000
*/
function minutesToMilliseconds$1(minutes) {
  return Math.trunc(minutes * millisecondsInMinute);
}
//#endregion
//#region dist/date-fns/fp/minutesToMilliseconds.js
var _minutesToMilliseconds = convertToFP(minutesToMilliseconds$1, 1);
//#endregion
//#region dist/date-fns/minutesToSeconds.js
/**
* @name minutesToSeconds
* @category Conversion Helpers
* @summary Convert minutes to seconds.
*
* @description
* Convert a number of minutes to a full number of seconds.
*
* @param minutes - The number of minutes to be converted
*
* @returns The number of minutes converted in seconds
*
* @example
* // Convert 2 minutes to seconds
* const result = minutesToSeconds(2)
* //=> 120
*/
function minutesToSeconds$1(minutes) {
  return Math.trunc(minutes * 60);
}
//#endregion
//#region dist/date-fns/fp/minutesToSeconds.js
var _minutesToSeconds = convertToFP(minutesToSeconds$1, 1);
//#endregion
//#region dist/date-fns/monthsToQuarters.js
/**
* @name monthsToQuarters
* @category Conversion Helpers
* @summary Convert number of months to quarters.
*
* @description
* Convert a number of months to a full number of quarters.
*
* @param months - The number of months to be converted.
*
* @returns The number of months converted in quarters
*
* @example
* // Convert 6 months to quarters:
* const result = monthsToQuarters(6)
* //=> 2
*
* @example
* // It uses floor rounding:
* const result = monthsToQuarters(7)
* //=> 2
*/
function monthsToQuarters$1(months) {
  var quarters = months / 3;
  return Math.trunc(quarters);
}
//#endregion
//#region dist/date-fns/fp/monthsToQuarters.js
var _monthsToQuarters = convertToFP(monthsToQuarters$1, 1);
//#endregion
//#region dist/date-fns/monthsToYears.js
/**
* @name monthsToYears
* @category Conversion Helpers
* @summary Convert number of months to years.
*
* @description
* Convert a number of months to a full number of years.
*
* @param months - The number of months to be converted
*
* @returns The number of months converted in years
*
* @example
* // Convert 36 months to years:
* const result = monthsToYears(36)
* //=> 3
*
* // It uses floor rounding:
* const result = monthsToYears(40)
* //=> 3
*/
function monthsToYears$1(months) {
  var years = months / 12;
  return Math.trunc(years);
}
//#endregion
//#region dist/date-fns/fp/monthsToYears.js
var _monthsToYears = convertToFP(monthsToYears$1, 1);
//#endregion
//#region dist/date-fns/nextDay.js
/**
* The {@link nextDay} function options.
*/
/**
* @name nextDay
* @category Weekday Helpers
* @summary When is the next day of the week? 0-6 the day of the week, 0 represents Sunday.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to check
* @param day - Day of the week
* @param options - An object with options
*
* @returns The date is the next day of the week
*
* @example
* // When is the next Monday after Mar, 20, 2020?
* const result = nextDay(new Date(2020, 2, 20), 1)
* //=> Mon Mar 23 2020 00:00:00
*
* @example
* // When is the next Tuesday after Mar, 21, 2020?
* const result = nextDay(new Date(2020, 2, 21), 2)
* //=> Tue Mar 24 2020 00:00:00
*/
function nextDay$1(date, day, options) {
  var delta = day - getDay$1(date, options);
  if (delta <= 0) delta += 7;
  return addDays$1(date, delta, options);
}
//#endregion
//#region dist/date-fns/fp/nextDay.js
var _nextDay = convertToFP(nextDay$1, 2);
//#endregion
//#region dist/date-fns/fp/nextDayWithOptions.js
var _nextDayWithOptions = convertToFP(nextDay$1, 3);
//#endregion
//#region dist/date-fns/nextFriday.js
/**
* The {@link nextFriday} function options.
*/
/**
* @name nextFriday
* @category Weekday Helpers
* @summary When is the next Friday?
*
* @description
* When is the next Friday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The next Friday
*
* @example
* // When is the next Friday after Mar, 22, 2020?
* const result = nextFriday(new Date(2020, 2, 22))
* //=> Fri Mar 27 2020 00:00:00
*/
function nextFriday$1(date, options) {
  return nextDay$1(date, 5, options);
}
//#endregion
//#region dist/date-fns/fp/nextFriday.js
var _nextFriday = convertToFP(nextFriday$1, 1);
//#endregion
//#region dist/date-fns/fp/nextFridayWithOptions.js
var _nextFridayWithOptions = convertToFP(nextFriday$1, 2);
//#endregion
//#region dist/date-fns/nextMonday.js
/**
* The {@link nextMonday} function options.
*/
/**
* @name nextMonday
* @category Weekday Helpers
* @summary When is the next Monday?
*
* @description
* When is the next Monday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, returned from the context function if passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The next Monday
*
* @example
* // When is the next Monday after Mar, 22, 2020?
* const result = nextMonday(new Date(2020, 2, 22))
* //=> Mon Mar 23 2020 00:00:00
*/
function nextMonday$1(date, options) {
  return nextDay$1(date, 1, options);
}
//#endregion
//#region dist/date-fns/fp/nextMonday.js
var _nextMonday = convertToFP(nextMonday$1, 1);
//#endregion
//#region dist/date-fns/fp/nextMondayWithOptions.js
var _nextMondayWithOptions = convertToFP(nextMonday$1, 2);
//#endregion
//#region dist/date-fns/nextSaturday.js
/**
* The {@link nextSaturday} function options.
*/
/**
* @name nextSaturday
* @category Weekday Helpers
* @summary When is the next Saturday?
*
* @description
* When is the next Saturday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The next Saturday
*
* @example
* // When is the next Saturday after Mar, 22, 2020?
* const result = nextSaturday(new Date(2020, 2, 22))
* //=> Sat Mar 28 2020 00:00:00
*/
function nextSaturday$1(date, options) {
  return nextDay$1(date, 6, options);
}
//#endregion
//#region dist/date-fns/fp/nextSaturday.js
var _nextSaturday = convertToFP(nextSaturday$1, 1);
//#endregion
//#region dist/date-fns/fp/nextSaturdayWithOptions.js
var _nextSaturdayWithOptions = convertToFP(nextSaturday$1, 2);
//#endregion
//#region dist/date-fns/nextSunday.js
/**
* The {@link nextSunday} function options.
*/
/**
* @name nextSunday
* @category Weekday Helpers
* @summary When is the next Sunday?
*
* @description
* When is the next Sunday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned if a context is provided.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The next Sunday
*
* @example
* // When is the next Sunday after March 22, 2020?
* const result = nextSunday(new Date(2020, 2, 22))
* //=> Sun Mar 29 2020 00:00:00
*/
function nextSunday$1(date, options) {
  return nextDay$1(date, 0, options);
}
//#endregion
//#region dist/date-fns/fp/nextSunday.js
var _nextSunday = convertToFP(nextSunday$1, 1);
//#endregion
//#region dist/date-fns/fp/nextSundayWithOptions.js
var _nextSundayWithOptions = convertToFP(nextSunday$1, 2);
//#endregion
//#region dist/date-fns/nextThursday.js
/**
* The {@link nextThursday} function options.
*/
/**
* @name nextThursday
* @category Weekday Helpers
* @summary When is the next Thursday?
*
* @description
* When is the next Thursday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The next Thursday
*
* @example
* // When is the next Thursday after Mar, 22, 2020?
* const result = nextThursday(new Date(2020, 2, 22))
* //=> Thur Mar 26 2020 00:00:00
*/
function nextThursday$1(date, options) {
  return nextDay$1(date, 4, options);
}
//#endregion
//#region dist/date-fns/fp/nextThursday.js
var _nextThursday = convertToFP(nextThursday$1, 1);
//#endregion
//#region dist/date-fns/fp/nextThursdayWithOptions.js
var _nextThursdayWithOptions = convertToFP(nextThursday$1, 2);
//#endregion
//#region dist/date-fns/nextTuesday.js
/**
* The {@link nextTuesday} function options.
*/
/**
* @name nextTuesday
* @category Weekday Helpers
* @summary When is the next Tuesday?
*
* @description
* When is the next Tuesday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The next Tuesday
*
* @example
* // When is the next Tuesday after Mar, 22, 2020?
* const result = nextTuesday(new Date(2020, 2, 22))
* //=> Tue Mar 24 2020 00:00:00
*/
function nextTuesday$1(date, options) {
  return nextDay$1(date, 2, options);
}
//#endregion
//#region dist/date-fns/fp/nextTuesday.js
var _nextTuesday = convertToFP(nextTuesday$1, 1);
//#endregion
//#region dist/date-fns/fp/nextTuesdayWithOptions.js
var _nextTuesdayWithOptions = convertToFP(nextTuesday$1, 2);
//#endregion
//#region dist/date-fns/nextWednesday.js
/**
* The {@link nextWednesday} function options.
*/
/**
* @name nextWednesday
* @category Weekday Helpers
* @summary When is the next Wednesday?
*
* @description
* When is the next Wednesday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The next Wednesday
*
* @example
* // When is the next Wednesday after Mar, 22, 2020?
* const result = nextWednesday(new Date(2020, 2, 22))
* //=> Wed Mar 25 2020 00:00:00
*/
function nextWednesday$1(date, options) {
  return nextDay$1(date, 3, options);
}
//#endregion
//#region dist/date-fns/fp/nextWednesday.js
var _nextWednesday = convertToFP(nextWednesday$1, 1);
//#endregion
//#region dist/date-fns/fp/nextWednesdayWithOptions.js
var _nextWednesdayWithOptions = convertToFP(nextWednesday$1, 2);
//#endregion
//#region dist/date-fns/fp/parse.js
var _parse = convertToFP(parse$1, 3);
//#endregion
//#region dist/date-fns/parseISO.js
/**
* The {@link parseISO} function options.
*/
/**
* @name parseISO
* @category Common Helpers
* @summary Parse ISO string
*
* @description
* Parse the given string in ISO 8601 format and return an instance of Date.
*
* Function accepts complete ISO 8601 formats as well as partial implementations.
* ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
*
* If the argument isn't a string, the function cannot parse the string or
* the values are invalid, it returns Invalid Date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param argument - The value to convert
* @param options - An object with options
*
* @returns The parsed date in the local time zone
*
* @example
* // Convert string '2014-02-11T11:30:30' to date:
* const result = parseISO('2014-02-11T11:30:30')
* //=> Tue Feb 11 2014 11:30:30
*
* @example
* // Convert string '+02014101' to date,
* // if the additional number of digits in the extended year format is 1:
* const result = parseISO('+02014101', { additionalDigits: 1 })
* //=> Fri Apr 11 2014 00:00:00
*/
function parseISO$1(argument, options) {var _options$additionalDi;
  var invalidDate = function invalidDate() {return constructFrom$1(options === null || options === void 0 ? void 0 : options.in, NaN);};
  var additionalDigits = (_options$additionalDi = options === null || options === void 0 ? void 0 : options.additionalDigits) !== null && _options$additionalDi !== void 0 ? _options$additionalDi : 2;
  var dateStrings = splitDateString(argument);
  var date;
  if (dateStrings.date) {
    var parseYearResult = parseYear(dateStrings.date, additionalDigits);
    date = parseDate(parseYearResult.restDateString, parseYearResult.year);
  }
  if (!date || isNaN(+date)) return invalidDate();
  var timestamp = +date;
  var time = 0;
  var offset;
  if (dateStrings.time) {
    time = parseTime(dateStrings.time);
    if (isNaN(time)) return invalidDate();
  }
  if (dateStrings.timezone) {
    offset = parseTimezone(dateStrings.timezone);
    if (isNaN(offset)) return invalidDate();
  } else {
    var tmpDate = new Date(timestamp + time);
    var result = toDate$1(0, options === null || options === void 0 ? void 0 : options.in);
    result.setFullYear(tmpDate.getUTCFullYear(), tmpDate.getUTCMonth(), tmpDate.getUTCDate());
    result.setHours(tmpDate.getUTCHours(), tmpDate.getUTCMinutes(), tmpDate.getUTCSeconds(), tmpDate.getUTCMilliseconds());
    return result;
  }
  return toDate$1(timestamp + time + offset, options === null || options === void 0 ? void 0 : options.in);
}
var patterns = {
  dateTimeDelimiter: /[T ]/,
  timeZoneDelimiter: /[Z ]/i,
  timezone: /([Z+-].*)$/
};
var dateRegex = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/;
var timeRegex = /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/;
var timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/;
function splitDateString(dateString) {
  var dateStrings = {};
  var array = dateString.split(patterns.dateTimeDelimiter);
  var timeString;
  if (array.length > 2) return dateStrings;
  if (/:/.test(array[0])) timeString = array[0];else
  {
    dateStrings.date = array[0];
    timeString = array[1];
    if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
      dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0];
      timeString = dateString.substr(dateStrings.date.length, dateString.length);
    }
  }
  if (timeString) {
    var token = patterns.timezone.exec(timeString);
    if (token) {
      dateStrings.time = timeString.replace(token[1], "");
      dateStrings.timezone = token[1];
    } else dateStrings.time = timeString;
  }
  return dateStrings;
}
function parseYear(dateString, additionalDigits) {
  var regex = new RegExp("^(?:(\\d{4}|[+-]\\d{" + (4 + additionalDigits) + "})|(\\d{2}|[+-]\\d{" + (2 + additionalDigits) + "})$)");
  var captures = dateString.match(regex);
  if (!captures) return {
    year: NaN,
    restDateString: ""
  };
  var year = captures[1] ? parseInt(captures[1]) : null;
  var century = captures[2] ? parseInt(captures[2]) : null;
  return {
    year: century === null ? year : century * 100,
    restDateString: dateString.slice((captures[1] || captures[2]).length)
  };
}
function parseDate(dateString, year) {
  if (year === null) return /* @__PURE__ */new Date(NaN);
  var captures = dateString.match(dateRegex);
  if (!captures) return /* @__PURE__ */new Date(NaN);
  var isWeekDate = !!captures[4];
  var dayOfYear = parseDateUnit(captures[1]);
  var month = parseDateUnit(captures[2]) - 1;
  var day = parseDateUnit(captures[3]);
  var week = parseDateUnit(captures[4]);
  var dayOfWeek = parseDateUnit(captures[5]) - 1;
  if (isWeekDate) {
    if (!validateWeekDate(year, week, dayOfWeek)) return /* @__PURE__ */new Date(NaN);
    return dayOfISOWeekYear(year, week, dayOfWeek);
  } else {
    var date = /* @__PURE__ */new Date(0);
    if (!validateDate(year, month, day) || !validateDayOfYearDate(year, dayOfYear)) return /* @__PURE__ */new Date(NaN);
    date.setUTCFullYear(year, month, Math.max(dayOfYear, day));
    return date;
  }
}
function parseDateUnit(value) {
  return value ? parseInt(value) : 1;
}
function parseTime(timeString) {
  var captures = timeString.match(timeRegex);
  if (!captures) return NaN;
  var hours = parseTimeUnit(captures[1]);
  var minutes = parseTimeUnit(captures[2]);
  var seconds = parseTimeUnit(captures[3]);
  if (!validateTime(hours, minutes, seconds)) return NaN;
  return hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * 1e3;
}
function parseTimeUnit(value) {
  return value && parseFloat(value.replace(",", ".")) || 0;
}
function parseTimezone(timezoneString) {
  if (timezoneString === "Z") return 0;
  var captures = timezoneString.match(timezoneRegex);
  if (!captures) return 0;
  var sign = captures[1] === "+" ? -1 : 1;
  var hours = parseInt(captures[2]);
  var minutes = captures[3] && parseInt(captures[3]) || 0;
  if (!validateTimezone(hours, minutes)) return NaN;
  return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute);
}
function dayOfISOWeekYear(isoWeekYear, week, day) {
  var date = /* @__PURE__ */new Date(0);
  date.setUTCFullYear(isoWeekYear, 0, 4);
  var fourthOfJanuaryDay = date.getUTCDay() || 7;
  var diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
var daysInMonths = [
31,
null,
31,
30,
31,
30,
31,
31,
30,
31,
30,
31];

function isLeapYearIndex(year) {
  return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
}
function validateDate(year, month, date) {
  return month >= 0 && month <= 11 && date >= 1 && date <= (daysInMonths[month] || (isLeapYearIndex(year) ? 29 : 28));
}
function validateDayOfYearDate(year, dayOfYear) {
  return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex(year) ? 366 : 365);
}
function validateWeekDate(_year, week, day) {
  return week >= 1 && week <= 53 && day >= 0 && day <= 6;
}
function validateTime(hours, minutes, seconds) {
  if (hours === 24) return minutes === 0 && seconds === 0;
  return seconds >= 0 && seconds < 60 && minutes >= 0 && minutes < 60 && hours >= 0 && hours < 25;
}
function validateTimezone(_hours, minutes) {
  return minutes >= 0 && minutes <= 59;
}
//#endregion
//#region dist/date-fns/fp/parseISO.js
var _parseISO = convertToFP(parseISO$1, 1);
//#endregion
//#region dist/date-fns/fp/parseISOWithOptions.js
var _parseISOWithOptions = convertToFP(parseISO$1, 2);
//#endregion
//#region dist/date-fns/parseJSON.js
/**
* The {@link parseJSON} function options.
*/
/**
* Converts a complete ISO date string in UTC time, the typical format for transmitting
* a date in JSON, to a JavaScript `Date` instance.
*
* This is a minimal implementation for converting dates retrieved from a JSON API to
* a `Date` instance which can be used with other functions in the `date-fns` library.
* The following formats are supported:
*
* - `2000-03-15T05:20:10.123Z`: The output of `.toISOString()` and `JSON.stringify(new Date())`
* - `2000-03-15T05:20:10Z`: Without milliseconds
* - `2000-03-15T05:20:10+00:00`: With a zero offset, the default JSON encoded format in some other languages
* - `2000-03-15T05:20:10+05:45`: With a positive or negative offset, the default JSON encoded format in some other languages
* - `2000-03-15T05:20:10+0000`: With a zero offset without a colon
* - `2000-03-15T05:20:10`: Without a trailing 'Z' symbol
* - `2000-03-15T05:20:10.1234567`: Up to 7 digits in milliseconds field. Only first 3 are taken into account since JS does not allow fractional milliseconds
* - `2000-03-15 05:20:10`: With a space instead of a 'T' separator for APIs returning a SQL date without reformatting
*
* For convenience and ease of use these other input types are also supported
* via [toDate](https://date-fns.org/docs/toDate):
*
* - A `Date` instance will be cloned
* - A `number` will be treated as a timestamp
*
* Any other input type or invalid date strings will return an `Invalid Date`.
*
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param dateStr - A fully formed ISO8601 date string to convert
* @param options - An object with options
*
* @returns The parsed date in the local time zone
*/
function parseJSON$1(dateStr, options) {
  var parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?/);
  if (!parts) return toDate$1(NaN, options === null || options === void 0 ? void 0 : options.in);
  return toDate$1(Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4] - (+parts[9] || 0) * (parts[8] == "-" ? -1 : 1), +parts[5] - (+parts[10] || 0) * (parts[8] == "-" ? -1 : 1), +parts[6], +((parts[7] || "0") + "00").substring(0, 3)), options === null || options === void 0 ? void 0 : options.in);
}
//#endregion
//#region dist/date-fns/fp/parseJSON.js
var _parseJSON = convertToFP(parseJSON$1, 1);
//#endregion
//#region dist/date-fns/fp/parseJSONWithOptions.js
var _parseJSONWithOptions = convertToFP(parseJSON$1, 2);
//#endregion
//#region dist/date-fns/fp/parseWithOptions.js
var _parseWithOptions = convertToFP(parse$1, 4);
//#endregion
//#region dist/date-fns/subDays.js
/**
* The {@link subDays} function options.
*/
/**
* @name subDays
* @category Day Helpers
* @summary Subtract the specified number of days from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of days to be subtracted.
* @param options - An object with options
*
* @returns The new date with the days subtracted
*
* @example
* // Subtract 10 days from 1 September 2014:
* const result = subDays(new Date(2014, 8, 1), 10)
* //=> Fri Aug 22 2014 00:00:00
*/
function subDays$1(date, amount, options) {
  return addDays$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/previousDay.js
/**
* The {@link previousDay} function options.
*/
/**
* @name previousDay
* @category Weekday Helpers
* @summary When is the previous day of the week?
*
* @description
* When is the previous day of the week? 0-6 the day of the week, 0 represents Sunday.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to check
* @param day - The day of the week
* @param options - An object with options
*
* @returns The date is the previous day of week
*
* @example
* // When is the previous Monday before Mar, 20, 2020?
* const result = previousDay(new Date(2020, 2, 20), 1)
* //=> Mon Mar 16 2020 00:00:00
*
* @example
* // When is the previous Tuesday before Mar, 21, 2020?
* const result = previousDay(new Date(2020, 2, 21), 2)
* //=> Tue Mar 17 2020 00:00:00
*/
function previousDay$1(date, day, options) {
  var delta = getDay$1(date, options) - day;
  if (delta <= 0) delta += 7;
  return subDays$1(date, delta, options);
}
//#endregion
//#region dist/date-fns/fp/previousDay.js
var _previousDay = convertToFP(previousDay$1, 2);
//#endregion
//#region dist/date-fns/fp/previousDayWithOptions.js
var _previousDayWithOptions = convertToFP(previousDay$1, 3);
//#endregion
//#region dist/date-fns/previousFriday.js
/**
* The {@link previousFriday} function options.
*/
/**
* @name previousFriday
* @category Weekday Helpers
* @summary When is the previous Friday?
*
* @description
* When is the previous Friday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [UTCDate](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - The options
*
* @returns The previous Friday
*
* @example
* // When is the previous Friday before Jun, 19, 2021?
* const result = previousFriday(new Date(2021, 5, 19))
* //=> Fri June 18 2021 00:00:00
*/
function previousFriday$1(date, options) {
  return previousDay$1(date, 5, options);
}
//#endregion
//#region dist/date-fns/fp/previousFriday.js
var _previousFriday = convertToFP(previousFriday$1, 1);
//#endregion
//#region dist/date-fns/fp/previousFridayWithOptions.js
var _previousFridayWithOptions = convertToFP(previousFriday$1, 2);
//#endregion
//#region dist/date-fns/previousMonday.js
/**
* The {@link previousMonday} function options.
*/
/**
* @name previousMonday
* @category Weekday Helpers
* @summary When is the previous Monday?
*
* @description
* When is the previous Monday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The previous Monday
*
* @example
* // When is the previous Monday before Jun, 18, 2021?
* const result = previousMonday(new Date(2021, 5, 18))
* //=> Mon June 14 2021 00:00:00
*/
function previousMonday$1(date, options) {
  return previousDay$1(date, 1, options);
}
//#endregion
//#region dist/date-fns/fp/previousMonday.js
var _previousMonday = convertToFP(previousMonday$1, 1);
//#endregion
//#region dist/date-fns/fp/previousMondayWithOptions.js
var _previousMondayWithOptions = convertToFP(previousMonday$1, 2);
//#endregion
//#region dist/date-fns/previousSaturday.js
/**
* The {@link previousSaturday} function options.
*/
/**
* @name previousSaturday
* @category Weekday Helpers
* @summary When is the previous Saturday?
*
* @description
* When is the previous Saturday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - The options
*
* @returns The previous Saturday
*
* @example
* // When is the previous Saturday before Jun, 20, 2021?
* const result = previousSaturday(new Date(2021, 5, 20))
* //=> Sat June 19 2021 00:00:00
*/
function previousSaturday$1(date, options) {
  return previousDay$1(date, 6, options);
}
//#endregion
//#region dist/date-fns/fp/previousSaturday.js
var _previousSaturday = convertToFP(previousSaturday$1, 1);
//#endregion
//#region dist/date-fns/fp/previousSaturdayWithOptions.js
var _previousSaturdayWithOptions = convertToFP(previousSaturday$1, 2);
//#endregion
//#region dist/date-fns/previousSunday.js
/**
* The {@link previousSunday} function options.
*/
/**
* @name previousSunday
* @category Weekday Helpers
* @summary When is the previous Sunday?
*
* @description
* When is the previous Sunday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - The options
*
* @returns The previous Sunday
*
* @example
* // When is the previous Sunday before Jun, 21, 2021?
* const result = previousSunday(new Date(2021, 5, 21))
* //=> Sun June 20 2021 00:00:00
*/
function previousSunday$1(date, options) {
  return previousDay$1(date, 0, options);
}
//#endregion
//#region dist/date-fns/fp/previousSunday.js
var _previousSunday = convertToFP(previousSunday$1, 1);
//#endregion
//#region dist/date-fns/fp/previousSundayWithOptions.js
var _previousSundayWithOptions = convertToFP(previousSunday$1, 2);
//#endregion
//#region dist/date-fns/previousThursday.js
/**
* The {@link previousThursday} function options.
*/
/**
* @name previousThursday
* @category Weekday Helpers
* @summary When is the previous Thursday?
*
* @description
* When is the previous Thursday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The previous Thursday
*
* @example
* // When is the previous Thursday before Jun, 18, 2021?
* const result = previousThursday(new Date(2021, 5, 18))
* //=> Thu June 17 2021 00:00:00
*/
function previousThursday$1(date, options) {
  return previousDay$1(date, 4, options);
}
//#endregion
//#region dist/date-fns/fp/previousThursday.js
var _previousThursday = convertToFP(previousThursday$1, 1);
//#endregion
//#region dist/date-fns/fp/previousThursdayWithOptions.js
var _previousThursdayWithOptions = convertToFP(previousThursday$1, 2);
//#endregion
//#region dist/date-fns/previousTuesday.js
/**
* The {@link previousTuesday} function options.
*/
/**
* @name previousTuesday
* @category Weekday Helpers
* @summary When is the previous Tuesday?
*
* @description
* When is the previous Tuesday?
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The previous Tuesday
*
* @example
* // When is the previous Tuesday before Jun, 18, 2021?
* const result = previousTuesday(new Date(2021, 5, 18))
* //=> Tue June 15 2021 00:00:00
*/
function previousTuesday$1(date, options) {
  return previousDay$1(date, 2, options);
}
//#endregion
//#region dist/date-fns/fp/previousTuesday.js
var _previousTuesday = convertToFP(previousTuesday$1, 1);
//#endregion
//#region dist/date-fns/fp/previousTuesdayWithOptions.js
var _previousTuesdayWithOptions = convertToFP(previousTuesday$1, 2);
//#endregion
//#region dist/date-fns/previousWednesday.js
/**
* The {@link previousWednesday} function options.
*/
/**
* @name previousWednesday
* @category Weekday Helpers
* @summary When is the previous Wednesday?
*
* @description
* When is the previous Wednesday?
*
* @typeParam DateType - The Date type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [UTCDate](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to start counting from
* @param options - An object with options
*
* @returns The previous Wednesday
*
* @example
* // When is the previous Wednesday before Jun, 18, 2021?
* const result = previousWednesday(new Date(2021, 5, 18))
* //=> Wed June 16 2021 00:00:00
*/
function previousWednesday$1(date, options) {
  return previousDay$1(date, 3, options);
}
//#endregion
//#region dist/date-fns/fp/previousWednesday.js
var _previousWednesday = convertToFP(previousWednesday$1, 1);
//#endregion
//#region dist/date-fns/fp/previousWednesdayWithOptions.js
var _previousWednesdayWithOptions = convertToFP(previousWednesday$1, 2);
//#endregion
//#region dist/date-fns/quartersToMonths.js
/**
* @name quartersToMonths
* @category Conversion Helpers
* @summary Convert number of quarters to months.
*
* @description
* Convert a number of quarters to a full number of months.
*
* @param quarters - The number of quarters to be converted
*
* @returns The number of quarters converted in months
*
* @example
* // Convert 2 quarters to months
* const result = quartersToMonths(2)
* //=> 6
*/
function quartersToMonths$1(quarters) {
  return Math.trunc(quarters * 3);
}
//#endregion
//#region dist/date-fns/fp/quartersToMonths.js
var _quartersToMonths = convertToFP(quartersToMonths$1, 1);
//#endregion
//#region dist/date-fns/quartersToYears.js
/**
* @name quartersToYears
* @category Conversion Helpers
* @summary Convert number of quarters to years.
*
* @description
* Convert a number of quarters to a full number of years.
*
* @param quarters - The number of quarters to be converted
*
* @returns The number of quarters converted in years
*
* @example
* // Convert 8 quarters to years
* const result = quartersToYears(8)
* //=> 2
*
* @example
* // It uses floor rounding:
* const result = quartersToYears(11)
* //=> 2
*/
function quartersToYears$1(quarters) {
  var years = quarters / 4;
  return Math.trunc(years);
}
//#endregion
//#region dist/date-fns/fp/quartersToYears.js
var _quartersToYears = convertToFP(quartersToYears$1, 1);
//#endregion
//#region dist/date-fns/roundToNearestHours.js
/**
* The {@link roundToNearestHours} function options.
*/
/**
* @name roundToNearestHours
* @category Hour Helpers
* @summary Rounds the given date to the nearest hour
*
* @description
* Rounds the given date to the nearest hour (or number of hours).
* Rounds up when the given date is exactly between the nearest round hours.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to round
* @param options - An object with options.
*
* @returns The new date rounded to the closest hour
*
* @example
* // Round 10 July 2014 12:34:56 to nearest hour:
* const result = roundToNearestHours(new Date(2014, 6, 10, 12, 34, 56))
* //=> Thu Jul 10 2014 13:00:00
*
* @example
* // Round 10 July 2014 12:34:56 to nearest half hour:
* const result = roundToNearestHours(new Date(2014, 6, 10, 12, 34, 56), { nearestTo: 6 })
* //=> Thu Jul 10 2014 12:00:00
*
* @example
* // Round 10 July 2014 12:34:56 to nearest half hour:
* const result = roundToNearestHours(new Date(2014, 6, 10, 12, 34, 56), { nearestTo: 8 })
* //=> Thu Jul 10 2014 16:00:00
*
* @example
* // Floor (rounds down) 10 July 2014 12:34:56 to nearest hour:
* const result = roundToNearestHours(new Date(2014, 6, 10, 1, 23, 45), { roundingMethod: 'ceil' })
* //=> Thu Jul 10 2014 02:00:00
*
* @example
* // Ceil (rounds up) 10 July 2014 12:34:56 to nearest quarter hour:
* const result = roundToNearestHours(new Date(2014, 6, 10, 12, 34, 56), { roundingMethod: 'floor', nearestTo: 8 })
* //=> Thu Jul 10 2014 08:00:00
*/
function roundToNearestHours$1(date, options) {var _options$nearestTo, _options$roundingMeth2;
  var nearestTo = (_options$nearestTo = options === null || options === void 0 ? void 0 : options.nearestTo) !== null && _options$nearestTo !== void 0 ? _options$nearestTo : 1;
  if (nearestTo < 1 || nearestTo > 12) return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, NaN);
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var fractionalMinutes = date_.getMinutes() / 60;
  var fractionalSeconds = date_.getSeconds() / 60 / 60;
  var fractionalMilliseconds = date_.getMilliseconds() / 1e3 / 60 / 60;
  var hours = date_.getHours() + fractionalMinutes + fractionalSeconds + fractionalMilliseconds;
  var roundedHours = getRoundingMethod((_options$roundingMeth2 = options === null || options === void 0 ? void 0 : options.roundingMethod) !== null && _options$roundingMeth2 !== void 0 ? _options$roundingMeth2 : "round")(hours / nearestTo) * nearestTo;
  date_.setHours(roundedHours, 0, 0, 0);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/roundToNearestHours.js
var _roundToNearestHours = convertToFP(roundToNearestHours$1, 1);
//#endregion
//#region dist/date-fns/fp/roundToNearestHoursWithOptions.js
var _roundToNearestHoursWithOptions = convertToFP(roundToNearestHours$1, 2);
//#endregion
//#region dist/date-fns/roundToNearestMinutes.js
/**
* The {@link roundToNearestMinutes} function options.
*/
/**
* @name roundToNearestMinutes
* @category Minute Helpers
* @summary Rounds the given date to the nearest minute
*
* @description
* Rounds the given date to the nearest minute (or number of minutes).
* Rounds up when the given date is exactly between the nearest round minutes.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to round
* @param options - An object with options.
*
* @returns The new date rounded to the closest minute
*
* @example
* // Round 10 July 2014 12:12:34 to nearest minute:
* const result = roundToNearestMinutes(new Date(2014, 6, 10, 12, 12, 34))
* //=> Thu Jul 10 2014 12:13:00
*
* @example
* // Round 10 July 2014 12:12:34 to nearest quarter hour:
* const result = roundToNearestMinutes(new Date(2014, 6, 10, 12, 12, 34), { nearestTo: 15 })
* //=> Thu Jul 10 2014 12:15:00
*
* @example
* // Floor (rounds down) 10 July 2014 12:12:34 to nearest minute:
* const result = roundToNearestMinutes(new Date(2014, 6, 10, 12, 12, 34), { roundingMethod: 'floor' })
* //=> Thu Jul 10 2014 12:12:00
*
* @example
* // Ceil (rounds up) 10 July 2014 12:12:34 to nearest half hour:
* const result = roundToNearestMinutes(new Date(2014, 6, 10, 12, 12, 34), { roundingMethod: 'ceil', nearestTo: 30 })
* //=> Thu Jul 10 2014 12:30:00
*/
function roundToNearestMinutes$1(date, options) {var _options$nearestTo2, _options$roundingMeth3;
  var nearestTo = (_options$nearestTo2 = options === null || options === void 0 ? void 0 : options.nearestTo) !== null && _options$nearestTo2 !== void 0 ? _options$nearestTo2 : 1;
  if (nearestTo < 1 || nearestTo > 30) return constructFrom$1(date, NaN);
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var fractionalSeconds = date_.getSeconds() / 60;
  var fractionalMilliseconds = date_.getMilliseconds() / 1e3 / 60;
  var minutes = date_.getMinutes() + fractionalSeconds + fractionalMilliseconds;
  var roundedMinutes = getRoundingMethod((_options$roundingMeth3 = options === null || options === void 0 ? void 0 : options.roundingMethod) !== null && _options$roundingMeth3 !== void 0 ? _options$roundingMeth3 : "round")(minutes / nearestTo) * nearestTo;
  date_.setMinutes(roundedMinutes, 0, 0);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/roundToNearestMinutes.js
var _roundToNearestMinutes = convertToFP(roundToNearestMinutes$1, 1);
//#endregion
//#region dist/date-fns/fp/roundToNearestMinutesWithOptions.js
var _roundToNearestMinutesWithOptions = convertToFP(roundToNearestMinutes$1, 2);
//#endregion
//#region dist/date-fns/secondsToHours.js
/**
* @name secondsToHours
* @category Conversion Helpers
* @summary Convert seconds to hours.
*
* @description
* Convert a number of seconds to a full number of hours.
*
* @param seconds - The number of seconds to be converted
*
* @returns The number of seconds converted in hours
*
* @example
* // Convert 7200 seconds into hours
* const result = secondsToHours(7200)
* //=> 2
*
* @example
* // It uses floor rounding:
* const result = secondsToHours(7199)
* //=> 1
*/
function secondsToHours$1(seconds) {
  var hours = seconds / secondsInHour;
  return Math.trunc(hours);
}
//#endregion
//#region dist/date-fns/fp/secondsToHours.js
var _secondsToHours = convertToFP(secondsToHours$1, 1);
//#endregion
//#region dist/date-fns/secondsToMilliseconds.js
/**
* @name secondsToMilliseconds
* @category Conversion Helpers
* @summary Convert seconds to milliseconds.
*
* @description
* Convert a number of seconds to a full number of milliseconds.
*
* @param seconds - The number of seconds to be converted
*
* @returns The number of seconds converted in milliseconds
*
* @example
* // Convert 2 seconds into milliseconds
* const result = secondsToMilliseconds(2)
* //=> 2000
*/
function secondsToMilliseconds$1(seconds) {
  return seconds * millisecondsInSecond;
}
//#endregion
//#region dist/date-fns/fp/secondsToMilliseconds.js
var _secondsToMilliseconds = convertToFP(secondsToMilliseconds$1, 1);
//#endregion
//#region dist/date-fns/secondsToMinutes.js
/**
* @name secondsToMinutes
* @category Conversion Helpers
* @summary Convert seconds to minutes.
*
* @description
* Convert a number of seconds to a full number of minutes.
*
* @param seconds - The number of seconds to be converted
*
* @returns The number of seconds converted in minutes
*
* @example
* // Convert 120 seconds into minutes
* const result = secondsToMinutes(120)
* //=> 2
*
* @example
* // It uses floor rounding:
* const result = secondsToMinutes(119)
* //=> 1
*/
function secondsToMinutes$1(seconds) {
  var minutes = seconds / 60;
  return Math.trunc(minutes);
}
//#endregion
//#region dist/date-fns/fp/secondsToMinutes.js
var _secondsToMinutes = convertToFP(secondsToMinutes$1, 1);
//#endregion
//#region dist/date-fns/setMonth.js
/**
* The {@link setMonth} function options.
*/
/**
* @name setMonth
* @category Month Helpers
* @summary Set the month to the given date.
*
* @description
* Set the month to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param month - The month index to set (0-11)
* @param options - The options
*
* @returns The new date with the month set
*
* @example
* // Set February to 1 September 2014:
* const result = setMonth(new Date(2014, 8, 1), 1)
* //=> Sat Feb 01 2014 00:00:00
*/
function setMonth$1(date, month, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  var day = _date.getDate();
  var midMonth = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  midMonth.setFullYear(year, month, 15);
  midMonth.setHours(0, 0, 0, 0);
  var daysInMonth = getDaysInMonth$1(midMonth);
  _date.setMonth(month, Math.min(day, daysInMonth));
  return _date;
}
//#endregion
//#region dist/date-fns/set.js
/**
* The {@link set} function options.
*/
/**
* @name set
* @category Common Helpers
* @summary Set date values to a given date.
*
* @description
* Set date values to a given date.
*
* Sets time values to date from object `values`.
* A value is not set if it is undefined or null or doesn't exist in `values`.
*
* Note about bundle size: `set` does not internally use `setX` functions from date-fns but instead opts
* to use native `Date#setX` methods. If you use this function, you may not want to include the
* other `setX` functions that date-fns provides if you are concerned about the bundle size.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param values - The date values to be set
* @param options - The options
*
* @returns The new date with options set
*
* @example
* // Transform 1 September 2014 into 20 October 2015 in a single line:
* const result = set(new Date(2014, 8, 20), { year: 2015, month: 9, date: 20 })
* //=> Tue Oct 20 2015 00:00:00
*
* @example
* // Set 12 PM to 1 September 2014 01:23:45 to 1 September 2014 12:00:00:
* const result = set(new Date(2014, 8, 1, 1, 23, 45), { hours: 12 })
* //=> Mon Sep 01 2014 12:23:45
*/
function set$1(date, values, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (isNaN(+_date)) return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, NaN);
  if (values.year != null) _date.setFullYear(values.year);
  if (values.month != null) _date = setMonth$1(_date, values.month);
  if (values.date != null) _date.setDate(values.date);
  if (values.hours != null) _date.setHours(values.hours);
  if (values.minutes != null) _date.setMinutes(values.minutes);
  if (values.seconds != null) _date.setSeconds(values.seconds);
  if (values.milliseconds != null) _date.setMilliseconds(values.milliseconds);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/set.js
var _set = convertToFP(set$1, 2);
//#endregion
//#region dist/date-fns/setDate.js
/**
* The {@link setDate} function options.
*/
/**
* @name setDate
* @category Day Helpers
* @summary Set the day of the month to the given date.
*
* @description
* Set the day of the month to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows using extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param dayOfMonth - The day of the month of the new date
* @param options - The options
*
* @returns The new date with the day of the month set
*
* @example
* // Set the 30th day of the month to 1 September 2014:
* const result = setDate(new Date(2014, 8, 1), 30)
* //=> Tue Sep 30 2014 00:00:00
*/
function setDate$1(date, dayOfMonth, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setDate(dayOfMonth);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/setDate.js
var _setDate = convertToFP(setDate$1, 2);
//#endregion
//#region dist/date-fns/fp/setDateWithOptions.js
var _setDateWithOptions = convertToFP(setDate$1, 3);
//#endregion
//#region dist/date-fns/fp/setDay.js
var _setDay = convertToFP(setDay$1, 2);
//#endregion
//#region dist/date-fns/setDayOfYear.js
/**
* The {@link setDayOfYear} function options.
*/
/**
* @name setDayOfYear
* @category Day Helpers
* @summary Set the day of the year to the given date.
*
* @description
* Set the day of the year to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param dayOfYear - The day of the year of the new date
* @param options - An object with options
*
* @returns The new date with the day of the year set
*
* @example
* // Set the 2nd day of the year to 2 July 2014:
* const result = setDayOfYear(new Date(2014, 6, 2), 2)
* //=> Thu Jan 02 2014 00:00:00
*/
function setDayOfYear$1(date, dayOfYear, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  date_.setMonth(0);
  date_.setDate(dayOfYear);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/setDayOfYear.js
var _setDayOfYear = convertToFP(setDayOfYear$1, 2);
//#endregion
//#region dist/date-fns/fp/setDayOfYearWithOptions.js
var _setDayOfYearWithOptions = convertToFP(setDayOfYear$1, 3);
//#endregion
//#region dist/date-fns/fp/setDayWithOptions.js
var _setDayWithOptions = convertToFP(setDay$1, 3);
//#endregion
//#region dist/date-fns/setHours.js
/**
* The {@link setHours} function options.
*/
/**
* @name setHours
* @category Hour Helpers
* @summary Set the hours to the given date.
*
* @description
* Set the hours to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param hours - The hours of the new date
* @param options - An object with options
*
* @returns The new date with the hours set
*
* @example
* // Set 4 hours to 1 September 2014 11:30:00:
* const result = setHours(new Date(2014, 8, 1, 11, 30), 4)
* //=> Mon Sep 01 2014 04:30:00
*/
function setHours$1(date, hours, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setHours(hours);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/setHours.js
var _setHours = convertToFP(setHours$1, 2);
//#endregion
//#region dist/date-fns/fp/setHoursWithOptions.js
var _setHoursWithOptions = convertToFP(setHours$1, 3);
//#endregion
//#region dist/date-fns/fp/setISODay.js
var _setISODay = convertToFP(setISODay$1, 2);
//#endregion
//#region dist/date-fns/fp/setISODayWithOptions.js
var _setISODayWithOptions = convertToFP(setISODay$1, 3);
//#endregion
//#region dist/date-fns/fp/setISOWeek.js
var _setISOWeek = convertToFP(setISOWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/setISOWeekWithOptions.js
var _setISOWeekWithOptions = convertToFP(setISOWeek$1, 3);
//#endregion
//#region dist/date-fns/fp/setISOWeekYear.js
var _setISOWeekYear = convertToFP(setISOWeekYear$1, 2);
//#endregion
//#region dist/date-fns/fp/setISOWeekYearWithOptions.js
var _setISOWeekYearWithOptions = convertToFP(setISOWeekYear$1, 3);
//#endregion
//#region dist/date-fns/setMilliseconds.js
/**
* The {@link setMilliseconds} function options.
*/
/**
* @name setMilliseconds
* @category Millisecond Helpers
* @summary Set the milliseconds to the given date.
*
* @description
* Set the milliseconds to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param milliseconds - The milliseconds of the new date
* @param options - The options
*
* @returns The new date with the milliseconds set
*
* @example
* // Set 300 milliseconds to 1 September 2014 11:30:40.500:
* const result = setMilliseconds(new Date(2014, 8, 1, 11, 30, 40, 500), 300)
* //=> Mon Sep 01 2014 11:30:40.300
*/
function setMilliseconds$1(date, milliseconds, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setMilliseconds(milliseconds);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/setMilliseconds.js
var _setMilliseconds = convertToFP(setMilliseconds$1, 2);
//#endregion
//#region dist/date-fns/fp/setMillisecondsWithOptions.js
var _setMillisecondsWithOptions = convertToFP(setMilliseconds$1, 3);
//#endregion
//#region dist/date-fns/setMinutes.js
/**
* The {@link setMinutes} function options.
*/
/**
* @name setMinutes
* @category Minute Helpers
* @summary Set the minutes to the given date.
*
* @description
* Set the minutes to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows using extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, returned from the context function, or inferred from the arguments.
*
* @param date - The date to be changed
* @param minutes - The minutes of the new date
* @param options - An object with options
*
* @returns The new date with the minutes set
*
* @example
* // Set 45 minutes to 1 September 2014 11:30:40:
* const result = setMinutes(new Date(2014, 8, 1, 11, 30, 40), 45)
* //=> Mon Sep 01 2014 11:45:40
*/
function setMinutes$1(date, minutes, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  date_.setMinutes(minutes);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/setMinutes.js
var _setMinutes = convertToFP(setMinutes$1, 2);
//#endregion
//#region dist/date-fns/fp/setMinutesWithOptions.js
var _setMinutesWithOptions = convertToFP(setMinutes$1, 3);
//#endregion
//#region dist/date-fns/fp/setMonth.js
var _setMonth = convertToFP(setMonth$1, 2);
//#endregion
//#region dist/date-fns/fp/setMonthWithOptions.js
var _setMonthWithOptions = convertToFP(setMonth$1, 3);
//#endregion
//#region dist/date-fns/setQuarter.js
/**
* The {@link setQuarter} function options.
*/
/**
* @name setQuarter
* @category Quarter Helpers
* @summary Set the year quarter to the given date.
*
* @description
* Set the year quarter to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param quarter - The quarter of the new date
* @param options - The options
*
* @returns The new date with the quarter set
*
* @example
* // Set the 2nd quarter to 2 July 2014:
* const result = setQuarter(new Date(2014, 6, 2), 2)
* //=> Wed Apr 02 2014 00:00:00
*/
function setQuarter$1(date, quarter, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var diff = quarter - (Math.trunc(date_.getMonth() / 3) + 1);
  return setMonth$1(date_, date_.getMonth() + diff * 3);
}
//#endregion
//#region dist/date-fns/fp/setQuarter.js
var _setQuarter = convertToFP(setQuarter$1, 2);
//#endregion
//#region dist/date-fns/fp/setQuarterWithOptions.js
var _setQuarterWithOptions = convertToFP(setQuarter$1, 3);
//#endregion
//#region dist/date-fns/setSeconds.js
/**
* The {@link setSeconds} function options.
*/
/**
* @name setSeconds
* @category Second Helpers
* @summary Set the seconds to the given date, with context support.
*
* @description
* Set the seconds to the given date, with an optional context for time zone specification.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param seconds - The seconds of the new date
* @param options - An object with options
*
* @returns The new date with the seconds set
*
* @example
* // Set 45 seconds to 1 September 2014 11:30:40:
* const result = setSeconds(new Date(2014, 8, 1, 11, 30, 40), 45)
* //=> Mon Sep 01 2014 11:30:45
*/
function setSeconds$1(date, seconds, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  _date.setSeconds(seconds);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/setSeconds.js
var _setSeconds = convertToFP(setSeconds$1, 2);
//#endregion
//#region dist/date-fns/fp/setSecondsWithOptions.js
var _setSecondsWithOptions = convertToFP(setSeconds$1, 3);
//#endregion
//#region dist/date-fns/fp/setWeek.js
var _setWeek = convertToFP(setWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/setWeekWithOptions.js
var _setWeekWithOptions = convertToFP(setWeek$1, 3);
//#endregion
//#region dist/date-fns/setWeekYear.js
/**
* The {@link setWeekYear} function options.
*/
/**
* @name setWeekYear
* @category Week-Numbering Year Helpers
* @summary Set the local week-numbering year to the given date.
*
* @description
* Set the local week-numbering year to the given date,
* saving the week number and the weekday number.
* The exact calculation depends on the values of
* `options.weekStartsOn` (which is the index of the first day of the week)
* and `options.firstWeekContainsDate` (which is the day of January, which is always in
* the first week of the week-numbering year)
*
* Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param weekYear - The local week-numbering year of the new date
* @param options - An object with options
*
* @returns The new date with the local week-numbering year set
*
* @example
* // Set the local week-numbering year 2004 to 2 January 2010 with default options:
* const result = setWeekYear(new Date(2010, 0, 2), 2004)
* //=> Sat Jan 03 2004 00:00:00
*
* @example
* // Set the local week-numbering year 2004 to 2 January 2010,
* // if Monday is the first day of week
* // and 4 January is always in the first week of the year:
* const result = setWeekYear(new Date(2010, 0, 2), 2004, {
*   weekStartsOn: 1,
*   firstWeekContainsDate: 4
* })
* //=> Sat Jan 01 2005 00:00:00
*/
function setWeekYear$1(date, weekYear, options) {var _ref42, _ref43, _ref44, _options$firstWeekCon5, _options$locale17, _defaultOptions$local11;
  var defaultOptions = getDefaultOptions$1();
  var firstWeekContainsDate = (_ref42 = (_ref43 = (_ref44 = (_options$firstWeekCon5 = options === null || options === void 0 ? void 0 : options.firstWeekContainsDate) !== null && _options$firstWeekCon5 !== void 0 ? _options$firstWeekCon5 : options === null || options === void 0 || (_options$locale17 = options.locale) === null || _options$locale17 === void 0 || (_options$locale17 = _options$locale17.options) === null || _options$locale17 === void 0 ? void 0 : _options$locale17.firstWeekContainsDate) !== null && _ref44 !== void 0 ? _ref44 : defaultOptions.firstWeekContainsDate) !== null && _ref43 !== void 0 ? _ref43 : (_defaultOptions$local11 = defaultOptions.locale) === null || _defaultOptions$local11 === void 0 || (_defaultOptions$local11 = _defaultOptions$local11.options) === null || _defaultOptions$local11 === void 0 ? void 0 : _defaultOptions$local11.firstWeekContainsDate) !== null && _ref42 !== void 0 ? _ref42 : 1;
  var diff = differenceInCalendarDays$1(toDate$1(date, options === null || options === void 0 ? void 0 : options.in), startOfWeekYear$1(date, options), options);
  var firstWeek = constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, 0);
  firstWeek.setFullYear(weekYear, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  var date_ = startOfWeekYear$1(firstWeek, options);
  date_.setDate(date_.getDate() + diff);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/setWeekYear.js
var _setWeekYear = convertToFP(setWeekYear$1, 2);
//#endregion
//#region dist/date-fns/fp/setWeekYearWithOptions.js
var _setWeekYearWithOptions = convertToFP(setWeekYear$1, 3);
//#endregion
//#region dist/date-fns/fp/setWithOptions.js
var _setWithOptions = convertToFP(set$1, 3);
//#endregion
//#region dist/date-fns/setYear.js
/**
* The {@link setYear} function options.
*/
/**
* @name setYear
* @category Year Helpers
* @summary Set the year to the given date.
*
* @description
* Set the year to the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param year - The year of the new date
* @param options - An object with options.
*
* @returns The new date with the year set
*
* @example
* // Set year 2013 to 1 September 2014:
* const result = setYear(new Date(2014, 8, 1), 2013)
* //=> Sun Sep 01 2013 00:00:00
*/
function setYear$1(date, year, options) {
  var date_ = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  if (isNaN(+date_)) return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, NaN);
  date_.setFullYear(year);
  return date_;
}
//#endregion
//#region dist/date-fns/fp/setYear.js
var _setYear = convertToFP(setYear$1, 2);
//#endregion
//#region dist/date-fns/fp/setYearWithOptions.js
var _setYearWithOptions = convertToFP(setYear$1, 3);
//#endregion
//#region dist/date-fns/fp/startOfDay.js
var _startOfDay = convertToFP(startOfDay$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfDayWithOptions.js
var _startOfDayWithOptions = convertToFP(startOfDay$1, 2);
//#endregion
//#region dist/date-fns/startOfDecade.js
/**
* The {@link startOfDecade} options.
*/
/**
* @name startOfDecade
* @category Decade Helpers
* @summary Return the start of a decade for the given date.
*
* @description
* Return the start of a decade for the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of a decade
*
* @example
* // The start of a decade for 21 October 2015 00:00:00:
* const result = startOfDecade(new Date(2015, 9, 21, 00, 00, 00))
* //=> Jan 01 2010 00:00:00
*/
function startOfDecade$1(date, options) {
  var _date = toDate$1(date, options === null || options === void 0 ? void 0 : options.in);
  var year = _date.getFullYear();
  var decade = Math.floor(year / 10) * 10;
  _date.setFullYear(decade, 0, 1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
//#endregion
//#region dist/date-fns/fp/startOfDecade.js
var _startOfDecade = convertToFP(startOfDecade$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfDecadeWithOptions.js
var _startOfDecadeWithOptions = convertToFP(startOfDecade$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfHour.js
var _startOfHour = convertToFP(startOfHour$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfHourWithOptions.js
var _startOfHourWithOptions = convertToFP(startOfHour$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfISOWeek.js
var _startOfISOWeek = convertToFP(startOfISOWeek$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfISOWeekWithOptions.js
var _startOfISOWeekWithOptions = convertToFP(startOfISOWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfISOWeekYear.js
var _startOfISOWeekYear = convertToFP(startOfISOWeekYear$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfISOWeekYearWithOptions.js
var _startOfISOWeekYearWithOptions = convertToFP(startOfISOWeekYear$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfMinute.js
var _startOfMinute = convertToFP(startOfMinute$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfMinuteWithOptions.js
var _startOfMinuteWithOptions = convertToFP(startOfMinute$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfMonth.js
var _startOfMonth = convertToFP(startOfMonth$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfMonthWithOptions.js
var _startOfMonthWithOptions = convertToFP(startOfMonth$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfQuarter.js
var _startOfQuarter = convertToFP(startOfQuarter$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfQuarterWithOptions.js
var _startOfQuarterWithOptions = convertToFP(startOfQuarter$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfSecond.js
var _startOfSecond = convertToFP(startOfSecond$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfSecondWithOptions.js
var _startOfSecondWithOptions = convertToFP(startOfSecond$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfWeek.js
var _startOfWeek = convertToFP(startOfWeek$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfWeekWithOptions.js
var _startOfWeekWithOptions = convertToFP(startOfWeek$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfWeekYear.js
var _startOfWeekYear = convertToFP(startOfWeekYear$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfWeekYearWithOptions.js
var _startOfWeekYearWithOptions = convertToFP(startOfWeekYear$1, 2);
//#endregion
//#region dist/date-fns/fp/startOfYear.js
var _startOfYear = convertToFP(startOfYear$1, 1);
//#endregion
//#region dist/date-fns/fp/startOfYearWithOptions.js
var _startOfYearWithOptions = convertToFP(startOfYear$1, 2);
//#endregion
//#region dist/date-fns/subMonths.js
/**
* The subMonths function options.
*/
/**
* @name subMonths
* @category Month Helpers
* @summary Subtract the specified number of months from the given date.
*
* @description
* Subtract the specified number of months from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of months to be subtracted.
* @param options - An object with options
*
* @returns The new date with the months subtracted
*
* @example
* // Subtract 5 months from 1 February 2015:
* const result = subMonths(new Date(2015, 1, 1), 5)
* //=> Mon Sep 01 2014 00:00:00
*/
function subMonths$1(date, amount, options) {
  return addMonths$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/sub.js
/**
* The {@link sub} function options.
*/
/**
* @name sub
* @category Common Helpers
* @summary Subtract the specified years, months, weeks, days, hours, minutes and seconds from the given date.
*
* @description
* Subtract the specified years, months, weeks, days, hours, minutes and seconds from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param duration - The object with years, months, weeks, days, hours, minutes and seconds to be subtracted
* @param options - An object with options
*
* | Key     | Description                        |
* |---------|------------------------------------|
* | years   | Amount of years to be subtracted   |
* | months  | Amount of months to be subtracted  |
* | weeks   | Amount of weeks to be subtracted   |
* | days    | Amount of days to be subtracted    |
* | hours   | Amount of hours to be subtracted   |
* | minutes | Amount of minutes to be subtracted |
* | seconds | Amount of seconds to be subtracted |
*
* All values default to 0
*
* @returns The new date with the seconds subtracted
*
* @example
* // Subtract the following duration from 15 June 2017 15:29:20
* const result = sub(new Date(2017, 5, 15, 15, 29, 20), {
*   years: 2,
*   months: 9,
*   weeks: 1,
*   days: 7,
*   hours: 5,
*   minutes: 9,
*   seconds: 30
* })
* //=> Mon Sep 1 2014 10:19:50
*/
function sub$1(date, duration, options) {
  var _duration$years3 = duration.years,years = _duration$years3 === void 0 ? 0 : _duration$years3,_duration$months3 = duration.months,months = _duration$months3 === void 0 ? 0 : _duration$months3,_duration$weeks2 = duration.weeks,weeks = _duration$weeks2 === void 0 ? 0 : _duration$weeks2,_duration$days3 = duration.days,days = _duration$days3 === void 0 ? 0 : _duration$days3,_duration$hours3 = duration.hours,hours = _duration$hours3 === void 0 ? 0 : _duration$hours3,_duration$minutes3 = duration.minutes,minutes = _duration$minutes3 === void 0 ? 0 : _duration$minutes3,_duration$seconds3 = duration.seconds,seconds = _duration$seconds3 === void 0 ? 0 : _duration$seconds3;
  var withoutDays = subDays$1(subMonths$1(date, months + years * 12, options), days + weeks * 7, options);
  var msToSub = (seconds + (minutes + hours * 60) * 60) * 1e3;
  return constructFrom$1((options === null || options === void 0 ? void 0 : options.in) || date, +withoutDays - msToSub);
}
//#endregion
//#region dist/date-fns/fp/sub.js
var _sub = convertToFP(sub$1, 2);
//#endregion
//#region dist/date-fns/subBusinessDays.js
/**
* The {@link subBusinessDays} function options.
*/
/**
* @name subBusinessDays
* @category Day Helpers
* @summary Subtract the specified number of business days (mon - fri) from the given date.
*
* @description
* Subtract the specified number of business days (mon - fri) from the given date, ignoring weekends.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of business days to be subtracted.
* @param options - An object with options
*
* @returns The new date with the business days subtracted
*
* @example
* // Subtract 10 business days from 1 September 2014:
* const result = subBusinessDays(new Date(2014, 8, 1), 10)
* //=> Mon Aug 18 2014 00:00:00 (skipped weekend days)
*/
function subBusinessDays$1(date, amount, options) {
  return addBusinessDays$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subBusinessDays.js
var _subBusinessDays = convertToFP(subBusinessDays$1, 2);
//#endregion
//#region dist/date-fns/fp/subBusinessDaysWithOptions.js
var _subBusinessDaysWithOptions = convertToFP(subBusinessDays$1, 3);
//#endregion
//#region dist/date-fns/fp/subDays.js
var _subDays = convertToFP(subDays$1, 2);
//#endregion
//#region dist/date-fns/fp/subDaysWithOptions.js
var _subDaysWithOptions = convertToFP(subDays$1, 3);
//#endregion
//#region dist/date-fns/subHours.js
/**
* The {@link subHours} function options.
*/
/**
* @name subHours
* @category Hour Helpers
* @summary Subtract the specified number of hours from the given date.
*
* @description
* Subtract the specified number of hours from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of hours to be subtracted.
* @param options - The options
*
* @returns The new date with the hours subtracted
*
* @example
* // Subtract 2 hours from 11 July 2014 01:00:00:
* const result = subHours(new Date(2014, 6, 11, 1, 0), 2)
* //=> Thu Jul 10 2014 23:00:00
*/
function subHours$1(date, amount, options) {
  return addHours$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subHours.js
var _subHours = convertToFP(subHours$1, 2);
//#endregion
//#region dist/date-fns/fp/subHoursWithOptions.js
var _subHoursWithOptions = convertToFP(subHours$1, 3);
//#endregion
//#region dist/date-fns/fp/subISOWeekYears.js
var _subISOWeekYears = convertToFP(subISOWeekYears$1, 2);
//#endregion
//#region dist/date-fns/fp/subISOWeekYearsWithOptions.js
var _subISOWeekYearsWithOptions = convertToFP(subISOWeekYears$1, 3);
//#endregion
//#region dist/date-fns/subMilliseconds.js
/**
* The {@link subMilliseconds} function options.
*/
/**
* Subtract the specified number of milliseconds from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of milliseconds to be subtracted.
* @param options - An object with options
*
* @returns The new date with the milliseconds subtracted
*/
function subMilliseconds$1(date, amount, options) {
  return addMilliseconds$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subMilliseconds.js
var _subMilliseconds = convertToFP(subMilliseconds$1, 2);
//#endregion
//#region dist/date-fns/fp/subMillisecondsWithOptions.js
var _subMillisecondsWithOptions = convertToFP(subMilliseconds$1, 3);
//#endregion
//#region dist/date-fns/subMinutes.js
/**
* The {@link subMinutes} function options.
*/
/**
* @name subMinutes
* @category Minute Helpers
* @summary Subtract the specified number of minutes from the given date.
*
* @description
* Subtract the specified number of minutes from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of minutes to be subtracted.
* @param options - An object with options
*
* @returns The new date with the minutes subtracted
*
* @example
* // Subtract 30 minutes from 10 July 2014 12:00:00:
* const result = subMinutes(new Date(2014, 6, 10, 12, 0), 30)
* //=> Thu Jul 10 2014 11:30:00
*/
function subMinutes$1(date, amount, options) {
  return addMinutes$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subMinutes.js
var _subMinutes = convertToFP(subMinutes$1, 2);
//#endregion
//#region dist/date-fns/fp/subMinutesWithOptions.js
var _subMinutesWithOptions = convertToFP(subMinutes$1, 3);
//#endregion
//#region dist/date-fns/fp/subMonths.js
var _subMonths = convertToFP(subMonths$1, 2);
//#endregion
//#region dist/date-fns/fp/subMonthsWithOptions.js
var _subMonthsWithOptions = convertToFP(subMonths$1, 3);
//#endregion
//#region dist/date-fns/subQuarters.js
/**
* The {@link subQuarters} function options.
*/
/**
* @name subQuarters
* @category Quarter Helpers
* @summary Subtract the specified number of year quarters from the given date.
*
* @description
* Subtract the specified number of year quarters from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of quarters to be subtracted.
* @param options - An object with options
*
* @returns The new date with the quarters subtracted
*
* @example
* // Subtract 3 quarters from 1 September 2014:
* const result = subQuarters(new Date(2014, 8, 1), 3)
* //=> Sun Dec 01 2013 00:00:00
*/
function subQuarters$1(date, amount, options) {
  return addQuarters$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subQuarters.js
var _subQuarters = convertToFP(subQuarters$1, 2);
//#endregion
//#region dist/date-fns/fp/subQuartersWithOptions.js
var _subQuartersWithOptions = convertToFP(subQuarters$1, 3);
//#endregion
//#region dist/date-fns/subSeconds.js
/**
* The {@link subSeconds} function options.
*/
/**
* Subtract the specified number of seconds from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of seconds to be subtracted.
* @param options - The options
*
* @returns The new date with the seconds subtracted
*
* @example
* // Subtract 30 seconds from 10 July 2014 12:45:00:
* const result = subSeconds(new Date(2014, 6, 10, 12, 45, 0), 30)
* //=> Thu Jul 10 2014 12:44:30
*/
function subSeconds$1(date, amount, options) {
  return addSeconds$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subSeconds.js
var _subSeconds = convertToFP(subSeconds$1, 2);
//#endregion
//#region dist/date-fns/fp/subSecondsWithOptions.js
var _subSecondsWithOptions = convertToFP(subSeconds$1, 3);
//#endregion
//#region dist/date-fns/subWeeks.js
/**
* The {@link subWeeks} function options.
*/
/**
* @name subWeeks
* @category Week Helpers
* @summary Subtract the specified number of weeks from the given date.
*
* @description
* Subtract the specified number of weeks from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of weeks to be subtracted.
* @param options - An object with options
*
* @returns The new date with the weeks subtracted
*
* @example
* // Subtract 4 weeks from 1 September 2014:
* const result = subWeeks(new Date(2014, 8, 1), 4)
* //=> Mon Aug 04 2014 00:00:00
*/
function subWeeks$1(date, amount, options) {
  return addWeeks$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subWeeks.js
var _subWeeks = convertToFP(subWeeks$1, 2);
//#endregion
//#region dist/date-fns/fp/subWeeksWithOptions.js
var _subWeeksWithOptions = convertToFP(subWeeks$1, 3);
//#endregion
//#region dist/date-fns/fp/subWithOptions.js
var _subWithOptions = convertToFP(sub$1, 3);
//#endregion
//#region dist/date-fns/subYears.js
/**
* The {@link subYears} function options.
*/
/**
* @name subYears
* @category Year Helpers
* @summary Subtract the specified number of years from the given date.
*
* @description
* Subtract the specified number of years from the given date.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The date to be changed
* @param amount - The amount of years to be subtracted.
* @param options - An object with options
*
* @returns The new date with the years subtracted
*
* @example
* // Subtract 5 years from 1 September 2014:
* const result = subYears(new Date(2014, 8, 1), 5)
* //=> Tue Sep 01 2009 00:00:00
*/
function subYears$1(date, amount, options) {
  return addYears$1(date, -amount, options);
}
//#endregion
//#region dist/date-fns/fp/subYears.js
var _subYears = convertToFP(subYears$1, 2);
//#endregion
//#region dist/date-fns/fp/subYearsWithOptions.js
var _subYearsWithOptions = convertToFP(subYears$1, 3);
//#endregion
//#region dist/date-fns/fp/toDate.js
var _toDate = convertToFP(toDate$1, 2);
//#endregion
//#region dist/date-fns/fp/transpose.js
var _transpose = convertToFP(transpose$1, 2);
//#endregion
//#region dist/date-fns/weeksToDays.js
/**
* @name weeksToDays
* @category Conversion Helpers
* @summary Convert weeks to days.
*
* @description
* Convert a number of weeks to a full number of days.
*
* @param weeks - The number of weeks to be converted
*
* @returns The number of weeks converted in days
*
* @example
* // Convert 2 weeks into days
* const result = weeksToDays(2)
* //=> 14
*/
function weeksToDays$1(weeks) {
  return Math.trunc(weeks * 7);
}
//#endregion
//#region dist/date-fns/fp/weeksToDays.js
var _weeksToDays = convertToFP(weeksToDays$1, 1);
//#endregion
//#region dist/date-fns/yearsToDays.js
/**
* @name yearsToDays
* @category Conversion Helpers
* @summary Convert years to days.
*
* @description
* Convert a number of years to a full number of days.
*
* @param years - The number of years to be converted
*
* @returns The number of years converted in days
*
* @example
* // Convert 2 years into days
* const result = yearsToDays(2)
* //=> 730
*/
function yearsToDays$1(years) {
  return Math.trunc(years * daysInYear);
}
//#endregion
//#region dist/date-fns/fp/yearsToDays.js
var _yearsToDays = convertToFP(yearsToDays$1, 1);
//#endregion
//#region dist/date-fns/yearsToMonths.js
/**
* @name yearsToMonths
* @category Conversion Helpers
* @summary Convert years to months.
*
* @description
* Convert a number of years to a full number of months.
*
* @param years - The number of years to be converted
*
* @returns The number of years converted in months
*
* @example
* // Convert 2 years into months
* const result = yearsToMonths(2)
* //=> 24
*/
function yearsToMonths$1(years) {
  return Math.trunc(years * 12);
}
//#endregion
//#region dist/date-fns/fp/yearsToMonths.js
var _yearsToMonths = convertToFP(yearsToMonths$1, 1);
//#endregion
//#region dist/date-fns/yearsToQuarters.js
/**
* @name yearsToQuarters
* @category Conversion Helpers
* @summary Convert years to quarters.
*
* @description
* Convert a number of years to a full number of quarters.
*
* @param years - The number of years to be converted
*
* @returns The number of years converted in quarters
*
* @example
* // Convert 2 years to quarters
* const result = yearsToQuarters(2)
* //=> 8
*/
function yearsToQuarters$1(years) {
  return Math.trunc(years * 4);
}
//#endregion
//#region dist/date-fns/fp/yearsToQuarters.js
var _yearsToQuarters = convertToFP(yearsToQuarters$1, 1);
//#endregion
//#region dist/date-fns/fp.js
var fp_exports = /* @__PURE__ */__exportAll({
  add: function add() {return _add;},
  addBusinessDays: function addBusinessDays() {return _addBusinessDays;},
  addBusinessDaysWithOptions: function addBusinessDaysWithOptions() {return _addBusinessDaysWithOptions;},
  addDays: function addDays() {return _addDays;},
  addDaysWithOptions: function addDaysWithOptions() {return _addDaysWithOptions;},
  addHours: function addHours() {return _addHours;},
  addHoursWithOptions: function addHoursWithOptions() {return _addHoursWithOptions;},
  addISOWeekYears: function addISOWeekYears() {return _addISOWeekYears;},
  addISOWeekYearsWithOptions: function addISOWeekYearsWithOptions() {return _addISOWeekYearsWithOptions;},
  addMilliseconds: function addMilliseconds() {return _addMilliseconds;},
  addMillisecondsWithOptions: function addMillisecondsWithOptions() {return _addMillisecondsWithOptions;},
  addMinutes: function addMinutes() {return _addMinutes;},
  addMinutesWithOptions: function addMinutesWithOptions() {return _addMinutesWithOptions;},
  addMonths: function addMonths() {return _addMonths;},
  addMonthsWithOptions: function addMonthsWithOptions() {return _addMonthsWithOptions;},
  addQuarters: function addQuarters() {return _addQuarters;},
  addQuartersWithOptions: function addQuartersWithOptions() {return _addQuartersWithOptions;},
  addSeconds: function addSeconds() {return _addSeconds;},
  addSecondsWithOptions: function addSecondsWithOptions() {return _addSecondsWithOptions;},
  addWeeks: function addWeeks() {return _addWeeks;},
  addWeeksWithOptions: function addWeeksWithOptions() {return _addWeeksWithOptions;},
  addWithOptions: function addWithOptions() {return _addWithOptions;},
  addYears: function addYears() {return _addYears;},
  addYearsWithOptions: function addYearsWithOptions() {return _addYearsWithOptions;},
  areIntervalsOverlapping: function areIntervalsOverlapping() {return _areIntervalsOverlapping;},
  areIntervalsOverlappingWithOptions: function areIntervalsOverlappingWithOptions() {return _areIntervalsOverlappingWithOptions;},
  clamp: function clamp() {return _clamp;},
  clampWithOptions: function clampWithOptions() {return _clampWithOptions;},
  closestIndexTo: function closestIndexTo() {return _closestIndexTo;},
  closestTo: function closestTo() {return _closestTo;},
  closestToWithOptions: function closestToWithOptions() {return _closestToWithOptions;},
  compareAsc: function compareAsc() {return _compareAsc;},
  compareDesc: function compareDesc() {return _compareDesc;},
  constructFrom: function constructFrom() {return _constructFrom;},
  daysToWeeks: function daysToWeeks() {return _daysToWeeks;},
  differenceInBusinessDays: function differenceInBusinessDays() {return _differenceInBusinessDays;},
  differenceInBusinessDaysWithOptions: function differenceInBusinessDaysWithOptions() {return _differenceInBusinessDaysWithOptions;},
  differenceInCalendarDays: function differenceInCalendarDays() {return _differenceInCalendarDays;},
  differenceInCalendarDaysWithOptions: function differenceInCalendarDaysWithOptions() {return _differenceInCalendarDaysWithOptions;},
  differenceInCalendarISOWeekYears: function differenceInCalendarISOWeekYears() {return _differenceInCalendarISOWeekYears;},
  differenceInCalendarISOWeekYearsWithOptions: function differenceInCalendarISOWeekYearsWithOptions() {return _differenceInCalendarISOWeekYearsWithOptions;},
  differenceInCalendarISOWeeks: function differenceInCalendarISOWeeks() {return _differenceInCalendarISOWeeks;},
  differenceInCalendarISOWeeksWithOptions: function differenceInCalendarISOWeeksWithOptions() {return _differenceInCalendarISOWeeksWithOptions;},
  differenceInCalendarMonths: function differenceInCalendarMonths() {return _differenceInCalendarMonths;},
  differenceInCalendarMonthsWithOptions: function differenceInCalendarMonthsWithOptions() {return _differenceInCalendarMonthsWithOptions;},
  differenceInCalendarQuarters: function differenceInCalendarQuarters() {return _differenceInCalendarQuarters;},
  differenceInCalendarQuartersWithOptions: function differenceInCalendarQuartersWithOptions() {return _differenceInCalendarQuartersWithOptions;},
  differenceInCalendarWeeks: function differenceInCalendarWeeks() {return _differenceInCalendarWeeks;},
  differenceInCalendarWeeksWithOptions: function differenceInCalendarWeeksWithOptions() {return _differenceInCalendarWeeksWithOptions;},
  differenceInCalendarYears: function differenceInCalendarYears() {return _differenceInCalendarYears;},
  differenceInCalendarYearsWithOptions: function differenceInCalendarYearsWithOptions() {return _differenceInCalendarYearsWithOptions;},
  differenceInDays: function differenceInDays() {return _differenceInDays;},
  differenceInDaysWithOptions: function differenceInDaysWithOptions() {return _differenceInDaysWithOptions;},
  differenceInHours: function differenceInHours() {return _differenceInHours;},
  differenceInHoursWithOptions: function differenceInHoursWithOptions() {return _differenceInHoursWithOptions;},
  differenceInISOWeekYears: function differenceInISOWeekYears() {return _differenceInISOWeekYears;},
  differenceInISOWeekYearsWithOptions: function differenceInISOWeekYearsWithOptions() {return _differenceInISOWeekYearsWithOptions;},
  differenceInMilliseconds: function differenceInMilliseconds() {return _differenceInMilliseconds;},
  differenceInMinutes: function differenceInMinutes() {return _differenceInMinutes;},
  differenceInMinutesWithOptions: function differenceInMinutesWithOptions() {return _differenceInMinutesWithOptions;},
  differenceInMonths: function differenceInMonths() {return _differenceInMonths;},
  differenceInMonthsWithOptions: function differenceInMonthsWithOptions() {return _differenceInMonthsWithOptions;},
  differenceInQuarters: function differenceInQuarters() {return _differenceInQuarters;},
  differenceInQuartersWithOptions: function differenceInQuartersWithOptions() {return _differenceInQuartersWithOptions;},
  differenceInSeconds: function differenceInSeconds() {return _differenceInSeconds;},
  differenceInSecondsWithOptions: function differenceInSecondsWithOptions() {return _differenceInSecondsWithOptions;},
  differenceInWeeks: function differenceInWeeks() {return _differenceInWeeks;},
  differenceInWeeksWithOptions: function differenceInWeeksWithOptions() {return _differenceInWeeksWithOptions;},
  differenceInYears: function differenceInYears() {return _differenceInYears;},
  differenceInYearsWithOptions: function differenceInYearsWithOptions() {return _differenceInYearsWithOptions;},
  eachDayOfInterval: function eachDayOfInterval() {return _eachDayOfInterval;},
  eachDayOfIntervalWithOptions: function eachDayOfIntervalWithOptions() {return _eachDayOfIntervalWithOptions;},
  eachHourOfInterval: function eachHourOfInterval() {return _eachHourOfInterval;},
  eachHourOfIntervalWithOptions: function eachHourOfIntervalWithOptions() {return _eachHourOfIntervalWithOptions;},
  eachMinuteOfInterval: function eachMinuteOfInterval() {return _eachMinuteOfInterval;},
  eachMinuteOfIntervalWithOptions: function eachMinuteOfIntervalWithOptions() {return _eachMinuteOfIntervalWithOptions;},
  eachMonthOfInterval: function eachMonthOfInterval() {return _eachMonthOfInterval;},
  eachMonthOfIntervalWithOptions: function eachMonthOfIntervalWithOptions() {return _eachMonthOfIntervalWithOptions;},
  eachQuarterOfInterval: function eachQuarterOfInterval() {return _eachQuarterOfInterval;},
  eachQuarterOfIntervalWithOptions: function eachQuarterOfIntervalWithOptions() {return _eachQuarterOfIntervalWithOptions;},
  eachWeekOfInterval: function eachWeekOfInterval() {return _eachWeekOfInterval;},
  eachWeekOfIntervalWithOptions: function eachWeekOfIntervalWithOptions() {return _eachWeekOfIntervalWithOptions;},
  eachWeekendOfInterval: function eachWeekendOfInterval() {return _eachWeekendOfInterval;},
  eachWeekendOfIntervalWithOptions: function eachWeekendOfIntervalWithOptions() {return _eachWeekendOfIntervalWithOptions;},
  eachWeekendOfMonth: function eachWeekendOfMonth() {return _eachWeekendOfMonth;},
  eachWeekendOfMonthWithOptions: function eachWeekendOfMonthWithOptions() {return _eachWeekendOfMonthWithOptions;},
  eachWeekendOfYear: function eachWeekendOfYear() {return _eachWeekendOfYear;},
  eachWeekendOfYearWithOptions: function eachWeekendOfYearWithOptions() {return _eachWeekendOfYearWithOptions;},
  eachYearOfInterval: function eachYearOfInterval() {return _eachYearOfInterval;},
  eachYearOfIntervalWithOptions: function eachYearOfIntervalWithOptions() {return _eachYearOfIntervalWithOptions;},
  endOfDay: function endOfDay() {return _endOfDay;},
  endOfDayWithOptions: function endOfDayWithOptions() {return _endOfDayWithOptions;},
  endOfDecade: function endOfDecade() {return _endOfDecade;},
  endOfDecadeWithOptions: function endOfDecadeWithOptions() {return _endOfDecadeWithOptions;},
  endOfHour: function endOfHour() {return _endOfHour;},
  endOfHourWithOptions: function endOfHourWithOptions() {return _endOfHourWithOptions;},
  endOfISOWeek: function endOfISOWeek() {return _endOfISOWeek;},
  endOfISOWeekWithOptions: function endOfISOWeekWithOptions() {return _endOfISOWeekWithOptions;},
  endOfISOWeekYear: function endOfISOWeekYear() {return _endOfISOWeekYear;},
  endOfISOWeekYearWithOptions: function endOfISOWeekYearWithOptions() {return _endOfISOWeekYearWithOptions;},
  endOfMinute: function endOfMinute() {return _endOfMinute;},
  endOfMinuteWithOptions: function endOfMinuteWithOptions() {return _endOfMinuteWithOptions;},
  endOfMonth: function endOfMonth() {return _endOfMonth;},
  endOfMonthWithOptions: function endOfMonthWithOptions() {return _endOfMonthWithOptions;},
  endOfQuarter: function endOfQuarter() {return _endOfQuarter;},
  endOfQuarterWithOptions: function endOfQuarterWithOptions() {return _endOfQuarterWithOptions;},
  endOfSecond: function endOfSecond() {return _endOfSecond;},
  endOfSecondWithOptions: function endOfSecondWithOptions() {return _endOfSecondWithOptions;},
  endOfWeek: function endOfWeek() {return _endOfWeek;},
  endOfWeekWithOptions: function endOfWeekWithOptions() {return _endOfWeekWithOptions;},
  endOfYear: function endOfYear() {return _endOfYear;},
  endOfYearWithOptions: function endOfYearWithOptions() {return _endOfYearWithOptions;},
  format: function format() {return _format;},
  formatDistance: function formatDistance() {return _formatDistance;},
  formatDistanceStrict: function formatDistanceStrict() {return _formatDistanceStrict;},
  formatDistanceStrictWithOptions: function formatDistanceStrictWithOptions() {return _formatDistanceStrictWithOptions;},
  formatDistanceWithOptions: function formatDistanceWithOptions() {return _formatDistanceWithOptions;},
  formatDuration: function formatDuration() {return _formatDuration;},
  formatDurationWithOptions: function formatDurationWithOptions() {return _formatDurationWithOptions;},
  formatISO: function formatISO() {return _formatISO;},
  formatISO9075: function formatISO9075() {return _formatISO2;},
  formatISO9075WithOptions: function formatISO9075WithOptions() {return _formatISO9075WithOptions;},
  formatISODuration: function formatISODuration() {return _formatISODuration;},
  formatISOWithOptions: function formatISOWithOptions() {return _formatISOWithOptions;},
  formatRFC3339: function formatRFC3339() {return _formatRFC;},
  formatRFC3339WithOptions: function formatRFC3339WithOptions() {return _formatRFC3339WithOptions;},
  formatRFC7231: function formatRFC7231() {return _formatRFC2;},
  formatRelative: function formatRelative() {return _formatRelative;},
  formatRelativeWithOptions: function formatRelativeWithOptions() {return _formatRelativeWithOptions;},
  formatWithOptions: function formatWithOptions() {return _formatWithOptions;},
  fromUnixTime: function fromUnixTime() {return _fromUnixTime;},
  fromUnixTimeWithOptions: function fromUnixTimeWithOptions() {return _fromUnixTimeWithOptions;},
  getDate: function getDate() {return _getDate;},
  getDateWithOptions: function getDateWithOptions() {return _getDateWithOptions;},
  getDay: function getDay() {return _getDay;},
  getDayOfYear: function getDayOfYear() {return _getDayOfYear;},
  getDayOfYearWithOptions: function getDayOfYearWithOptions() {return _getDayOfYearWithOptions;},
  getDayWithOptions: function getDayWithOptions() {return _getDayWithOptions;},
  getDaysInMonth: function getDaysInMonth() {return _getDaysInMonth;},
  getDaysInMonthWithOptions: function getDaysInMonthWithOptions() {return _getDaysInMonthWithOptions;},
  getDaysInYear: function getDaysInYear() {return _getDaysInYear;},
  getDaysInYearWithOptions: function getDaysInYearWithOptions() {return _getDaysInYearWithOptions;},
  getDecade: function getDecade() {return _getDecade;},
  getDecadeWithOptions: function getDecadeWithOptions() {return _getDecadeWithOptions;},
  getHours: function getHours() {return _getHours;},
  getHoursWithOptions: function getHoursWithOptions() {return _getHoursWithOptions;},
  getISODay: function getISODay() {return _getISODay;},
  getISODayWithOptions: function getISODayWithOptions() {return _getISODayWithOptions;},
  getISOWeek: function getISOWeek() {return _getISOWeek;},
  getISOWeekWithOptions: function getISOWeekWithOptions() {return _getISOWeekWithOptions;},
  getISOWeekYear: function getISOWeekYear() {return _getISOWeekYear;},
  getISOWeekYearWithOptions: function getISOWeekYearWithOptions() {return _getISOWeekYearWithOptions;},
  getISOWeeksInYear: function getISOWeeksInYear() {return _getISOWeeksInYear;},
  getISOWeeksInYearWithOptions: function getISOWeeksInYearWithOptions() {return _getISOWeeksInYearWithOptions;},
  getMilliseconds: function getMilliseconds() {return _getMilliseconds;},
  getMinutes: function getMinutes() {return _getMinutes;},
  getMinutesWithOptions: function getMinutesWithOptions() {return _getMinutesWithOptions;},
  getMonth: function getMonth() {return _getMonth;},
  getMonthWithOptions: function getMonthWithOptions() {return _getMonthWithOptions;},
  getOverlappingDaysInIntervals: function getOverlappingDaysInIntervals() {return _getOverlappingDaysInIntervals;},
  getQuarter: function getQuarter() {return _getQuarter;},
  getQuarterWithOptions: function getQuarterWithOptions() {return _getQuarterWithOptions;},
  getSeconds: function getSeconds() {return _getSeconds;},
  getTime: function getTime() {return _getTime;},
  getUnixTime: function getUnixTime() {return _getUnixTime;},
  getWeek: function getWeek() {return _getWeek;},
  getWeekOfMonth: function getWeekOfMonth() {return _getWeekOfMonth;},
  getWeekOfMonthWithOptions: function getWeekOfMonthWithOptions() {return _getWeekOfMonthWithOptions;},
  getWeekWithOptions: function getWeekWithOptions() {return _getWeekWithOptions;},
  getWeekYear: function getWeekYear() {return _getWeekYear;},
  getWeekYearWithOptions: function getWeekYearWithOptions() {return _getWeekYearWithOptions;},
  getWeeksInMonth: function getWeeksInMonth() {return _getWeeksInMonth;},
  getWeeksInMonthWithOptions: function getWeeksInMonthWithOptions() {return _getWeeksInMonthWithOptions;},
  getYear: function getYear() {return _getYear;},
  getYearWithOptions: function getYearWithOptions() {return _getYearWithOptions;},
  hoursToMilliseconds: function hoursToMilliseconds() {return _hoursToMilliseconds;},
  hoursToMinutes: function hoursToMinutes() {return _hoursToMinutes;},
  hoursToSeconds: function hoursToSeconds() {return _hoursToSeconds;},
  interval: function interval() {return _interval;},
  intervalToDuration: function intervalToDuration() {return _intervalToDuration;},
  intervalToDurationWithOptions: function intervalToDurationWithOptions() {return _intervalToDurationWithOptions;},
  intervalWithOptions: function intervalWithOptions() {return _intervalWithOptions;},
  intlFormat: function intlFormat() {return _intlFormat;},
  intlFormatDistance: function intlFormatDistance() {return _intlFormatDistance;},
  intlFormatDistanceWithOptions: function intlFormatDistanceWithOptions() {return _intlFormatDistanceWithOptions;},
  isAfter: function isAfter() {return _isAfter;},
  isBefore: function isBefore() {return _isBefore;},
  isDate: function isDate() {return _isDate;},
  isEqual: function isEqual() {return _isEqual;},
  isExists: function isExists() {return _isExists;},
  isFirstDayOfMonth: function isFirstDayOfMonth() {return _isFirstDayOfMonth;},
  isFirstDayOfMonthWithOptions: function isFirstDayOfMonthWithOptions() {return _isFirstDayOfMonthWithOptions;},
  isFriday: function isFriday() {return _isFriday;},
  isFridayWithOptions: function isFridayWithOptions() {return _isFridayWithOptions;},
  isLastDayOfMonth: function isLastDayOfMonth() {return _isLastDayOfMonth;},
  isLastDayOfMonthWithOptions: function isLastDayOfMonthWithOptions() {return _isLastDayOfMonthWithOptions;},
  isLeapYear: function isLeapYear() {return _isLeapYear;},
  isLeapYearWithOptions: function isLeapYearWithOptions() {return _isLeapYearWithOptions;},
  isMatch: function isMatch() {return _isMatch;},
  isMatchWithOptions: function isMatchWithOptions() {return _isMatchWithOptions;},
  isMonday: function isMonday() {return _isMonday;},
  isMondayWithOptions: function isMondayWithOptions() {return _isMondayWithOptions;},
  isSameDay: function isSameDay() {return _isSameDay;},
  isSameDayWithOptions: function isSameDayWithOptions() {return _isSameDayWithOptions;},
  isSameHour: function isSameHour() {return _isSameHour;},
  isSameHourWithOptions: function isSameHourWithOptions() {return _isSameHourWithOptions;},
  isSameISOWeek: function isSameISOWeek() {return _isSameISOWeek;},
  isSameISOWeekWithOptions: function isSameISOWeekWithOptions() {return _isSameISOWeekWithOptions;},
  isSameISOWeekYear: function isSameISOWeekYear() {return _isSameISOWeekYear;},
  isSameISOWeekYearWithOptions: function isSameISOWeekYearWithOptions() {return _isSameISOWeekYearWithOptions;},
  isSameMinute: function isSameMinute() {return _isSameMinute;},
  isSameMonth: function isSameMonth() {return _isSameMonth;},
  isSameMonthWithOptions: function isSameMonthWithOptions() {return _isSameMonthWithOptions;},
  isSameQuarter: function isSameQuarter() {return _isSameQuarter;},
  isSameQuarterWithOptions: function isSameQuarterWithOptions() {return _isSameQuarterWithOptions;},
  isSameSecond: function isSameSecond() {return _isSameSecond;},
  isSameWeek: function isSameWeek() {return _isSameWeek;},
  isSameWeekWithOptions: function isSameWeekWithOptions() {return _isSameWeekWithOptions;},
  isSameYear: function isSameYear() {return _isSameYear;},
  isSameYearWithOptions: function isSameYearWithOptions() {return _isSameYearWithOptions;},
  isSaturday: function isSaturday() {return _isSaturday;},
  isSaturdayWithOptions: function isSaturdayWithOptions() {return _isSaturdayWithOptions;},
  isSunday: function isSunday() {return _isSunday;},
  isSundayWithOptions: function isSundayWithOptions() {return _isSundayWithOptions;},
  isThursday: function isThursday() {return _isThursday;},
  isThursdayWithOptions: function isThursdayWithOptions() {return _isThursdayWithOptions;},
  isTuesday: function isTuesday() {return _isTuesday;},
  isTuesdayWithOptions: function isTuesdayWithOptions() {return _isTuesdayWithOptions;},
  isValid: function isValid() {return _isValid;},
  isWednesday: function isWednesday() {return _isWednesday;},
  isWednesdayWithOptions: function isWednesdayWithOptions() {return _isWednesdayWithOptions;},
  isWeekend: function isWeekend() {return _isWeekend;},
  isWeekendWithOptions: function isWeekendWithOptions() {return _isWeekendWithOptions;},
  isWithinInterval: function isWithinInterval() {return _isWithinInterval;},
  isWithinIntervalWithOptions: function isWithinIntervalWithOptions() {return _isWithinIntervalWithOptions;},
  lastDayOfDecade: function lastDayOfDecade() {return _lastDayOfDecade;},
  lastDayOfDecadeWithOptions: function lastDayOfDecadeWithOptions() {return _lastDayOfDecadeWithOptions;},
  lastDayOfISOWeek: function lastDayOfISOWeek() {return _lastDayOfISOWeek;},
  lastDayOfISOWeekWithOptions: function lastDayOfISOWeekWithOptions() {return _lastDayOfISOWeekWithOptions;},
  lastDayOfISOWeekYear: function lastDayOfISOWeekYear() {return _lastDayOfISOWeekYear;},
  lastDayOfISOWeekYearWithOptions: function lastDayOfISOWeekYearWithOptions() {return _lastDayOfISOWeekYearWithOptions;},
  lastDayOfMonth: function lastDayOfMonth() {return _lastDayOfMonth;},
  lastDayOfMonthWithOptions: function lastDayOfMonthWithOptions() {return _lastDayOfMonthWithOptions;},
  lastDayOfQuarter: function lastDayOfQuarter() {return _lastDayOfQuarter;},
  lastDayOfQuarterWithOptions: function lastDayOfQuarterWithOptions() {return _lastDayOfQuarterWithOptions;},
  lastDayOfWeek: function lastDayOfWeek() {return _lastDayOfWeek;},
  lastDayOfWeekWithOptions: function lastDayOfWeekWithOptions() {return _lastDayOfWeekWithOptions;},
  lastDayOfYear: function lastDayOfYear() {return _lastDayOfYear;},
  lastDayOfYearWithOptions: function lastDayOfYearWithOptions() {return _lastDayOfYearWithOptions;},
  lightFormat: function lightFormat() {return _lightFormat;},
  max: function max() {return _max;},
  maxWithOptions: function maxWithOptions() {return _maxWithOptions;},
  milliseconds: function milliseconds() {return _milliseconds2;},
  millisecondsToHours: function millisecondsToHours() {return _millisecondsToHours;},
  millisecondsToMinutes: function millisecondsToMinutes() {return _millisecondsToMinutes;},
  millisecondsToSeconds: function millisecondsToSeconds() {return _millisecondsToSeconds;},
  min: function min() {return _min;},
  minWithOptions: function minWithOptions() {return _minWithOptions;},
  minutesToHours: function minutesToHours() {return _minutesToHours;},
  minutesToMilliseconds: function minutesToMilliseconds() {return _minutesToMilliseconds;},
  minutesToSeconds: function minutesToSeconds() {return _minutesToSeconds;},
  monthsToQuarters: function monthsToQuarters() {return _monthsToQuarters;},
  monthsToYears: function monthsToYears() {return _monthsToYears;},
  nextDay: function nextDay() {return _nextDay;},
  nextDayWithOptions: function nextDayWithOptions() {return _nextDayWithOptions;},
  nextFriday: function nextFriday() {return _nextFriday;},
  nextFridayWithOptions: function nextFridayWithOptions() {return _nextFridayWithOptions;},
  nextMonday: function nextMonday() {return _nextMonday;},
  nextMondayWithOptions: function nextMondayWithOptions() {return _nextMondayWithOptions;},
  nextSaturday: function nextSaturday() {return _nextSaturday;},
  nextSaturdayWithOptions: function nextSaturdayWithOptions() {return _nextSaturdayWithOptions;},
  nextSunday: function nextSunday() {return _nextSunday;},
  nextSundayWithOptions: function nextSundayWithOptions() {return _nextSundayWithOptions;},
  nextThursday: function nextThursday() {return _nextThursday;},
  nextThursdayWithOptions: function nextThursdayWithOptions() {return _nextThursdayWithOptions;},
  nextTuesday: function nextTuesday() {return _nextTuesday;},
  nextTuesdayWithOptions: function nextTuesdayWithOptions() {return _nextTuesdayWithOptions;},
  nextWednesday: function nextWednesday() {return _nextWednesday;},
  nextWednesdayWithOptions: function nextWednesdayWithOptions() {return _nextWednesdayWithOptions;},
  parse: function parse() {return _parse;},
  parseISO: function parseISO() {return _parseISO;},
  parseISOWithOptions: function parseISOWithOptions() {return _parseISOWithOptions;},
  parseJSON: function parseJSON() {return _parseJSON;},
  parseJSONWithOptions: function parseJSONWithOptions() {return _parseJSONWithOptions;},
  parseWithOptions: function parseWithOptions() {return _parseWithOptions;},
  previousDay: function previousDay() {return _previousDay;},
  previousDayWithOptions: function previousDayWithOptions() {return _previousDayWithOptions;},
  previousFriday: function previousFriday() {return _previousFriday;},
  previousFridayWithOptions: function previousFridayWithOptions() {return _previousFridayWithOptions;},
  previousMonday: function previousMonday() {return _previousMonday;},
  previousMondayWithOptions: function previousMondayWithOptions() {return _previousMondayWithOptions;},
  previousSaturday: function previousSaturday() {return _previousSaturday;},
  previousSaturdayWithOptions: function previousSaturdayWithOptions() {return _previousSaturdayWithOptions;},
  previousSunday: function previousSunday() {return _previousSunday;},
  previousSundayWithOptions: function previousSundayWithOptions() {return _previousSundayWithOptions;},
  previousThursday: function previousThursday() {return _previousThursday;},
  previousThursdayWithOptions: function previousThursdayWithOptions() {return _previousThursdayWithOptions;},
  previousTuesday: function previousTuesday() {return _previousTuesday;},
  previousTuesdayWithOptions: function previousTuesdayWithOptions() {return _previousTuesdayWithOptions;},
  previousWednesday: function previousWednesday() {return _previousWednesday;},
  previousWednesdayWithOptions: function previousWednesdayWithOptions() {return _previousWednesdayWithOptions;},
  quartersToMonths: function quartersToMonths() {return _quartersToMonths;},
  quartersToYears: function quartersToYears() {return _quartersToYears;},
  roundToNearestHours: function roundToNearestHours() {return _roundToNearestHours;},
  roundToNearestHoursWithOptions: function roundToNearestHoursWithOptions() {return _roundToNearestHoursWithOptions;},
  roundToNearestMinutes: function roundToNearestMinutes() {return _roundToNearestMinutes;},
  roundToNearestMinutesWithOptions: function roundToNearestMinutesWithOptions() {return _roundToNearestMinutesWithOptions;},
  secondsToHours: function secondsToHours() {return _secondsToHours;},
  secondsToMilliseconds: function secondsToMilliseconds() {return _secondsToMilliseconds;},
  secondsToMinutes: function secondsToMinutes() {return _secondsToMinutes;},
  set: function set() {return _set;},
  setDate: function setDate() {return _setDate;},
  setDateWithOptions: function setDateWithOptions() {return _setDateWithOptions;},
  setDay: function setDay() {return _setDay;},
  setDayOfYear: function setDayOfYear() {return _setDayOfYear;},
  setDayOfYearWithOptions: function setDayOfYearWithOptions() {return _setDayOfYearWithOptions;},
  setDayWithOptions: function setDayWithOptions() {return _setDayWithOptions;},
  setHours: function setHours() {return _setHours;},
  setHoursWithOptions: function setHoursWithOptions() {return _setHoursWithOptions;},
  setISODay: function setISODay() {return _setISODay;},
  setISODayWithOptions: function setISODayWithOptions() {return _setISODayWithOptions;},
  setISOWeek: function setISOWeek() {return _setISOWeek;},
  setISOWeekWithOptions: function setISOWeekWithOptions() {return _setISOWeekWithOptions;},
  setISOWeekYear: function setISOWeekYear() {return _setISOWeekYear;},
  setISOWeekYearWithOptions: function setISOWeekYearWithOptions() {return _setISOWeekYearWithOptions;},
  setMilliseconds: function setMilliseconds() {return _setMilliseconds;},
  setMillisecondsWithOptions: function setMillisecondsWithOptions() {return _setMillisecondsWithOptions;},
  setMinutes: function setMinutes() {return _setMinutes;},
  setMinutesWithOptions: function setMinutesWithOptions() {return _setMinutesWithOptions;},
  setMonth: function setMonth() {return _setMonth;},
  setMonthWithOptions: function setMonthWithOptions() {return _setMonthWithOptions;},
  setQuarter: function setQuarter() {return _setQuarter;},
  setQuarterWithOptions: function setQuarterWithOptions() {return _setQuarterWithOptions;},
  setSeconds: function setSeconds() {return _setSeconds;},
  setSecondsWithOptions: function setSecondsWithOptions() {return _setSecondsWithOptions;},
  setWeek: function setWeek() {return _setWeek;},
  setWeekWithOptions: function setWeekWithOptions() {return _setWeekWithOptions;},
  setWeekYear: function setWeekYear() {return _setWeekYear;},
  setWeekYearWithOptions: function setWeekYearWithOptions() {return _setWeekYearWithOptions;},
  setWithOptions: function setWithOptions() {return _setWithOptions;},
  setYear: function setYear() {return _setYear;},
  setYearWithOptions: function setYearWithOptions() {return _setYearWithOptions;},
  startOfDay: function startOfDay() {return _startOfDay;},
  startOfDayWithOptions: function startOfDayWithOptions() {return _startOfDayWithOptions;},
  startOfDecade: function startOfDecade() {return _startOfDecade;},
  startOfDecadeWithOptions: function startOfDecadeWithOptions() {return _startOfDecadeWithOptions;},
  startOfHour: function startOfHour() {return _startOfHour;},
  startOfHourWithOptions: function startOfHourWithOptions() {return _startOfHourWithOptions;},
  startOfISOWeek: function startOfISOWeek() {return _startOfISOWeek;},
  startOfISOWeekWithOptions: function startOfISOWeekWithOptions() {return _startOfISOWeekWithOptions;},
  startOfISOWeekYear: function startOfISOWeekYear() {return _startOfISOWeekYear;},
  startOfISOWeekYearWithOptions: function startOfISOWeekYearWithOptions() {return _startOfISOWeekYearWithOptions;},
  startOfMinute: function startOfMinute() {return _startOfMinute;},
  startOfMinuteWithOptions: function startOfMinuteWithOptions() {return _startOfMinuteWithOptions;},
  startOfMonth: function startOfMonth() {return _startOfMonth;},
  startOfMonthWithOptions: function startOfMonthWithOptions() {return _startOfMonthWithOptions;},
  startOfQuarter: function startOfQuarter() {return _startOfQuarter;},
  startOfQuarterWithOptions: function startOfQuarterWithOptions() {return _startOfQuarterWithOptions;},
  startOfSecond: function startOfSecond() {return _startOfSecond;},
  startOfSecondWithOptions: function startOfSecondWithOptions() {return _startOfSecondWithOptions;},
  startOfWeek: function startOfWeek() {return _startOfWeek;},
  startOfWeekWithOptions: function startOfWeekWithOptions() {return _startOfWeekWithOptions;},
  startOfWeekYear: function startOfWeekYear() {return _startOfWeekYear;},
  startOfWeekYearWithOptions: function startOfWeekYearWithOptions() {return _startOfWeekYearWithOptions;},
  startOfYear: function startOfYear() {return _startOfYear;},
  startOfYearWithOptions: function startOfYearWithOptions() {return _startOfYearWithOptions;},
  sub: function sub() {return _sub;},
  subBusinessDays: function subBusinessDays() {return _subBusinessDays;},
  subBusinessDaysWithOptions: function subBusinessDaysWithOptions() {return _subBusinessDaysWithOptions;},
  subDays: function subDays() {return _subDays;},
  subDaysWithOptions: function subDaysWithOptions() {return _subDaysWithOptions;},
  subHours: function subHours() {return _subHours;},
  subHoursWithOptions: function subHoursWithOptions() {return _subHoursWithOptions;},
  subISOWeekYears: function subISOWeekYears() {return _subISOWeekYears;},
  subISOWeekYearsWithOptions: function subISOWeekYearsWithOptions() {return _subISOWeekYearsWithOptions;},
  subMilliseconds: function subMilliseconds() {return _subMilliseconds;},
  subMillisecondsWithOptions: function subMillisecondsWithOptions() {return _subMillisecondsWithOptions;},
  subMinutes: function subMinutes() {return _subMinutes;},
  subMinutesWithOptions: function subMinutesWithOptions() {return _subMinutesWithOptions;},
  subMonths: function subMonths() {return _subMonths;},
  subMonthsWithOptions: function subMonthsWithOptions() {return _subMonthsWithOptions;},
  subQuarters: function subQuarters() {return _subQuarters;},
  subQuartersWithOptions: function subQuartersWithOptions() {return _subQuartersWithOptions;},
  subSeconds: function subSeconds() {return _subSeconds;},
  subSecondsWithOptions: function subSecondsWithOptions() {return _subSecondsWithOptions;},
  subWeeks: function subWeeks() {return _subWeeks;},
  subWeeksWithOptions: function subWeeksWithOptions() {return _subWeeksWithOptions;},
  subWithOptions: function subWithOptions() {return _subWithOptions;},
  subYears: function subYears() {return _subYears;},
  subYearsWithOptions: function subYearsWithOptions() {return _subYearsWithOptions;},
  toDate: function toDate() {return _toDate;},
  transpose: function transpose() {return _transpose;},
  weeksToDays: function weeksToDays() {return _weeksToDays;},
  yearsToDays: function yearsToDays() {return _yearsToDays;},
  yearsToMonths: function yearsToMonths() {return _yearsToMonths;},
  yearsToQuarters: function yearsToQuarters() {return _yearsToQuarters;}
});
//#endregion
//#region dist/date-fns/_entries/fp/cdn.js
window.dateFns = _objectSpread(_objectSpread({},
window.dateFns), {}, {
  fp: fp_exports });

//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();
"use strict";

exports.utc = void 0;
var _index = require("../date/index.cjs");
/**
 * The function creates a new `UTCDate` instance from the provided value. Use it
 * to provide the context for the date-fns functions, via the `in` option.
 *
 * @param value - Date value, timestamp, string or `Date` instance
 *
 * @returns UTCDate instance created from the provided value
 */
const utc = value => new _index.UTCDate(+new Date(value));
exports.utc = utc;
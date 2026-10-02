import { stringifyLocale } from "./stringifyLocale.mjs";
const cache = new Map();
export function getFormatter(locale, options) {
  const optionsString = JSON.stringify({
    locale: stringifyLocale(locale),
    options
  });
  const cachedFormatter = cache.get(optionsString);
  if (cachedFormatter) {
    return cachedFormatter;
  }
  const formatter = new Intl.NumberFormat(locale, options);
  cache.set(optionsString, formatter);
  return formatter;
}
export function formatNumber(value, locale, options) {
  if (value == null) {
    return '';
  }
  return getFormatter(locale, options).format(value);
}
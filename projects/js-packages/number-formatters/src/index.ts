import createNumberFormatters from './create-number-formatters.js';

const defaultFormatter = createNumberFormatters();

export const {
	setLocale,
	setGeoLocation,
	formatNumber,
	formatNumberCompact,
	formatCurrency,
	getCurrencyObject,
} = defaultFormatter;

export { createNumberFormatters };

export * from './types.js';

// We can optionally export the formatters individually if we want to use them in a more granular way.
// export { numberFormat, numberFormatCompact, numberFormatCurrency, getCurrencyObject };

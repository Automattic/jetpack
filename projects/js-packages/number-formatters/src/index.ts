import createNumberFormatters from './create-number-formatters.ts';

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

export * from './types.ts';

// We can optionally export the formatters individually if we want to use them in a more granular way.
// export { numberFormat, numberFormatCompact, numberFormatCurrency, getCurrencyObject };

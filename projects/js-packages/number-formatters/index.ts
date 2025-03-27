import createNumberFormatters from './src/create-number-formatters.js';

const defaultFormatter = createNumberFormatters();

export const {
	setLocale,
	setGeoLocation,
	formatNumber,
	formatNumberCompact,
	formatCurrency,
	getCurrencyObject,
} = defaultFormatter;

export * from './types/index.js';

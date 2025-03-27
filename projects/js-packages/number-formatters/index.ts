import createNumberFormatter from './src/index.js';

const defaultFormatter = createNumberFormatter();

export const {
	setLocale,
	setGeoLocation,
	formatNumber,
	formatNumberCompact,
	formatCurrency,
	getCurrencyObject,
} = defaultFormatter;

export * from './types/index.js';

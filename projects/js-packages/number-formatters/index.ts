import NumberFormatter from './src/index.js';

const defaultFormatter = new NumberFormatter();

export const {
	setLocale,
	setGeoLocation,
	formatNumber,
	formatNumberCompact,
	formatCurrency,
	getCurrencyObject,
} = defaultFormatter;

export { NumberFormatter };

export * from './types/index.js';

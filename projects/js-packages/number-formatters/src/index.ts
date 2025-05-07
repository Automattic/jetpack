import createNumberFormatters from './create-number-formatters.ts';
import { CURRENCY_OVERRIDES } from './number-format-currency/currencies.ts';

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

export { CURRENCY_OVERRIDES };

export type * from './types.ts';

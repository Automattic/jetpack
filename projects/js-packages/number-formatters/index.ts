import createNumberFormatter from './src/index.js';

const formatter = createNumberFormatter();

// add the description from formatter.formatNumber
/**
 * Formats a number using locale settings and/or passed options.
 * @param {...any} args - The number to format and optional formatting parameters.
 * @return {string} The formatted number.
 */
export function formatNumber( ...args: Parameters< typeof formatter.formatNumber > ) {
	return formatter.formatNumber( ...args );
}

/**
 *
 * @param {...any} args
 */
export function formatNumberCompact( ...args: Parameters< typeof formatter.formatNumberCompact > ) {
	return formatter.formatNumberCompact( ...args );
}

/**
 *
 * @param {...any} args
 */
export function formatCurrency( ...args: Parameters< typeof formatter.formatCurrency > ) {
	return formatter.formatCurrency( ...args );
}

/**
 *
 * @param {...any} args
 */
export function getCurrencyObject( ...args: Parameters< typeof formatter.getCurrencyObject > ) {
	return formatter.getCurrencyObject( ...args );
}

/**
 *
 * @param {...any} args
 */
export function setLocale( ...args: Parameters< typeof formatter.setLocale > ) {
	return formatter.setLocale( ...args );
}

/**
 *
 * @param {...any} args
 */
export function setGeoLocation( ...args: Parameters< typeof formatter.setGeoLocation > ) {
	return formatter.setGeoLocation( ...args );
}

export { formatter };

import { numberFormat } from '@automattic/jetpack-components';
import type { FormatNumberFunction } from './types';

const defaultConfig: Intl.NumberFormatOptions = {
	style: 'percent',
};

/**
 * Formats a number as a percentage string.
 *
 * @param {number}                   number   - The number to format (e.g. 0.5 for 50%)
 * @param {Intl.NumberFormatOptions} [config] - Optional formatting configuration
 * @return {string} The formatted percentage string (e.g. "50%")
 */
const formatPercentage: FormatNumberFunction = ( number, config = defaultConfig ) => {
	if ( number === null || ! Number.isFinite( number ) ) {
		return '-';
	}

	// Force percentage
	config.style = 'percent';

	return numberFormat( number, config );
};

export default formatPercentage;

import { formatNumber } from '@automattic/number-formatters';

/**
 * Format a percentage value with smart decimal handling.
 * Uses `@automattic/number-formatters` for consistent formatting.
 * Removes unnecessary trailing zeros and caps at 2 decimal places.
 *
 * @param value - The percentage value (0-100 range)
 * @return Formatted percentage string (e.g., "30%", "30.1%", "30.25%")
 */
export const formatPercentage = ( value: number ): string => {
	// Use formatNumber with percentage style, but convert from 0-100 range to 0-1 range
	return formatNumber( value / 100, {
		numberFormatOptions: {
			style: 'percent',
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		},
	} );
};

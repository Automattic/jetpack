import { formatNumber } from '@automattic/number-formatters';

/**
 * A duration in minutes, or in hours from 60 minutes on, with units spelled in the reader's locale.
 *
 * @param seconds     - The duration.
 * @param unitDisplay - `short` for "28 min", `long` for "28 minutes".
 * @return The formatted duration.
 */
export function formatDuration( seconds: number, unitDisplay: 'short' | 'long' ): string {
	const minutes = Math.max( 1, Math.round( seconds / 60 ) );
	if ( minutes < 60 ) {
		return formatNumber( minutes, {
			numberFormatOptions: { style: 'unit', unit: 'minute', unitDisplay },
		} );
	}
	return formatNumber( seconds / 3600, {
		numberFormatOptions: { style: 'unit', unit: 'hour', unitDisplay, maximumFractionDigits: 1 },
	} );
}

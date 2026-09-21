import { formatNumber } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';

/**
 * Whether a data point's value cannot be drawn.
 *
 * @param value                - The point's value.
 * @param options              - Validation options.
 * @param options.allowMissing - Whether `null` is a bucket with no reading rather than a fault.
 * @return True when the value is invalid.
 */
export const isInvalidReading = (
	value: number | null | undefined,
	{ allowMissing }: { allowMissing: boolean }
) => ( value === null ? ! allowMissing : value === undefined || isNaN( value ) );

/**
 * Formats a reading for a tooltip.
 *
 * @param value - The reading, or null when the bucket has none.
 * @return The formatted value.
 */
export const formatReading = ( value: number | null | undefined ) =>
	// formatNumber( null ) is "0", which would claim a reading of zero for a bucket that has none.
	value == null ? __( 'No data', 'jetpack-charts' ) : formatNumber( value );

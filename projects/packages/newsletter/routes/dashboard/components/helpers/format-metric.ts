import { __, sprintf } from '@wordpress/i18n';

/**
 * Format a metric count, or its placeholder when unavailable.
 *
 * @param value - Metric value, or null/undefined when unavailable.
 * @return Localized metric.
 */
export function formatMetric( value: number | null | undefined ): string {
	return value === null || value === undefined ? '—' : new Intl.NumberFormat().format( value );
}

/**
 * Format a whole-number percentage, or its placeholder when unavailable.
 *
 * @param value - Percentage in the 0-100 range, or null/undefined when unavailable.
 * @return Localized percentage.
 */
export function formatRate( value: number | null | undefined ): string {
	return value === null || value === undefined
		? '—'
		: sprintf(
				/* translators: %d: Percentage value without the percent sign. */
				__( '%d%%', 'jetpack-newsletter' ),
				Math.round( value )
		  );
}

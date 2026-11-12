import { formatNumber } from '@automattic/number-formatters';

const PLACEHOLDER = '—';

/**
 * Format a metric count, or its placeholder when unavailable.
 *
 * @param value - Metric value, or null/undefined when unavailable.
 * @return Localized metric.
 */
export function formatMetric( value: number | null | undefined ): string {
	return value === null || value === undefined ? PLACEHOLDER : formatNumber( value );
}

/**
 * Format a whole-number percentage, or its placeholder when unavailable.
 *
 * @param value - Percentage in the 0-100 range, or null/undefined when unavailable.
 * @return Localized percentage.
 */
export function formatRate( value: number | null | undefined ): string {
	return value === null || value === undefined
		? PLACEHOLDER
		: formatNumber( value / 100, {
				numberFormatOptions: { style: 'percent' },
			} );
}

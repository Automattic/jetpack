/**
 * External dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { CountLabel } from '../types';

/**
 * Compose a tooltip row as one translatable sentence, value first: `1 View · September 17, 2026`.
 * Without a `countLabel`, the metric name is the unit.
 *
 * @param value      - Formatted value, or null for a bucket with no reading.
 * @param name       - Metric name.
 * @param date       - Formatted date.
 * @param count      - The row's raw value, which picks `countLabel`'s plural form.
 * @param countLabel - The metric's plural-aware unit; without one, `name` is the unit.
 * @return The tooltip row label.
 */
export function formatTooltipPointLabel(
	value: string | null,
	name: string,
	date: string,
	count?: number | null,
	countLabel?: CountLabel
): string {
	if ( value === null ) {
		return sprintf(
			/* translators: 1: metric name, 2: date. */
			__( 'No data for %1$s · %2$s', 'jetpack-premium-analytics-pkg' ),
			name,
			date
		);
	}

	// A plural-only `name` cannot agree with a count of 1, nor with a locale's other forms.
	if ( countLabel && count !== undefined && count !== null ) {
		return sprintf(
			/* translators: 1: a count with its unit, such as "1 Subscriber", 2: date. */
			_x( '%1$s · %2$s', 'chart tooltip: count and date', 'jetpack-premium-analytics-pkg' ),
			sprintf( countLabel( count ), value ),
			date
		);
	}

	return sprintf(
		/* translators: 1: formatted value, 2: metric name, 3: date. */
		__( '%1$s %2$s · %3$s', 'jetpack-premium-analytics-pkg' ),
		value,
		name,
		date
	);
}

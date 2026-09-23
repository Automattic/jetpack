/**
 * External dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { CountLabel } from '../types';

/**
 * Compose a tooltip row as one translatable sentence, so the value reads with
 * the metric as its unit: `86 Views · September 17, 2026`.
 *
 * @param value      - Formatted value.
 * @param name       - Metric name.
 * @param date       - Formatted date.
 * @param count      - The row's raw value, which picks `countLabel`'s plural form.
 * @param countLabel - The metric's plural-aware unit; without one, `name` is the unit.
 * @return The tooltip row label.
 */
export function formatTooltipPointLabel(
	value: string,
	name: string,
	date: string,
	count?: number,
	countLabel?: CountLabel
): string {
	// A plural-only `name` cannot agree with a count of 1, nor with a locale's other forms.
	if ( countLabel && count !== undefined ) {
		return sprintf(
			/* translators: 1: a count with its unit, such as "1 subscriber", 2: date. */
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

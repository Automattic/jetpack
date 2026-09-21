/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Compose a tooltip row as one translatable sentence, so the value reads with
 * the metric as its unit: `86 Views · September 17, 2026`.
 *
 * @param value - Formatted value.
 * @param name  - Metric name.
 * @param date  - Formatted date.
 * @return The tooltip row label.
 */
export function formatTooltipPointLabel( value: string, name: string, date: string ): string {
	return sprintf(
		/* translators: 1: formatted value, 2: metric name, 3: date. */
		__( '%1$s %2$s · %3$s', 'jetpack-premium-analytics-pkg' ),
		value,
		name,
		date
	);
}

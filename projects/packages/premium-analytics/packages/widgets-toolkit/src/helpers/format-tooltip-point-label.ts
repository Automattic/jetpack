/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Compose a tooltip row as one translatable sentence, so the value reads with
 * the metric as its unit: `86 Views · September 17, 2026`.
 *
 * @param value - Formatted value, or null for a bucket with no reading.
 * @param name  - Metric name.
 * @param date  - Formatted date.
 * @return The tooltip row label.
 */
export function formatTooltipPointLabel(
	value: string | null,
	name: string,
	date: string
): string {
	if ( value === null ) {
		return sprintf(
			/* translators: 1: metric name, 2: date. */
			__( 'No data for %1$s · %2$s', 'jetpack-premium-analytics-pkg' ),
			name,
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

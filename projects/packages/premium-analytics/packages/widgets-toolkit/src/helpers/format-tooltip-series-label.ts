/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Join a metric name and date for a tooltip row while keeping the complete
 * user-facing string available to translators.
 *
 * @param name - Metric name.
 * @param date - Formatted date.
 * @return The tooltip row label.
 */
export function formatTooltipSeriesLabel( name: string, date: string ): string {
	return sprintf(
		/* translators: 1: metric name, 2: date. */
		__( '%1$s · %2$s', 'jetpack-premium-analytics-pkg' ),
		name,
		date
	);
}

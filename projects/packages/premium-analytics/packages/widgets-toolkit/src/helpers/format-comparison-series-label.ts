/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Label a metric's previous-period series. Must stay stable across date
 * changes — including the range would reveal a seeded-hidden comparison on
 * every period change; the legend collapses it into the metric's own item.
 *
 * @param name - The metric name.
 * @return The comparison series' label.
 */
export function formatComparisonSeriesLabel( name: string ): string {
	return sprintf(
		/* translators: %s is a metric name, e.g. "Views". */
		__( '%s · previous period', 'jetpack-premium-analytics-pkg' ),
		name
	);
}

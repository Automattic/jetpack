/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Label a metric's previous-period series.
 *
 * The charts provider stores visibility by label, so this has to stay stable
 * while the dashboard dates change: including the range would reveal a
 * seeded-hidden comparison whenever the reader picked a new period without
 * remounting the chart. The legend collapses it into its metric's item, so the
 * text itself surfaces only to assistive technology.
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

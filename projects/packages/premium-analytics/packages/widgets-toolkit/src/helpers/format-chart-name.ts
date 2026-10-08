/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Name a chart after what it shows, so a screen reader can tell it from the widget around it.
 *
 * @param title - What the chart shows, such as the widget title.
 * @return The chart's accessible name, or undefined to keep the chart's default.
 */
export function formatChartName( title?: string ): string | undefined {
	if ( ! title ) {
		return undefined;
	}

	return sprintf(
		/* translators: %s is what a chart shows, e.g. "Sales by device". */
		__( '%s chart', 'jetpack-premium-analytics-pkg' ),
		title
	);
}

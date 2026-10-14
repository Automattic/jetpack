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
		__( 'Chart: %s', 'jetpack-premium-analytics-pkg' ),
		title
	);
}

/**
 * Name a map after what it shows, so a screen reader can tell it from a chart of the same data.
 *
 * @param title - What the map shows, such as the widget title.
 * @return The map's accessible name, or undefined to keep the map's default.
 */
export function formatMapName( title?: string ): string | undefined {
	if ( ! title ) {
		return undefined;
	}

	return sprintf(
		/* translators: %s is what a map shows, e.g. "Top locations". */
		__( 'Map: %s', 'jetpack-premium-analytics-pkg' ),
		title
	);
}

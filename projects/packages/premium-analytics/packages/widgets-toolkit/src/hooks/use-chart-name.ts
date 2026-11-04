/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useWidgetIdentity } from '@wordpress/widget-primitives';

/**
 * Name a chart after what it shows: its own title, or else the title of the widget it sits in.
 *
 * @param chartTitle - What the chart shows, when that is not the widget title.
 * @return The chart's accessible name, or undefined outside a widget when no title is given.
 */
export function useChartName( chartTitle?: string ): string | undefined {
	const { title: widgetTitle } = useWidgetIdentity();
	const title = chartTitle || widgetTitle;

	return title
		? sprintf(
				/* translators: %s is what a chart shows, e.g. "Sales by device". */
				__( 'Chart: %s', 'jetpack-premium-analytics-pkg' ),
				title
			)
		: undefined;
}

/**
 * Name a map after what it shows: its own title, or else the title of the widget it sits in.
 *
 * @param chartTitle - What the map shows, when that is not the widget title.
 * @return The map's accessible name, or undefined outside a widget when no title is given.
 */
export function useMapName( chartTitle?: string ): string | undefined {
	const { title: widgetTitle } = useWidgetIdentity();
	const title = chartTitle || widgetTitle;

	return title
		? sprintf(
				/* translators: %s is what a map shows, e.g. "Top locations". */
				__( 'Map: %s', 'jetpack-premium-analytics-pkg' ),
				title
			)
		: undefined;
}

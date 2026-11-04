/**
 * External dependencies
 */
import { useWidgetIdentity } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { formatChartName, formatMapName } from '../helpers/format-chart-name';

/**
 * Name a chart after what it shows: its own title, or else the title of the widget it sits in.
 *
 * @param chartTitle - What the chart shows, when that is not the widget title.
 * @return The chart's accessible name, or undefined to keep the chart's default.
 */
export function useChartName( chartTitle?: string ): string | undefined {
	const { title } = useWidgetIdentity();
	return formatChartName( chartTitle || title );
}

/**
 * Name a map after what it shows: its own title, or else the title of the widget it sits in.
 *
 * @param chartTitle - What the map shows, when that is not the widget title.
 * @return The map's accessible name, or undefined to keep the map's default.
 */
export function useMapName( chartTitle?: string ): string | undefined {
	const { title } = useWidgetIdentity();
	return formatMapName( chartTitle || title );
}

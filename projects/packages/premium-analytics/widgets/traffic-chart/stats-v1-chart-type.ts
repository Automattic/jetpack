/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import type { TrafficChartType } from './widget';

/**
 * The key Jetpack Stats v1 saves its chart type under in this browser, per site. The wp-admin
 * dashboard's Stats widget reads it too, to draw its chart as this one.
 *
 * @return The key, or nothing when the site id is unknown.
 */
function statsV1ChartTypeKey(): string | undefined {
	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	return blogId ? `jetpack_stats_chart_type_${ blogId }` : undefined;
}

/**
 * The chart type Jetpack Stats v1 saved in this browser, if it saved one.
 * Only readable where v1 and this dashboard share an origin.
 */
export function readStatsV1ChartType(): TrafficChartType | undefined {
	const key = statsV1ChartTypeKey();
	if ( ! key ) {
		return undefined;
	}

	try {
		const saved = window.localStorage.getItem( key );
		return saved === 'bar' || saved === 'line' ? saved : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Saves the chart type where Stats v1 saved it, so the Stats widget on the wp-admin dashboard
 * keeps following this chart once no Stats v1 page writes the key.
 *
 * @param chartType - The chart type the Traffic summary switched to.
 */
export function saveStatsV1ChartType( chartType: TrafficChartType ): void {
	const key = statsV1ChartTypeKey();
	if ( ! key ) {
		return;
	}

	try {
		window.localStorage.setItem( key, chartType );
	} catch {
		// Nothing to save into; the widget's own attribute still holds the choice.
	}
}

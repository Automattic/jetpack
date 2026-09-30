/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import type { TrafficChartType } from './widget';

/**
 * The chart type Jetpack Stats v1 saved in this browser, if it saved one.
 * Only readable where v1 and this dashboard share an origin.
 */
export function readStatsV1ChartType(): TrafficChartType | undefined {
	const blogId = getScriptData()?.site?.wpcom?.blog_id;
	if ( ! blogId ) {
		return undefined;
	}

	try {
		const saved = window.localStorage.getItem( `jetpack_stats_chart_type_${ blogId }` );
		return saved === 'bar' || saved === 'line' ? saved : undefined;
	} catch {
		return undefined;
	}
}

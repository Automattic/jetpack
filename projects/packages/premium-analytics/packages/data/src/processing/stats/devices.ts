/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

/**
 * A single normalized device-views row.
 */
export interface StatsDevicesItem extends StatsNormalizedItemBase {
	label: string;
	views: number;
	children: null;
}

/**
 * Parse the `top_values` array returned by `stats/devices/{property}`.
 *
 * Each item has a `label` (device or browser name) and a `value` (view count).
 * Items are sorted descending by view count.
 *
 * @param topValues - Raw top_values array from the API.
 * @return Normalized device items.
 */
function parseTopValues( topValues: StatsRecord[] ): StatsDevicesItem[] {
	return topValues
		.map( item => ( {
			label: String( item.name ?? item.label ?? '' ),
			views: safeParseFloat( item.value ),
			children: null as null,
		} ) )
		.filter( item => item.label )
		.sort( ( a, b ) => b.views - a.views );
}

/**
 * Normalize a `stats/devices/{property}` response into the shared
 * `StatsNormalizedReport` shape.
 *
 * Actual API shape (both summarized and non-summarized):
 * ```json
 * { "top_values": [{ "label": "Desktop", "value": 1234 }, ...] }
 * ```
 *
 * @param response - Raw WPCOM Stats API response.
 * @param query    - Stats query params (used to detect summarize mode).
 * @return Normalized report.
 */
export function sanitizeStatsDevicesResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsDevicesItem > {
	const payload = coerceStatsRecord( response );
	const topValues = coerceStatsArray< StatsRecord >( payload.top_values );
	const items = parseTopValues( topValues );

	return {
		summary: normalizeStatsReportSummary( response, query ),
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}

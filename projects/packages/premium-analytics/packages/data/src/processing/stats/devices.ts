/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord, createStatsListDataPoint, normalizeStatsReportSummary } from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

/**
 * A single normalized device-views row.
 *
 * `label` is the raw device key returned by the API (e.g. 'desktop',
 * 'mobile', 'tablet', or a browser/OS name); callers are responsible
 * for mapping to display strings.
 */
export interface StatsDevicesItem extends StatsNormalizedItemBase {
	label: string;
	views: number;
	children: null;
}

/**
 * Parse the `top_values` object returned by `stats/devices/{property}`.
 *
 * The API returns a plain object where each key is a device type and
 * the value is the view count, e.g.:
 * ```json
 * { "desktop": 1000, "mobile": 800, "tablet": 90 }
 * ```
 *
 * Items are sorted descending by view count.
 *
 * @param topValues - Raw top_values object from the API.
 * @return Normalized device items.
 */
function parseTopValues( topValues: Record< string, unknown > ): StatsDevicesItem[] {
	return Object.entries( topValues )
		.map( ( [ key, value ] ) => ( {
			label: key,
			views: safeParseFloat( value ),
			children: null as null,
		} ) )
		.filter( item => item.label )
		.sort( ( a, b ) => b.views - a.views );
}

/**
 * Normalize a `stats/devices/{property}` response into the shared
 * `StatsNormalizedReport` shape.
 *
 * Actual API shape:
 * ```json
 * { "top_values": { "desktop": 1000, "mobile": 800, "tablet": 90 } }
 * ```
 *
 * `top_values` is a plain object (dict), not an array.
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
	const topValues = coerceStatsRecord( payload.top_values );
	const items = parseTopValues( topValues );

	return {
		summary: normalizeStatsReportSummary( response, query ),
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}

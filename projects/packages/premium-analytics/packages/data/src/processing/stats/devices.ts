/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord, createStatsListDataPoint, normalizeStatsReportSummary } from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

/**
 * A single normalized device percentage row.
 *
 * `label` is the raw device key returned by the API (e.g. 'desktop',
 * 'mobile', 'tablet', or a browser/OS name); callers are responsible
 * for mapping to display strings.
 */
export interface StatsDevicesItem extends StatsNormalizedItemBase {
	label: string;
	percentage: number;
	children: null;
}

/**
 * Parse the `top_values` object returned by `stats/devices/{property}`.
 *
 * The API returns a plain object where each key is a device type and
 * the value is that type's percentage share, e.g.:
 * ```json
 * { "desktop": 85.9, "mobile": 13.5, "tablet": 0.5 }
 * ```
 *
 * Items are sorted descending by percentage share.
 *
 * @param topValues - Raw top_values object from the API.
 * @return Normalized device items.
 */
function parseTopValues( topValues: Record< string, unknown > ): StatsDevicesItem[] {
	return Object.entries( topValues )
		.map( ( [ key, value ] ) => ( {
			label: key,
			percentage: safeParseFloat( value ),
			children: null as null,
		} ) )
		.filter( item => item.label )
		.sort( ( a, b ) => b.percentage - a.percentage );
}

/**
 * Normalize a `stats/devices/{property}` response into the shared
 * `StatsNormalizedReport` shape.
 *
 * Actual API shape:
 * ```json
 * { "top_values": { "desktop": 85.9, "mobile": 13.5, "tablet": 0.5 } }
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

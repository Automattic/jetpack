/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsRecord,
	createStatsListDataPoint,
	getStatsBuckets,
	getStatsIntervalFields,
	getStatsTopLevelPeriod,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

/**
 * A single normalized device-views row.
 *
 * `label` is the raw device type key returned by the API (e.g. 'desktop',
 * 'mobile', 'tablet'); callers are responsible for mapping to display strings.
 */
export interface StatsDevicesItem extends StatsNormalizedItemBase {
	label: string;
	views: number;
	children: null;
}

/**
 * Convert the flat `{ desktop: N, mobile: N, tablet: N }` breakdown object
 * the Stats API returns under `days[date].views` (or `summary.views`) into an
 * array of normalized items, sorted descending by view count.
 *
 * Keys `views` (the scalar total) and `other_views` are excluded because
 * they are aggregate fields, not individual breakdown rows.
 */
function parseDeviceBreakdown( record: Record< string, unknown > ): StatsDevicesItem[] {
	const excluded = new Set( [ 'views', 'other_views' ] );

	return Object.entries( record )
		.filter( ( [ key ] ) => ! excluded.has( key ) )
		.map( ( [ key, value ] ) => ( {
			label: key,
			views: safeParseFloat( value ),
			children: null as null,
		} ) )
		.sort( ( a, b ) => b.views - a.views );
}

/**
 * Normalize a `stats/devices/{property}` response into the shared
 * `StatsNormalizedReport` shape.
 *
 * Assumed API shape (v1.1, non-summarized):
 * ```json
 * {
 *   "date": "2026-06-24",
 *   "period": "day",
 *   "days": {
 *     "2026-06-24": {
 *       "views": { "desktop": 1000, "mobile": 800, "tablet": 90 },
 *       "other_views": 0
 *     }
 *   }
 * }
 * ```
 *
 * Assumed API shape (summarize=true):
 * ```json
 * { "summary": { "views": { "desktop": 1000, "mobile": 800, "tablet": 90 } } }
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

	if ( query?.summarize ) {
		const summary = coerceStatsRecord( payload.summary );
		const viewsBreakdown = coerceStatsRecord( summary.views );
		const items = parseDeviceBreakdown( viewsBreakdown );

		return {
			summary: normalizeStatsReportSummary( response, query, [ 'views' ] ),
			data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
		};
	}

	const period = getStatsTopLevelPeriod( response, query );

	const data = getStatsBuckets( response, query ).map( ( [ date, bucket ] ) => {
		const viewsBreakdown = coerceStatsRecord( bucket.views );
		const items = parseDeviceBreakdown( viewsBreakdown );

		return {
			...getStatsIntervalFields( date, period ),
			items,
		};
	} );

	return {
		summary: normalizeStatsReportSummary( response, query ),
		data,
	};
}

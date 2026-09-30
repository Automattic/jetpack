/**
 * External dependencies
 */
import { computeDateRangeFromPreset, normalizeReportParams } from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import {
	REPORT_DATE_PARAM_KEYS,
	pickReportOriginWindowParams,
	toReportOriginWindowParams,
} from '@jetpack-premium-analytics/routing';

type NormalizeInput = Parameters< typeof normalizeReportParams >[ 0 ];

/**
 * The date params a post or video detail route seeds its URL with.
 *
 * A link into the page opens it on all time, keeping the linking page's window
 * for the breadcrumbs; a reload or an in-page change keeps the page's own range.
 * The all-time start is provisional until `useDetailDateControls` anchors it.
 *
 * @param search    - The current route search params.
 * @param isArrival - Whether the search came from a link into the page rather than the page itself.
 * @return The normalized report params plus the origin-window params.
 */
export function seedDetailDateParams(
	search: Record< string, unknown >,
	isArrival: boolean
): Record< string, unknown > {
	if ( ! isArrival ) {
		return {
			...normalizeReportParams( search as NormalizeInput ),
			...pickReportOriginWindowParams( search ),
		};
	}

	const withoutWindow = { ...search };
	for ( const key of REPORT_DATE_PARAM_KEYS ) {
		delete withoutWindow[ key ];
	}
	const allTime = computeDateRangeFromPreset( PRESET_ALL_TIME );

	return {
		...normalizeReportParams( {
			...withoutWindow,
			preset: PRESET_ALL_TIME,
			from: allTime?.from,
			to: allTime?.to,
		} as NormalizeInput ),
		...toReportOriginWindowParams( search ),
	};
}

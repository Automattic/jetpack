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
 * A link in opens the page on all time and keeps the linking window for the breadcrumbs;
 * a reload keeps the page's own range. `useDetailDateControls` anchors the all-time start.
 *
 * @param search     - The current route search params.
 * @param resourceId - The page's entity ID. Links never carry it under the scope param, so
 *                   a missing or mismatched one marks an arrival.
 * @param scopeParam - The search param the page keeps its entity ID under.
 * @return The normalized report params plus the origin-window params.
 */
export function seedDetailDateParams(
	search: Record< string, unknown >,
	resourceId: string,
	scopeParam = 'post_id'
): Record< string, unknown > {
	if ( search[ scopeParam ] === resourceId ) {
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

/**
 * External dependencies
 */
import {
	computeDateRangeFromPreset,
	normalizeReportParams,
	type LockableInterval,
} from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import {
	omitReportDateParams,
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
 * @param search          - The current route search params.
 * @param resourceId      - The page's post or video ID. Links never carry it as `post_id`, so a
 *                        missing or mismatched one marks an arrival.
 * @param lockedIntervals - The buckets the plan locks.
 * @return The normalized report params plus the origin-window params.
 */
export function seedDetailDateParams(
	search: Record< string, unknown >,
	resourceId: string,
	lockedIntervals?: readonly LockableInterval[]
): Record< string, unknown > {
	if ( search.post_id === resourceId ) {
		return {
			...normalizeReportParams( search as NormalizeInput, undefined, { lockedIntervals } ),
			...pickReportOriginWindowParams( search ),
		};
	}

	const withoutWindow = omitReportDateParams( search );
	const allTime = computeDateRangeFromPreset( PRESET_ALL_TIME );

	return {
		...normalizeReportParams(
			{
				...withoutWindow,
				preset: PRESET_ALL_TIME,
				from: allTime?.from,
				to: allTime?.to,
			} as NormalizeInput,
			undefined,
			{ lockedIntervals }
		),
		...toReportOriginWindowParams( search ),
	};
}

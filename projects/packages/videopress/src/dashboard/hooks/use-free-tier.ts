import { isWoASite } from '@automattic/jetpack-script-data';
import { useIsVideoPressUnlimited } from './use-is-videopress-unlimited';
import { useLibrary } from './use-library';
import { useUpload } from './use-upload';
import type { View } from '@wordpress/dataviews';

export type FreeTierState = {
	isFree: boolean;
	isAtomic: boolean;
	isUnlimited: boolean;
	videoCount: number;
	limit: number;
	isAtLimit: boolean;
};

const FREE_TIER_UPLOAD_LIMIT = 1;

// Minimal View used only to read totalItems from the listing query.
// `perPage: 1` keeps the payload tiny. The `type: 'videopress'` filter
// is load-bearing: the free-tier upload cap applies to VideoPress-hosted
// videos only, not to local video attachments, so the count must
// exclude them — otherwise a site with even one local (non-VideoPress)
// video attachment would falsely gate a free user's first upload.
const COUNT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 1,
	fields: [],
	filters: [ { field: 'type', value: 'videopress', operator: 'is' } ],
	search: '',
	sort: { field: 'date', direction: 'desc' },
};

/**
 * Free-tier state derived from real data sources: server-side library
 * count via useLibrary, in-flight uploads via useUpload, plan-tier flags
 * via useFeatures + Initial State, and atomic via script-data.
 *
 * @return Free-tier state.
 */
export function useFreeTier(): FreeTierState {
	const { paginationInfo } = useLibrary( COUNT_VIEW );
	const { uploadQueue } = useUpload();
	const siteData =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.siteData
			: undefined;

	const isFree = ! siteData?.hasVideoPressAccess;

	const completed = paginationInfo?.totalItems ?? 0;
	const inFlight = uploadQueue.filter(
		u => u.status === 'uploading' || u.status === 'pending'
	).length;
	const videoCount = completed + inFlight;

	const isAtomic = isWoASite();
	const isUnlimited = useIsVideoPressUnlimited();

	// Only the free, non-unlimited tier is capped. `isUnlimited` (grandfathered
	// 2TB plans) and paid access come from signals independent of `isFree`, so
	// guard against an "unlimited yet free-flagged" combination wrongly gating
	// uploads.
	const isAtLimit = isFree && ! isUnlimited && videoCount >= FREE_TIER_UPLOAD_LIMIT;

	return {
		isFree,
		isAtomic,
		isUnlimited,
		videoCount,
		limit: FREE_TIER_UPLOAD_LIMIT,
		isAtLimit,
	};
}

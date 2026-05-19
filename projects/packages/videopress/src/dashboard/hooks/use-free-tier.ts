import { isWoASite } from '@automattic/jetpack-script-data';
import { useFeatures } from './use-features';
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
// `perPage: 1` keeps the payload tiny.
const COUNT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 1,
	fields: [],
	filters: [],
	search: '',
	sort: { field: 'date', direction: 'desc' },
};

type Override = boolean | null;

/**
 * Parse a `?vp_free=…` / `?vp_at_limit=…`-style query param into a
 * tri-state override: `true` when present and truthy, `false` when
 * present and falsy, `null` when absent.
 *
 * Designer/QA toggles are read once on first call and frozen. They are
 * deliberately non-reactive because they require a full page reload to
 * change in practice.
 *
 * @param search - The query string (with or without leading `?`).
 * @param key    - Param name to read.
 * @return The override, or `null` when absent.
 */
function parseOverride( search: string, key: string ): Override {
	const params = new URLSearchParams( search );
	if ( ! params.has( key ) ) {
		return null;
	}
	const raw = params.get( key );
	if ( raw === null ) {
		return null;
	}
	const normalized = raw.toLowerCase();
	return ! ( normalized === '0' || normalized === 'false' || normalized === '' );
}

const SEARCH = typeof window === 'undefined' ? '' : window.location.search;
const FREE_OVERRIDE: Override = parseOverride( SEARCH, 'vp_free' );
const AT_LIMIT_OVERRIDE: Override = parseOverride( SEARCH, 'vp_at_limit' );

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
	const features = useFeatures();
	const siteData =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.siteData
			: undefined;

	const isFree = FREE_OVERRIDE !== null ? FREE_OVERRIDE : ! siteData?.hasVideoPressAccess;

	const completed = paginationInfo?.totalItems ?? 0;
	const inFlight = uploadQueue.filter(
		u => u.status === 'uploading' || u.status === 'pending'
	).length;
	const realVideoCount = completed + inFlight;
	const videoCount = AT_LIMIT_OVERRIDE === true ? FREE_TIER_UPLOAD_LIMIT : realVideoCount;

	const isAtomic = isWoASite();
	const isUnlimited = Boolean(
		siteData?.isVideoPressUnlimited || features.data?.isVideoPressUnlimitedSupported
	);

	const isAtLimit = isFree && videoCount >= FREE_TIER_UPLOAD_LIMIT;

	return {
		isFree,
		isAtomic,
		isUnlimited,
		videoCount,
		limit: FREE_TIER_UPLOAD_LIMIT,
		isAtLimit,
	};
}

import { useFeatures } from './use-features';

/**
 * Whether the site is grandfathered into the larger (2TB) VideoPress storage
 * cap. WPCOM grants the `videopress-unlimited-storage` feature to Jetpack
 * Premium/Business/Security/Complete plans purchased before 2021-10-07, and
 * that tier is physically capped at 2TB. The signal arrives two ways: a
 * synchronous initial-state value (so the storage meter shows the right
 * denominator on first paint) and the features REST flag as a fallback.
 *
 * @return `true` when the site holds the unlimited (2TB) storage feature.
 */
export function useIsVideoPressUnlimited(): boolean {
	const features = useFeatures();
	const siteData =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.siteData
			: undefined;
	return Boolean(
		siteData?.isVideoPressUnlimited || features.data?.isVideoPressUnlimitedSupported
	);
}

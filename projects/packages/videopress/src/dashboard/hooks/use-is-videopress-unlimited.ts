/**
 * Whether the site is grandfathered into the larger (2TB) VideoPress storage
 * cap. WPCOM grants the `videopress-unlimited-storage` feature to Jetpack
 * Premium/Business/Security/Complete plans purchased before 2021-10-07, and
 * that tier is physically capped at 2TB.
 *
 * Read from the boot payload only: `Initial_State` computes it from the same
 * `Product::get_site_features_from_wpcom()` source (and 15s transient) the
 * old `/videopress/v1/features` fallback re-fetched moments after boot, so
 * the REST round-trip added nothing but a second copy of the flag.
 *
 * @return `true` when the site holds the unlimited (2TB) storage feature.
 */
export function useIsVideoPressUnlimited(): boolean {
	const siteData =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.siteData
			: undefined;
	return Boolean( siteData?.isVideoPressUnlimited );
}

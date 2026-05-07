/**
 * Reads the Protect Scan v2 feature flag.
 *
 * Truthy when EITHER:
 * the PHP constant JETPACK_PROTECT_SCAN_V2 is defined truthy
 * (hydrated as `scanV2Enabled` on initial state), OR
 * the URL has `?protect-scan-v2=1`.
 */
type ProtectInitialState = {
	scanV2Enabled?: boolean;
};

declare const window: Window & {
	jetpackProtectInitialState?: ProtectInitialState;
};

/**
 * Returns whether the Protect Scan v2 feature flag is enabled.
 *
 * @return True when either the PHP constant or the URL flag is set.
 */
export default function useScanV2Enabled(): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}

	const fromConstant = Boolean( window.jetpackProtectInitialState?.scanV2Enabled );
	const fromUrl = new URLSearchParams( window.location.search ).has( 'protect-scan-v2' );
	return fromConstant || fromUrl;
}

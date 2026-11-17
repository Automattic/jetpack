import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * What the Settings tab's Ads card needs from the server, printed by the Jetpack plugin's `Jetpack_Ads_Settings_Home`.
 */
export interface AdsSettingsData {
	hasWordAds: boolean;
	hasConnectedOwner: boolean;
	isSubdirectorySite: boolean;
	/** Set when the host forces WordAds on or off through `jetpack_active_modules`. */
	moduleOverride: 'active' | 'inactive' | false;
}

type MonetizeScriptData = { monetize?: { adsSettings?: AdsSettingsData } };

/**
 * The Ads card's data, absent wherever the Jetpack plugin doesn't print it.
 *
 * @return The data, or undefined.
 */
export function getAdsSettingsData(): AdsSettingsData | undefined {
	return ( getScriptData() as MonetizeScriptData | undefined )?.monetize?.adsSettings;
}

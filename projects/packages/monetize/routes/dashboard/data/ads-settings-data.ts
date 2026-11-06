import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * What the Settings tab needs from the server, printed by the Jetpack plugin's `Jetpack_Ads_Settings_Home`.
 */
export interface AdsSettingsData {
	hasWordAds: boolean;
	hasConnectedOwner: boolean;
	upgradeUrl: string;
	earningsUrl: string;
	isSubdirectorySite: boolean;
}

type MonetizeScriptData = { monetize?: { adsSettings?: AdsSettingsData } };

/**
 * The Settings tab's data, absent wherever the Ads settings don't live on this page.
 *
 * @return The data, or undefined.
 */
export function getAdsSettingsData(): AdsSettingsData | undefined {
	return ( getScriptData() as MonetizeScriptData | undefined )?.monetize?.adsSettings;
}

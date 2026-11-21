import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import { getSectionState } from './state';

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
 * Simple never runs that plugin code, so there the card's data comes from the Ads section's state.
 *
 * @return The data, or undefined.
 */
export function getAdsSettingsData(): AdsSettingsData | undefined {
	if ( isSimpleSite() ) {
		const ads = getSectionState< { hasWordAds?: boolean } >( 'ads' );
		return (
			ads && {
				hasWordAds: Boolean( ads.hasWordAds ),
				hasConnectedOwner: true,
				isSubdirectorySite: false,
				moduleOverride: false,
			}
		);
	}

	return ( getScriptData() as MonetizeScriptData | undefined )?.monetize?.adsSettings;
}

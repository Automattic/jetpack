import { getScriptData } from '@automattic/jetpack-script-data';
import type { AdsSettingsData } from './ads-settings-data';

type MonetizeScriptData = {
	monetize?: {
		sections?: Record< string, unknown >;
		upgradeUrl?: string;
		tracks?: boolean;
		/** Printed by the Jetpack plugin, not this package. */
		adsSettings?: AdsSettingsData;
	};
};

/**
 * What `Dashboard::add_script_data()` prints for the whole page.
 */
export interface PageData {
	/** Where the page's upgrade links go. */
	upgradeUrl: string;
	/** Whether the site and user allow Tracks. */
	tracks: boolean;
}

/**
 * The `monetize` script data.
 *
 * @return The data, or undefined when PHP printed none.
 */
export function getMonetizeData() {
	return ( getScriptData() as MonetizeScriptData | undefined )?.monetize;
}

/**
 * The state PHP added for a section to `JetpackScriptData.monetize.sections`.
 *
 * @param key - The section's key.
 * @return The section's state, or undefined when the section isn't registered.
 */
export function getSectionState< T >( key: string ): T | undefined {
	return getMonetizeData()?.sections?.[ key ] as T | undefined;
}

/**
 * What every tab shares, with no upgrade link and no Tracks if PHP printed none.
 *
 * @return The page data.
 */
export function getPageData(): PageData {
	const data = getMonetizeData();
	return { upgradeUrl: data?.upgradeUrl ?? '', tracks: Boolean( data?.tracks ) };
}

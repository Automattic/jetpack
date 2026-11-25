import { select, useSelect } from '@wordpress/data';
import getOverview from './get-overview';
import { settingsStore } from './settings-store';
import type { SettingsResponse } from './settings-types';

/**
 * Read the `seo-tools` state from the settings store, which the SEO tools switch
 * updates, falling back to the page's Overview snapshot.
 *
 * Treats a missing bootstrap as inactive, so SEO-dependent controls stay hidden
 * until the module state is known. Independent settings remain available.
 *
 * @param settings - The settings store's snapshot.
 * @return Whether the `seo-tools` module is active.
 */
const readSeoToolsActive = ( settings: SettingsResponse | null ): boolean =>
	settings?.seo_tools_active ?? getOverview()?.site_visibility.seo_tools_active ?? false;

/**
 * Whether the `seo-tools` Jetpack module is active for this site, for route guards
 * and other code outside React.
 *
 * @return Whether the `seo-tools` module is active.
 */
export default function isSeoToolsActive(): boolean {
	return readSeoToolsActive( select( settingsStore ).getSettings() );
}

/**
 * Whether the `seo-tools` Jetpack module is active, re-rendering when the switch changes it.
 *
 * @return Whether the `seo-tools` module is active.
 */
export function useSeoToolsActive(): boolean {
	return readSeoToolsActive( useSelect( s => s( settingsStore ).getSettings(), [] ) );
}

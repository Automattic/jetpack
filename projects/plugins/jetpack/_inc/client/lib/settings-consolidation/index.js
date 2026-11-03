import { getScriptData } from '@automattic/jetpack-script-data';
import { userCanManageModules } from 'state/initial-state';

/**
 * Whether settings move out of the Settings screen: the `my-jetpack-settings-consolidation` flag is on and My Jetpack is available.
 *
 * My Jetpack sets the value; an older My Jetpack leaves it out, which reads as off.
 *
 * @return {boolean} True when settings move out of this screen.
 */
export const isSettingsConsolidationEnabled = () =>
	Boolean( getScriptData()?.myJetpack?.settingsConsolidation );

/**
 * Modules whose Settings card is gone once settings move out, with no pointer left, so a search for them finds nothing here.
 *
 * @return {string[]} Module slugs, none while the flag is off.
 */
export function getMovedOutModules() {
	return isSettingsConsolidationEnabled() ? [ 'earn' ] : [];
}

/**
 * Whether a module's Settings card is gone once settings move out.
 *
 * @param {string} module - Module slug.
 * @return {boolean} True when the card no longer renders.
 */
export const isMovedOut = module => getMovedOutModules().includes( module );

/**
 * Whether a module's Settings toggle gives way to its switch in My Jetpack › Features, leaving only a search result that points there.
 *
 * Users who cannot manage modules have no Features, so they keep the toggle.
 *
 * @param {object} state  - Global state tree.
 * @param {string} module - Module slug.
 * @return {boolean} True when Features switches the module instead.
 */
export function isSwitchedInFeatures( state, module ) {
	return (
		isSettingsConsolidationEnabled() &&
		userCanManageModules( state ) &&
		[ 'blocks', 'copy-post', 'latex', 'shortcodes' ].includes( module )
	);
}

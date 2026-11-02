import { getScriptData } from '@automattic/jetpack-script-data';

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
 * Modules whose Settings card is gone once settings move out, so a search for them finds nothing here.
 *
 * @param {boolean} canManageModules - Whether the user can manage modules; other users keep the Social card.
 * @return {string[]} Module slugs, none while the flag is off.
 */
export function getMovedOutModules( canManageModules ) {
	if ( ! isSettingsConsolidationEnabled() ) {
		return [];
	}
	return [ 'blaze', 'earn', ...( canManageModules ? [ 'publicize' ] : [] ) ];
}

/**
 * Whether a module's Settings card is gone once settings move out.
 *
 * @param {string}  module           - Module slug.
 * @param {boolean} canManageModules - Whether the user can manage modules.
 * @return {boolean} True when the card no longer renders.
 */
export const isMovedOut = ( module, canManageModules ) =>
	getMovedOutModules( canManageModules ).includes( module );

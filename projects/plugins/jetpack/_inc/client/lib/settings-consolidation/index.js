import { getScriptData } from '@automattic/jetpack-script-data';
import { currentThemeIsBlockTheme, userCanManageModules } from 'state/initial-state';
import { isModuleActivated } from 'state/modules';

// The modules behind the Writing tab's Widgets card, in card order.
export const WIDGET_MODULES = [ 'widgets', 'widget-visibility' ];

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
 * @param {object} [state] - Global state tree, which adds the modules gone for this site and user.
 * @return {string[]} Module slugs, none while the flag is off.
 */
export function getMovedOutModules( state ) {
	if ( ! isSettingsConsolidationEnabled() ) {
		return [];
	}

	// Features hides these while they are off, so a pointer there would find nothing.
	const hiddenInFeatures = state
		? WIDGET_MODULES.filter(
				module =>
					isSwitchedInFeatures( state, module ) &&
					isDeprecatedInFeatures( state, module ) &&
					! isModuleActivated( state, module )
			)
		: [];

	return [ 'earn', ...hiddenInFeatures ];
}

/**
 * Whether a module's Settings card is gone once settings move out.
 *
 * @param {string} module  - Module slug.
 * @param {object} [state] - Global state tree, as for getMovedOutModules().
 * @return {boolean} True when the card no longer renders.
 */
export const isMovedOut = ( module, state ) => getMovedOutModules( state ).includes( module );

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
	if ( ! isSettingsConsolidationEnabled() || ! userCanManageModules( state ) ) {
		return false;
	}

	return [ 'blocks', 'copy-post', 'latex', 'shortcodes', ...WIDGET_MODULES ].includes( module );
}

/**
 * Whether Features lists a module only to switch it off, with no settings link: the widget modules on a block theme.
 *
 * Mirrors `Feature_Visibility::get_deprecated_modules()` in My Jetpack.
 *
 * @param {object} state  - Global state tree.
 * @param {string} module - Module slug.
 * @return {boolean} True when Features treats the module as deprecated.
 */
export function isDeprecatedInFeatures( state, module ) {
	return currentThemeIsBlockTheme( state ) && WIDGET_MODULES.includes( module );
}

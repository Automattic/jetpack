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

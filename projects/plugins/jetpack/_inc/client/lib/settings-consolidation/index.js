import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether the `my-jetpack-settings-consolidation` flag is on, which moves settings out of the Settings screen.
 *
 * My Jetpack sets the value; an older My Jetpack leaves it out, which reads as off.
 *
 * @return {boolean} True when settings move out of this screen.
 */
export const isSettingsConsolidationEnabled = () =>
	Boolean( getScriptData()?.myJetpack?.settingsConsolidation );

import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether settings move into My Jetpack: the server's flag, already joined with the page being available.
 *
 * @return True when Configure opens the settings panel.
 */
export function isSettingsConsolidationEnabled(): boolean {
	return Boolean( getScriptData()?.myJetpack?.settingsConsolidation );
}

/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Check whether CSV exports are enabled by the server-side feature gate.
 *
 * Exports default to enabled so a missing flag cannot hide the shipped UI.
 * The server may explicitly return false as a kill switch.
 *
 * @return Whether CSV exports are enabled.
 */
export function isCsvExportEnabled(): boolean {
	return getScriptData()?.premium_analytics?.csv_exports_enabled !== false;
}

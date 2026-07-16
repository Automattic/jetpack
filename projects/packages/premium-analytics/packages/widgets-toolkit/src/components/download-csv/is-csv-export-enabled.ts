/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Check whether CSV exports are enabled by the server-side feature gate.
 *
 * @return Whether CSV exports are enabled.
 */
export function isCsvExportEnabled(): boolean {
	return getScriptData()?.premium_analytics?.csv_exports_enabled === true;
}

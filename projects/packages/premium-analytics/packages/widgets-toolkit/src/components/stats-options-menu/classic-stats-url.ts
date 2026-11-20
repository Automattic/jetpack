/**
 * External dependencies
 */
import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';

/**
 * Where switching the dashboard off sends the reader: the classic Stats page, as the server
 * publishes it, or null while no plugin registers one.
 *
 * A server that predates the key gets the page at its historic address, so the shipped UI keeps working.
 *
 * @return The classic Stats page URL, or null.
 */
export function getClassicStatsUrl(): string | null {
	const url = getScriptData()?.premium_analytics?.classic_stats_url;

	return url === undefined ? getAdminUrl( 'admin.php?page=stats' ) : url;
}

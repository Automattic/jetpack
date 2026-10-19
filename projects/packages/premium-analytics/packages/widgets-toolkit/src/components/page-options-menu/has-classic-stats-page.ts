/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether the site still has a classic Stats page, which is where switching the dashboard off
 * sends the reader.
 *
 * Defaults to true, so a server that predates the flag keeps the shipped UI.
 *
 * @return Whether there is a classic Stats page to return to.
 */
export function hasClassicStatsPage(): boolean {
	return getScriptData()?.premium_analytics?.has_classic_stats_page !== false;
}

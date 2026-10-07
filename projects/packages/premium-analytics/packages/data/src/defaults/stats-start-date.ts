/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';

/**
 * The day Stats counts from, as the host sends it on the dashboard page.
 *
 * @return The start of that day in the site timezone, or undefined when the host did not send it.
 */
export function getStatsStartDate(): Date | undefined {
	return parseSiteDateTime( getScriptData()?.premium_analytics?.stats_start_date );
}

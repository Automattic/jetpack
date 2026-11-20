/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether to offer feedback: only to readers who may see Stats, and only until classic Stats is retired.
 *
 * Defaults to true, so a server that predates either key keeps the shipped UI.
 *
 * @return Whether to offer feedback.
 */
export function canSendFeedback(): boolean {
	const data = getScriptData()?.premium_analytics;

	return data?.can_view_stats !== false && data?.classic_stats_retired !== true;
}

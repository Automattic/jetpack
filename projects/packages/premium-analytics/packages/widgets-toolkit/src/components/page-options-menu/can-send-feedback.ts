/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Whether the reader may send feedback, which posts to a Stats endpoint.
 *
 * Defaults to true, so a server that predates the flag keeps the shipped UI.
 *
 * @return Whether to offer feedback.
 */
export function canSendFeedback(): boolean {
	return getScriptData()?.premium_analytics?.can_view_stats !== false;
}

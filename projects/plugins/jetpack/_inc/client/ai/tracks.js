/**
 * Tracks helpers for the Jetpack AI admin page (jetpack_ai_* events).
 * The Settings tab's MCP events keep their own wrapper in ./mcp/tracks.js.
 */

import { getSiteType } from '@automattic/jetpack-script-data';
import analytics from 'lib/analytics';

export const EVENTS = {
	VIEWED: 'jetpack_ai_hub_viewed',
	LINK_CLICK: 'jetpack_ai_hub_link_click',
	FEATURE_TOGGLED: 'jetpack_ai_feature_toggled',
	DISCOVER_FILTERED: 'jetpack_ai_hub_discover_filtered',
	DISCOVER_SKILL_VIEWED: 'jetpack_ai_hub_discover_skill_viewed',
	DISCOVER_SKILL_SENT: 'jetpack_ai_hub_discover_skill_sent',
};

/**
 * Record a Tracks event for the AI page with the standard site and audience
 * props. is_a11n and is_test come from the page data, as strings, matching
 * the jetpack_mcp_* events.
 *
 * @param {string} eventName - Tracks event name.
 * @param {object} props     - Event properties.
 */
export function recordAiHubEvent( eventName, props = {} ) {
	const { isA11n = false, isTest = false } = window?.jetpackAiSettings ?? {};

	analytics.tracks.recordEvent( eventName, {
		site_type: getTrackingSiteType(),
		is_a11n: isA11n ? 'true' : 'false',
		is_test: isTest ? 'true' : 'false',
		...props,
	} );
}

/**
 * Site type in the Data-team spelling used by the other AI events
 * (Image Studio, ai-client): simple | atomic | jetpack.
 *
 * @return {string} The site type.
 */
export function getTrackingSiteType() {
	const type = getSiteType();
	return type === 'woa' ? 'atomic' : type;
}

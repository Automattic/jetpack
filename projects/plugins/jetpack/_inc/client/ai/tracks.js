/**
 * Tracks helpers for the Jetpack AI admin page (jetpack_ai_* events).
 * The MCP tab keeps its own wrapper in ./mcp/tracks.js.
 */

import { getSiteType } from '@automattic/jetpack-script-data';
import { useEffect, useRef } from '@wordpress/element';
import analytics from 'lib/analytics';

export const EVENTS = {
	VIEWED: 'jetpack_ai_hub_viewed',
	LINK_CLICK: 'jetpack_ai_hub_link_click',
	FEATURE_TOGGLED: 'jetpack_ai_feature_toggled',
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

/**
 * Record an event once per mount, with the props as they were at mount.
 *
 * @param {string} eventName - Tracks event name.
 * @param {object} props     - Event properties.
 */
export function useRecordOnce( eventName, props = {} ) {
	const propsRef = useRef( props );
	useEffect( () => {
		recordAiHubEvent( eventName, propsRef.current );
	}, [ eventName ] );
}

/**
 * Tracks helpers for the Jetpack AI admin page (jetpack_ai_* events).
 * The MCP tab keeps its own wrapper in ./mcp/tracks.js.
 */

import { useEffect, useRef } from '@wordpress/element';
import analytics from 'lib/analytics';

export const EVENTS = {
	VIEWED: 'jetpack_ai_hub_viewed',
	LINK_CLICK: 'jetpack_ai_hub_link_click',
};

/**
 * Record a Tracks event for the AI page.
 *
 * @param {string} eventName - Tracks event name.
 * @param {object} props     - Event properties.
 */
export function recordAiHubEvent( eventName, props = {} ) {
	analytics.tracks.recordEvent( eventName, props );
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

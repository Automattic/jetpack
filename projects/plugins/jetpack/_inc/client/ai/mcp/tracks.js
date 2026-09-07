/**
 * Tracks wrapper for the jetpack_mcp_* events.
 *
 * Merges the AI-product-standard audience properties into every MCP event so
 * events added later inherit them, matching TracksPropsHelper::audience_props()
 * in wpcom (AIINT-586) and useMcpTracksAudienceProps() in wp-calypso:
 *
 * - is_a11n is identity, not access — the user is an Automattician, regardless
 * of the MCP allowlist.
 * - is_test is environment only — an internal testing environment (localhost,
 * sandbox, proxied request), regardless of who made the request.
 *
 * Both are computed server-side by Jetpack_AI_Page and ride the
 * jetpackAiSettings global, and both are sent as the strings 'true'/'false'
 * per the AIINT-576 encoding cutover.
 *
 * ai_session_id is deliberately absent: these events fire from browser UI with
 * no agent session in scope, so the property would be 'none' on every row.
 */

import analytics from 'lib/analytics';

/**
 * Record a jetpack_mcp_* Tracks event with the audience properties merged in.
 *
 * Reads jetpackAiSettings at call time, not module scope, so tests and late
 * injections see current values.
 *
 * @param {string} eventName       - Tracks event name (jetpack_mcp_*).
 * @param {object} eventProperties - Event-specific properties.
 */
export function recordMcpTracksEvent( eventName, eventProperties = {} ) {
	const { isA11n = false, isTest = false } = window?.jetpackAiSettings ?? {};

	analytics.tracks.recordEvent( eventName, {
		is_a11n: isA11n ? 'true' : 'false',
		is_test: isTest ? 'true' : 'false',
		...eventProperties,
	} );
}

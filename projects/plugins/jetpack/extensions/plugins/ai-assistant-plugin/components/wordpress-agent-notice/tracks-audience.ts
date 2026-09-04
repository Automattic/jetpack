/**
 * Audience properties for the notice's Tracks events, sourced from the same
 * server-provided signals the `jetpack_big_sky_*` family recorder reads, so the
 * notice's rows filter and join like the rest of the family. is_a11n is
 * identity (Automattician or proxied request), omitted when the payload does
 * not carry it and never coerced to false. is_test is environment only.
 */

type AgentsManagerInlineData = {
	isA11n?: boolean;
	isDevMode?: boolean;
};

// The Agents Manager injects a bare `const agentsManagerData` global rather
// than a window property; some hosts assign `window.agentsManagerData` instead.
// A bare identifier read resolves either through the scope chain, and the
// typeof guard keeps it safe when neither exists.
declare const agentsManagerData: AgentsManagerInlineData | undefined;

function getAgentsManagerInlineData(): AgentsManagerInlineData | undefined {
	return typeof agentsManagerData !== 'undefined' && agentsManagerData
		? agentsManagerData
		: undefined;
}

export type TracksAudienceProperties = {
	is_test: boolean;
	is_a11n?: boolean;
};

/**
 * Read the audience signals the server injected for this request.
 *
 * `is_test` ORs the Agents Manager and Big Sky dev-mode signals, matching the
 * family recorder's getIsTest() in wp-calypso's agents-manager package.
 *
 * @return {TracksAudienceProperties} Audience properties for a Tracks event.
 */
export function getTracksAudienceProperties(): TracksAudienceProperties {
	const inlineData = getAgentsManagerInlineData();
	// Big Sky injects string flags; truthiness matches the family recorder's read.
	const bigSkyDevMode = !! (
		window as Window & { bigSkyInitialState?: { isDevMode?: boolean | string } }
	 ).bigSkyInitialState?.isDevMode;

	return {
		is_test: !! inlineData?.isDevMode || bigSkyDevMode,
		...( typeof inlineData?.isA11n === 'boolean' ? { is_a11n: inlineData.isA11n } : {} ),
	};
}

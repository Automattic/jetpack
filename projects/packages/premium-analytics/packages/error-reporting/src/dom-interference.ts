// Each probe keys on an artefact only Chromium and extension translators leave behind. Safari and
// Firefox translate text nodes in place with no marker, so an empty result means "undetectable".
const PROBES: Array< [ string, () => boolean ] > = [
	[
		'google-translate',
		() =>
			document.documentElement.classList.contains( 'translated-ltr' ) ||
			document.documentElement.classList.contains( 'translated-rtl' ) ||
			document.querySelector( 'font[style*="vertical-align"]' ) !== null,
	],
	[ 'edge-translate', () => document.querySelector( '[_msttexthash]' ) !== null ],
	[
		'immersive-translate',
		() => document.querySelector( '[class*="immersive-translate"]' ) !== null,
	],
	[
		'grammarly',
		() =>
			document.querySelector(
				'[data-gr-ext-installed], grammarly-extension, grammarly-desktop-integration'
			) !== null,
	],
	[ 'dark-reader', () => document.querySelector( 'style.darkreader' ) !== null ],
];

/**
 * Names the page-mutating agents active at error time, which reparent React-managed text nodes and
 * crash the commit phase with a `NotFoundError` from `insertBefore` that is not our bug.
 *
 * @return The detected agents, comma separated, or undefined when none were detected.
 */
export function detectDomInterference(): string | undefined {
	try {
		const found = PROBES.filter( ( [ , probe ] ) => probe() ).map( ( [ name ] ) => name );

		return found.length > 0 ? found.join( ',' ) : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Shared helpers for parsing VideoPress identifiers and building embed URLs.
 */

/**
 * Matches a VideoPress URL or GUID and captures the GUID. Kept in sync with the
 * `VIDEOPRESS_REGEX` constant on the PHP module class.
 *
 * @type {RegExp}
 */
const VIDEOPRESS_REGEX =
	/^(?:(?:http(?:s)?:\/\/)?(?:www\.)?video(?:\.word)?press\.com\/(?:v|embed)\/)?([a-zA-Z\d]+)(?:.*)?/i;

/**
 * Extracts the VideoPress GUID from a URL or raw id.
 *
 * @param {string} value - The raw URL or video id entered by the user.
 * @return {string} The GUID, or an empty string when no match is found.
 */
export const getVideoPressGuid = value => {
	if ( ! value ) {
		return '';
	}

	return value.match( VIDEOPRESS_REGEX )?.[ 1 ] ?? '';
};

/**
 * Builds the VideoPress embed URL for a GUID, applying only the player options
 * that differ from the VideoPress player defaults (for a clean URL, mirroring the
 * VideoPress block). Kept in sync with `build_embed_url()` in the PHP render trait.
 *
 * @param {string}  guid                  - The VideoPress GUID.
 * @param {object}  [options]             - The player options.
 * @param {boolean} [options.autoplay]    - Whether to autoplay (default off).
 * @param {boolean} [options.loop]        - Whether to loop (default off).
 * @param {boolean} [options.muted]       - Whether to start muted (default off).
 * @param {boolean} [options.controls]    - Whether to show controls (default on).
 * @param {boolean} [options.playsinline] - Whether to play inline (default off).
 * @return {string} The embed URL.
 */
export const getEmbedUrl = ( guid, options = {} ) => {
	const { autoplay, loop, muted, controls = true, playsinline } = options;

	const params = new URLSearchParams();
	if ( autoplay ) {
		params.set( 'autoPlay', '1' );
	}
	if ( loop ) {
		params.set( 'loop', '1' );
	}
	if ( muted ) {
		params.set( 'muted', '1' );
		params.set( 'persistVolume', '0' );
	}
	if ( ! controls ) {
		params.set( 'controls', '0' );
	}
	if ( playsinline ) {
		params.set( 'playsinline', '1' );
	}
	// Always identify the embedder so VideoPress can attribute Divi traffic.
	params.set( 'embedder', 'divi-builder' );

	return `https://videopress.com/embed/${ guid }?${ params.toString() }`;
};

/**
 * Reads a Divi 5 toggle attribute, which stores `'on'`/`'off'` strings, into the
 * player options shape consumed by `getEmbedUrl()`.
 *
 * @param {object} attrs - The module attributes.
 * @return {object} The resolved player options.
 */
export const getPlayerOptions = attrs => {
	const isOn = ( name, defaultValue ) =>
		( attrs?.[ name ]?.innerContent?.desktop?.value ?? ( defaultValue ? 'on' : 'off' ) ) === 'on';

	return {
		autoplay: isOn( 'autoplay', false ),
		loop: isOn( 'loop', false ),
		muted: isOn( 'muted', false ),
		controls: isOn( 'controls', true ),
		playsinline: isOn( 'playsinline', false ),
	};
};

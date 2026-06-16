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
 * Builds the VideoPress embed URL for a GUID.
 *
 * @param {string} guid - The VideoPress GUID.
 * @return {string} The embed URL.
 */
export const getEmbedUrl = guid =>
	`https://videopress.com/embed/${ guid }?autoPlay=0&permalink=0&loop=0&embedder=divi-builder`;

/**
 * Write — pure text / data helpers.
 *
 * Extracted from view.js so they can be unit-tested in isolation. Every export
 * here is a pure function of its arguments: no DOM, no Interactivity API store,
 * no module-level side effects.
 */

// Cap free-text error strings so a pathological message can't bloat the payload.
export const MAX_ERROR_MESSAGE_LENGTH = 200;

/**
 * Check whether raw user input is a bare numeric post ID.
 *
 * @param {string} input - Raw user input from the post picker URL field.
 * @return {number|null} Post ID or null if not a bare numeric string.
 */
export function parsePostId( input ) {
	const trimmed = input.trim();
	if ( /^\d+$/.test( trimmed ) ) return parseInt( trimmed, 10 );
	return null;
}

/**
 * Escape a string for safe interpolation into an HTML attribute value.
 *
 * @param {string} str - Raw string value.
 * @return {string} HTML-attribute-safe string.
 */
export function escapeAttr( str ) {
	return str.replace( /&/g, '&amp;' ).replace( /"/g, '&quot;' );
}

/**
 * Convert an rgb() color string to hex (#rrggbb). Returns the input
 * unchanged if it is not in rgb() format.
 *
 * @param {string} rgb - A CSS color value, e.g. "rgb(214, 54, 56)".
 * @return {string} Hex color string, e.g. "#d63638".
 */
export function rgbToHex( rgb ) {
	const m = rgb.match( /^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/ );
	if ( ! m ) return rgb;
	const hex = i => ( '0' + parseInt( m[ i ], 10 ).toString( 16 ) ).slice( -2 );
	return '#' + hex( 1 ) + hex( 2 ) + hex( 3 );
}

/**
 * Whether `href` is safe to preserve on a pasted link. Allows http(s),
 * mailto, tel, and same-document/relative URLs; everything else (notably
 * `javascript:`, `vbscript:`, and `data:`) is rejected so a pasted link
 * can't smuggle script execution past the sanitizer.
 *
 * @param {string} href - The href value to check.
 * @return {boolean} True when the href is safe to keep.
 */
export function isSafePasteHref( href ) {
	if ( ! href ) return false;
	const trimmed = href.trim();
	if ( ! trimmed ) return false;
	// Relative / same-document / query / fragment URLs have no scheme.
	if ( /^[#/?]/.test( trimmed ) || trimmed.startsWith( './' ) || trimmed.startsWith( '../' ) ) {
		return true;
	}
	return /^(https?:|mailto:|tel:)/i.test( trimmed );
}

/**
 * Convert a YouTube/Vimeo URL to an embeddable URL.
 *
 * @param {string} url - The video URL to convert.
 * @return {string|null} The embeddable URL, or null if not recognized.
 */
export function getEmbedUrl( url ) {
	// YouTube
	let match = url.match(
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
	);
	if ( match ) return 'https://www.youtube.com/embed/' + match[ 1 ];

	// Vimeo
	match = url.match( /vimeo\.com\/(\d+)/ );
	if ( match ) return 'https://player.vimeo.com/video/' + match[ 1 ];

	return null;
}

/**
 * Detect a markdown list shortcut in a paragraph's text.
 *
 * Returns 'ul' for `-`, `*`, or `+`, 'ol' for `1.`, otherwise null. Captured
 * before the trigger space is inserted, so the marker should be the only
 * content — trailing whitespace is allowed to tolerate a stray <br>-only text
 * node that contentEditable can leave in an otherwise-empty block.
 *
 * @param {string} text - The paragraph's text content.
 * @return {'ul'|'ol'|null} The list tag to create, or null.
 */
export function parseMarkdownListShortcut( text ) {
	if ( /^[-*+]\s*$/.test( text ) ) return 'ul';
	if ( /^1\.\s*$/.test( text ) ) return 'ol';
	return null;
}

/**
 * Detect a markdown blockquote shortcut in a paragraph's text.
 *
 * Returns true for a lone `>` marker. Captured before the trigger space is
 * inserted, so the marker should be the only content — trailing whitespace is
 * allowed to tolerate a stray <br>-only text node that contentEditable can
 * leave in an otherwise-empty block, matching parseMarkdownListShortcut.
 *
 * @param {string} text - The paragraph's text content.
 * @return {boolean} Whether the text is a blockquote shortcut.
 */
export function parseMarkdownQuoteShortcut( text ) {
	return /^>\s*$/.test( text );
}

/**
 * Normalize an unknown thrown value into a small, Tracks-friendly descriptor.
 *
 * Handles the shapes `wp.apiFetch` actually rejects with: WP REST errors
 * ( `{ code, message, data: { status } }` ), native/AbortError ( `{ name,
 * message }` ), and non-object throws as a last resort.
 *
 * @param {*} err - The thrown value.
 * @return {{ code: string, status: (number|null), message: string }} Descriptor.
 */
export function describeSaveError( err ) {
	if ( ! err || typeof err !== 'object' ) {
		const raw = err === undefined ? '' : String( err );
		return { code: 'unknown', status: null, message: raw.slice( 0, MAX_ERROR_MESSAGE_LENGTH ) };
	}
	// Prefer the specific REST `code` (always a string, e.g. 'rest_cannot_edit');
	// fall back to `name` ('AbortError', 'TypeError', …). Guard on a string code
	// because a DOMException carries a numeric `.code` (AbortError is 20), which
	// would otherwise shadow the 'AbortError' name and break the timeout message
	// and telemetry error_code.
	const code = ( typeof err.code === 'string' && err.code ) || err.name || 'unknown';
	const status = err.data && typeof err.data.status === 'number' ? err.data.status : null;
	const message = String( err.message || '' ).slice( 0, MAX_ERROR_MESSAGE_LENGTH );
	return { code: String( code ), status, message };
}

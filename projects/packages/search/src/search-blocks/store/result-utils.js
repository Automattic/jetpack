/**
 * Pure helpers for shaping v1.3 Jetpack Search results into the flat form the
 * Interactivity API templates consume. Extracted from store/index.js so they
 * can be unit-tested without bootstrapping the IAPI runtime.
 */

const HTTP_SCHEME_PATTERN = /^https?:\/\//i;
const ANY_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const STRIP_TAGS_PATTERN = /<[^>]*>/g;

/**
 * Ensure a URL is a browser-safe http(s)/protocol-relative reference. The
 * v1.3 API returns hostless URLs (e.g. `example.com/foo/`) which we promote
 * to a protocol-relative form (`//example.com/foo/`) so links inherit the
 * page's scheme — matches the page protocol on http sites and avoids
 * mixed-content downgrades on https sites. URLs with any other scheme
 * (javascript:, data:, ftp:, …) are rejected so a compromised API response
 * can't smuggle a non-http URL into an href.
 *
 * @param {string} raw - Raw URL from the API.
 * @return {string} Safe URL or ''.
 */
export function toSafeUrl( raw ) {
	if ( typeof raw !== 'string' || raw === '' ) {
		return '';
	}
	if ( HTTP_SCHEME_PATTERN.test( raw ) ) {
		return raw;
	}
	if ( ANY_SCHEME_PATTERN.test( raw ) ) {
		return '';
	}
	return `//${ raw.replace( /^\/+/, '' ) }`;
}

/**
 * Format an ISO date string for display on a search result card.
 *
 * @param {string} iso      - ISO-ish date string.
 * @param {string} [locale] - BCP47 locale (e.g. `en-US`).
 * @return {string} Formatted date or ''.
 */
export function formatDate( iso, locale = 'en-US' ) {
	if ( ! iso ) {
		return '';
	}
	const fixed = String( iso ).replace( /\.\d+/, '' ).replace( ' ', 'T' );
	const d = new Date( fixed );
	if ( isNaN( d.getTime() ) ) {
		return '';
	}
	return d.toLocaleDateString( locale || 'en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	} );
}

/**
 * Derive a breadcrumb-style path from a permalink ("2023 › 01 › 13 › slug").
 *
 * @param {string} permalink - Full URL.
 * @return {string} Breadcrumb string or ''.
 */
export function formatPath( permalink ) {
	if ( ! permalink ) {
		return '';
	}
	try {
		// `toSafeUrl` promotes hostless API URLs to protocol-relative form
		// (`//example.com/…`), but `new URL()` requires an explicit scheme and
		// would throw otherwise. Pin a scheme for parsing only — it never
		// reaches the DOM.
		const resolved = permalink.startsWith( '//' ) ? `https:${ permalink }` : permalink;
		const url = new URL( resolved );
		const parts = url.pathname.split( '/' ).filter( Boolean ).map( decodeURIComponent );
		return parts.join( ' › ' );
	} catch {
		return '';
	}
}

/**
 * Strip HTML tags from a string. Runs the regex repeatedly until the output
 * is stable so nested tag constructions (e.g. `<<script>script>`, which a
 * single pass would leave as `<script>`) can't smuggle a tag through.
 *
 * @param {string} s - Input string.
 * @return {string} Input with all `<...>` tags removed.
 */
export function stripTags( s ) {
	let prev;
	let out = s;
	do {
		prev = out;
		out = out.replace( STRIP_TAGS_PATTERN, '' );
	} while ( out !== prev );
	return out;
}

/**
 * Tokenize a v1.3 `highlight` field into an array of pieces suitable for
 * rendering with Interactivity `data-wp-each` / `data-wp-text`. Each piece
 * is `{ text, isHighlight }`; the template wraps highlighted pieces in a
 * styled element so the match still stands out visually. Splitting into
 * text pieces (vs. binding innerHTML) keeps the XSS surface at zero — we
 * never render API-supplied HTML, only textContent.
 *
 * Returns an empty array when the highlight field is missing/invalid so
 * the template falls back to the plain `title` field.
 *
 * @param {*} highlight - Highlight value (array of snippet strings or a single string).
 * @return {Array<{index: number, text: string, isHighlight: boolean}>} Pieces to render.
 */
export function tokenizeHighlight( highlight ) {
	const raw = Array.isArray( highlight ) ? highlight.join( ' ' ) : highlight;
	if ( typeof raw !== 'string' || raw === '' ) {
		return [];
	}
	// Kept local so `exec()`'s stateful `lastIndex` cursor can't leak between
	// calls — the regex is cheap to construct.
	const markPattern = /<mark[^>]*>([\s\S]*?)<\/mark>/gi;
	const pieces = [];
	let lastIndex = 0;
	let match;

	while ( ( match = markPattern.exec( raw ) ) !== null ) {
		if ( match.index > lastIndex ) {
			pieces.push( {
				text: stripTags( raw.slice( lastIndex, match.index ) ),
				isHighlight: false,
			} );
		}
		pieces.push( {
			text: stripTags( match[ 1 ] ),
			isHighlight: true,
		} );
		lastIndex = markPattern.lastIndex;
	}
	if ( lastIndex < raw.length ) {
		pieces.push( {
			text: stripTags( raw.slice( lastIndex ) ),
			isHighlight: false,
		} );
	}
	// data-wp-each needs a stable key per piece — index works because the
	// pieces array is recomputed whenever the parent result changes.
	return pieces.filter( p => p.text !== '' ).map( ( p, index ) => ( { ...p, index } ) );
}

/**
 * Normalize a v1.3 Jetpack Search result into the flat shape expected by the
 * Interactivity API templates.
 *
 * @param {object} raw      - Raw result from the API.
 * @param {string} [locale] - BCP47 locale for date formatting.
 * @return {object} Flat result.
 */
export function normalizeResult( raw, locale = 'en-US' ) {
	const fields = raw?.fields ?? {};
	const highlight = raw?.highlight ?? {};
	const permalink = toSafeUrl( fields[ 'permalink.url.raw' ] );
	const rawImage = fields[ 'image.url.raw' ];
	const imageSrc = Array.isArray( rawImage ) ? rawImage[ 0 ] : rawImage;
	const imageUrl = toSafeUrl( imageSrc );
	const plainTitle = String( fields[ 'title.default' ] ?? fields.title ?? '' );
	const titlePieces = tokenizeHighlight( highlight.title );
	return {
		id: String( raw?.result_id ?? fields.post_id ?? permalink ),
		title: plainTitle,
		// Rendered when the API returns a highlighted title; template
		// falls back to `title` when this is empty.
		titlePieces,
		hasTitlePieces: titlePieces.length > 0,
		permalink,
		path: formatPath( permalink ),
		dateLabel: formatDate( fields.date, locale ),
		imageUrl,
	};
}

/**
 * Count the total number of selected filter values across all filter keys.
 *
 * @param {object} activeFilters - Map of filterKey → array of selected values.
 * @return {number} Total selected values; 0 if input is not a plain object.
 */
export function countActiveFilters( activeFilters ) {
	if ( ! activeFilters || typeof activeFilters !== 'object' ) {
		return 0;
	}
	return Object.values( activeFilters ).reduce(
		( sum, v ) => sum + ( Array.isArray( v ) ? v.length : 0 ),
		0
	);
}

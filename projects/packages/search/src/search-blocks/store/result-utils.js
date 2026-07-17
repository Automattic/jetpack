/**
 * Pure helpers for shaping v1.3 search results into the flat shape IA
 * templates consume. Extracted from store/index.js for Jest. Strings are
 * deliberately untranslated — IA view bundles can't import `@wordpress/i18n`.
 */

import { formatWpDate } from './wp-date-format';

// Module-scoped — seeded once at hydration. See AGENTS.md § Interactivity API gotchas.
let seededDateFormat = '';

/**
 * Capture the site's `date_format` for subsequent `formatDate()` calls.
 *
 * @param {string} format - WP token string; empty falls back to Intl short form.
 */
export function setSeededDateFormat( format ) {
	seededDateFormat = typeof format === 'string' ? format : '';
}

const HTTP_SCHEME_PATTERN = /^https?:\/\//i;
const ANY_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const STRIP_TAGS_PATTERN = /<[^>]*>/g;
const NUMERIC_ENTITY_PATTERN = /&#(\d+);/g;
const HEX_ENTITY_PATTERN = /&#x([0-9a-f]+);/gi;
const NAMED_ENTITY_PATTERN = /&([a-z][a-z0-9]*);/gi;
// Minimum entity coverage for API-supplied prices/titles. WPCOM returns
// `<span>&#036;</span>11.05` with `$` as a numeric entity + `&nbsp;`.
// Anything outside this map is left visible (`&copy;` → as-is).
const NAMED_ENTITY_MAP = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
};

/**
 * Promote API URLs to a safe http(s)/protocol-relative form. Hostless URLs
 * (`example.com/foo/`) → `//example.com/foo/`. **Security**: any other scheme
 * (`javascript:`, `data:`, `ftp:`) is rejected so a compromised API response
 * can't smuggle a script/data URL into an `href`.
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
 * Format an ISO date for a result card. Uses the site's `date_format` via
 * `formatWpDate` when seeded, else falls back to a short Intl shape. The
 * `dateFormat` override is for tests.
 *
 * @param {string} iso          - ISO date string.
 * @param {string} [locale]     - BCP47 locale.
 * @param {string} [dateFormat] - Tests only; defaults to module-scoped seed.
 * @return {string} Formatted date or ''.
 */
export function formatDate( iso, locale = 'en-US', dateFormat = seededDateFormat ) {
	if ( ! iso ) {
		return '';
	}
	const fixed = String( iso ).replace( /\.\d+/, '' ).replace( ' ', 'T' );
	const d = new Date( fixed );
	if ( isNaN( d.getTime() ) ) {
		return '';
	}
	const resolvedLocale = locale || 'en-US';
	if ( dateFormat ) {
		return formatWpDate( d, dateFormat, resolvedLocale );
	}
	return d.toLocaleDateString( resolvedLocale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	} );
}

/**
 * Breadcrumb path from a permalink ("2023 › 01 › 13 › slug").
 *
 * @param {string} permalink - Full URL.
 * @return {string} Breadcrumb string or ''.
 */
export function formatPath( permalink ) {
	if ( ! permalink ) {
		return '';
	}
	try {
		// `new URL()` requires an explicit scheme; pin one for parsing only.
		const resolved = permalink.startsWith( '//' ) ? `https:${ permalink }` : permalink;
		const url = new URL( resolved );
		const parts = url.pathname.split( '/' ).filter( Boolean ).map( decodeURIComponent );
		return parts.join( ' › ' );
	} catch {
		return '';
	}
}

/**
 * Format `fields.author` for display. API returns string or array; up to
 * three names joined, more truncated with "...". Decoded because the API
 * HTML-encodes names (`O&#8217;Brien`) and `data-wp-text` is textContent.
 *
 * @param {*} value - `fields.author` from the response.
 * @return {string} Display string, or ''.
 */
export function formatAuthor( value ) {
	if ( Array.isArray( value ) ) {
		const names = value.map( v => decodeEntities( String( v ?? '' ).trim() ) ).filter( Boolean );
		if ( names.length === 0 ) {
			return '';
		}
		if ( names.length > 3 ) {
			return names.slice( 0, 3 ).join( ', ' ) + '...';
		}
		return names.join( ', ' );
	}
	if ( typeof value !== 'string' ) {
		return '';
	}
	return decodeEntities( value.trim() );
}

/**
 * Decode the entity subset the v1.3 API uses in text-rendered fields
 * (numeric entities + the named ones in `NAMED_ENTITY_MAP`). Rest untouched.
 *
 * @param {string} s - Input string.
 * @return {string} Decoded string.
 */
export function decodeEntities( s ) {
	if ( typeof s !== 'string' || s === '' ) {
		return s;
	}
	return s
		.replace( NUMERIC_ENTITY_PATTERN, ( _, n ) => safeFromCodePoint( Number( n ) ) )
		.replace( HEX_ENTITY_PATTERN, ( _, h ) => safeFromCodePoint( parseInt( h, 16 ) ) )
		.replace( NAMED_ENTITY_PATTERN, ( m, name ) => {
			const value = NAMED_ENTITY_MAP[ name.toLowerCase() ];
			return value === undefined ? m : value;
		} );
}

/**
 * `String.fromCodePoint` throws on out-of-range integers — swallow so a
 * malformed entity drops the bad bytes instead of crashing the whole pass.
 *
 * @param {number} n - Code point.
 * @return {string} The character, or '' if invalid.
 */
function safeFromCodePoint( n ) {
	try {
		return String.fromCodePoint( n );
	} catch {
		return '';
	}
}

/**
 * Strip tags + decode entities, looping until stable so nested
 * (`<<script>script>`) and entity-encoded (`&lt;script&gt;`) tags can't smuggle through.
 *
 * @param {string} s - Input string.
 * @return {string} Tags stripped, entities decoded.
 */
export function stripTags( s ) {
	if ( typeof s !== 'string' || s === '' ) {
		return s;
	}
	let prev;
	let out = s;
	do {
		prev = out;
		out = decodeEntities( out ).replace( STRIP_TAGS_PATTERN, '' );
	} while ( out !== prev );
	return out;
}

/**
 * Tokenize a `highlight` field into `{ text, isHighlight }` pieces for
 * `data-wp-each`. Text-only (never innerHTML) keeps XSS at zero.
 *
 * @param {*} highlight - Highlight value.
 * @return {Array<{index: number, text: string, isHighlight: boolean}>} Pieces to render.
 */
export function tokenizeHighlight( highlight ) {
	const raw = Array.isArray( highlight ) ? highlight.join( ' ' ) : highlight;
	if ( typeof raw !== 'string' || raw === '' ) {
		return [];
	}
	// Local so `exec()`'s `lastIndex` can't leak between calls.
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
	// `data-wp-each` needs a stable key; index is fine — recomputed per result.
	return pieces.filter( p => p.text !== '' ).map( ( p, index ) => ( { ...p, index } ) );
}

/**
 * First scalar from a maybe-array field.
 *
 * @param {*} value - Scalar or array.
 * @return {*} Scalar or undefined.
 */
function firstScalar( value ) {
	return Array.isArray( value ) ? value[ 0 ] : value;
}

/**
 * Coerce a maybe-array numeric to a finite number; 0 on missing/garbage.
 *
 * @param {*} value - Scalar or array.
 * @return {number} Finite number, or 0.
 */
function toNumber( value ) {
	const n = Number( firstScalar( value ) );
	return Number.isFinite( n ) ? n : 0;
}

/**
 * Product-layout fields from a raw result. Empty/zero for non-products so
 * `data-wp-bind--hidden` checks still hide the price/rating row.
 *
 * @param {object} fields - `raw.fields` from the response.
 * @return {object} Product fields.
 */
function normalizeProductFields( fields ) {
	// WPCOM returns WC prices as HTML fragments (overlay renders via
	// `dangerouslySetInnerHTML`). Blocks bind via `data-wp-text`, so flatten.
	const formattedPrice = stripTags( String( firstScalar( fields[ 'wc.formatted_price' ] ) ?? '' ) );
	const formattedRegularPrice = stripTags(
		String( firstScalar( fields[ 'wc.formatted_regular_price' ] ) ?? '' )
	);
	const formattedSalePrice = stripTags(
		String( firstScalar( fields[ 'wc.formatted_sale_price' ] ) ?? '' )
	);
	const hasSalePrice =
		formattedSalePrice !== '' &&
		formattedRegularPrice !== '' &&
		formattedSalePrice !== formattedRegularPrice;
	const rating = Math.max(
		0,
		Math.min( 5, toNumber( fields[ 'meta._wc_average_rating.double' ] ) )
	);
	const reviewCount = Math.max(
		0,
		Math.trunc( toNumber( fields[ 'meta._wc_review_count.long' ] ) )
	);
	const ratingPercent = `${ Math.round( ( rating / 5 ) * 200 ) / 2 }%`;
	return {
		formattedPrice,
		formattedRegularPrice,
		formattedSalePrice,
		hasSalePrice,
		hasPrice: formattedPrice !== '' || formattedSalePrice !== '',
		rating,
		// Rounded to half-star to match WC.
		ratingPercent,
		reviewCount,
		reviewCountLabel: reviewCount > 0 ? `(${ reviewCount })` : '',
		// Star bar + `(N)` count are aria-hidden, so this is the SR-only signal.
		ratingAriaLabel: buildRatingAriaLabel( rating, reviewCount ),
		hasRating: rating > 0,
	};
}

/**
 * SR announcement for the rating row. Untranslated (see file header).
 *
 * @param {number} rating      - 0–5 average rating.
 * @param {number} reviewCount - Number of reviews.
 * @return {string} Aria-label, or '' to hide.
 */
function buildRatingAriaLabel( rating, reviewCount ) {
	if ( rating <= 0 ) {
		return '';
	}
	if ( reviewCount <= 0 ) {
		return `${ rating } out of 5 stars`;
	}
	if ( reviewCount === 1 ) {
		return `${ rating } out of 5 stars based on 1 review`;
	}
	return `${ rating } out of 5 stars based on ${ reviewCount } reviews`;
}

/**
 * Match-hint badge value. '' when title has a highlight, 'comments' when a
 * comment matched, 'content' otherwise. Mirrors the overlay's
 * `SearchResultProduct` badge logic.
 *
 * @param {object} highlight   - `raw.highlight` from the response.
 * @param {Array}  titlePieces - Pre-computed title pieces.
 * @return {'content'|'comments'|''} Match hint value.
 */
export function deriveMatchHint( highlight, titlePieces ) {
	if ( titlePieces.some( p => p.isHighlight ) ) {
		return '';
	}
	if ( typeof highlight !== 'object' || highlight === null ) {
		return '';
	}
	const entries = Object.entries( highlight );
	// v1.3 uses 'comment' (singular).
	if (
		entries.some(
			( [ key, value ] ) => key === 'comment' && Array.isArray( value ) && value[ 0 ]?.length > 0
		)
	) {
		return 'comments';
	}
	if (
		entries.some(
			( [ key, value ] ) =>
				key !== 'title' && key !== 'comment' && Array.isArray( value ) && value[ 0 ]?.length > 0
		)
	) {
		return 'content';
	}
	return '';
}

/**
 * Normalize a v1.3 result into the flat shape IA templates consume.
 *
 * @param {object} raw           - Raw result from the API.
 * @param {string} [locale]      - BCP47 locale for date formatting.
 * @param {string} [searchQuery] - Empty → suppress match-hint badge ("Matches
 *                               content" reads wrong on filter-only browse).
 * @return {object} Flat result.
 */
export function normalizeResult( raw, locale = 'en-US', searchQuery = '' ) {
	const fields = raw?.fields ?? {};
	const highlight = raw?.highlight ?? {};
	const permalink = toSafeUrl( fields[ 'permalink.url.raw' ] );
	const rawImage = fields[ 'image.url.raw' ];
	const imageSrc = Array.isArray( rawImage ) ? rawImage[ 0 ] : rawImage;
	const imageUrl = toSafeUrl( imageSrc );
	// Flatten entities (post titles can contain `&amp;`, `&#8217;`) since
	// `data-wp-text` is textContent.
	const plainTitle = stripTags( String( fields[ 'title.default' ] ?? fields.title ?? '' ) );
	const titlePieces = tokenizeHighlight( highlight.title );
	const contentPieces = tokenizeHighlight( highlight.content );
	const hasQuery = typeof searchQuery === 'string' && searchQuery.trim() !== '';
	const matchHint = hasQuery ? deriveMatchHint( highlight, titlePieces ) : '';
	return {
		id: String( raw?.result_id ?? fields.post_id ?? permalink ),
		// Server-assigned TrainTracks payload (fetch_algo, railcar, session_id…).
		// The search API attaches it per-result; carried through so the relevance
		// events in store/index.js can read it off `context.result`.
		railcar: raw?.railcar ?? null,
		title: plainTitle,
		titlePieces,
		hasTitlePieces: titlePieces.length > 0,
		contentPieces,
		hasContentPieces: contentPieces.length > 0,
		permalink,
		path: formatPath( permalink ),
		dateLabel: formatDate( fields.date, locale ),
		authorLabel: formatAuthor( fields.author ),
		imageUrl,
		// Pre-built `url(...)` for `data-wp-style--background-image`.
		imageBackgroundImage: imageUrl ? `url(${ imageUrl })` : '',
		matchHint,
		matchHintIsComments: matchHint === 'comments',
		...normalizeProductFields( fields ),
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

/**
 * Pure helpers for shaping v1.3 Jetpack Search results into the flat form the
 * Interactivity API templates consume. Extracted from store/index.js so they
 * can be unit-tested without bootstrapping the IAPI runtime.
 *
 * Note: this module is loaded inside the Interactivity API view bundle, where
 * `@wordpress/i18n` is not available — the IAPI runtime rejects WP-script
 * imports. Strings here are deliberately untranslated; the editor preview
 * (edit.js) composes its own localized versions via wp.i18n. Localizing the
 * frontend strings is tracked separately so it lands once the IAPI build
 * pipeline gains wp.i18n support.
 */

const HTTP_SCHEME_PATTERN = /^https?:\/\//i;
const ANY_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
const STRIP_TAGS_PATTERN = /<[^>]*>/g;
const NUMERIC_ENTITY_PATTERN = /&#(\d+);/g;
const HEX_ENTITY_PATTERN = /&#x([0-9a-f]+);/gi;
const NAMED_ENTITY_PATTERN = /&([a-z][a-z0-9]*);/gi;
// Minimum entity coverage needed to render API-supplied prices/titles as plain
// text — WPCOM hands back HTML-formatted prices like `<span>&#036;</span>11.05`
// where `$` arrives as a numeric entity and `&nbsp;` is common between currency
// and amount. Anything outside this map (e.g. `&copy;`) is left intact so it
// stays visible as a question for whoever sees it, rather than silently
// disappearing.
const NAMED_ENTITY_MAP = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
};

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
 * Decode the small set of HTML entities the v1.3 API can place in
 * text-rendered fields. WPCOM hands back WC-formatted prices and post titles
 * with numeric entities (e.g. `&#036;` for `$`) and a handful of named ones
 * (`&amp;`, `&nbsp;`); everything else is left untouched.
 *
 * @param {string} s - Input string.
 * @return {string} Input with the supported entities replaced.
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
 * `String.fromCodePoint` throws on out-of-range integers; swallow the throw so
 * a malformed numeric entity drops the bad bytes instead of crashing the whole
 * sanitization pass.
 *
 * @param {number} n - Code point.
 * @return {string} The character, or '' if the code point is invalid.
 */
function safeFromCodePoint( n ) {
	try {
		return String.fromCodePoint( n );
	} catch {
		return '';
	}
}

/**
 * Strip HTML tags from a string and decode any HTML entities the API may have
 * encoded around them. Runs the strip+decode pair in a loop until the output
 * is stable so nested tag constructions (e.g. `<<script>script>`, which a
 * single strip pass would leave as `<script>`) and entity-encoded tags
 * (`&lt;script&gt;`, which would survive a single strip pass) can't smuggle
 * a tag through.
 *
 * @param {string} s - Input string.
 * @return {string} Input with all tags removed and supported entities decoded.
 */
export function stripTags( s ) {
	if ( typeof s !== 'string' || s === '' ) {
		return s;
	}
	let prev;
	let out = s;
	do {
		prev = out;
		// The strip regex on its own is "incomplete multi-character
		// sanitization" — `<<script>script>` collapses to `<script>` after a
		// single pass, which CodeQL flags. The loop runs the strip+decode
		// pair until the output stabilizes, so the security guarantee holds
		// across nested or entity-encoded tags. The `keeps stripping until
		// the output is free of tag-like markup` test in result-utils.test.js
		// pins this behavior.
		out = decodeEntities( out ).replace( STRIP_TAGS_PATTERN, '' );
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
 * First non-empty scalar from a possibly-array field. The v1.3 API hands
 * back single values as bare strings and multi-valued meta fields as arrays;
 * call sites only ever need the first entry.
 *
 * @param {*} value - Scalar or array.
 * @return {*} Scalar or undefined.
 */
function firstScalar( value ) {
	return Array.isArray( value ) ? value[ 0 ] : value;
}

/**
 * Coerce a possibly-array numeric field into a finite number. Returns 0 when
 * the value is missing or unparseable so downstream `hasRating` / `>= 0`
 * checks stay simple.
 *
 * @param {*} value - Scalar or array.
 * @return {number} Finite number, or 0.
 */
function toNumber( value ) {
	const n = Number( firstScalar( value ) );
	return Number.isFinite( n ) ? n : 0;
}

/**
 * Build product-layout fields from a raw result. Returns empty/zero values
 * when the result isn't a WooCommerce product so the template's
 * `data-wp-bind--hidden` checks still hide the price/rating row.
 *
 * @param {object} fields - `raw.fields` from the v1.3 API response.
 * @return {object} Product fields.
 */
function normalizeProductFields( fields ) {
	// WPCOM returns WC prices as HTML fragments (e.g.
	// `<span class="woocommerce-Price-amount"><span class="…-currencySymbol">&#036;</span>11.05</span>`)
	// because the legacy instant-search overlay renders them via
	// `dangerouslySetInnerHTML`. Search Blocks bind these via `data-wp-text`,
	// so the markup has to be flattened to plain text up front or the result
	// card prints the raw `<span>` tags and `&#036;` entity to the page.
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
		// Drives a CSS-only star bar via `data-wp-style--width`. Rounded to a
		// half-star to match WC's display convention.
		ratingPercent,
		reviewCount,
		reviewCountLabel: reviewCount > 0 ? `(${ reviewCount })` : '',
		// Combined SR string for the rating row. The visible star bar and
		// `(N)` count are aria-hidden, so this is the only signal screen
		// readers get — needs both the rating and the review count to match
		// instant-search's "Average rating … from N reviews" announcement.
		ratingAriaLabel: buildRatingAriaLabel( rating, reviewCount ),
		hasRating: rating > 0,
	};
}

/**
 * Compose the screen-reader announcement for the rating row.
 *
 * Strings are intentionally untranslated — see the file-level comment.
 * Localization is tracked as a follow-up that needs IAPI build support
 * for `@wordpress/i18n`.
 *
 * @param {number} rating      - 0–5 average rating.
 * @param {number} reviewCount - Number of reviews backing the rating.
 * @return {string} Aria-label, or '' when the row should be hidden.
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
 * Derive the match hint from the highlight object.
 *
 * Returns '' when the title itself carries a highlighted fragment (no badge
 * needed), 'comments' when a comment field matched but the title didn't, or
 * 'content' when another non-title field matched but the title didn't.
 *
 * Mirrors the badge logic in the instant-search `SearchResultProduct`
 * component. The v1.3 API uses 'comment' (singular) as the comment-field key.
 *
 * @param {object} highlight   - `raw.highlight` from the API response.
 * @param {Array}  titlePieces - Pre-computed title pieces from tokenizeHighlight.
 * @return {'content'|'comments'|''} Match hint value.
 */
export function deriveMatchHint( highlight, titlePieces ) {
	// If the title itself has a highlighted fragment, no badge is needed.
	if ( titlePieces.some( p => p.isHighlight ) ) {
		return '';
	}
	if ( typeof highlight !== 'object' || highlight === null ) {
		return '';
	}
	const entries = Object.entries( highlight );
	if (
		entries.some(
			// The v1.3 API uses 'comment' (singular), not 'comments'.
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
 * Normalize a v1.3 Jetpack Search result into the flat shape expected by the
 * Interactivity API templates.
 *
 * @param {object} raw           - Raw result from the API.
 * @param {string} [locale]      - BCP47 locale for date formatting.
 * @param {string} [searchQuery] - The query string the user actually typed. When
 *                               empty (filter-only browse), the match-hint
 *                               badge is suppressed — "Matches content" only
 *                               makes sense in response to a typed query, and
 *                               reads as misleading when every visible result
 *                               was returned by a category/tag/price filter.
 * @return {object} Flat result.
 */
export function normalizeResult( raw, locale = 'en-US', searchQuery = '' ) {
	const fields = raw?.fields ?? {};
	const highlight = raw?.highlight ?? {};
	const permalink = toSafeUrl( fields[ 'permalink.url.raw' ] );
	const rawImage = fields[ 'image.url.raw' ];
	const imageSrc = Array.isArray( rawImage ) ? rawImage[ 0 ] : rawImage;
	const imageUrl = toSafeUrl( imageSrc );
	// The fallback title is rendered via `data-wp-text`, so any HTML or HTML
	// entities the API returns (post titles can contain `&amp;`, `&#8217;`,
	// etc.) need to be flattened the same way the highlight pieces are —
	// otherwise the raw entity markup leaks onto the result card.
	const plainTitle = stripTags( String( fields[ 'title.default' ] ?? fields.title ?? '' ) );
	const titlePieces = tokenizeHighlight( highlight.title );
	const contentPieces = tokenizeHighlight( highlight.content );
	const hasQuery = typeof searchQuery === 'string' && searchQuery.trim() !== '';
	const matchHint = hasQuery ? deriveMatchHint( highlight, titlePieces ) : '';
	return {
		id: String( raw?.result_id ?? fields.post_id ?? permalink ),
		title: plainTitle,
		// Rendered when the API returns a highlighted title; template
		// falls back to `title` when this is empty.
		titlePieces,
		hasTitlePieces: titlePieces.length > 0,
		// Rendered when the API returns a highlighted content snippet;
		// hidden when empty so the layout does not gain an empty gap.
		contentPieces,
		hasContentPieces: contentPieces.length > 0,
		permalink,
		path: formatPath( permalink ),
		dateLabel: formatDate( fields.date, locale ),
		imageUrl,
		// Pre-built `url(...)` value so the product layout's CSS background
		// image binds via `data-wp-style--background-image` without the
		// template having to wrap a string at render time.
		imageBackgroundImage: imageUrl ? `url(${ imageUrl })` : '',
		// 'content' | 'comments' | '' — drives the "Matches content / Matches
		// comments" hint badge shown on product cards when the title has no
		// highlight but another field does.
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

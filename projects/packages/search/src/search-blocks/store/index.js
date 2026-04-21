import { store } from '@wordpress/interactivity';
import { buildSearchUrl } from './api';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';
const HTTP_SCHEME_PATTERN = /^https?:\/\//i;
const ANY_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
let initialized = false;
// Monotonic token used to drop stale `search()` responses. Incremented on
// every new search; in-flight responses compare their token against the
// latest before touching store state, so a slow request for an older query
// can't overwrite fresh results when the user changes query or sort mid-fetch.
let searchToken = 0;

/**
 * Ensure a URL is a browser-safe http(s)/protocol-relative reference. The v1.3
 * API returns hostless URLs (e.g. `example.com/foo/`) which we promote to a
 * protocol-relative form (`//example.com/foo/`) so links inherit the page's
 * scheme — matches the page protocol on http sites and avoids mixed-content
 * downgrades on https sites. URLs with any other scheme (javascript:, data:,
 * ftp:, …) are rejected so a compromised API response can't smuggle a non-http
 * URL into an href.
 *
 * @param {string} raw - Raw URL from the API.
 * @return {string} Safe URL or ''.
 */
function toSafeUrl( raw ) {
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
 * Takes the BCP47 locale explicitly so the dependency on store state is
 * visible at the call site — callers pass `state.locale` (seeded by PHP
 * from the site's blog locale).
 *
 * NOTE: falls back to a fixed `{ year, month, day }` style rather than
 * reading WP's `date_format` option. Matching the site's configured date
 * format requires parsing WP's PHP date-format tokens in JS. Deferred to
 * follow-up — see PR #48198.
 *
 * @param {string} iso      - ISO-ish date string.
 * @param {string} [locale] - BCP47 locale (e.g. `en-US`).
 * @return {string} Formatted date or ''.
 */
function formatDate( iso, locale = 'en-US' ) {
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
function formatPath( permalink ) {
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

const STRIP_TAGS_PATTERN = /<[^>]*>/g;

/**
 * Strip HTML tags from a string. Runs the regex repeatedly until the output
 * is stable so nested tag constructions (e.g. `<<script>script>`, which a
 * single pass would leave as `<script>`) can't smuggle a tag through.
 *
 * @param {string} s - Input string.
 * @return {string} Input with all `<...>` tags removed.
 */
function stripTags( s ) {
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
function tokenizeHighlight( highlight ) {
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
 * Request a page of results. Shared between the initial search and
 * subsequent load-more calls; the caller owns the loading flag and
 * decides how to merge the response into state.
 *
 * @param {string|null} pageHandle - Cursor, or null for the first page.
 * @yield {Promise} fetch + response.json() promises.
 * @return {object} Parsed API response body.
 */
function* fetchResults( pageHandle ) {
	const url = buildSearchUrl( {
		siteId: state.siteId,
		searchQuery: state.searchQuery,
		sortOrder: state.sortOrder,
		pageHandle,
		isPrivateSite: state.isPrivateSite,
		isWpcom: state.isWpcom,
		apiRoot: state.apiRoot,
		homeUrl: state.homeUrl,
	} );
	const response = yield fetch( url, {
		headers: state.isPrivateSite ? { 'X-WP-Nonce': state.nonce } : {},
		credentials: state.isPrivateSite ? 'include' : 'same-origin',
	} );
	return yield response.json();
}

/**
 * Normalize a v1.3 Jetpack Search result into the flat shape expected by the
 * Interactivity API templates.
 *
 * @param {object} raw - Raw result from the API.
 * @return {object} Flat result.
 */
function normalizeResult( raw ) {
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
		hasTitleHighlight: titlePieces.length > 0,
		permalink,
		path: formatPath( permalink ),
		dateLabel: formatDate( fields.date, state.locale ),
		imageUrl,
	};
}

const { state, actions } = store( NAMESPACE, {
	state: {
		/**
		 * Short human-readable results count for display blocks.
		 *
		 * NOTE: not localized. `@wordpress/i18n` isn't available as an
		 * Interactivity API script module (WP only registers
		 * `@wordpress/interactivity`), and the dependency-extraction
		 * plugin throws when any other `@wordpress/*` is imported into
		 * an ESM view bundle. Revisit when WP registers wp-i18n as a
		 * module, or switch to seeding translated plural forms from PHP
		 * via `wp_interactivity_state()`. See PR #48198.
		 *
		 * @return {string} Text such as "42 results".
		 */
		get resultsCountText() {
			if ( state.isLoading ) {
				return '';
			}
			const total = state.totalResults;
			if ( total === 0 ) {
				return '';
			}
			return `${ total } result${ total === 1 ? '' : 's' }`;
		},

		/**
		 * `data-wp-bind` only evaluates simple property paths (with an
		 * optional leading `!`) — expressions like `a.length > 0 || b`
		 * parse as literal path segments and silently return `undefined`.
		 * Templates therefore must bind to a single getter, so derived
		 * visibility flags live here.
		 *
		 * Also requires `searchQuery` so the message doesn't flash on a
		 * bare `/search/` page where the user hasn't typed anything yet.
		 *
		 * @return {boolean} True when the no-results message should show.
		 */
		get showNoResults() {
			return !! state.searchQuery && ! state.isLoading && state.results.length === 0;
		},

		/**
		 * Derived load-more wrapper visibility. Only checks `pageHandle`
		 * (whether another page is available) — the button and spinner
		 * inside handle their own loading-state visibility, which lets
		 * the spinner remain visible while `isLoadingMore` is true.
		 *
		 * @return {boolean} True when the load-more wrapper should show.
		 */
		get showLoadMore() {
			return !! state.pageHandle;
		},
	},

	actions: {
		/**
		 * Run a search and replace the result list.
		 *
		 * @param {object}  [options]         - Options.
		 * @param {boolean} [options.syncUrl] - Push new state to the URL after a
		 *                                    successful fetch. Default `true`;
		 *                                    pass `false` when the search was
		 *                                    itself triggered by a URL change
		 *                                    (e.g. `popstate`) so we don't
		 *                                    bounce a new history entry back
		 *                                    on top of the one the browser
		 *                                    just navigated to.
		 * @yield {Promise} fetch + response.json() promises.
		 */
		*search( { syncUrl = true } = {} ) {
			const myToken = ++searchToken;
			state.isLoading = true;
			state.hasError = false;
			try {
				const data = yield* fetchResults( null );
				// A newer `search()` started while this one was in-flight — its
				// response will own the state write. Dropping here keeps us
				// from clobbering fresh results with a slow, stale response.
				if ( myToken !== searchToken ) {
					return;
				}
				state.results = ( data.results ?? [] ).map( normalizeResult );
				state.totalResults = data.total ?? 0;
				state.pageHandle = data.page_handle ?? null;
				if ( syncUrl ) {
					actions.syncToUrl();
				}
			} catch {
				if ( myToken === searchToken ) {
					state.hasError = true;
				}
			} finally {
				if ( myToken === searchToken ) {
					state.isLoading = false;
				}
			}
		},

		/**
		 * Load the next page of results and append to the existing list.
		 *
		 * @yield {Promise} fetch + response.json() promises.
		 */
		*loadMore() {
			if ( ! state.pageHandle || state.isLoading || state.isLoadingMore ) {
				return;
			}
			state.isLoadingMore = true;
			state.hasError = false;
			try {
				const data = yield* fetchResults( state.pageHandle );
				state.results = [ ...state.results, ...( data.results ?? [] ).map( normalizeResult ) ];
				state.pageHandle = data.page_handle ?? null;
			} catch {
				state.hasError = true;
			} finally {
				state.isLoadingMore = false;
			}
		},

		/**
		 * Push current state to browser URL.
		 */
		syncToUrl() {
			pushStateToUrl( {
				searchQuery: state.searchQuery,
				sortOrder: state.sortOrder,
			} );
		},

		/**
		 * Handle browser back/forward navigation.
		 *
		 * @yield {Promise} search action.
		 */
		*handlePopState() {
			const { searchQuery, sortOrder } = readStateFromUrl();
			state.searchQuery = searchQuery;
			state.sortOrder = sortOrder;
			yield actions.search( { syncUrl: false } );
		},
	},

	callbacks: {
		/**
		 * Fires when the search-results block mounts. Runs the initial
		 * search if the URL seeded a query and registers the popstate
		 * listener. Guarded so multiple blocks on the same page share a
		 * single listener and a single initial fetch.
		 */
		initialize() {
			if ( initialized ) {
				return;
			}
			initialized = true;
			window.addEventListener( 'popstate', actions.handlePopState );
			if ( state.searchQuery ) {
				// The URL already carries this query — don't push a duplicate
				// history entry on top of the browser's current one.
				actions.search( { syncUrl: false } );
			}
		},
	},
} );

export { state, actions };

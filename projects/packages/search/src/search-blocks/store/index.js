import { _n, sprintf } from '@wordpress/i18n';
import { store } from '@wordpress/interactivity';
import { buildSearchUrl } from './api';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';
const HTTP_SCHEME_PATTERN = /^https?:\/\//i;
const ANY_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;
let initialized = false;

/**
 * Ensure a URL starts with http(s)://. The v1.3 API returns hostless URLs
 * (e.g. `example.com/foo/`), which we promote to https. URLs with any other
 * scheme (javascript:, data:, ftp:, …) are rejected so a compromised API
 * response can't smuggle a non-http URL into an href.
 *
 * @param {string} raw - Raw URL from the API.
 * @return {string} Safe http(s) URL or ''.
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
	return `https://${ raw.replace( /^\/+/, '' ) }`;
}

/**
 * Format an ISO date string as "Mon D, YYYY" using the page locale.
 *
 * @param {string} iso - ISO-ish date string.
 * @return {string} Formatted date or ''.
 */
function formatDate( iso ) {
	if ( ! iso ) {
		return '';
	}
	const fixed = String( iso ).replace( /\.\d+/, '' ).replace( ' ', 'T' );
	const d = new Date( fixed );
	if ( isNaN( d.getTime() ) ) {
		return '';
	}
	const locale = ( typeof document !== 'undefined' && document.documentElement.lang ) || 'en-US';
	return d.toLocaleDateString( locale, {
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
		const url = new URL( permalink );
		const parts = url.pathname.split( '/' ).filter( Boolean ).map( decodeURIComponent );
		return parts.join( ' › ' );
	} catch {
		return '';
	}
}

/**
 * Pull a plain-text string out of a v1.3 `highlight` field, which arrives as
 * an array of snippets with `<mark>` tags. We render via data-wp-text, so HTML
 * would show as literal tags — strip them here.
 *
 * @param {*} highlight - Highlight value (array of strings or string).
 * @return {string} Plain text.
 */
function stripHighlightTags( highlight ) {
	const raw = Array.isArray( highlight ) ? highlight.join( ' ' ) : highlight;
	if ( typeof raw !== 'string' ) {
		return '';
	}
	return raw.replace( /<\/?mark[^>]*>/gi, '' );
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
 * Interactivity API templates. Mirrors Search_Blocks::normalize_result() in PHP.
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
	const title =
		stripHighlightTags( highlight.title ) || fields[ 'title.default' ] || fields.title || '';
	return {
		id: String( raw?.result_id ?? fields.post_id ?? permalink ),
		title,
		permalink,
		path: formatPath( permalink ),
		dateLabel: formatDate( fields.date ),
		imageUrl,
	};
}

const { state, actions } = store( NAMESPACE, {
	state: {
		/**
		 * Short human-readable results count for display blocks.
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
			return sprintf(
				/* translators: %d is the number of search results. */
				_n( '%d result', '%d results', total, 'jetpack-search-pkg' ),
				total
			);
		},
	},

	actions: {
		/**
		 * Run a search and replace the result list.
		 *
		 * @yield {Promise} fetch + response.json() promises.
		 */
		*search() {
			state.isLoading = true;
			try {
				const data = yield* fetchResults( null );
				state.results = ( data.results ?? [] ).map( normalizeResult );
				state.totalResults = data.total ?? 0;
				state.pageHandle = data.page_handle ?? null;
				actions.syncToUrl();
			} catch {
				state.hasError = true;
			} finally {
				state.isLoading = false;
			}
		},

		/**
		 * Load the next page of results and append to the existing list.
		 *
		 * @yield {Promise} fetch + response.json() promises.
		 */
		*loadMore() {
			if ( ! state.pageHandle || state.isLoading ) {
				return;
			}
			state.isLoadingMore = true;
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
			yield actions.search();
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
				actions.search();
			}
		},
	},
} );

export { state, actions };

import { store } from '@wordpress/interactivity';
import { buildSearchUrl } from './api';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';
const SAFE_URL_PATTERN = /^https?:\/\//i;

/**
 * Ensure a URL starts with http(s)://. The v1.3 API returns hostless URLs
 * (e.g. `example.com/foo/`), which we promote to https. Anything that still
 * isn't http(s) after promotion is rejected so a compromised API response
 * can't inject a javascript:/data: URL into an href.
 *
 * @param {string} raw - Raw URL from the API.
 * @return {string} Safe http(s) URL or ''.
 */
function toSafeUrl( raw ) {
	if ( typeof raw !== 'string' || raw === '' ) {
		return '';
	}
	const withScheme = SAFE_URL_PATTERN.test( raw ) ? raw : `https://${ raw.replace( /^\/+/, '' ) }`;
	return SAFE_URL_PATTERN.test( withScheme ) ? withScheme : '';
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
			return `${ total } result${ total === 1 ? '' : 's' }`;
		},
	},

	actions: {
		/**
		 * Run a search and update state with results.
		 *
		 * @yield {Promise} fetch + response.json() promises.
		 */
		*search() {
			state.isLoading = true;

			const url = buildSearchUrl( {
				siteId: state.siteId,
				searchQuery: state.searchQuery,
				sortOrder: state.sortOrder,
				pageHandle: null,
				isPrivateSite: state.isPrivateSite,
				isWpcom: state.isWpcom,
				apiRoot: state.apiRoot,
				homeUrl: state.homeUrl,
			} );

			const headers = state.isPrivateSite ? { 'X-WP-Nonce': state.nonce } : {};

			try {
				const response = yield fetch( url, {
					headers,
					credentials: state.isPrivateSite ? 'include' : 'same-origin',
				} );
				const data = yield response.json();

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
		 * Load next page of results (appends to existing results).
		 *
		 * @yield {Promise} fetch + response.json() promises.
		 */
		*loadMore() {
			if ( ! state.pageHandle || state.isLoading ) {
				return;
			}

			state.isLoadingMore = true;

			const url = buildSearchUrl( {
				siteId: state.siteId,
				searchQuery: state.searchQuery,
				sortOrder: state.sortOrder,
				pageHandle: state.pageHandle,
				isPrivateSite: state.isPrivateSite,
				isWpcom: state.isWpcom,
				apiRoot: state.apiRoot,
				homeUrl: state.homeUrl,
			} );

			const headers = state.isPrivateSite ? { 'X-WP-Nonce': state.nonce } : {};

			try {
				const response = yield fetch( url, {
					headers,
					credentials: state.isPrivateSite ? 'include' : 'same-origin',
				} );
				const data = yield response.json();

				state.results = [ ...state.results, ...( data.results ?? [] ).map( normalizeResult ) ];
				state.pageHandle = data.page_handle ?? null;
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
		 * Register popstate listener once when any block mounts.
		 */
		onMount() {
			window.addEventListener( 'popstate', actions.handlePopState );
		},
	},
} );

export { state, actions };

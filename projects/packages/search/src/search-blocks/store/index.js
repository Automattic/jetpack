import { store } from '@wordpress/interactivity';
import { buildSearchUrl } from './api';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';

/**
 * Allow http(s) links only. Anything else — javascript:, data:, vbscript:, etc. —
 * is a potential DOM-XSS vector when written to an <a href> via data-wp-bind--href.
 * The v1.3 Jetpack Search API is trusted, but defense in depth: the trust boundary
 * for rendering untyped URL strings belongs in our code, not in the API.
 */
const SAFE_URL_PATTERN = /^https?:\/\//i;
/**
 * Return the URL if it is an http(s) URL, otherwise '#'.
 *
 * @param {string} url - URL to check.
 * @return {string} Safe URL.
 */
function sanitizePermalink( url ) {
	return typeof url === 'string' && SAFE_URL_PATTERN.test( url ) ? url : '#';
}

const { state, actions } = store( NAMESPACE, {
	state: {
		/**
		 * Search results with permalinks scheme-validated for safe use in
		 * data-wp-bind--href. Templates must bind to state.safeResults, not
		 * state.results, so a compromised or buggy API response cannot inject
		 * a javascript:/data: URL into an href.
		 *
		 * @return {Array<object>} Results with sanitized permalinks.
		 */
		get safeResults() {
			return ( state.results ?? [] ).map( result => ( {
				...result,
				fields: {
					...( result.fields ?? {} ),
					permalink: sanitizePermalink( result.fields?.permalink ),
				},
			} ) );
		},

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

				state.results = data.results ?? [];
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

				state.results = [ ...state.results, ...( data.results ?? [] ) ];
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

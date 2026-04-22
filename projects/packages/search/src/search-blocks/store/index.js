import { store } from '@wordpress/interactivity';
import { buildSearchUrl } from './api';
import { normalizeResult } from './result-utils';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';
let initialized = false;
// Monotonic token used to drop stale `search()` responses. Incremented on
// every new search; in-flight responses compare their token against the
// latest before touching store state, so a slow request for an older query
// can't overwrite fresh results when the user changes query or sort mid-fetch.
let searchToken = 0;

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
		activeFilters: state.activeFilters,
		filterConfigs: state.filterConfigs,
	} );
	const response = yield fetch( url, {
		headers: state.isPrivateSite ? { 'X-WP-Nonce': state.nonce } : {},
		credentials: state.isPrivateSite ? 'include' : 'same-origin',
	} );
	return yield response.json();
}

const { state, actions } = store( NAMESPACE, {
	state: {
		/**
		 * Short human-readable results count for display blocks. Doubles
		 * as the loading indicator: returning "Searching…" in-place
		 * keeps the results-count element populated across the transition
		 * from one query to the next, so the flex row containing it
		 * doesn't collapse and re-expand on every keystroke-triggered
		 * search. There is no separate spinner/skeleton — this text is
		 * the loading state, and the search-results wrapper carries
		 * `aria-busy` for assistive tech.
		 *
		 * NOTE: not localized. `@wordpress/i18n` isn't available as an
		 * Interactivity API script module (WP only registers
		 * `@wordpress/interactivity`), and the dependency-extraction
		 * plugin throws when any other `@wordpress/*` is imported into
		 * an ESM view bundle. Revisit when WP registers wp-i18n as a
		 * module, or switch to seeding translated plural forms from PHP
		 * via `wp_interactivity_state()`. See PR #48198.
		 *
		 * @return {string} "Searching…" while a search is in flight,
		 * "Found 42 results" once a query resolves with hits, or an
		 * empty string in every other case — pre-search, error, or
		 * zero hits. The no-results block owns the empty-state copy.
		 */
		get resultsCountText() {
			if ( state.isLoading ) {
				return 'Searching…';
			}
			const total = state.totalResults;
			if ( total === 0 ) {
				return '';
			}
			return `Found ${ total } result${ total === 1 ? '' : 's' }`;
		},

		/**
		 * `data-wp-bind` only evaluates simple property paths (with an
		 * optional leading `!`) — expressions like `a.length > 0 || b`
		 * parse as literal path segments and silently return `undefined`.
		 * Templates therefore must bind to a single getter, so derived
		 * visibility flags live here.
		 *
		 * Gated on `searchQuery` (so the message doesn't flash on a bare
		 * `/search/` page where the user hasn't typed) and on `!hasError`
		 * (so "No results found" doesn't display when the fetch actually
		 * failed — there is no dedicated error block yet).
		 *
		 * @return {boolean} True when the no-results message should show.
		 */
		get showNoResults() {
			return (
				!! state.searchQuery && ! state.isLoading && ! state.hasError && state.results.length === 0
			);
		},

		/**
		 * Derived load-more wrapper visibility. Hidden while the first-page
		 * fetch is in flight so a stale `pageHandle` from the previous query
		 * doesn't flash a "Load more" button against results that no longer
		 * match. `isLoadingMore` (paginating the current query) stays
		 * orthogonal — the wrapper stays visible and its children swap the
		 * button for a spinner via their own bindings.
		 *
		 * @return {boolean} True when the load-more wrapper should show.
		 */
		get showLoadMore() {
			return !! state.pageHandle && ! state.isLoading;
		},

		/**
		 * True when any filter has at least one selected value. Used by
		 * active-filters to decide whether to render the pills wrapper.
		 *
		 * @return {boolean} Whether any filter is active.
		 */
		get hasActiveFilters() {
			return Object.values( state.activeFilters ?? {} ).some(
				v => Array.isArray( v ) && v.length > 0
			);
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
				state.results = ( data.results ?? [] ).map( r => normalizeResult( r, state.locale ) );
				state.totalResults = data.total ?? 0;
				state.pageHandle = data.page_handle ?? null;
				state.aggregations = data.aggregations ?? {};
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
				state.results = [
					...state.results,
					...( data.results ?? [] ).map( r => normalizeResult( r, state.locale ) ),
				];
				state.pageHandle = data.page_handle ?? null;
			} catch {
				state.hasError = true;
			} finally {
				state.isLoadingMore = false;
			}
		},

		/**
		 * Toggle a filter value on or off, then re-run the search.
		 *
		 * Multiple selected values under the same filter key are kept in an
		 * array on `activeFilters`; different filter keys stay separate. How
		 * the ES clause combines them (OR within a key, AND across keys) is
		 * the responsibility of `buildFilterClause` — this action is just
		 * bookkeeping on the selection set.
		 *
		 * @param {string} filterKey   - e.g. `category`, `post_types`.
		 * @param {string} filterValue - e.g. `news`, `post`.
		 * @yield {Promise} search action.
		 */
		*setFilter( filterKey, filterValue ) {
			const current = state.activeFilters[ filterKey ] ?? [];
			const index = current.indexOf( filterValue );
			if ( index === -1 ) {
				state.activeFilters = {
					...state.activeFilters,
					[ filterKey ]: [ ...current, filterValue ],
				};
			} else {
				const next = current.filter( v => v !== filterValue );
				if ( next.length === 0 ) {
					const { [ filterKey ]: _removed, ...rest } = state.activeFilters;
					state.activeFilters = rest;
				} else {
					state.activeFilters = { ...state.activeFilters, [ filterKey ]: next };
				}
			}
			yield actions.search();
		},

		/**
		 * Clear all active filters and re-run the search.
		 *
		 * @yield {Promise} search action.
		 */
		*clearFilters() {
			if ( Object.keys( state.activeFilters ?? {} ).length === 0 ) {
				return;
			}
			state.activeFilters = {};
			yield actions.search();
		},

		/**
		 * Push current state to browser URL.
		 */
		syncToUrl() {
			pushStateToUrl( {
				searchQuery: state.searchQuery,
				sortOrder: state.sortOrder,
				activeFilters: state.activeFilters,
			} );
		},

		/**
		 * Handle browser back/forward navigation.
		 *
		 * @yield {Promise} search action.
		 */
		*handlePopState() {
			const { searchQuery, sortOrder, activeFilters } = readStateFromUrl( state.filterConfigs );
			state.searchQuery = searchQuery;
			state.sortOrder = sortOrder;
			state.activeFilters = activeFilters;
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
			if ( state.searchQuery || state.hasActiveFilters ) {
				// The URL already carries this query — don't push a duplicate
				// history entry on top of the browser's current one.
				actions.search( { syncUrl: false } );
			}
		},
	},
} );

export { state, actions };

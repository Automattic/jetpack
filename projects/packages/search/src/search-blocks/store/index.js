import { store } from '@wordpress/interactivity';
import { buildSearchUrl } from './api';
import { isEventInsidePopoverRoot } from './popover-events';
import { countActiveFilters, normalizeResult } from './result-utils';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';
let initialized = false;
// Monotonic token used to drop stale async result responses. Incremented on
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
		priceRange: state.priceRange,
	} );
	const response = yield fetch( url, {
		headers: state.isPrivateSite ? { 'X-WP-Nonce': state.nonce } : {},
		credentials: state.isPrivateSite ? 'include' : 'same-origin',
	} );
	return yield response.json();
}

const { state, actions } = store( NAMESPACE, {
	state: {
		// UI: popover open flags. Kept as separate booleans so only one
		// popover can be open at a time — the toggle actions close the
		// other when opening this one.
		isFilterPopoverOpen: false,
		isSortPopoverOpen: false,

		/**
		 * Short human-readable results count for display blocks. Doubles
		 * as the loading indicator: returning the "searching" string
		 * in-place keeps the results-count element populated across the
		 * transition from one query to the next, so the flex row
		 * containing it doesn't collapse and re-expand on every
		 * keystroke-triggered search. There is no separate
		 * spinner/skeleton — this text is the loading state, and the
		 * search-results wrapper carries `aria-busy` for assistive tech.
		 *
		 * Strings are seeded from PHP via `wp_interactivity_state()`
		 * (see `Search_Blocks::build_initial_strings()`) because the
		 * view bundle can't import `@wordpress/i18n` — WP only registers
		 * `@wordpress/interactivity` as a script module. Languages with
		 * more than two plural forms degrade to "plural for all count
		 * > 1" since the count is dynamic on the client.
		 *
		 * @return {string} Translated "Searching…" while a search is in
		 * flight, "Found 42 results" once a query resolves with hits,
		 * or an empty string in every other case — pre-search, error,
		 * or zero hits. The no-results block owns the empty-state copy.
		 */
		get resultsCountText() {
			if ( state.isLoading ) {
				return state.strings?.searching ?? 'Searching…';
			}
			const total = state.totalResults;
			if ( total === 0 ) {
				return '';
			}
			const template =
				total === 1
					? state.strings?.resultsCountSingle ?? 'Found %d result'
					: state.strings?.resultsCountPlural ?? 'Found %d results';
			return template.replace( '%d', total );
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

		/**
		 * Total selected filter values across all filter keys. Used by the
		 * filter-popover trigger to render a count badge.
		 *
		 * @return {number} Count of selected filter values.
		 */
		get activeFilterCount() {
			return countActiveFilters( state.activeFilters );
		},

		/**
		 * True when the filter-popover trigger should be disabled: there are
		 * no aggregation buckets to filter on AND no active filters to clear.
		 * Opening the popover in that state would show an empty panel, so we
		 * gate the affordance itself. Remains enabled while any filter is
		 * active so users can still open the popover to remove pills even
		 * when the current query returns no results.
		 *
		 * @return {boolean} Whether the filter trigger is disabled.
		 */
		get isFilterTriggerDisabled() {
			if ( state.hasActiveFilters ) {
				return false;
			}
			const aggs = state.aggregations ?? {};
			for ( const key of Object.keys( aggs ) ) {
				const buckets = aggs[ key ]?.buckets;
				if ( Array.isArray( buckets ) && buckets.length > 0 ) {
					return false;
				}
			}
			return true;
		},

		/**
		 * True when the current sort order is "relevance". Used by the sort
		 * popover menu to set `aria-checked` on the Relevance menu item.
		 * Interactivity API `data-wp-bind` only evaluates simple property
		 * paths, so inline `===` comparisons are not supported — derived
		 * booleans must live here.
		 *
		 * @return {boolean} Whether sortOrder is "relevance".
		 */
		get isSortByRelevance() {
			return state.sortOrder === 'relevance';
		},

		/**
		 * True when the sort-popover trigger should be disabled: there are
		 * no results to sort AND the sort order is still the default. Mirrors
		 * `isFilterTriggerDisabled` — opening the popover pre-search shows a
		 * menu that would do nothing. Remains enabled when the user has
		 * already picked a non-default sort so they can switch back.
		 *
		 * @return {boolean} Whether the sort trigger is disabled.
		 */
		get isSortTriggerDisabled() {
			return state.totalResults === 0 && state.sortOrder === 'relevance';
		},

		/**
		 * True when the current sort order is "newest".
		 *
		 * @return {boolean} Whether sortOrder is "newest".
		 */
		get isSortByNewest() {
			return state.sortOrder === 'newest';
		},

		/**
		 * True when the current sort order is "oldest".
		 *
		 * @return {boolean} Whether sortOrder is "oldest".
		 */
		get isSortByOldest() {
			return state.sortOrder === 'oldest';
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
			state.isLoadingMore = false;
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
			const myToken = searchToken;
			state.isLoadingMore = true;
			state.hasError = false;
			try {
				const data = yield* fetchResults( state.pageHandle );
				// A first-page search started while this pagination request was
				// in-flight. Its response owns the list, so don't append stale
				// items from the old query/filter/sort state.
				if ( myToken !== searchToken ) {
					return;
				}
				state.results = [
					...state.results,
					...( data.results ?? [] ).map( r => normalizeResult( r, state.locale ) ),
				];
				state.pageHandle = data.page_handle ?? null;
			} catch {
				if ( myToken === searchToken ) {
					state.hasError = true;
				}
			} finally {
				if ( myToken === searchToken ) {
					state.isLoadingMore = false;
				}
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
				priceRange: state.priceRange,
			} );
		},

		/**
		 * Handle browser back/forward navigation.
		 *
		 * @yield {Promise} search action.
		 */
		*handlePopState() {
			const { searchQuery, sortOrder, activeFilters, priceRange } = readStateFromUrl(
				state.filterConfigs
			);
			state.searchQuery = searchQuery;
			state.sortOrder = sortOrder;
			state.activeFilters = activeFilters;
			state.priceRange = priceRange;
			yield actions.search( { syncUrl: false } );
		},

		/**
		 * Toggle the filter popover. Closes the sort popover if it's open.
		 */
		toggleFilterPopover() {
			state.isFilterPopoverOpen = ! state.isFilterPopoverOpen;
			if ( state.isFilterPopoverOpen ) {
				state.isSortPopoverOpen = false;
			}
		},

		/**
		 * Toggle the sort popover. Closes the filter popover if it's open.
		 */
		toggleSortPopover() {
			state.isSortPopoverOpen = ! state.isSortPopoverOpen;
			if ( state.isSortPopoverOpen ) {
				state.isFilterPopoverOpen = false;
			}
		},

		/**
		 * Close every popover. Bound to Escape key and outside-click handlers.
		 */
		closeAllPopovers() {
			state.isFilterPopoverOpen = false;
			state.isSortPopoverOpen = false;
		},

		/**
		 * Change sort order from a popover menu item and close the popover.
		 * `event.currentTarget.value` carries the new sortOrder.
		 *
		 * @param {Event} event - Click event from the menu item.
		 * @yield {Promise} Search fetch.
		 */
		*selectSortOrder( event ) {
			const next = event?.currentTarget?.value;
			if ( ! next || next === state.sortOrder ) {
				state.isSortPopoverOpen = false;
				return;
			}
			state.sortOrder = next;
			state.isSortPopoverOpen = false;
			yield actions.search();
		},

		/**
		 * Close any open popover when clicking outside it. Bound to
		 * `data-wp-on-window--click` so the handler fires on every click;
		 * early-exit when the click began inside any element marked with
		 * `data-jetpack-search-popover-root`.
		 *
		 * @param {Event} event - Window click event.
		 */
		onWindowClickClosePopovers( event ) {
			if ( ! state.isFilterPopoverOpen && ! state.isSortPopoverOpen ) {
				return;
			}
			if ( isEventInsidePopoverRoot( event ) ) {
				return;
			}
			state.isFilterPopoverOpen = false;
			state.isSortPopoverOpen = false;
		},

		/**
		 * Close popovers on Escape.
		 *
		 * @param {KeyboardEvent} event - Window keydown event.
		 */
		onEscapeClosePopovers( event ) {
			if ( event?.key !== 'Escape' ) {
				return;
			}
			if ( state.isFilterPopoverOpen || state.isSortPopoverOpen ) {
				state.isFilterPopoverOpen = false;
				state.isSortPopoverOpen = false;
			}
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
			if ( state.searchQuery || state.hasActiveFilters || state.priceRange ) {
				// The URL already carries this query — don't push a duplicate
				// history entry on top of the browser's current one.
				// `priceRange` is checked separately because `hasActiveFilters`
				// only inspects `activeFilters`; without this gate a URL like
				// `?min_price=10` would leave PHP's `isLoading: true` spinner
				// stuck because no initial fetch ever fires.
				actions.search( { syncUrl: false } );
			}
		},
	},
} );

export { state, actions };

import {
	store,
	getContext,
	withSyncEvent as originalWithSyncEvent,
} from '@wordpress/interactivity';
import { buildSearchUrl, formatDateBucketLabel } from './api';
import { isEventInsidePopoverRoot } from './popover-events';
import { countActiveFilters, normalizeResult } from './result-utils';
import {
	focusSortTrigger,
	getSortMenuOptionKeysFromItem,
	getSortMenuOptionKeysFromTrigger,
} from './sort-menu-dom';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';
let initialized = false;

// `withSyncEvent` opts an action into reading synchronous event APIs
// (`event.currentTarget`, `event.preventDefault()`) without the
// "synchronous event access" deprecation warning the Interactivity API
// will turn into a hard error in WordPress 7.0. Falls back to a noop
// wrapper on older runtimes (pre-WP 6.7) so the package still loads.
const withSyncEvent =
	originalWithSyncEvent ||
	( cb =>
		( ...args ) =>
			cb( ...args ) );

/**
 * Drop activeFilters keys not present in filterConfigs.
 *
 * Uses `Object.hasOwn` rather than `allowedKeys[key]` so prototype-chain
 * keys (`__proto__`, `constructor`, `toString`, …) can't survive the gate
 * via inherited properties. Output uses a null prototype for the same
 * reason — assigning `gated.__proto__` on a plain object would trigger
 * the prototype setter instead of writing a regular property.
 *
 * @param {object} activeFilters - { [filterKey]: string[] } URL-seeded selections.
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } registered filters.
 * @return {{ gated: object, droppedAny: boolean }} Filtered selections plus a drop flag.
 */
export function gateActiveFilters( activeFilters, filterConfigs ) {
	const allowedKeys = filterConfigs ?? {};
	const gated = Object.create( null );
	let droppedAny = false;
	for ( const [ key, values ] of Object.entries( activeFilters ?? {} ) ) {
		if ( ! Object.hasOwn( allowedKeys, key ) ) {
			droppedAny = true;
			continue;
		}
		gated[ key ] = values;
	}
	return { gated, droppedAny };
}

/**
 * Parse a `slug_slash_name` aggregation bucket key into `{ value, label }`.
 *
 * Taxonomy, author, and product-attribute aggregations index the bucket key
 * as `slug/Display Name`; post-type buckets are plain (no slash) so value
 * and label are the same. Splitting on the *first* `/` handles names that
 * themselves contain slashes.
 *
 * @param {unknown} rawKey - Bucket `key` from the search response.
 * @return {{ value: string, label: string }} Parsed value (slug) and label (display name).
 */
function parseSlashBucketKey( rawKey ) {
	const key = String( rawKey ?? '' );
	const slashIdx = key.indexOf( '/' );
	if ( slashIdx === -1 ) {
		return { value: key, label: key };
	}
	return { value: key.slice( 0, slashIdx ), label: key.slice( slashIdx + 1 ) };
}

/**
 * Resolve the slug for a date_histogram bucket.
 *
 * Date buckets carry both `key` (epoch milliseconds) and `key_as_string`
 * (formatted by ES with the `Y` / `Y-m` format the block requested). We use
 * `key_as_string` as the slug so URLs read like `?post_date[]=2024` or
 * `?post_date[]=2024-03`, which is what visitors expect to see.
 *
 * @param {object} bucket - Aggregation bucket from the search response.
 * @return {string} Bucket slug (year or yyyy-mm).
 */
function dateBucketSlug( bucket ) {
	const ks = bucket?.key_as_string;
	if ( typeof ks === 'string' && ks !== '' ) {
		return ks;
	}
	// `key_as_string` is always populated when ES has a `format` on the agg
	// (which buildAggregations supplies), but fall back to the numeric key
	// stringified so a malformed response still produces a stable identifier.
	return String( bucket?.key ?? '' );
}

/**
 * Build the `filterItems` list for a `slash`-format filter (taxonomy,
 * post_type, author). Selected buckets are dropped — active filters appear
 * in the active-filters block, so the checkbox list only offers values the
 * user hasn't chosen yet.
 *
 * @param {object} sharedState - Live store state.
 * @param {string} filterKey   - Key of this filter's aggregation entry.
 * @param {object} config      - filterConfigs entry for this filter.
 * @return {Array<object>} Item descriptors for each unselected bucket.
 */
function checkboxFilterItems( sharedState, filterKey, config ) {
	const buckets = sharedState.aggregations?.[ filterKey ]?.buckets;
	if ( ! Array.isArray( buckets ) ) {
		return [];
	}
	const selected = sharedState.activeFilters?.[ filterKey ] ?? [];
	const showCount = config.showCount !== false;
	return buckets.reduce( ( items, bucket ) => {
		const { value, label } = parseSlashBucketKey( bucket.key );
		if ( selected.includes( value ) ) {
			return items;
		}
		items.push( {
			value,
			label,
			showCount,
			countLabel: String( bucket.doc_count ?? 0 ),
		} );
		return items;
	}, [] );
}

/**
 * Build the `filterItems` list for a `date` filter. Drops empty
 * (`doc_count: 0`) buckets and buckets the user has already selected, then
 * truncates to `maxItems`. Each item carries a pre-formatted `label` via
 * `formatDateBucketLabel` so the active-filters pill code can read this
 * same shape without re-implementing date formatting per block.
 *
 * @param {object} sharedState - Live store state.
 * @param {string} filterKey   - Key of this filter's aggregation entry.
 * @param {object} config      - filterConfigs entry for this filter.
 * @return {Array<object>} Item descriptors for each unselected, populated bucket.
 */
function dateFilterItems( sharedState, filterKey, config ) {
	const buckets = sharedState.aggregations?.[ filterKey ]?.buckets;
	if ( ! Array.isArray( buckets ) ) {
		return [];
	}
	const selected = sharedState.activeFilters?.[ filterKey ] ?? [];
	const showCount = config.showCount !== false;
	const interval = config.interval === 'month' ? 'month' : 'year';
	const locale = sharedState.locale || 'en-US';
	// date_histogram has no ES `size` parameter — the response carries every
	// non-empty bucket in the date range. Slice client-side to `maxItems` so
	// a long-running blog doesn't render dozens of checkboxes; ES order has
	// already placed the user's preferred buckets at the head of the list.
	const limit = Math.max( 1, config.maxItems ?? 10 );
	const items = [];
	for ( const bucket of buckets ) {
		if ( items.length >= limit ) {
			break;
		}
		if ( ( bucket?.doc_count ?? 0 ) <= 0 ) {
			continue;
		}
		const value = dateBucketSlug( bucket );
		if ( ! value || selected.includes( value ) ) {
			continue;
		}
		items.push( {
			value,
			label: formatDateBucketLabel( value, interval, locale ),
			showCount,
			countLabel: String( bucket.doc_count ),
		} );
	}
	return items;
}
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

		// Roving-tabindex state for the sort popover's ARIA menu. Tracks
		// which menu item is the active descendant for keyboard
		// navigation; `null` (or a key not present in the rendered menu)
		// means the menu hasn't been keyboard-engaged yet, in which case
		// the currently checked option becomes the implicit default.
		sortMenuFocusedKey: null,

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

		/**
		 * Whether the current filter block has any aggregation buckets to
		 * render. Bound to the wrapper's `hidden` attribute so a filter
		 * group with no matches disappears rather than showing an empty
		 * heading. Dispatches on `filterType` so each block type uses its
		 * own emptiness rule: `date` requires at least one populated bucket
		 * (`doc_count > 0`), since the date_histogram is requested with
		 * `min_doc_count: 1` and empty buckets shouldn't arrive — keep the
		 * guard as defence-in-depth against response-shape changes. Every
		 * other filter type just needs at least one bucket of any size.
		 *
		 * @return {boolean} True when buckets are available.
		 */
		get hasFilterBuckets() {
			const { filterKey } = getContext();
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			if ( ! Array.isArray( buckets ) || buckets.length === 0 ) {
				return false;
			}
			const config = state.filterConfigs?.[ filterKey ] ?? {};
			if ( config.filterType === 'date' ) {
				return buckets.some( bucket => ( bucket?.doc_count ?? 0 ) > 0 );
			}
			return true;
		},

		/**
		 * True when every available bucket is already in `activeFilters` —
		 * the checkbox list would render empty and the block should show
		 * the "All filters applied" message instead. Bucket-slug derivation
		 * dispatches on `filterType`: date filters compare against
		 * `key_as_string`; other filters parse the `slug/Name` key.
		 *
		 * @return {boolean} True when the list has nothing left to offer.
		 */
		get allBucketsSelected() {
			const { filterKey } = getContext();
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			if ( ! Array.isArray( buckets ) || buckets.length === 0 ) {
				return false;
			}
			const selected = state.activeFilters?.[ filterKey ] ?? [];
			if ( selected.length === 0 ) {
				return false;
			}
			const config = state.filterConfigs?.[ filterKey ] ?? {};
			if ( config.filterType === 'date' ) {
				const populated = buckets.filter( bucket => ( bucket?.doc_count ?? 0 ) > 0 );
				if ( populated.length === 0 ) {
					return false;
				}
				return populated.every( bucket => selected.includes( dateBucketSlug( bucket ) ) );
			}
			return buckets.every( bucket => {
				const { value } = parseSlashBucketKey( bucket.key );
				return selected.includes( value );
			} );
		},

		/**
		 * Derived list of `{ value, label, showCount, countLabel }` items
		 * for the current filter block. Dispatches on `filterType` to the
		 * matching builder so a single getter on the shared namespace
		 * serves every filter block — registering it inside each view
		 * bundle would clobber siblings on a page with mixed filter types
		 * (Interactivity API merges later `store()` patches).
		 *
		 * @return {Array<object>} Item descriptors for each unselected bucket.
		 */
		get filterItems() {
			const { filterKey } = getContext();
			const config = state.filterConfigs?.[ filterKey ] ?? {};
			if ( config.filterType === 'date' ) {
				return dateFilterItems( state, filterKey, config );
			}
			return checkboxFilterItems( state, filterKey, config );
		},
	},

	actions: {
		/**
		 * Toggle the filter value that owns the change event. Shared by
		 * filter-checkbox and filter-date — both bind the same checkbox
		 * `change` handler; the input's `value` carries the slug, and
		 * `filterKey` comes from the wrapper context. Living on the shared
		 * namespace keeps the action registration single-owner so a later-
		 * loaded view bundle can't replace it with a divergent copy.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} setFilter action.
		 */
		*onFilterChange( event ) {
			const { filterKey } = getContext();
			yield actions.setFilter( filterKey, event.target.value );
		},

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
			// urlParamsToState bypasses its own gate when filterConfigs is empty;
			// re-gate here so popstate matches initialize() and stray URL keys
			// can't round-trip back into pushStateToUrl on a page with no
			// registered filters.
			state.activeFilters = gateActiveFilters( activeFilters, state.filterConfigs ).gated;
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
		 * Resets the menu's roving-tabindex state on close so the next
		 * open starts focus on the active sort.
		 */
		toggleSortPopover() {
			state.isSortPopoverOpen = ! state.isSortPopoverOpen;
			if ( state.isSortPopoverOpen ) {
				state.isFilterPopoverOpen = false;
			} else {
				state.sortMenuFocusedKey = null;
			}
		},

		/**
		 * Close every popover. Bound to Escape key and outside-click handlers.
		 */
		closeAllPopovers() {
			state.isFilterPopoverOpen = false;
			state.isSortPopoverOpen = false;
			state.sortMenuFocusedKey = null;
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
				state.sortMenuFocusedKey = null;
				return;
			}
			state.sortOrder = next;
			state.isSortPopoverOpen = false;
			state.sortMenuFocusedKey = null;
			yield actions.search();
		},

		/**
		 * Open the sort popover from the trigger via ArrowDown/ArrowUp/Enter
		 * /Space and move focus into the menu. Anchors focus on the active
		 * sort (the checked menuitemradio) — matches the radio-menu pattern
		 * where reopening returns to the selected option rather than
		 * snapping back to the top. Falls back to the first/last item only
		 * when the active sort isn't in the rendered list. Tab is left to
		 * the browser so users can step past the trigger without entering
		 * the menu, matching the WAI-ARIA APG menu-button example.
		 *
		 * @param {KeyboardEvent} event - Keydown event on the trigger.
		 */
		onSortTriggerKeydown: withSyncEvent( event => {
			const key = event?.key;
			if ( key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Enter' && key !== ' ' ) {
				return;
			}
			event.preventDefault();
			if ( ! state.isSortPopoverOpen ) {
				state.isSortPopoverOpen = true;
				state.isFilterPopoverOpen = false;
			}
			const options = getSortMenuOptionKeysFromTrigger( event.currentTarget );
			if ( options.length === 0 ) {
				return;
			}
			if ( options.includes( state.sortOrder ) ) {
				state.sortMenuFocusedKey = state.sortOrder;
				return;
			}
			state.sortMenuFocusedKey = key === 'ArrowUp' ? options[ options.length - 1 ] : options[ 0 ];
		} ),

		/**
		 * Implements the ARIA menu keyboard pattern for the sort popover:
		 * roving tabindex with ArrowUp/ArrowDown wrapping, Home/End to
		 * jump to ends, Enter/Space to activate, Escape to close and
		 * return focus to the trigger, and Tab to leave the menu (handled
		 * by letting the browser's default focus order continue while we
		 * close the popover so the focus ring lands on the next focusable
		 * sibling rather than skipping back into a hidden menu item).
		 *
		 * @param {KeyboardEvent} event - Keydown event on a menu item.
		 * @yield {Promise} Optional search action when Enter/Space activates.
		 */
		onSortMenuKeydown: withSyncEvent( function* ( event ) {
			const key = event?.key;
			if ( key === 'Tab' ) {
				state.isSortPopoverOpen = false;
				state.sortMenuFocusedKey = null;
				return;
			}
			if ( key === 'Escape' ) {
				event.preventDefault();
				state.isSortPopoverOpen = false;
				state.sortMenuFocusedKey = null;
				focusSortTrigger( event.currentTarget );
				return;
			}
			if ( key === 'Enter' || key === ' ' ) {
				event.preventDefault();
				const item = event.currentTarget;
				const next = item?.value;
				const shouldSearch = !! next && next !== state.sortOrder;
				if ( shouldSearch ) {
					state.sortOrder = next;
				}
				state.isSortPopoverOpen = false;
				state.sortMenuFocusedKey = null;
				focusSortTrigger( item );
				if ( shouldSearch ) {
					yield actions.search();
				}
				return;
			}
			const options = getSortMenuOptionKeysFromItem( event?.currentTarget );
			if ( options.length === 0 ) {
				return;
			}
			if ( key === 'Home' ) {
				event.preventDefault();
				state.sortMenuFocusedKey = options[ 0 ];
				return;
			}
			if ( key === 'End' ) {
				event.preventDefault();
				state.sortMenuFocusedKey = options[ options.length - 1 ];
				return;
			}
			if ( key === 'ArrowDown' || key === 'ArrowUp' ) {
				event.preventDefault();
				const currentValue = event?.currentTarget?.value ?? null;
				const currentIndex = currentValue ? options.indexOf( currentValue ) : -1;
				const delta = key === 'ArrowDown' ? 1 : -1;
				let nextIndex;
				if ( currentIndex < 0 ) {
					nextIndex = key === 'ArrowDown' ? 0 : options.length - 1;
				} else {
					nextIndex = ( currentIndex + delta + options.length ) % options.length;
				}
				state.sortMenuFocusedKey = options[ nextIndex ];
			}
		} ),

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
			state.sortMenuFocusedKey = null;
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
				state.sortMenuFocusedKey = null;
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
			const { gated, droppedAny } = gateActiveFilters( state.activeFilters, state.filterConfigs );
			if ( droppedAny ) {
				state.activeFilters = gated;
			}
			if ( state.searchQuery || state.hasActiveFilters || state.priceRange ) {
				// syncUrl=false: URL already carries this query; avoid a duplicate history entry.
				// priceRange is checked separately so `?min_price=10` still triggers an initial fetch.
				actions.search( { syncUrl: false } );
			} else if ( droppedAny ) {
				// Gate emptied activeFilters and no fetch will fire — clear the PHP-seeded spinner.
				state.isLoading = false;
			}
		},
	},
} );

export { state, actions };

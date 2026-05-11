import {
	store,
	getContext,
	withSyncEvent as originalWithSyncEvent,
} from '@wordpress/interactivity';
import { buildSearchUrl, formatDateBucketLabel } from './api';
import { bucketLabel, bucketValue } from './bucket-key';
import { isEventInsidePopoverRoot } from './popover-events';
import { countActiveFilters, normalizeResult } from './result-utils';
import {
	focusSortTrigger,
	getSortMenuOptionKeysFromItem,
	getSortMenuOptionKeysFromTrigger,
} from './results-sort-menu-dom';
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
 * Drop filterLogic entries whose filter key is missing from `activeFilters`,
 * has an empty selection set, or targets a non-taxonomy filter. Mirrors the
 * cleanup `setFilter()` performs locally; called from popstate and at
 * hydration where the URL parse is the source of truth and the
 * taxonomy-only gate (server-side `Filter_Checkbox::normalize_query_type`)
 * may not have run yet — because PHP `parse_url_filter_logic` runs before
 * any block has registered its config, so it can't know which keys are
 * taxonomy filters.
 *
 * @param {object} filterLogic     - { [filterKey]: 'or' | 'and' }.
 * @param {object} activeFilters   - { [filterKey]: string[] }.
 * @param {object} [filterConfigs] - { [filterKey]: FilterConfig } when available; passing
 *                                 this enables the taxonomy gate.
 * @return {object} Gated logic map.
 */
export function pickLogicForActive( filterLogic, activeFilters, filterConfigs = null ) {
	const out = {};
	for ( const [ key, value ] of Object.entries( filterLogic ?? {} ) ) {
		if ( ( activeFilters?.[ key ]?.length ?? 0 ) === 0 ) {
			continue;
		}
		if ( filterConfigs && filterConfigs[ key ]?.filterType !== 'taxonomy' ) {
			continue;
		}
		out[ key ] = value;
	}
	return out;
}

/**
 * Overlay per-filter AND/OR overrides onto each filterConfig's `queryType`.
 * The override map (`filterLogic`) is its own state slice — kept separate so
 * a deep-link `?query_type_category=and` survives even if the user toggles
 * the block attribute in a future edit. Returns the original map untouched
 * when no overrides apply, to avoid spurious referential changes that would
 * defeat downstream identity checks.
 *
 * @param {object} filterConfigs - { [filterKey]: FilterConfig }.
 * @param {object} filterLogic   - { [filterKey]: 'or' | 'and' } overrides.
 * @return {object} Effective filterConfigs.
 */
export function overlayFilterLogic( filterConfigs, filterLogic ) {
	if ( ! filterConfigs || ! filterLogic || Object.keys( filterLogic ).length === 0 ) {
		return filterConfigs;
	}
	let dirty = false;
	const overlaid = {};
	for ( const [ key, config ] of Object.entries( filterConfigs ) ) {
		const override = filterLogic[ key ];
		if ( override && override !== config?.queryType ) {
			overlaid[ key ] = { ...config, queryType: override };
			dirty = true;
		} else {
			overlaid[ key ] = config;
		}
	}
	return dirty ? overlaid : filterConfigs;
}

/**
 * True when a filter key has anything to render: live aggregation buckets,
 * session-retained options, or an active selection. Drives wrapper
 * visibility — without the retained / selection check a narrower query
 * could hide the section that holds the user's own selection.
 *
 * Date filters bail out before the retention / selection clauses: they
 * don't accumulate retained options (mergeRetainedFilterOptions skips
 * them) and dateFilterItems doesn't render selected values that aren't
 * in the current aggregation, so an empty bucket list means an empty
 * <ul> and the wrapper should hide. Selections still surface via the
 * active-filters pills.
 *
 * @param {object} sharedState - Live store state.
 * @param {string} filterKey   - Filter key.
 * @return {boolean} True when the wrapper has something to show.
 */
function filterHasContent( sharedState, filterKey ) {
	if ( ( sharedState.aggregations?.[ filterKey ]?.buckets?.length ?? 0 ) > 0 ) {
		return true;
	}
	if ( sharedState.filterConfigs?.[ filterKey ]?.filterType === 'date' ) {
		return false;
	}
	return (
		( sharedState.retainedFilterOptions?.[ filterKey ]?.length ?? 0 ) > 0 ||
		( sharedState.activeFilters?.[ filterKey ]?.length ?? 0 ) > 0
	);
}

/**
 * Slug for a date_histogram bucket. Falls back to the numeric key when
 * `key_as_string` is missing.
 *
 * @param {object} bucket - Aggregation bucket.
 * @return {string} Bucket slug.
 */
function dateBucketSlug( bucket ) {
	const ks = bucket?.key_as_string;
	if ( typeof ks === 'string' && ks !== '' ) {
		return ks;
	}
	return String( bucket?.key ?? '' );
}

/**
 * filterItems for non-date filters. Handles both `slug/Name` keys (taxonomy,
 * author) and bare-slug keys (post_type) via `bucketLabel`/`bucketValue`.
 *
 * Three sources are merged:
 * 1. The current aggregation's buckets — authoritative for label and count.
 * 2. `retainedFilterOptions[filterKey]` — values seen in earlier responses
 * whose buckets dropped out of the latest result set; rendered with count
 * `0` so the list stays stable across searches.
 * 3. Selected values not yet seen in any aggregation (URL-seeded deep links
 * that arrive before the first fetch resolves) — rendered as checked, count
 * `0`, label falling back to the value itself when no `valueLabels` mapping
 * exists.
 *
 * Sort order: unchecked, zero-count items sink to the bottom; the rest follow
 * the configured `bucketSortOrder` (count desc or alpha by visible label).
 * A checked option keeps its normal sort position even if its current count
 * is `0`, so users always see what they've selected. The `count` sort uses
 * the visible label as a tiebreaker so two buckets with the same count don't
 * swap positions across re-renders — ES bucket order is unstable on ties.
 *
 * @param {object} sharedState - Live store state.
 * @param {string} filterKey   - Filter key.
 * @param {object} config      - filterConfigs entry.
 * @return {Array<object>} Item descriptors.
 */
function checkboxFilterItems( sharedState, filterKey, config ) {
	const buckets = sharedState.aggregations?.[ filterKey ]?.buckets ?? [];
	const retained = sharedState.retainedFilterOptions?.[ filterKey ] ?? [];
	const selected = sharedState.activeFilters?.[ filterKey ] ?? [];
	const selectedSet = new Set( selected );
	const showCount = config.showCount !== false;
	const valueLabels = config.valueLabels;

	const seen = new Set();
	const items = [];
	const add = ( value, label, count ) => {
		if ( seen.has( value ) ) {
			return;
		}
		seen.add( value );
		items.push( {
			value,
			label,
			showCount,
			countLabel: String( count ),
			count,
			checked: selectedSet.has( value ),
		} );
	};

	for ( const bucket of buckets ) {
		add( bucketValue( bucket.key ), bucketLabel( bucket.key, valueLabels ), bucket.doc_count ?? 0 );
	}
	for ( const option of retained ) {
		add( option.value, option.label, 0 );
	}
	for ( const value of selected ) {
		add( value, bucketLabel( value, valueLabels ), 0 );
	}

	return sortFilterItems( items, config, sharedState.locale );
}

/**
 * Apply the configured bucket sort order with one global rule layered on top:
 * unchecked options whose count is `0` sink to the bottom. Checked items keep
 * their normal sort position even at count `0`.
 *
 * @param {Array<object>} items  - Items as built by `checkboxFilterItems`.
 * @param {object}        config - filterConfigs entry (`bucketSortOrder`).
 * @param {string}        locale - Locale tag for `localeCompare`.
 * @return {Array<object>} The same array, sorted in place.
 */
function sortFilterItems( items, config, locale ) {
	const lc = locale || 'en-US';
	const byLabel = ( a, b ) => a.label.localeCompare( b.label, lc, { sensitivity: 'base' } );
	const compareConfigured =
		config.bucketSortOrder === 'alpha'
			? byLabel
			: ( a, b ) => ( a.count !== b.count ? b.count - a.count : byLabel( a, b ) );
	const sinkRank = item => ( ! item.checked && item.count === 0 ? 1 : 0 );
	return items.sort( ( a, b ) => sinkRank( a ) - sinkRank( b ) || compareConfigured( a, b ) );
}

/**
 * Merge fresh aggregation buckets into `retainedFilterOptions` so the
 * filter-checkbox list keeps options that have appeared at any point in
 * the session, even after a narrower query drops them from ES results.
 * Returns the original object when nothing is added so reactive subscribers
 * don't re-run on no-op merges.
 *
 * Date filters are skipped — their bucket set is dense by interval and the
 * `dateFilterItems` reader hides empty buckets for its own reasons.
 *
 * Tradeoffs intentionally left in: labels are set on first sight and never
 * refreshed (a taxonomy term renamed mid-session keeps the original label
 * until reload), and the map grows monotonically across the session — it's
 * bounded only by tab lifetime, with no `sessionStorage` persistence today.
 * `loadMore()` does not call this helper because it doesn't refresh
 * aggregations either, so retention only advances when a fresh search runs.
 *
 * @param {object} prev          - Existing `retainedFilterOptions` map.
 * @param {object} aggregations  - Latest API aggregations response.
 * @param {object} filterConfigs - Registered filter configs (for valueLabels + filterType gate).
 * @return {object} Possibly-new map; reference equality preserved when unchanged.
 */
export function mergeRetainedFilterOptions( prev, aggregations, filterConfigs ) {
	let next = prev;
	for ( const [ filterKey, agg ] of Object.entries( aggregations ?? {} ) ) {
		const config = filterConfigs?.[ filterKey ];
		if ( ! config || config.filterType === 'date' ) {
			continue;
		}
		const buckets = agg?.buckets;
		if ( ! Array.isArray( buckets ) || buckets.length === 0 ) {
			continue;
		}
		const existing = next?.[ filterKey ] ?? [];
		const merged = mergeNewBucketsIntoOptions( existing, buckets, config.valueLabels );
		if ( merged !== existing ) {
			next = { ...( next ?? {} ), [ filterKey ]: merged };
		}
	}
	return next;
}

/**
 * Append any not-yet-seen bucket values to `existing`. Returns the same
 * array reference when nothing new lands so the caller can use reference
 * equality to skip a parent-object clone.
 *
 * @param {Array<object>} existing    - Prior `[{value, label}]` list.
 * @param {Array<object>} buckets     - Aggregation buckets for this filter.
 * @param {object|null}   valueLabels - Optional slug→label map (post_type).
 * @return {Array<object>} Original or appended-to list.
 */
function mergeNewBucketsIntoOptions( existing, buckets, valueLabels ) {
	const seen = new Set( existing.map( option => option.value ) );
	let merged = existing;
	for ( const bucket of buckets ) {
		const value = bucketValue( bucket.key );
		if ( seen.has( value ) ) {
			continue;
		}
		seen.add( value );
		if ( merged === existing ) {
			merged = [ ...existing ];
		}
		merged.push( { value, label: bucketLabel( bucket.key, valueLabels ) } );
	}
	return merged;
}

/**
 * filterItems for a `date` filter. Drops empty buckets, then slices to
 * `maxItems` (date_histogram has no ES `size`). Selected buckets stay in
 * the list and surface their state via `checked`.
 *
 * @param {object} sharedState - Live store state.
 * @param {string} filterKey   - Filter key.
 * @param {object} config      - filterConfigs entry.
 * @return {Array<object>} Item descriptors.
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
		if ( ! value ) {
			continue;
		}
		items.push( {
			value,
			label: formatDateBucketLabel( value, interval, locale ),
			checked: selected.includes( value ),
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
 * Build the human-readable results-count string from the live store state.
 * Returns "Searching…" while a search is in flight, "Found 42 results" once
 * a query resolves with hits, or an empty string in every other case
 * (pre-search, error, or zero hits — the empty-state region inside
 * `jetpack-search/results-list` owns that copy). Called by every action that mutates `isLoading` or
 * `totalResults` so the seeded `state.resultsCountText` stays in lockstep
 * with the counters; SSR resolves `data-wp-text` against that seeded value
 * directly, so the string can't live on a JS getter.
 *
 * Exported so tests can verify the formatting in isolation without driving
 * the full `actions.search()` lifecycle.
 *
 * @param {object} liveState - The IA store state.
 * @return {string} Localized results-count or status string.
 */
export function computeResultsCountText( liveState ) {
	if ( liveState.isLoading ) {
		return liveState.strings?.searching ?? 'Searching…';
	}
	const total = liveState.totalResults;
	if ( total === 0 ) {
		return '';
	}
	const template =
		total === 1
			? liveState.strings?.resultsCountSingle ?? 'Found %d result'
			: liveState.strings?.resultsCountPlural ?? 'Found %d results';
	return template.replace( '%d', total );
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
		activeFilters: state.activeFilters,
		// Overlay per-filter `filterLogic` overrides onto each filterConfig's
		// `queryType` before handing to the URL builder. The override lives
		// separately in store state so it survives across navigations even
		// when blocks re-register their configs; merging here keeps the
		// downstream consumer (`buildFilterClause`) free of the override path.
		filterConfigs: overlayFilterLogic( state.filterConfigs, state.filterLogic ),
		priceRange: state.priceRange,
		staticPostTypes: state.staticPostTypes,
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

		// `resultsCountText` lives on the seeded state (PHP-side), not as a
		// getter, so the IA SSR pass can resolve `data-wp-text="state.resultsCountText"`
		// to the right initial string on a deep-link load. See
		// `computeResultsCountText()` below for the full string-selection logic;
		// every action that mutates `isLoading` / `totalResults` calls it to
		// keep this value in lockstep with the underlying counters.

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
		 * failed — the error region inside `jetpack-search/results-list` owns
		 * that message instead).
		 *
		 * @return {boolean} True when the no-results message should show.
		 */
		get showNoResults() {
			return (
				!! state.searchQuery && ! state.isLoading && ! state.hasError && state.results.length === 0
			);
		},

		/**
		 * Visibility flag for the error region inside `jetpack-search/results-list`.
		 * Gated on both `!isLoading` and `!isLoadingMore` so the message hides
		 * the moment the user retries — covering the `loadMore()` failure path
		 * (where `isLoading` stays false but `isLoadingMore` toggles)
		 * symmetrically with the `search()` path. `hasError` itself is also
		 * cleared at the start of each action, but binding through a single
		 * getter keeps the template `data-wp-bind` simple (the Interactivity
		 * API only evaluates simple property paths).
		 *
		 * @return {boolean} True when the error message should show.
		 */
		get showError() {
			return !! state.hasError && ! state.isLoading && ! state.isLoadingMore;
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
		 * True when any facet is active — selected filter values or a
		 * price range. Drives the active-filters pill wrapper, the standalone
		 * clear-filters block, and the filter-popover trigger. priceRange
		 * counts as a filter here so a price-only selection (including a
		 * half-open range like `?min_price=10`) doesn't leave the pill
		 * wrapper hidden when the user has a chip to clear.
		 *
		 * @return {boolean} Whether any filter is active.
		 */
		get hasActiveFilters() {
			const hasSelections = Object.values( state.activeFilters ?? {} ).some(
				v => Array.isArray( v ) && v.length > 0
			);
			if ( hasSelections ) {
				return true;
			}
			const range = state.priceRange;
			return !! range && ( range.min != null || range.max != null );
		},

		/**
		 * Total selected filter values across all filter keys. Used by the
		 * filters-popover trigger to render a count badge.
		 *
		 * @return {number} Count of selected filter values.
		 */
		get activeFilterCount() {
			return countActiveFilters( state.activeFilters );
		},

		/**
		 * True when the filters-popover trigger should be disabled: there are
		 * no aggregation buckets to filter on AND no active filters to clear.
		 * Opening the popover in that state would show an empty panel, so we
		 * gate the affordance itself. Remains enabled whenever
		 * `hasActiveFilters` is true (which now includes a `priceRange`
		 * selection) so users can still open the popover to layer additional
		 * facets on top of a price-only deep link, even when the current
		 * query returns no results.
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
		 * Bound to the wrapper's `hidden` attribute. Date filters require at
		 * least one populated bucket (defence against response-shape changes
		 * since `min_doc_count: 1` should already exclude empty buckets).
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
		 * True when every aggregation bucket for the current filter block is
		 * already selected. Used by the `filter-wc-attribute` block to hide
		 * the list and show an "All filters applied" message.
		 *
		 * @return {boolean} True when all buckets are selected.
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
			return buckets.every( bucket => selected.includes( bucketValue( bucket.key ) ) );
		},

		/**
		 * Item descriptors for the current filter block. Dispatches on
		 * `filterType`. Lives on the shared namespace so per-block view
		 * bundles don't clobber siblings. Each item carries `value`,
		 * `label`, `count`, `countLabel`, `showCount`, and `checked`;
		 * `checkboxFilterItems` also folds retained options and URL-seeded
		 * selections into the list (see its JSDoc).
		 *
		 * @return {Array<object>} Item descriptors.
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
		 * filter-checkbox and filter-date.
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
			state.resultsCountText = computeResultsCountText( state );
			try {
				const data = yield* fetchResults( null );
				// A newer `search()` started while this one was in-flight — its
				// response will own the state write. Dropping here keeps us
				// from clobbering fresh results with a slow, stale response.
				if ( myToken !== searchToken ) {
					return;
				}
				state.results = ( data.results ?? [] ).map( r =>
					normalizeResult( r, state.locale, state.searchQuery )
				);
				state.totalResults = data.total ?? 0;
				state.pageHandle = data.page_handle ?? null;
				state.aggregations = data.aggregations ?? {};
				state.retainedFilterOptions = mergeRetainedFilterOptions(
					state.retainedFilterOptions,
					state.aggregations,
					state.filterConfigs
				);
				if ( syncUrl ) {
					actions.syncToUrl();
				}
			} catch {
				if ( myToken === searchToken ) {
					// Clear the result-shape fields alongside `hasError` so a
					// failed query doesn't leave the previous query's results,
					// total count, or aggregation buckets visible underneath
					// the error message — the page would otherwise show a
					// "Found N results" count and stale filter buckets next to
					// a `role="alert"` "Something went wrong" message, which
					// reads as both successful and broken at the same time.
					// `loadMore()` deliberately does NOT do this — its catch
					// block leaves the existing pages alone since they're
					// still valid; only the next page failed to fetch.
					state.hasError = true;
					state.results = [];
					state.totalResults = 0;
					state.pageHandle = null;
					state.aggregations = {};
				}
			} finally {
				if ( myToken === searchToken ) {
					state.isLoading = false;
					state.resultsCountText = computeResultsCountText( state );
					// First fetch (success or error) ends the pre-hydration window —
					// guard the write so subsequent re-searches don't trigger an IA
					// re-render of every skeleton-bound element.
					if ( ! state.skeletonHidden ) {
						state.skeletonHidden = true;
					}
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
					...( data.results ?? [] ).map( r =>
						normalizeResult( r, state.locale, state.searchQuery )
					),
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
					// Drop any logic override for the now-empty filter so the
					// URL serializer doesn't leave `?query_type_<key>=and`
					// orphaned in the address bar after the last selection
					// is cleared.
					if ( state.filterLogic && filterKey in state.filterLogic ) {
						const { [ filterKey ]: _droppedLogic, ...restLogic } = state.filterLogic;
						state.filterLogic = restLogic;
					}
				} else {
					state.activeFilters = { ...state.activeFilters, [ filterKey ]: next };
				}
			}
			yield actions.search();
		},

		/**
		 * Clear every facet and re-run the search. Resets `activeFilters`
		 * AND `priceRange` so a single clear-all affordance wipes both
		 * checkbox-shaped selections and the half-open price range.
		 *
		 * @yield {Promise} search action.
		 */
		*clearFilters() {
			if ( ! state.hasActiveFilters ) {
				return;
			}
			state.activeFilters = {};
			state.filterLogic = {};
			state.priceRange = null;
			yield actions.search();
		},

		/**
		 * Update the price range and re-run the search if it changed. Either
		 * bound may be null for a half-open range; passing both as null clears
		 * the range. No-ops when the new range matches the current one so a
		 * blur from an unchanged input doesn't trigger an identical re-fetch.
		 *
		 * @param {number|null} min - Lower bound, inclusive.
		 * @param {number|null} max - Upper bound, inclusive.
		 * @yield {Promise} search action.
		 */
		*setPriceRange( min, max ) {
			const normalize = v => ( v === null || v === undefined || v === '' ? null : Number( v ) );
			const nextMin = normalize( min );
			const nextMax = normalize( max );
			// Reject NaN bounds so a typo'd input doesn't poison the ES range
			// clause. Mirrors the parsePriceBound() guard in url-state.js so
			// the action and the URL reader agree on what "no bound" means.
			const validMin = nextMin === null || ( Number.isFinite( nextMin ) && nextMin >= 0 );
			const validMax = nextMax === null || ( Number.isFinite( nextMax ) && nextMax >= 0 );
			if ( ! validMin || ! validMax ) {
				return;
			}
			// Inverted bounds (min > max) build a guaranteed-empty ES clause.
			// Drop the call rather than pushing a bad URL or zeroing results.
			if ( nextMin !== null && nextMax !== null && nextMin > nextMax ) {
				return;
			}
			const next = nextMin === null && nextMax === null ? null : { min: nextMin, max: nextMax };
			const prev = state.priceRange;
			const same =
				( prev === null && next === null ) ||
				( prev !== null && next !== null && prev.min === next.min && prev.max === next.max );
			if ( same ) {
				return;
			}
			state.priceRange = next;
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
				filterLogic: state.filterLogic,
				filterConfigs: state.filterConfigs,
				priceRange: state.priceRange,
				searchParamName: state.searchParamName,
				isWooCommerceActive: state.isWooCommerceActive,
			} );
		},

		/**
		 * Handle browser back/forward navigation.
		 *
		 * @yield {Promise} search action.
		 */
		*handlePopState() {
			const { searchQuery, sortOrder, activeFilters, filterLogic, priceRange } = readStateFromUrl(
				state.filterConfigs,
				state.searchParamName,
				state.isWooCommerceActive
			);
			state.searchQuery = searchQuery;
			state.sortOrder = sortOrder;
			// urlParamsToState bypasses its own gate when filterConfigs is empty;
			// re-gate here so popstate matches initialize() and stray URL keys
			// can't round-trip back into pushStateToUrl on a page with no
			// registered filters.
			const { gated } = gateActiveFilters( activeFilters, state.filterConfigs );
			state.activeFilters = gated;
			// Gate filterLogic the same way: drop entries whose filter key
			// either isn't registered, has no surviving selections, or
			// targets a non-taxonomy filter.
			state.filterLogic = pickLogicForActive( filterLogic, gated, state.filterConfigs );
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
			// Re-gate filterLogic against the (possibly trimmed) activeFilters
			// AND against the just-registered filterConfigs so a
			// `?query_type_<key>=and` whose `<key>` was dropped or targets a
			// non-taxonomy filter doesn't linger in state and re-emit on the
			// next URL push. PHP `parse_url_filter_logic` can't apply the
			// taxonomy gate itself because it runs before any block render.php
			// has populated filterConfigs — this is where it lands.
			if ( state.filterLogic && Object.keys( state.filterLogic ).length > 0 ) {
				const gatedLogic = pickLogicForActive(
					state.filterLogic,
					state.activeFilters,
					state.filterConfigs
				);
				if ( Object.keys( gatedLogic ).length !== Object.keys( state.filterLogic ).length ) {
					state.filterLogic = gatedLogic;
				}
			}
			if ( state.searchQuery || state.hasActiveFilters ) {
				// syncUrl=false: URL already carries this query; avoid a duplicate history entry.
				actions.search( { syncUrl: false } );
			} else if ( droppedAny ) {
				// Gate emptied activeFilters and no fetch will fire — clear the PHP-seeded
				// spinner and also drop the skeleton, since no fetch is coming.
				state.isLoading = false;
				state.skeletonHidden = true;
			}
		},

		/**
		 * Reactively syncs `context.wrapperHidden` for each filter-checkbox
		 * block. The wrapper stays visible while the pre-hydration skeleton
		 * is up; afterwards it hides only when the filter has nothing to
		 * show (no buckets, no retained options, no active selection).
		 */
		syncFilterWrapperVisibility() {
			const ctx = getContext();
			ctx.wrapperHidden = state.skeletonHidden && ! filterHasContent( state, ctx.filterKey );
		},
	},
} );

export { state, actions };

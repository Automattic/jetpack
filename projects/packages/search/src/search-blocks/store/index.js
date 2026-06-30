import {
	store,
	getContext,
	getElement,
	withSyncEvent as originalWithSyncEvent,
} from '@wordpress/interactivity';
import { markdownToHtml } from '../../instant-search/lib/markdown';
import { streamAiAnswer } from './ai-stream';
import { buildSearchUrl, formatDateBucketLabel } from './api';
import { bucketLabel, bucketValue } from './bucket-key';
import { filterHasContent, filtersHaveNothingToShow, hasAnyActiveFilter } from './filters-empty';
import { isEventInsidePopoverRoot } from './popover-events';
import { countActiveFilters, normalizeResult, setSeededDateFormat } from './result-utils';
import {
	focusSortTrigger,
	getSortMenuOptionKeysFromItem,
	getSortMenuOptionKeysFromTrigger,
} from './results-sort-menu-dom';
import { identifySite, recordTrainTracksInteract, recordTrainTracksRender } from './tracks';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';
let initialized = false;
// Idempotency latch for the deep-link first fetch. Either entry path — the
// `data-wp-init` callback on the results-list block, or the overlay-bootstrap's
// explicit invocation after hydrating the cloned overlay subtree — can flip it
// safely; only the first one actually dispatches. The bootstrap path exists
// because the IA private-API render of the cloned overlay regions races with
// the runtime's auto-walk and the directive intermittently misses, leaving the
// PHP-seeded "Searching…" spinner latched on.
let initialSearchDispatched = false;

// Module-scope abort handles so `actions.search()` can cancel the previous
// stream — across action calls, fetch has no other way to reach them.
let aiBriefController = null;
let aiExtendedController = null;
// Last query that fired an AI answer, so filter/sort re-runs of
// `actions.search()` don't re-spam the agent for the same text.
let aiLastQuery = null;
// Latched per page load (never reset). Pages without an `ai-answer` block
// skip the SSE round-trip entirely. See AGENTS.md § Interactivity API gotchas.
let aiBlockPresent = false;

// Rotating loading hints for the extended-answer stream. Mirrors
// `Search_Blocks::build_ai_extended_loading_hints()` so PHP/JS share keys.
// No trailing `…` — render.php appends an animated ellipsis.
const AI_EXTENDED_LOADING_HINTS = [
	'Searching harder',
	'Looking deeper into this',
	'Finding a more complete answer',
	'Analyzing additional sources',
	'Gathering more details',
	'Pulling in more context',
	'Expanding the search',
	'Rolling up my virtual sleeves',
	'Digging through the archives',
	'Putting on my reading glasses',
	'Checking under the digital couch cushions',
	'Consulting the oracle',
	'Asking a smarter algorithm',
	'Brewing a fresh batch of insights',
	'Unleashing the full power of search',
];

/**
 * Pick a random extended-answer loading hint. Prefers
 * `state.aiExtendedLoadingHints` (translated via the PHP seed) over the
 * English defaults baked into the bundle.
 *
 * @param {object} liveState - The IA store state.
 * @return {string} Loading hint.
 */
function pickExtendedLoadingHint( liveState ) {
	const hints = Array.isArray( liveState.aiExtendedLoadingHints )
		? liveState.aiExtendedLoadingHints
		: AI_EXTENDED_LOADING_HINTS;
	if ( hints.length === 0 ) {
		return '';
	}
	return hints[ Math.floor( Math.random() * hints.length ) ];
}

/**
 * Reset the brief/extended answer state slice. One writer so every clear path
 * lands on the same shape.
 */
function resetAiAnswerState() {
	state.aiBriefStatus = 'idle';
	state.aiBriefText = '';
	state.aiBriefCitations = [];
	state.aiBriefError = null;
	state.aiExtendedStatus = 'idle';
	state.aiExtendedText = '';
	state.aiExtendedCitations = [];
	state.aiExtendedError = null;
	state.aiExtendedLoadingText = '';
	state.aiShowExtended = false;
	state.aiSessionId = null;
}

// See AGENTS.md § Interactivity API gotchas — synchronous event access.
const withSyncEvent =
	originalWithSyncEvent ||
	( cb =>
		( ...args ) =>
			cb( ...args ) );

/**
 * Drop `activeFilters` keys not present in `filterConfigs`.
 *
 * Uses `Object.hasOwn` + null-prototype output to defang prototype-chain
 * smuggling (`__proto__`, `constructor`, `toString`). See AGENTS.md §
 * Interactivity API gotchas.
 *
 * @param {object} activeFilters - { [filterKey]: string[] } URL-seeded.
 * @param {object} filterConfigs - { [filterKey]: FilterConfig } registered.
 * @return {{ gated: object, droppedAny: boolean }} Gated selections + drop flag.
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
 * Drop static-filter selections whose key isn't registered (or isn't a
 * `kind === 'static'` config). Mirrors `gateActiveFilters` for the
 * scalar-URL counterpart so a stray `?section=x` URL from a deregistered
 * static filter can't survive across renders. Returns `{ gated, droppedAny }`
 * so callers can write state only when something actually changed — same
 * contract as `gateActiveFilters`.
 *
 * @param {object} selections    - { [filterKey]: string }.
 * @param {object} filterConfigs - { [filterKey]: FilterConfig }.
 * @return {{ gated: object, droppedAny: boolean }} Filtered selections plus a drop flag.
 */
export function gateStaticFilterSelections( selections, filterConfigs ) {
	const allowedKeys = filterConfigs ?? {};
	const gated = Object.create( null );
	let droppedAny = false;
	for ( const [ key, value ] of Object.entries( selections ?? {} ) ) {
		if ( ! value || ! Object.hasOwn( allowedKeys, key ) || allowedKeys[ key ]?.kind !== 'static' ) {
			droppedAny = true;
			continue;
		}
		gated[ key ] = value;
	}
	return { gated, droppedAny };
}

/**
 * Drop `filterLogic` entries with no matching active selection, or that
 * target a non-taxonomy filter when `filterConfigs` is supplied. Called from
 * popstate + hydration where the PHP `parse_url_filter_logic` ran before any
 * block could register its config, so the taxonomy gate happens here.
 *
 * @param {object} filterLogic     - { [filterKey]: 'or' | 'and' }.
 * @param {object} activeFilters   - { [filterKey]: string[] }.
 * @param {object} [filterConfigs] - Enables the taxonomy gate when passed.
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
 * Overlay per-filter AND/OR overrides onto each `filterConfig.queryType`.
 * Kept as a separate state slice so a `?query_type_category=and` deep link
 * survives later block-attribute edits. Returns the original map by
 * reference when no overrides apply (preserves identity for subscribers).
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
 * Reverse the slot-keyed aggregation response back onto user-facing filter
 * keys. The API request keys mapped taxonomies under their slot slug (the
 * WPCOM proxy validates agg names against indexable taxonomies — see
 * `aggregationKeyFor` in `store/api.js`); downstream readers key off the
 * user-facing `filterKey`, so we flip back once before state lands.
 * Unmapped passes through.
 *
 * @param {object} aggregations  - Raw `data.aggregations` from the API.
 * @param {object} filterConfigs - Registered filter configs.
 * @return {object} Aggregations keyed by user-facing `filterKey`.
 */
export function remapAggregationsToFilterKeys( aggregations, filterConfigs ) {
	if ( ! aggregations || typeof aggregations !== 'object' ) {
		return {};
	}
	const slotToFilterKey = {};
	for ( const [ filterKey, config ] of Object.entries( filterConfigs ?? {} ) ) {
		const slug = config?.effectiveSlug;
		if ( slug && config?.taxonomy && slug !== config.taxonomy ) {
			slotToFilterKey[ slug ] = filterKey;
		}
	}
	if ( Object.keys( slotToFilterKey ).length === 0 ) {
		return aggregations;
	}
	const remapped = {};
	for ( const [ key, value ] of Object.entries( aggregations ) ) {
		const target = slotToFilterKey[ key ] ?? key;
		remapped[ target ] = value;
	}
	return remapped;
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
 * filterItems for non-date filters. See AGENTS.md § Filter bucket lifecycle
 * for the merge/sort/cap rules.
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

	// Slice after sort: zero-count retained entries already sink to the
	// bottom, so they drop first when `maxItems` is exceeded.
	const limit = Math.max( 1, config.maxItems ?? 10 );
	return sortFilterItems( items, config, sharedState.locale ).slice( 0, limit );
}

/**
 * Sort by `bucketSortOrder` with unchecked zero-count items sunk to the
 * bottom. Checked items keep their normal position even at count `0`. See
 * AGENTS.md § Filter bucket lifecycle.
 *
 * @param {Array<object>} items  - Items from `checkboxFilterItems`.
 * @param {object}        config - filterConfigs entry (`bucketSortOrder`).
 * @param {string}        locale - Locale tag for `localeCompare`.
 * @return {Array<object>} Sorted in place.
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
 * Merge fresh aggregation buckets into `retainedFilterOptions` so checkbox
 * filter lists stay stable across queries. See AGENTS.md § Filter bucket
 * lifecycle. Labels are set on first sight (a taxonomy renamed mid-session
 * keeps the original label until reload). Returns the original object when
 * nothing changed so subscribers don't re-run.
 *
 * @param {object} prev          - Existing `retainedFilterOptions` map.
 * @param {object} aggregations  - Latest API aggregations response.
 * @param {object} filterConfigs - Registered filter configs.
 * @return {object} Possibly-new map; reference preserved when unchanged.
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
 * Append unseen bucket values to `existing`. Returns the same reference when
 * nothing new lands so callers can skip a parent-object clone.
 *
 * @param {Array<object>} existing    - Prior `[{value, label}]` list.
 * @param {Array<object>} buckets     - Aggregation buckets.
 * @param {object|null}   valueLabels - Optional slug→label map.
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
// Monotonic token to drop stale async responses. Bumped on every new search;
// in-flight responses check it before writing state, so a slow request for an
// older query can't overwrite fresh results.
let searchToken = 0;

/**
 * Build the results-count string from live state — "Searching…", "Found N
 * results", or empty (empty-state region owns the no-hits copy). Called by
 * every action that mutates `isLoading`/`totalResults` so the seeded
 * `resultsCountText` stays in lockstep — SSR resolves `data-wp-text` against
 * the seed value, so this can't be a JS getter.
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
		// Overlay `filterLogic` onto `queryType` before handing to the URL
		// builder; keeps `buildFilterClause` free of the override path.
		filterConfigs: overlayFilterLogic( state.filterConfigs, state.filterLogic ),
		priceRange: state.priceRange,
		staticFilterSelections: state.staticFilterSelections,
		// Page-level scope from the `search-results` block (seeded at render).
		// Singular per page; no per-instance overrides.
		staticPostTypes: state.staticPostTypes ?? null,
	} );
	const response = yield fetch( url, {
		headers: state.isPrivateSite ? { 'X-WP-Nonce': state.nonce } : {},
		credentials: state.isPrivateSite ? 'include' : 'same-origin',
	} );
	return yield response.json();
}

const UI_ALGO_VARIANT = { compact: 'minimal', expanded: 'expanded', product: 'product' };

/**
 * UI-algo identifier for TrainTracks. Kept identical to instant search so blocks
 * impressions land in the same relevance bucket; the blocks `compact` layout maps
 * to instant search's `minimal`.
 *
 * @return {string} `jetpack-instant-search-ui/v1-{minimal|expanded|product}`.
 */
function trainTracksUiAlgo() {
	const variant = UI_ALGO_VARIANT[ state.resultsLayout ] ?? 'expanded';
	return `jetpack-instant-search-ui/v1-${ variant }`;
}

/**
 * Build the TrainTracks payload from a result's server-assigned railcar. Shape
 * matches instant search's `getCommonTrainTracksProps()` exactly.
 *
 * @param {object} railcar    - Per-result railcar from the search API.
 * @param {number} uiPosition - Absolute position of the result in the list.
 * @return {object} TrainTracks event properties.
 */
function trainTracksProps( railcar, uiPosition ) {
	return {
		fetch_algo: railcar.fetch_algo,
		fetch_position: railcar.fetch_position,
		fetch_query: railcar.fetch_query,
		railcar: railcar.railcar,
		rec_blog_id: railcar.rec_blog_id,
		rec_post_id: railcar.rec_post_id,
		session_id: railcar.session_id,
		ui_algo: trainTracksUiAlgo(),
		ui_position: uiPosition,
	};
}

/**
 * Fire one TrainTracks render (impression) event per result that carries a
 * railcar. `ui_position` reads the absolute index stamped on each result so it
 * matches the interact event fired on click.
 *
 * @param {Array<object>} results - Normalized results just added to the list.
 */
function recordResultRenders( results ) {
	if ( state.disableTracking ) {
		return;
	}
	for ( const result of results ) {
		if ( result.railcar ) {
			recordTrainTracksRender( trainTracksProps( result.railcar, result.index ) );
		}
	}
}

/**
 * Replace an array state slot in place. The Interactivity runtime keeps
 * re-rendering `data-wp-each` only while the initially-bound array is mutated;
 * swapping the slot's reference silently stops updates. Both slots this touches
 * (`results`) are declared as arrays on the initial state, so splicing is safe.
 *
 * @param {string} slot - State property name.
 * @param {Array}  next - Next array contents.
 * @return {Array} The live state array.
 */
function replaceStateArray( slot, next ) {
	state[ slot ].splice( 0, state[ slot ].length, ...next );
	return state[ slot ];
}

/**
 * Replace an object state slot in place (same reason as replaceStateArray):
 * drop keys missing from `next`, then assign the rest onto the existing object.
 *
 * @param {string} slot - State property name.
 * @param {object} next - Next object contents.
 * @return {object} The live state object.
 */
function replaceStateObject( slot, next ) {
	const current = state[ slot ];
	const keep = new Set( Object.keys( next ) );
	for ( const key of Object.keys( current ) ) {
		if ( ! keep.has( key ) ) {
			delete current[ key ];
		}
	}
	Object.assign( current, next );
	return current;
}

const { state, actions } = store( NAMESPACE, {
	state: {
		// Mutually exclusive popovers — only one open at a time.
		isFilterPopoverOpen: false,
		isSortPopoverOpen: false,

		// Resolved results-list layout, seeded per-page by results-list/render.php.
		// Drives the TrainTracks `ui_algo`; default keeps a valid value on pages
		// where the seed hasn't landed.
		resultsLayout: 'expanded',

		// Suppresses TrainTracks `_tkq` pushes. PHP-seeded from
		// `?disable_tracking=1` + the `jetpack_instant_search_disable_tracking`
		// filter, mirroring instant search. Default off so a missing seed tracks.
		disableTracking: false,

		// Roving-tabindex active descendant for the sort menu. `null` /
		// unknown-key = menu hasn't been keyboard-engaged; the currently
		// checked option becomes the implicit default.
		sortMenuFocusedKey: null,

		// AI Answer brief/extended slices. Split so "Show more" can stream
		// a second SSE without clobbering the first; `aiShowExtended` flips
		// reads to the longer one. Mirrors the overlay's React state.
		aiBriefStatus: 'idle',
		aiBriefText: '',
		aiBriefCitations: [],
		aiBriefError: null,
		aiExtendedStatus: 'idle',
		aiExtendedText: '',
		aiExtendedCitations: [],
		aiExtendedError: null,
		aiExtendedLoadingText: '',
		aiShowExtended: false,
		aiSessionId: null,

		// Server state seeds these too, but declaring them on the client store
		// gives `data-wp-each` directives stable containers before async fetches
		// replace their contents.
		results: [],
		aggregations: {},
		retainedFilterOptions: {},

		// `resultsCountText` lives on seeded state (not a getter) so SSR can
		// resolve `data-wp-text` to a real string on first paint. See
		// `computeResultsCountText()` for the lockstep logic.

		/**
		 * Skeleton visibility. SSR can't evaluate a getter, so the skeleton
		 * markup carries a literal `hidden` off the initial paint; this getter
		 * takes over after hydration so the in-flight initial search shows the
		 * skeleton (a reload that already has results keeps them — no flash).
		 *
		 * @return {boolean} True when the skeleton should be hidden.
		 */
		get skeletonHidden() {
			return ! ( state.isLoading && state.results.length === 0 );
		},

		/**
		 * No-results visibility. `data-wp-bind` only evaluates simple
		 * property paths, so derived flags must be single getters.
		 *
		 * Gated on `searchQuery || hasSearchParam` so the message doesn't
		 * flash on a bare `/search/` page but still shows on a `?s=` deep
		 * link with nothing indexed. `!hasError` so the error region owns
		 * the failure case.
		 *
		 * @return {boolean} True when the no-results message should show.
		 */
		get showNoResults() {
			return (
				( !! state.searchQuery || !! state.hasSearchParam ) &&
				! state.isLoading &&
				! state.hasError &&
				state.results.length === 0
			);
		},

		/**
		 * Visibility for the filters empty state.
		 *
		 * @return {boolean} True when the empty state should show.
		 */
		get showFiltersEmpty() {
			return filtersHaveNothingToShow( state );
		},

		/**
		 * Visibility for the results-list error region. Gates on both
		 * `!isLoading` and `!isLoadingMore` so the message hides on retry
		 * — covers `search()` and `loadMore()` symmetrically.
		 *
		 * @return {boolean} True when the error message should show.
		 */
		get showError() {
			return !! state.hasError && ! state.isLoading && ! state.isLoadingMore;
		},

		/**
		 * Load-more visibility. Hidden during the first-page fetch so a stale
		 * `pageHandle` doesn't flash "Load more" against results that no
		 * longer match. `isLoadingMore` keeps the wrapper visible — children
		 * swap to a spinner via their own bindings.
		 *
		 * @return {boolean} True when the load-more wrapper should show.
		 */
		get showLoadMore() {
			return !! state.pageHandle && ! state.isLoading;
		},

		/**
		 * Any facet is active — filter value, price range, or static
		 * selection. Drives active-filters / clear-filters / popover
		 * trigger. `priceRange` counts so a half-open `?min_price=10` deep
		 * link still surfaces a chip to clear.
		 *
		 * @return {boolean} Whether any filter is active.
		 */
		get hasActiveFilters() {
			return hasAnyActiveFilter( state );
		},

		/**
		 * Total active filter values across all keys. Drives the popover
		 * trigger's count badge.
		 *
		 * @return {number} Count of selected values.
		 */
		get activeFilterCount() {
			const dynamic = countActiveFilters( state.activeFilters );
			const staticCount = Object.values( state.staticFilterSelections ?? {} ).filter(
				v => !! v
			).length;
			return dynamic + staticCount;
		},

		/**
		 * Filters-popover trigger disabled when there are no buckets to
		 * filter on AND no active filters to clear. Stays enabled on a
		 * price-only deep link so users can layer more facets on top.
		 *
		 * @return {boolean} Whether the trigger is disabled.
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
		 * sortOrder === 'relevance' — drives `aria-checked` on the Relevance
		 * menu item. (Inline `===` isn't supported in `data-wp-bind`.)
		 *
		 * @return {boolean} Whether sortOrder is 'relevance'.
		 */
		get isSortByRelevance() {
			return state.sortOrder === 'relevance';
		},

		/**
		 * Sort-popover trigger disabled pre-search when sort is still default.
		 *
		 * @return {boolean} Whether the sort trigger is disabled.
		 */
		get isSortTriggerDisabled() {
			return state.totalResults === 0 && state.sortOrder === 'relevance';
		},

		/**
		 * sortOrder === 'newest'.
		 *
		 * @return {boolean} Whether sortOrder is 'newest'.
		 */
		get isSortByNewest() {
			return state.sortOrder === 'newest';
		},

		/**
		 * sortOrder === 'oldest'.
		 *
		 * @return {boolean} Whether sortOrder is 'oldest'.
		 */
		get isSortByOldest() {
			return state.sortOrder === 'oldest';
		},

		/**
		 * Whether the date-filter wrapper has at least one populated bucket.
		 * Defensive against response-shape changes — `min_doc_count: 1`
		 * already excludes empty buckets server-side.
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
		 * Every bucket for the current filter is selected. Drives
		 * `filter-wc-attribute`'s "All filters applied" empty state.
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
		 * Item descriptors for the current filter block. Each item: `value`,
		 * `label`, `count`, `countLabel`, `showCount`, `checked`. See
		 * `checkboxFilterItems` for the merge/sort/cap behavior.
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

		// AI Answers — derived state for the `ai-answer` block bindings. The
		// visible slice flips on `aiShowExtended` *and* on whether the
		// extended response has actually finished: while extended is still
		// `loading` or `streaming`, keep showing the brief content so the
		// panel doesn't collapse to a "Finding an answer" placeholder for
		// the few seconds it takes to come back. The extended-loading hint
		// at the bottom of the panel provides the in-flight signal during
		// that window; the content swap happens in one move when extended
		// reaches `done`. Without this we get a visible "reset" on click
		// (RSM-3591 in-review feedback).
		get aiVisibleStatus() {
			if ( ! state.aiShowExtended ) {
				return state.aiBriefStatus;
			}
			// Extended error surfaces immediately — failures aren't worth
			// hiding behind the brief content.
			if ( state.aiExtendedStatus === 'error' ) {
				return 'error';
			}
			// Once extended is done, fully swap to it.
			if ( state.aiExtendedStatus === 'done' ) {
				return 'done';
			}
			// Otherwise (extended is loading or streaming) hold the brief
			// content visible — its status is already `done` at this point
			// because `aiShowExtendedButton` only renders the trigger after
			// the brief finishes.
			return state.aiBriefStatus;
		},
		get aiVisibleText() {
			if ( state.aiShowExtended && state.aiExtendedStatus === 'done' ) {
				return state.aiExtendedText;
			}
			return state.aiBriefText;
		},
		get aiVisibleCitations() {
			const list =
				state.aiShowExtended && state.aiExtendedStatus === 'done'
					? state.aiExtendedCitations
					: state.aiBriefCitations;
			return list.map( ( { title, url }, index ) => ( {
				title,
				url,
				// Pre-resolve href so `data-wp-bind--href` reads a plain string.
				href: /^https?:\/\//i.test( url ) ? url : '#',
				// `index`-prefixed key so duplicate URLs don't collide on the IA
				// `data-wp-each-key` dedupe pass.
				key: `${ index }-${ url }`,
			} ) );
		},
		get aiVisibleError() {
			// Don't mask a brief-stage error with the not-yet-started extended slice.
			if ( state.aiShowExtended && state.aiExtendedError ) {
				return state.aiExtendedError;
			}
			return state.aiBriefError;
		},

		// Panel-level visibility — collapses the block to `hidden` so an
		// empty page doesn't reserve a wrapper of padding/border.
		get aiPanelHidden() {
			return state.aiVisibleStatus === 'idle';
		},
		get aiIsLoading() {
			return state.aiVisibleStatus === 'loading';
		},
		get aiIsError() {
			return state.aiVisibleStatus === 'error';
		},
		// Gates the content region so an early `streaming` event doesn't
		// blink the loading row off before the first token paints.
		get aiHasContent() {
			return state.aiVisibleStatus === 'streaming' || state.aiVisibleStatus === 'done';
		},
		get aiHasCitations() {
			return state.aiVisibleStatus === 'done' && state.aiVisibleCitations.length > 0;
		},
		get aiShowExtendedButton() {
			return state.aiBriefStatus === 'done' && ! state.aiShowExtended;
		},
		get aiExtendedLoadingHintShown() {
			return (
				state.aiShowExtended &&
				( state.aiExtendedStatus === 'loading' || state.aiExtendedStatus === 'streaming' ) &&
				!! state.aiExtendedLoadingText
			);
		},

		// Error sub-fields split for plain-string `data-wp-text`. Matches
		// the React overlay's `error.message` + `error.code` shape.
		get aiErrorPrimary() {
			return (
				state.strings?.aiErrorMessage ?? 'Sorry, an error occurred while generating an answer.'
			);
		},
		get aiHasErrorDetail() {
			return !! state.aiVisibleError?.message;
		},
		get aiErrorDetail() {
			return state.aiVisibleError?.message ?? '';
		},
		get aiHasErrorCode() {
			return state.aiVisibleError?.code != null;
		},
		get aiErrorCodeText() {
			const code = state.aiVisibleError?.code;
			if ( code == null ) {
				return '';
			}
			const template = state.strings?.aiErrorCode ?? 'Error code: %s';
			return template.replace( '%s', String( code ) );
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
		 * Replace the value of a single-select static filter (jetpack-search/filter-static).
		 *
		 * @param {Event} event - Change event from the radio input.
		 * @yield {Promise} setStaticFilter action.
		 */
		*onStaticFilterChange( event ) {
			const { filterKey } = getContext();
			yield actions.setStaticFilter( filterKey, event.target.value );
		},

		/**
		 * Idempotent first-fetch dispatcher for deep-linked search URLs
		 * (`?s=…`, `?q=…`, or a URL carrying filter params). Safe to call
		 * from multiple entry paths — only the first invocation actually
		 * fires `actions.search()`. The flag is per-page-load and
		 * deliberately never cleared; subsequent visitor-initiated searches
		 * go through the regular `actions.search()` path.
		 *
		 * Two callers today, by design. `callbacks.initialize` fires from
		 * the results-list block's `data-wp-init` directive on the regular
		 * hydration path (Embedded experience, or the Overlay when the IA
		 * runtime's auto-walk wins the race). `overlay-bootstrap.ensureHydrated`
		 * fires after the bootstrap clones the overlay template into the
		 * shell and runs `apis.render()` on each region — the safety net for
		 * the Overlay case where the directive doesn't fire reliably for the
		 * freshly-mounted subtree.
		 */
		dispatchInitialSearchIfNeeded() {
			if ( initialSearchDispatched ) {
				return;
			}
			if ( ! state.searchQuery && ! state.hasActiveFilters && ! state.hasSearchParam ) {
				return;
			}
			initialSearchDispatched = true;
			// syncUrl=false: URL already carries this query; avoid a duplicate history entry.
			actions.search( { syncUrl: false } );
		},

		/**
		 * Run a search and replace the result list.
		 *
		 * @param {object}  [options]         - Options.
		 * @param {boolean} [options.syncUrl] - Push to URL on success (default true);
		 *                                    pass `false` for popstate-triggered searches.
		 * @yield {Promise} fetch + response.json() promises.
		 */
		*search( options = {} ) {
			const { syncUrl = true } = options;
			const myToken = ++searchToken;
			state.isLoading = true;
			state.isLoadingMore = false;
			state.hasError = false;
			state.resultsCountText = computeResultsCountText( state );
			// Skip the SSE round-trip on pages without an `ai-answer` block.
			// `fetchAiAnswer` also gates on query length (≥ 3) and same-query memo.
			if ( aiBlockPresent ) {
				actions.fetchAiAnswer();
			}
			try {
				const data = yield* fetchResults( null );
				// Stale response — a newer `search()` owns the write.
				if ( myToken !== searchToken ) {
					return;
				}
				const nextResults = ( data.results ?? [] ).map( ( r, i ) => ( {
					...normalizeResult( r, state.locale, state.searchQuery ),
					index: i,
				} ) );
				replaceStateArray( 'results', nextResults );
				recordResultRenders( nextResults );
				state.totalResults = data.total ?? 0;
				state.pageHandle = data.page_handle ?? null;
				replaceStateObject(
					'aggregations',
					remapAggregationsToFilterKeys( data.aggregations, state.filterConfigs )
				);
				replaceStateObject(
					'retainedFilterOptions',
					mergeRetainedFilterOptions(
						state.retainedFilterOptions,
						state.aggregations,
						state.filterConfigs
					)
				);
				if ( syncUrl ) {
					actions.syncToUrl();
				}
			} catch {
				if ( myToken === searchToken ) {
					// Clear result fields alongside `hasError` so the page doesn't
					// show a "Found N results" count and stale buckets next to a
					// `role="alert"` error. `loadMore()` deliberately doesn't do
					// this — its existing pages are still valid.
					state.hasError = true;
					replaceStateArray( 'results', [] );
					state.totalResults = 0;
					state.pageHandle = null;
					replaceStateObject( 'aggregations', {} );
				}
			} finally {
				if ( myToken === searchToken ) {
					state.isLoading = false;
					state.resultsCountText = computeResultsCountText( state );
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
				// Stale — a first-page search took over; its response owns the list.
				if ( myToken !== searchToken ) {
					return;
				}
				const offset = state.results.length;
				const appended = ( data.results ?? [] ).map( ( r, i ) => ( {
					...normalizeResult( r, state.locale, state.searchQuery ),
					index: offset + i,
				} ) );
				state.results.push( ...appended );
				recordResultRenders( appended );
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
		 * Fires a TrainTracks interact event when a visitor clicks a result.
		 * Mirrors instant search's `action: 'click'` payload; `ui_position`
		 * reuses the result's stamped index so it matches its render event.
		 */
		recordResultInteract() {
			if ( state.disableTracking ) {
				return;
			}
			const { result } = getContext();
			if ( result?.railcar ) {
				recordTrainTracksInteract( {
					...trainTracksProps( result.railcar, result.index ),
					action: 'click',
				} );
			}
		},

		/**
		 * Replace a single-select static filter and re-run the search. Static
		 * filters store a scalar per key (vs. `setFilter`'s array) because
		 * each `filter-static` block renders radio inputs. Picking the current
		 * value clears the entry (mirrors the instant-search overlay).
		 *
		 * @param {string} filterKey   - The static filter's `filter_id`.
		 * @param {string} filterValue - Newly selected value, or '' to clear.
		 * @yield {Promise} search action.
		 */
		*setStaticFilter( filterKey, filterValue ) {
			const current = state.staticFilterSelections?.[ filterKey ] ?? '';
			const next = { ...( state.staticFilterSelections ?? {} ) };
			if ( current === filterValue ) {
				delete next[ filterKey ];
			} else {
				next[ filterKey ] = filterValue;
			}
			state.staticFilterSelections = next;
			yield actions.search();
		},

		/**
		 * Toggle a filter value and re-run the search. Multi-select within a
		 * key, separate sets per key. ES clause combination (OR within / AND
		 * across) lives in `buildFilterClause` — this is just bookkeeping.
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
					// Drop the now-orphan logic override so the URL serializer
					// doesn't leave `?query_type_<key>=and` in the address bar.
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
		 * Clear every facet and re-run the search.
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
			state.staticFilterSelections = {};
			yield actions.search();
		},

		/**
		 * Update the price range and re-run the search if it changed. Either
		 * bound may be null for a half-open range. No-op when unchanged.
		 *
		 * @param {number|null} min - Lower bound, inclusive.
		 * @param {number|null} max - Upper bound, inclusive.
		 * @yield {Promise} search action.
		 */
		*setPriceRange( min, max ) {
			const normalize = v => ( v === null || v === undefined || v === '' ? null : Number( v ) );
			const nextMin = normalize( min );
			const nextMax = normalize( max );
			// Reject NaN/negative (mirrors `parsePriceBound()` in url-state.js).
			const validMin = nextMin === null || ( Number.isFinite( nextMin ) && nextMin >= 0 );
			const validMax = nextMax === null || ( Number.isFinite( nextMax ) && nextMax >= 0 );
			if ( ! validMin || ! validMax ) {
				return;
			}
			// Inverted bounds → guaranteed-empty ES clause. Drop the call.
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
				staticFilterSelections: state.staticFilterSelections,
				searchParamName: state.searchParamName,
				isWooCommerceBlocksEnabled: state.isWooCommerceBlocksEnabled,
			} );
		},

		/**
		 * Handle browser back/forward navigation.
		 *
		 * @yield {Promise} search action.
		 */
		*handlePopState() {
			const {
				searchQuery,
				hasSearchParam,
				sortOrder,
				activeFilters,
				filterLogic,
				priceRange,
				staticFilterSelections,
			} = readStateFromUrl(
				state.filterConfigs,
				state.searchParamName,
				state.isWooCommerceBlocksEnabled
			);
			state.searchQuery = searchQuery;
			// Keep `hasSearchParam` in sync with the live URL.
			state.hasSearchParam = hasSearchParam;
			state.sortOrder = sortOrder;
			// Re-gate against `filterConfigs`: `urlParamsToState` skips gating when
			// configs are empty, so stray URL keys could otherwise round-trip back.
			const { gated } = gateActiveFilters( activeFilters, state.filterConfigs );
			state.activeFilters = gated;
			state.filterLogic = pickLogicForActive( filterLogic, gated, state.filterConfigs );
			state.priceRange = priceRange;
			state.staticFilterSelections = gateStaticFilterSelections(
				staticFilterSelections,
				state.filterConfigs
			).gated;
			// Static post-type scope is a page-level property of the
			// `search-results` block, PHP-seeded once at template render;
			// it is never URL-serialized and needs no popstate handling.
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
		 * Open sort popover via Arrow/Enter/Space and move focus into the menu.
		 * Anchors focus on the active sort (matches the WAI-ARIA radio-menu
		 * pattern). Tab is left to the browser so users can step past the trigger.
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
		 * ARIA menu keyboard pattern for the sort popover: roving tabindex with
		 * Arrow wrapping, Home/End, Enter/Space activate, Escape closes + restores
		 * trigger focus, Tab leaves (browser keeps default focus order while we
		 * close the popover).
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
		 * Close popovers on outside click. Early-exits when the click began
		 * inside any `data-jetpack-search-popover-root` element.
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

		/**
		 * Start a brief AI answer for the current query. Bails when query is
		 * shorter than 3 chars or unchanged from the last fetch (filter/sort
		 * re-triggers wouldn't change the agent response). Aborts any in-flight
		 * brief/extended stream from the previous query.
		 */
		fetchAiAnswer() {
			const query = state.searchQuery;
			if ( ! query || query.length < 3 ) {
				// Tear down: a query that dropped below the threshold should
				// hide the panel, not freeze the last answer.
				if ( aiBriefController ) {
					aiBriefController.abort();
					aiBriefController = null;
				}
				if ( aiExtendedController ) {
					aiExtendedController.abort();
					aiExtendedController = null;
				}
				resetAiAnswerState();
				aiLastQuery = null;
				return;
			}
			if ( query === aiLastQuery ) {
				return;
			}
			aiLastQuery = query;

			if ( aiBriefController ) {
				aiBriefController.abort();
			}
			if ( aiExtendedController ) {
				aiExtendedController.abort();
				aiExtendedController = null;
			}
			aiBriefController = new AbortController();

			resetAiAnswerState();
			state.aiBriefStatus = 'loading';

			streamAiAnswer( {
				controller: aiBriefController,
				query,
				siteId: state.siteId,
				filters: state.activeFilters,
				locale: state.locale,
				homeUrl: state.homeUrl,
				format: 'brief',
				onDelta: chunk => {
					state.aiBriefStatus = 'streaming';
					state.aiBriefText += chunk;
				},
				onDone: citations => {
					state.aiBriefStatus = 'done';
					state.aiBriefCitations = Array.isArray( citations ) ? citations : [];
				},
				onError: error => {
					state.aiBriefStatus = 'error';
					state.aiBriefError = error;
				},
				onSessionId: id => {
					state.aiSessionId = id;
				},
			} );
		},

		/**
		 * Trigger the longer "Show more" follow-up. Reuses the session ID the
		 * brief response handed back so the agent can keep its earlier
		 * context. No-ops if the brief answer hasn't finished — the brief
		 * Show-more button is only rendered when `aiBriefStatus === 'done'`,
		 * but a slow click after a re-fetch could still race the brief.
		 */
		showExtendedAiAnswer() {
			if ( state.aiBriefStatus !== 'done' ) {
				return;
			}
			const query = state.searchQuery;
			if ( ! query || query.length < 3 ) {
				return;
			}
			if ( aiExtendedController ) {
				aiExtendedController.abort();
			}
			aiExtendedController = new AbortController();

			state.aiShowExtended = true;
			state.aiExtendedStatus = 'loading';
			state.aiExtendedText = '';
			state.aiExtendedCitations = [];
			state.aiExtendedError = null;
			state.aiExtendedLoadingText = pickExtendedLoadingHint( state );

			streamAiAnswer( {
				controller: aiExtendedController,
				query,
				siteId: state.siteId,
				filters: state.activeFilters,
				locale: state.locale,
				homeUrl: state.homeUrl,
				format: 'extended',
				sessionId: state.aiSessionId,
				onDelta: chunk => {
					state.aiExtendedStatus = 'streaming';
					state.aiExtendedText += chunk;
				},
				onDone: citations => {
					state.aiExtendedStatus = 'done';
					state.aiExtendedCitations = Array.isArray( citations ) ? citations : [];
				},
				onError: error => {
					state.aiExtendedStatus = 'error';
					state.aiExtendedError = error;
				},
			} );
		},
	},

	callbacks: {
		/**
		 * Reactive `checked` binding for a static-filter radio so it stays
		 * in sync with `state.staticFilterSelections` across `clearFilters()`,
		 * `handlePopState()`, and other store mutations.
		 *
		 * @return {boolean} Whether the radio should appear checked.
		 */
		isStaticFilterSelected() {
			const { filterKey, optionValue } = getContext();
			return state.staticFilterSelections?.[ filterKey ] === optionValue;
		},

		/**
		 * Fires when search-results mounts. Runs the initial search if the URL
		 * seeded one and registers popstate. Idempotent across multiple blocks.
		 */
		initialize() {
			if ( initialized ) {
				return;
			}
			initialized = true;
			if ( ! state.disableTracking ) {
				identifySite( state.siteId );
			}
			// PHP seed; `formatDate()` reads from module scope rather than threading per-call.
			setSeededDateFormat( state.dateFormat );
			window.addEventListener( 'popstate', actions.handlePopState );
			const { gated, droppedAny } = gateActiveFilters( state.activeFilters, state.filterConfigs );
			if ( droppedAny ) {
				state.activeFilters = gated;
			}
			if (
				state.staticFilterSelections &&
				Object.keys( state.staticFilterSelections ).length > 0
			) {
				const { gated: gatedStatic, droppedAny: droppedStatic } = gateStaticFilterSelections(
					state.staticFilterSelections,
					state.filterConfigs
				);
				if ( droppedStatic ) {
					state.staticFilterSelections = gatedStatic;
				}
			}
			// PHP can't apply the taxonomy-only gate (it runs before any block
			// render.php has populated filterConfigs); the gate lands here.
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
			// `hasSearchParam` catches `?s=` (empty value) — the param is
			// present so the visitor expects a search to run, but
			// `searchQuery` alone is `''` and indistinguishable from a
			// URL that omits `s`. Seeded from PHP via build_initial_state().
			// The dispatcher is idempotent so the overlay-bootstrap's
			// belt-and-suspenders call after hydration doesn't double-fire.
			if ( state.searchQuery || state.hasActiveFilters || state.hasSearchParam ) {
				actions.dispatchInitialSearchIfNeeded();
			} else if ( droppedAny ) {
				// No fetch will fire — clear the spinner; `skeletonHidden`
				// derives to true once `isLoading` is false.
				state.isLoading = false;
			}
		},

		/**
		 * Wires the results-load-more `IntersectionObserver` when its
		 * `loadOnScroll` attribute is on. Returns a teardown the IA runtime
		 * calls on unmount/HMR so listeners never leak.
		 *
		 * @return {Function|undefined} cleanup or undefined when opted out.
		 */
		initLoadMoreObserver() {
			const wrapper = getElement?.()?.ref;
			if ( ! wrapper || wrapper.dataset?.loadOnScroll !== '1' ) {
				return;
			}
			if ( typeof IntersectionObserver === 'undefined' ) {
				return;
			}
			const sentinel = wrapper.querySelector( '.jetpack-search-load-more__sentinel' );
			if ( ! sentinel ) {
				return;
			}
			const offset = Number( wrapper.dataset.loadOnScrollOffset );
			const rootMargin = `0px 0px ${ Number.isFinite( offset ) ? offset : 200 }px 0px`;
			// IntersectionObserver fires only on state *changes*. If a fetched
			// page is too short to push the sentinel back outside the rootMargin,
			// auto-load stalls; `unobserve`+`observe` re-delivers the initial-state
			// event so a still-intersecting sentinel kicks the next page.
			let pending = false;
			const observer = new IntersectionObserver(
				entries => {
					if ( ! entries.some( e => e.isIntersecting ) ) {
						return;
					}
					if ( pending || ! state.showLoadMore || state.isLoadingMore ) {
						return;
					}
					pending = true;
					actions.loadMore();
					const settle = () => {
						if ( state.isLoadingMore ) {
							setTimeout( settle, 100 );
							return;
						}
						pending = false;
						if ( state.showLoadMore ) {
							observer.unobserve( sentinel );
							observer.observe( sentinel );
						}
					};
					setTimeout( settle, 100 );
				},
				{ root: null, rootMargin, threshold: 0 }
			);
			observer.observe( sentinel );
			return () => observer.disconnect();
		},

		/**
		 * Latches `aiBlockPresent` and kicks off a fetch for any URL-seeded
		 * query so deep-link loads get an answer without re-submitting.
		 */
		initializeAiAnswer() {
			aiBlockPresent = true;
			if ( state.searchQuery && state.searchQuery.length >= 3 ) {
				actions.fetchAiAnswer();
			}
		},

		/**
		 * Imperative markdown→HTML render — IA has no `data-wp-html`. The
		 * reactive read of `state.aiVisibleText` wires dependency tracking so
		 * subsequent token writes re-fire. Safe because `markdownToHtml()`
		 * escapes every text segment.
		 */
		renderAiAnswerHtml() {
			const element = getElement?.();
			const ref = element?.ref;
			if ( ! ref ) {
				return;
			}
			const html = markdownToHtml( state.aiVisibleText );
			if ( ref.innerHTML !== html ) {
				ref.innerHTML = html;
			}
		},

		/**
		 * Reactively sync `context.wrapperHidden`. Visible during the
		 * pre-hydration skeleton; afterwards hides only when the filter has
		 * nothing to show (no buckets, no retained, no selection).
		 */
		syncFilterWrapperVisibility() {
			const ctx = getContext();
			ctx.wrapperHidden = state.skeletonHidden && ! filterHasContent( state, ctx.filterKey );
		},
	},
} );

export { state, actions };

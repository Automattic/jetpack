// Mock the Interactivity API store so the Search block store can be exercised
// in Jest without booting the browser runtime.

const captured = {
	state: {},
	actions: {},
	callbacks: {},
	context: {},
	element: { ref: null },
};
const originalFetch = global.fetch;

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: ( _namespace, config ) => {
			if ( config ) {
				const descriptors = Object.getOwnPropertyDescriptors( config.state || {} );
				for ( const key of Object.keys( descriptors ) ) {
					Object.defineProperty( captured.state, key, descriptors[ key ] );
				}
				Object.assign( captured.actions, config.actions || {} );
				Object.assign( captured.callbacks, config.callbacks || {} );
			}
			return { state: captured.state, actions: captured.actions };
		},
		getContext: () => captured.context,
		getElement: () => captured.element,
	} ),
	{ virtual: true }
);

import {
	actions,
	computeResultsCountText,
	gateActiveFilters,
	gateStaticFilterSelections,
	remapAggregationsToFilterKeys,
	state,
} from '../../../src/search-blocks/store';
import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

const originalActions = { ...actions };

/**
 * Create a mock fetch response whose promise can be resolved after another action runs.
 *
 * @return {{promise: Promise<object>, resolve: Function}} Deferred response.
 */
function createDeferredResponse() {
	let resolve;
	const promise = new Promise( res => {
		resolve = res;
	} );
	return { promise, resolve };
}

/**
 * Create a minimal fetch Response mock.
 *
 * @param {object} data - Parsed JSON body.
 * @return {{json: Function}} Response-like object.
 */
function createResponse( data ) {
	return {
		json: jest.fn().mockResolvedValue( data ),
	};
}

/**
 * Create a raw API result for store normalization.
 *
 * @param {string} title - Result title.
 * @return {object} Raw search result.
 */
function createResult( title ) {
	return {
		result_id: title.toLowerCase().replaceAll( ' ', '-' ),
		fields: {
			'title.default': title,
			'permalink.url.raw': `example.com/${ title.toLowerCase().replaceAll( ' ', '-' ) }/`,
			date: '2026-04-01T00:00:00',
		},
	};
}

/**
 * Resolve each promise yielded by an Interactivity API action generator.
 * Rejected yields are propagated back into the generator via `.throw()` so
 * the action's own try/catch can absorb them — without this, awaiting a
 * rejected fetch outside the generator would surface the error to the test.
 *
 * @param {Generator} generator - Action generator.
 * @return {Promise<*>} Final generator return value.
 */
async function runGenerator( generator ) {
	let step = generator.next();
	while ( ! step.done ) {
		try {
			step = generator.next( await step.value );
		} catch ( err ) {
			step = generator.throw( err );
		}
	}
	return step.value;
}

describe( 'store helpers round-trip', () => {
	it( 'serializes and deserializes state without loss', () => {
		const original = {
			searchQuery: 'winter boots',
			sortOrder: 'newest',
		};
		const params = stateToUrlParams( original );
		const restored = urlParamsToState( params );
		expect( restored.searchQuery ).toBe( original.searchQuery );
		expect( restored.sortOrder ).toBe( original.sortOrder );
	} );

	it( 'collapses unknown `orderby` URL values to the default', () => {
		// A crafted URL like `?orderby=drop-tables` must not leak into the
		// `<select>` binding or the API request; parse_url_sort() applies
		// the same whitelist on the PHP side.
		const restored = urlParamsToState( new URLSearchParams( '?s=boots&orderby=drop-tables' ) );
		expect( restored.sortOrder ).toBe( 'relevance' );
	} );

	it( 'drops an invalid `sortOrder` from serialized output', () => {
		const params = stateToUrlParams( { searchQuery: 'boots', sortOrder: 'bogus' } );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );
} );

describe( 'store actions', () => {
	beforeEach( () => {
		Object.assign( actions, originalActions );
		Object.assign( state, {
			siteId: 123,
			searchQuery: 'old query',
			sortOrder: 'relevance',
			pageHandle: 'old-page',
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
			homeUrl: 'https://example.com',
			activeFilters: {},
			filterConfigs: {},
			priceRange: null,
			staticFilterSelections: {},
			staticPostTypes: null,
			results: [ { title: 'Existing result' } ],
			locale: 'en-US',
			isLoading: false,
			isLoadingMore: false,
			hasError: false,
			totalResults: 1,
			aggregations: {},
			strings: {},
			isFilterPopoverOpen: false,
			isSortPopoverOpen: false,
		} );
		Object.defineProperty( global, 'fetch', {
			configurable: true,
			writable: true,
			value: jest.fn(),
		} );
	} );

	afterEach( () => {
		if ( originalFetch ) {
			Object.defineProperty( global, 'fetch', {
				configurable: true,
				writable: true,
				value: originalFetch,
			} );
		} else {
			delete global.fetch;
		}
		jest.restoreAllMocks();
	} );

	it( 'hides the skeleton once a search resolves (success or error)', async () => {
		// `skeletonHidden` derives from an in-flight fetch with no results yet.
		// Once `search()` settles — success or error — `isLoading` is false so
		// the skeleton is hidden again. The error path clears `results`, so the
		// derived flag must still resolve to hidden and not strand placeholders.
		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Fresh hit' ) ],
				total: 1,
				page_handle: null,
				aggregations: {},
			} )
		);
		await runGenerator( actions.search( { syncUrl: false } ) );
		expect( state.skeletonHidden ).toBe( true );
		expect( state.isLoading ).toBe( false );

		global.fetch.mockRejectedValueOnce( new Error( 'network down' ) );
		await runGenerator( actions.search( { syncUrl: false } ) );
		expect( state.skeletonHidden ).toBe( true );
		expect( state.hasError ).toBe( true );
		expect( state.isLoading ).toBe( false );
	} );

	it( 'applies the page-level post-type scope from state on every fetch', async () => {
		// `search-results/render.php` seeds `state.staticPostTypes` once at
		// template render; the store reads it on every fetch — initial search,
		// typed search, filter/sort, load-more — without any per-instance
		// override or fall-through ladder.
		const ok = () =>
			createResponse( { results: [], total: 0, page_handle: null, aggregations: {} } );

		state.staticPostTypes = { include: [ 'product' ], exclude: [] };

		global.fetch.mockResolvedValueOnce( ok() );
		await runGenerator( actions.search( { syncUrl: false } ) );
		expect( decodeURIComponent( global.fetch.mock.calls[ 0 ][ 0 ] ) ).toContain(
			'filter[bool][must][0][term][post_type]=product'
		);

		// A filter/sort re-run uses the same seeded scope — no separate session
		// state, the slot is the single source of truth.
		global.fetch.mockResolvedValueOnce( ok() );
		await runGenerator( actions.search( { syncUrl: false } ) );
		expect( decodeURIComponent( global.fetch.mock.calls[ 1 ][ 0 ] ) ).toContain(
			'filter[bool][must][0][term][post_type]=product'
		);

		// Clearing `state.staticPostTypes` (no `search-results` scope set)
		// produces an unconstrained query.
		state.staticPostTypes = null;
		global.fetch.mockResolvedValueOnce( ok() );
		await runGenerator( actions.search( { syncUrl: false } ) );
		expect( decodeURIComponent( global.fetch.mock.calls[ 2 ][ 0 ] ) ).not.toContain(
			'[term][post_type]'
		);
	} );

	it( 'popstate re-runs search with only the syncUrl option (scope stays seeded)', async () => {
		// Page-level scope is set by render.php and doesn't move; popstate
		// only restores URL-driven state slices (query, filters, sort, etc).
		state.searchParamName = 's';
		state.isWooCommerceBlocksEnabled = false;
		const searchSpy = jest.spyOn( actions, 'search' ).mockImplementation( function* () {} );
		await runGenerator( actions.handlePopState() );
		expect( searchSpy ).toHaveBeenCalledTimes( 1 );
		expect( searchSpy.mock.calls[ 0 ][ 0 ] ).toEqual( { syncUrl: false } );
		searchSpy.mockRestore();
	} );

	it( 'sets hasError on a failed loadMore and clears it on the next loadMore', async () => {
		state.pageHandle = 'next-page';
		global.fetch.mockRejectedValueOnce( new Error( 'network down' ) ).mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Recovered result' ) ],
				page_handle: null,
			} )
		);

		await runGenerator( actions.loadMore() );
		expect( state.hasError ).toBe( true );
		expect( state.isLoadingMore ).toBe( false );

		// Re-enable pagination so the second call doesn't early-out (the
		// failed request leaves pageHandle untouched, but the action also
		// short-circuits when pageHandle is null).
		state.pageHandle = 'next-page';
		await runGenerator( actions.loadMore() );
		expect( state.hasError ).toBe( false );
		expect( state.results.map( r => r.title ) ).toContain( 'Recovered result' );
	} );

	it( 'clears the previous query results when search() errors out', async () => {
		// Seed the store as if a successful query had just resolved, so we
		// can prove the error path tears that data down. Without this, a
		// subsequent failed search would render its `role="alert"` message
		// underneath stale results and a stale "Found N results" count.
		state.results = [ { id: 'old-1', title: 'Stale result' } ];
		state.totalResults = 5;
		state.pageHandle = 'old-page';
		state.aggregations = { category: { buckets: [ { key: 'news', doc_count: 3 } ] } };
		state.hasError = false;
		const resultsRef = state.results;
		const aggregationsRef = state.aggregations;

		global.fetch.mockRejectedValueOnce( new Error( 'network down' ) );
		await runGenerator( actions.search( { syncUrl: false } ) );

		expect( state.hasError ).toBe( true );
		expect( state.results ).toBe( resultsRef );
		expect( state.results ).toEqual( [] );
		expect( state.totalResults ).toBe( 0 );
		expect( state.pageHandle ).toBeNull();
		expect( state.aggregations ).toBe( aggregationsRef );
		expect( state.aggregations ).toEqual( {} );
		// `resultsCountText` reads from `totalResults` via `computeResultsCountText`,
		// so an empty count string falls out for free — no extra wiring.
		expect( state.resultsCountText ).toBe( '' );
	} );

	it( 'remaps slot-keyed aggregations back to the user-facing filterKey when search() resolves', async () => {
		// End-to-end pin: a mapped custom taxonomy (`genre` →
		// `jetpack-search-tag1`) sends its aggregation request under the
		// slot slug because the WPCOM search proxy validates aggregation
		// names against indexable taxonomies. The API response comes back
		// keyed by the slot too. Every downstream consumer (`filterItems`,
		// `retainedFilterOptions`, wrapper-visibility checks) reads
		// `state.aggregations[filterKey]`, so `actions.search()` must flip
		// the response key back to `genre` once before persisting to state.
		// Otherwise the bucket list would never reach the Genre filter UI
		// despite the API returning data for it.
		state.filterConfigs = {
			genre: {
				filterKey: 'genre',
				filterType: 'taxonomy',
				taxonomy: 'genre',
				effectiveSlug: 'jetpack-search-tag1',
				maxItems: 10,
			},
		};
		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Genre hit' ) ],
				total: 1,
				page_handle: null,
				aggregations: {
					'jetpack-search-tag1': {
						buckets: [
							{ key: 'fantasy/Fantasy', doc_count: 3 },
							{ key: 'sci-fi/Sci-Fi', doc_count: 2 },
						],
					},
				},
			} )
		);

		await runGenerator( actions.search( { syncUrl: false } ) );

		expect( state.aggregations ).toEqual( {
			genre: {
				buckets: [
					{ key: 'fantasy/Fantasy', doc_count: 3 },
					{ key: 'sci-fi/Sci-Fi', doc_count: 2 },
				],
			},
		} );
		// Slot key must not leak into state — downstream readers key off
		// `filterKey`, never `effectiveSlug`.
		expect( state.aggregations[ 'jetpack-search-tag1' ] ).toBeUndefined();
	} );

	it( 'keeps each-bound result and aggregation containers stable when search() resolves', async () => {
		state.results = [];
		state.aggregations = {};
		state.retainedFilterOptions = {};
		state.filterConfigs = {
			category: {
				filterKey: 'category',
				filterType: 'taxonomy',
				taxonomy: 'category',
				effectiveSlug: 'category',
				maxItems: 10,
			},
		};
		const resultsRef = state.results;
		const aggregationsRef = state.aggregations;
		const retainedRef = state.retainedFilterOptions;

		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Fresh result' ) ],
				total: 1,
				page_handle: null,
				aggregations: {
					category: {
						buckets: [ { key: 'news/News', doc_count: 4 } ],
					},
				},
			} )
		);

		await runGenerator( actions.search( { syncUrl: false } ) );

		expect( state.results ).toBe( resultsRef );
		expect( state.results ).toHaveLength( 1 );
		expect( state.results[ 0 ].title ).toBe( 'Fresh result' );
		expect( state.aggregations ).toBe( aggregationsRef );
		expect( state.aggregations.category.buckets[ 0 ].key ).toBe( 'news/News' );
		expect( state.retainedFilterOptions ).toBe( retainedRef );
		expect( state.retainedFilterOptions.category ).toEqual( [ { value: 'news', label: 'News' } ] );
	} );

	it( 'overwrites a kept aggregation key in place when a re-search returns the same key', async () => {
		// The happy-path stability test starts from `{}`, so it only exercises
		// replaceStateObject's add branch. Here `category` is present in BOTH
		// the prior and the next aggregations — proving the keep-branch
		// overwrites the bucket contents while holding the same object
		// reference (the load-bearing property for `data-wp-each`).
		state.results = [];
		state.aggregations = { category: { buckets: [ { key: 'old/Old', doc_count: 1 } ] } };
		state.retainedFilterOptions = {};
		state.filterConfigs = {
			category: {
				filterKey: 'category',
				filterType: 'taxonomy',
				taxonomy: 'category',
				effectiveSlug: 'category',
				maxItems: 10,
			},
		};
		const aggregationsRef = state.aggregations;

		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Fresh result' ) ],
				total: 1,
				page_handle: null,
				aggregations: { category: { buckets: [ { key: 'news/News', doc_count: 4 } ] } },
			} )
		);

		await runGenerator( actions.search( { syncUrl: false } ) );

		expect( state.aggregations ).toBe( aggregationsRef );
		expect( state.aggregations.category.buckets ).toEqual( [ { key: 'news/News', doc_count: 4 } ] );
	} );

	it( 'drops an aggregation key absent from the next response while keeping the container reference', async () => {
		// replaceStateObject's delete-stale branch: a prior response had both
		// `category` and `tag`; the next response only returns `category`. The
		// stale `tag` key must be deleted from the SAME object (not a fresh
		// one), or a `data-wp-each` bound to it would render a ghost facet.
		state.results = [];
		state.aggregations = {
			category: { buckets: [ { key: 'news/News', doc_count: 4 } ] },
			tag: { buckets: [ { key: 'react/React', doc_count: 2 } ] },
		};
		state.retainedFilterOptions = {};
		state.filterConfigs = {
			category: {
				filterKey: 'category',
				filterType: 'taxonomy',
				taxonomy: 'category',
				effectiveSlug: 'category',
				maxItems: 10,
			},
			tag: {
				filterKey: 'tag',
				filterType: 'taxonomy',
				taxonomy: 'tag',
				effectiveSlug: 'tag',
				maxItems: 10,
			},
		};
		const aggregationsRef = state.aggregations;

		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Fresh result' ) ],
				total: 1,
				page_handle: null,
				aggregations: { category: { buckets: [ { key: 'updates/Updates', doc_count: 7 } ] } },
			} )
		);

		await runGenerator( actions.search( { syncUrl: false } ) );

		expect( state.aggregations ).toBe( aggregationsRef );
		expect( state.aggregations.category.buckets ).toEqual( [
			{ key: 'updates/Updates', doc_count: 7 },
		] );
		expect( Object.hasOwn( state.aggregations, 'tag' ) ).toBe( false );
	} );

	it( 'appends loadMore() results in place, keeping the results array reference', async () => {
		// loadMore does `state.results.push( ...appended )` rather than
		// reassigning, so the each-bound array keeps its reference and the
		// runtime keeps re-rendering. Without this the second page would
		// silently never paint.
		state.results = [ { id: 'page1-1', title: 'Page 1 result', index: 0 } ];
		state.pageHandle = 'next-page';
		const resultsRef = state.results;

		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Page 2 result' ) ],
				page_handle: 'page-3',
			} )
		);

		await runGenerator( actions.loadMore() );

		expect( state.results ).toBe( resultsRef );
		expect( state.results ).toHaveLength( 2 );
		expect( state.results[ 0 ].title ).toBe( 'Page 1 result' );
		expect( state.results[ 1 ].title ).toBe( 'Page 2 result' );
		expect( state.pageHandle ).toBe( 'page-3' );
	} );

	it( 'leaves the existing results in place when loadMore() errors out', async () => {
		// loadMore failures must not clear the first-page results — they're
		// still valid; only the *next* page failed to fetch. The success
		// path of the first search seeded the list; loadMore's catch must
		// not regress that.
		state.results = [ { id: 'page1-1', title: 'Page 1 result' } ];
		state.totalResults = 50;
		state.pageHandle = 'next-page';
		state.aggregations = { category: { buckets: [ { key: 'news', doc_count: 3 } ] } };

		global.fetch.mockRejectedValueOnce( new Error( 'network down' ) );
		await runGenerator( actions.loadMore() );

		expect( state.hasError ).toBe( true );
		expect( state.results ).toHaveLength( 1 );
		expect( state.results[ 0 ].title ).toBe( 'Page 1 result' );
		expect( state.totalResults ).toBe( 50 );
		expect( state.aggregations.category.buckets[ 0 ].key ).toBe( 'news' );
	} );

	it( 'drops load-more responses superseded by a new search', async () => {
		const loadMoreResponse = createDeferredResponse();
		global.fetch.mockReturnValueOnce( loadMoreResponse.promise ).mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Fresh result' ) ],
				total: 1,
				page_handle: null,
				aggregations: {},
			} )
		);

		const loadMorePromise = runGenerator( actions.loadMore() );
		expect( state.isLoadingMore ).toBe( true );

		state.searchQuery = 'fresh query';
		await runGenerator( actions.search( { syncUrl: false } ) );

		loadMoreResponse.resolve(
			createResponse( {
				results: [ createResult( 'Stale page result' ) ],
				page_handle: 'stale-next-page',
			} )
		);
		await loadMorePromise;

		expect( state.results ).toHaveLength( 1 );
		expect( state.results[ 0 ].title ).toBe( 'Fresh result' );
		expect( state.pageHandle ).toBeNull();
		expect( state.isLoadingMore ).toBe( false );
	} );

	it( 'adds and removes selected filter values before searching', async () => {
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();

		await runGenerator( actions.setFilter( 'category', 'news' ) );
		expect( state.activeFilters ).toEqual( { category: [ 'news' ] } );

		await runGenerator( actions.setFilter( 'category', 'updates' ) );
		expect( state.activeFilters ).toEqual( { category: [ 'news', 'updates' ] } );

		await runGenerator( actions.setFilter( 'category', 'news' ) );
		expect( state.activeFilters ).toEqual( { category: [ 'updates' ] } );

		await runGenerator( actions.setFilter( 'category', 'updates' ) );
		expect( state.activeFilters ).toEqual( {} );
		expect( search ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'setStaticFilter replaces the per-key value (single-select) and clears when re-picked', async () => {
		// Static filters are mutually-exclusive radios — unlike setFilter,
		// each call REPLACES rather than toggles within an array. Re-picking
		// the currently selected value clears the entry (same UX as the
		// legacy overlay's setStaticFilter).
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();
		state.staticFilterSelections = {};

		await runGenerator( actions.setStaticFilter( 'section', 'news' ) );
		expect( state.staticFilterSelections ).toEqual( { section: 'news' } );

		// Picking a different value REPLACES (does not append).
		await runGenerator( actions.setStaticFilter( 'section', 'guides' ) );
		expect( state.staticFilterSelections ).toEqual( { section: 'guides' } );

		// Re-picking the current value clears the entry — radio "deselect"
		// affordance preserves the legacy overlay behavior.
		await runGenerator( actions.setStaticFilter( 'section', 'guides' ) );
		expect( state.staticFilterSelections ).toEqual( {} );

		// Different keys stay independent — picking `audience` after a
		// cleared `section` doesn't resurrect the old `section` entry.
		await runGenerator( actions.setStaticFilter( 'audience', 'dev' ) );
		expect( state.staticFilterSelections ).toEqual( { audience: 'dev' } );

		expect( search ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'clearFilters wipes staticFilterSelections alongside activeFilters + priceRange', async () => {
		// `clearFilters` is the standalone clear-all button — it must wipe
		// every facet shape so a user doesn't have to click each filter
		// type's clear affordance individually.
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();
		state.activeFilters = {};
		state.priceRange = null;
		state.staticFilterSelections = { section: 'guides' };

		await runGenerator( actions.clearFilters() );

		expect( state.staticFilterSelections ).toEqual( {} );
		expect( search ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'clears every facet only when something is active', async () => {
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();

		await runGenerator( actions.clearFilters() );
		expect( search ).not.toHaveBeenCalled();

		state.activeFilters = { tag: [ 'react' ] };
		await runGenerator( actions.clearFilters() );
		expect( state.activeFilters ).toEqual( {} );
		expect( search ).toHaveBeenCalledTimes( 1 );

		// Price-only state still triggers a clear — covers half-open ranges
		// like `{ min: 10, max: null }` so a "clear all" affordance wipes
		// every facet, not just the checkbox-shaped ones.
		state.priceRange = { min: 10, max: null };
		await runGenerator( actions.clearFilters() );
		expect( state.priceRange ).toBeNull();
		expect( search ).toHaveBeenCalledTimes( 2 );
		// Combined state — both checkbox selections and a price range — must
		// reset in a single call, since the standalone clear-filters button
		// is the only affordance that wipes price selections in one click.
		state.activeFilters = { tag: [ 'react' ] };
		state.priceRange = { min: 10, max: 50 };
		await runGenerator( actions.clearFilters() );
		expect( state.activeFilters ).toEqual( {} );
		expect( state.priceRange ).toBeNull();
		expect( search ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'setPriceRange validates bounds, no-ops on identity, and clears on null/null', async () => {
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();
		state.priceRange = null;

		// NaN / negative bounds drop the call rather than poisoning ES.
		await runGenerator( actions.setPriceRange( 'abc', 50 ) );
		await runGenerator( actions.setPriceRange( -1, 50 ) );
		expect( state.priceRange ).toBeNull();
		expect( search ).not.toHaveBeenCalled();

		// Inverted bounds (min > max) build an empty clause — drop too.
		await runGenerator( actions.setPriceRange( 100, 10 ) );
		expect( state.priceRange ).toBeNull();
		expect( search ).not.toHaveBeenCalled();

		// Closed range writes and searches.
		await runGenerator( actions.setPriceRange( 10, 50 ) );
		expect( state.priceRange ).toEqual( { min: 10, max: 50 } );
		expect( search ).toHaveBeenCalledTimes( 1 );

		// Identity no-op — same bounds shouldn't refetch.
		await runGenerator( actions.setPriceRange( 10, 50 ) );
		expect( search ).toHaveBeenCalledTimes( 1 );

		// Half-open range (one bound null) is allowed — both min-only and
		// max-only shapes round-trip the matching null through to state so the
		// URL writer and ES range clause see the same "no bound" sentinel.
		await runGenerator( actions.setPriceRange( 25, null ) );
		expect( state.priceRange ).toEqual( { min: 25, max: null } );
		expect( search ).toHaveBeenCalledTimes( 2 );

		await runGenerator( actions.setPriceRange( null, 50 ) );
		expect( state.priceRange ).toEqual( { min: null, max: 50 } );
		expect( search ).toHaveBeenCalledTimes( 3 );

		// Both null clears the range.
		await runGenerator( actions.setPriceRange( null, null ) );
		expect( state.priceRange ).toBeNull();
		expect( search ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'keeps filter and sort popovers mutually exclusive', () => {
		state.isSortPopoverOpen = true;
		actions.toggleFilterPopover();
		expect( state.isFilterPopoverOpen ).toBe( true );
		expect( state.isSortPopoverOpen ).toBe( false );

		state.isFilterPopoverOpen = true;
		actions.toggleSortPopover();
		expect( state.isSortPopoverOpen ).toBe( true );
		expect( state.isFilterPopoverOpen ).toBe( false );

		actions.closeAllPopovers();
		expect( state.isFilterPopoverOpen ).toBe( false );
		expect( state.isSortPopoverOpen ).toBe( false );
	} );

	it( 'selects a new sort order and closes the sort popover', async () => {
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();
		state.sortOrder = 'relevance';
		state.isSortPopoverOpen = true;

		await runGenerator( actions.selectSortOrder( { currentTarget: { value: 'newest' } } ) );

		expect( state.sortOrder ).toBe( 'newest' );
		expect( state.isSortPopoverOpen ).toBe( false );
		expect( search ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'closes the sort popover without searching when sort selection is unchanged', async () => {
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();
		state.sortOrder = 'relevance';
		state.isSortPopoverOpen = true;

		await runGenerator( actions.selectSortOrder( { currentTarget: { value: 'relevance' } } ) );

		expect( state.sortOrder ).toBe( 'relevance' );
		expect( state.isSortPopoverOpen ).toBe( false );
		expect( search ).not.toHaveBeenCalled();
	} );

	it( 'closes popovers on outside click but keeps them open for inside clicks', () => {
		document.body.innerHTML =
			'<div data-jetpack-search-popover-root><button id="inside"></button></div><button id="outside"></button>';
		state.isFilterPopoverOpen = true;
		const insideEvent = new MouseEvent( 'click', { bubbles: true } );
		Object.defineProperty( insideEvent, 'target', {
			value: document.getElementById( 'inside' ),
		} );

		actions.onWindowClickClosePopovers( insideEvent );
		expect( state.isFilterPopoverOpen ).toBe( true );

		const outsideEvent = new MouseEvent( 'click', { bubbles: true } );
		Object.defineProperty( outsideEvent, 'target', {
			value: document.getElementById( 'outside' ),
		} );

		actions.onWindowClickClosePopovers( outsideEvent );
		expect( state.isFilterPopoverOpen ).toBe( false );
	} );

	it( 'syncToUrl writes priceRange so a price-filtered URL survives subsequent searches', () => {
		// Regression: omitting priceRange from pushStateToUrl meant the
		// first search after JS hydrated rewrote `?min_price=10` away,
		// breaking shareable URLs and back-button behavior.
		// `isWooCommerceBlocksEnabled` must be true — `min_price`/`max_price` are
		// WC-only and `pushStateToUrl` drops them otherwise (RSM-2805).
		const replaceState = jest.spyOn( window.history, 'replaceState' ).mockImplementation();
		state.searchQuery = 'shoes';
		state.priceRange = { min: 10, max: 50 };
		state.isWooCommerceBlocksEnabled = true;

		actions.syncToUrl();

		expect( replaceState ).toHaveBeenCalledTimes( 1 );
		const writtenUrl = replaceState.mock.calls[ 0 ][ 2 ];
		expect( writtenUrl ).toContain( 'min_price=10' );
		expect( writtenUrl ).toContain( 'max_price=50' );
	} );

	it( 'syncToUrl drops priceRange on non-Woo sites so a stray range cannot leak into the URL (RSM-2805)', () => {
		// `filter-wc-price` isn't registered on non-Woo sites, but a stale
		// `state.priceRange` (e.g. seeded from a deep link before the JS
		// gate caught up, or set by an unrelated callback) must never round-
		// trip into the URL — the next API request would otherwise carry a
		// `range` clause for a field the index doesn't have.
		const replaceState = jest.spyOn( window.history, 'replaceState' ).mockImplementation();
		state.searchQuery = 'shoes';
		state.priceRange = { min: 10, max: 50 };
		state.isWooCommerceBlocksEnabled = false;

		actions.syncToUrl();

		const writtenUrl = replaceState.mock.calls[ 0 ][ 2 ];
		expect( writtenUrl ).not.toContain( 'min_price' );
		expect( writtenUrl ).not.toContain( 'max_price' );
	} );

	it( 'syncToUrl writes static-filter selections as scalar params alongside other state', () => {
		// Regression guard: the staticFilterSelections slice must thread
		// through pushStateToUrl so a shareable URL captures the radio
		// selection. Scalar `?filter_id=value` format (no `[]`) is the
		// legacy overlay's contract.
		const replaceState = jest.spyOn( window.history, 'replaceState' ).mockImplementation();
		state.searchQuery = 'docs';
		state.staticFilterSelections = { section: 'guides' };
		state.filterConfigs = { section: { filterKey: 'section', kind: 'static' } };

		actions.syncToUrl();

		const writtenUrl = replaceState.mock.calls[ 0 ][ 2 ];
		expect( writtenUrl ).toContain( 'section=guides' );
		expect( writtenUrl ).not.toContain( 'section[]' );
	} );

	it( 'closes open popovers on Escape only', () => {
		state.isFilterPopoverOpen = true;
		state.isSortPopoverOpen = true;

		actions.onEscapeClosePopovers( { key: 'Enter' } );
		expect( state.isFilterPopoverOpen ).toBe( true );
		expect( state.isSortPopoverOpen ).toBe( true );

		actions.onEscapeClosePopovers( { key: 'Escape' } );
		expect( state.isFilterPopoverOpen ).toBe( false );
		expect( state.isSortPopoverOpen ).toBe( false );
	} );
} );

describe( 'store getters', () => {
	beforeEach( () => {
		Object.assign( state, {
			isLoading: false,
			hasError: false,
			results: [ { title: 'Existing result' } ],
			searchQuery: 'react',
			totalResults: 0,
			pageHandle: null,
			activeFilters: {},
			aggregations: {},
			sortOrder: 'relevance',
			strings: {
				searching: 'Looking…',
				resultsCountSingle: 'Found %d item',
				resultsCountPlural: 'Found %d items',
			},
		} );
	} );

	it( 'formats the results count for loading, singular, plural, and empty states', () => {
		// `resultsCountText` is now a regular state value updated by
		// `actions.search()` rather than a getter — the SSR pass needs to
		// read a literal string off the seeded state, and JS getters don't
		// resolve server-side. Exercising `computeResultsCountText` directly
		// keeps the formatting contract under test without driving the full
		// fetch lifecycle.
		state.isLoading = true;
		expect( computeResultsCountText( state ) ).toBe( 'Looking…' );

		state.isLoading = false;
		state.totalResults = 1;
		expect( computeResultsCountText( state ) ).toBe( 'Found 1 item' );

		state.totalResults = 3;
		expect( computeResultsCountText( state ) ).toBe( 'Found 3 items' );

		state.totalResults = 0;
		expect( computeResultsCountText( state ) ).toBe( '' );
	} );

	it( 'derives result, load-more, and filter visibility flags', () => {
		state.results = [];
		expect( state.showNoResults ).toBe( true );
		expect( state.showError ).toBe( false );

		state.hasError = true;
		expect( state.showNoResults ).toBe( false );
		expect( state.showError ).toBe( true );

		// While a fresh search is in flight the error block stays hidden so
		// the previous-query message doesn't linger over the next request.
		state.isLoading = true;
		expect( state.showError ).toBe( false );

		// Same when paginating an existing query — keeps the symmetry with
		// loadMore()'s lifecycle (which only flips isLoadingMore).
		state.isLoading = false;
		state.isLoadingMore = true;
		expect( state.showError ).toBe( false );

		state.isLoadingMore = false;
		state.hasError = false;
		expect( state.showError ).toBe( false );

		state.pageHandle = 'next-page';
		expect( state.showLoadMore ).toBe( true );

		state.isLoading = true;
		expect( state.showLoadMore ).toBe( false );

		state.isLoading = false;
		state.activeFilters = { category: [ 'news', 'updates' ] };
		expect( state.hasActiveFilters ).toBe( true );
		expect( state.activeFilterCount ).toBe( 2 );
	} );

	it( 'shows the skeleton only while a fetch is in flight with no results yet', () => {
		// The initial client-side search must surface the skeleton; a reload
		// that already has results keeps them visible (no flash).
		state.isLoading = false;
		state.results = [];
		expect( state.skeletonHidden ).toBe( true );

		state.isLoading = true;
		expect( state.skeletonHidden ).toBe( false );

		state.results = [ { title: 'Fresh hit' } ];
		expect( state.skeletonHidden ).toBe( true );

		state.isLoading = false;
		expect( state.skeletonHidden ).toBe( true );
	} );

	it( 'surfaces showNoResults for an explicit-but-empty `?s=` deep link (SEARCH-183)', () => {
		// Empty `?s=` URL — `searchQuery` is `''` but `hasSearchParam` is true,
		// so the initial search fires (covered by other tests). If that search
		// returns zero results (e.g. a site with no indexed posts), the
		// no-results affordance must still surface; otherwise the page renders
		// blank with no explanation. Pre-SEARCH-183 the getter gated only on
		// `!! state.searchQuery` and silently swallowed this case.
		state.results = [];
		state.isLoading = false;
		state.hasError = false;
		state.searchQuery = '';
		state.hasSearchParam = true;
		expect( state.showNoResults ).toBe( true );

		// Bare `/search/` page (no `s` in URL, no filters) — message stays
		// hidden so it doesn't flash before the user types.
		state.hasSearchParam = false;
		expect( state.showNoResults ).toBe( false );
	} );

	it( 'hasActiveFilters counts the priceRange (including half-open) as a filter', () => {
		state.activeFilters = {};
		state.priceRange = null;
		expect( state.hasActiveFilters ).toBe( false );

		state.activeFilters = { category: [ 'news' ] };
		expect( state.hasActiveFilters ).toBe( true );

		state.activeFilters = {};
		state.priceRange = { min: 10, max: 50 };
		expect( state.hasActiveFilters ).toBe( true );

		// Half-open range still counts — without this branch a price-only
		// deep link leaves the active-filters wrapper hidden after hydration.
		state.priceRange = { min: null, max: 50 };
		expect( state.hasActiveFilters ).toBe( true );

		state.priceRange = { min: null, max: null };
		expect( state.hasActiveFilters ).toBe( false );
	} );

	it( 'hasActiveFilters and activeFilterCount include staticFilterSelections', () => {
		// Without this contribution, a deep link to `?section=guides` would
		// leave the active-filters / clear-filters affordances hidden even
		// though the static filter is constraining results.
		state.activeFilters = {};
		state.priceRange = null;
		state.staticFilterSelections = {};
		expect( state.hasActiveFilters ).toBe( false );
		expect( state.activeFilterCount ).toBe( 0 );

		state.staticFilterSelections = { section: 'guides' };
		expect( state.hasActiveFilters ).toBe( true );
		expect( state.activeFilterCount ).toBe( 1 );

		// Combined with dynamic filters — totals add.
		state.activeFilters = { category: [ 'news', 'wp' ] };
		expect( state.activeFilterCount ).toBe( 3 );

		// Empty-string entries don't count (they round-trip as 'cleared').
		state.activeFilters = {};
		state.staticFilterSelections = { section: '' };
		expect( state.hasActiveFilters ).toBe( false );
		expect( state.activeFilterCount ).toBe( 0 );
	} );

	it( 'enables the filter trigger for active filters or available aggregation buckets', () => {
		expect( state.isFilterTriggerDisabled ).toBe( true );

		state.aggregations = { category: { buckets: [ { key: 'news', doc_count: 2 } ] } };
		expect( state.isFilterTriggerDisabled ).toBe( false );

		state.aggregations = {};
		state.activeFilters = { category: [ 'news' ] };
		expect( state.isFilterTriggerDisabled ).toBe( false );
	} );

	it( 'derives sort state and trigger disabled state', () => {
		expect( state.isSortByRelevance ).toBe( true );
		expect( state.isSortTriggerDisabled ).toBe( true );

		state.sortOrder = 'newest';
		expect( state.isSortByNewest ).toBe( true );
		expect( state.isSortTriggerDisabled ).toBe( false );

		state.sortOrder = 'oldest';
		expect( state.isSortByOldest ).toBe( true );
	} );

	it( 'allBucketsSelected returns true only when every bucket is in activeFilters', () => {
		captured.context = { filterKey: 'pa_color' };

		state.aggregations = {};
		state.activeFilters = {};
		expect( state.allBucketsSelected ).toBe( false );

		state.aggregations = { pa_color: { buckets: [ { key: 'red' }, { key: 'blue' } ] } };
		state.activeFilters = {};
		expect( state.allBucketsSelected ).toBe( false );

		state.activeFilters = { pa_color: [ 'red' ] };
		expect( state.allBucketsSelected ).toBe( false );

		state.activeFilters = { pa_color: [ 'red', 'blue' ] };
		expect( state.allBucketsSelected ).toBe( true );

		captured.context = {};
	} );
} );

describe( 'remapAggregationsToFilterKeys', () => {
	// Mirror of `aggregationKeyFor` on the response side: the API returns
	// buckets under the slot slug for mapped custom taxonomies, but every
	// downstream consumer (`filterItems`, `retainedFilterOptions`,
	// wrapper-visibility) reads `aggregations[filterKey]`. This helper
	// flips the keys back exactly once before the response hits store
	// state.
	it( 'rewrites slot-keyed buckets back to the user-facing filterKey', () => {
		const aggregations = {
			'jetpack-search-tag1': { buckets: [ { key: 'fantasy/Fantasy', doc_count: 3 } ] },
		};
		const filterConfigs = {
			genre: { filterType: 'taxonomy', taxonomy: 'genre', effectiveSlug: 'jetpack-search-tag1' },
		};
		expect( remapAggregationsToFilterKeys( aggregations, filterConfigs ) ).toEqual( {
			genre: { buckets: [ { key: 'fantasy/Fantasy', doc_count: 3 } ] },
		} );
	} );

	it( 'returns the same object reference when no mapped filters are present', () => {
		// Built-ins and unmapped customs key by the filterKey already, so
		// the helper can short-circuit and avoid a needless clone.
		const aggregations = { category: { buckets: [] } };
		const filterConfigs = {
			category: { filterType: 'taxonomy', taxonomy: 'category', effectiveSlug: 'category' },
		};
		expect( remapAggregationsToFilterKeys( aggregations, filterConfigs ) ).toBe( aggregations );
	} );

	it( 'leaves non-slot buckets alone when remapping a mapped one', () => {
		const aggregations = {
			category: { buckets: [ { key: 'news/News', doc_count: 1 } ] },
			'jetpack-search-tag1': { buckets: [ { key: 'fantasy/Fantasy', doc_count: 3 } ] },
		};
		const filterConfigs = {
			category: { filterType: 'taxonomy', taxonomy: 'category', effectiveSlug: 'category' },
			genre: { filterType: 'taxonomy', taxonomy: 'genre', effectiveSlug: 'jetpack-search-tag1' },
		};
		expect( remapAggregationsToFilterKeys( aggregations, filterConfigs ) ).toEqual( {
			category: { buckets: [ { key: 'news/News', doc_count: 1 } ] },
			genre: { buckets: [ { key: 'fantasy/Fantasy', doc_count: 3 } ] },
		} );
	} );

	it( 'tolerates missing or invalid input gracefully', () => {
		expect( remapAggregationsToFilterKeys( undefined, {} ) ).toEqual( {} );
		expect( remapAggregationsToFilterKeys( null, {} ) ).toEqual( {} );
		expect( remapAggregationsToFilterKeys( {}, undefined ) ).toEqual( {} );
	} );
} );

describe( 'gateActiveFilters', () => {
	it( 'drops keys that are not in the registered filterConfigs', () => {
		const { gated, droppedAny } = gateActiveFilters(
			{ category: [ 'news' ], post_date: [ '2024-08' ], foo: [ 'bar' ] },
			{ category: { filterKey: 'category' }, post_date: { filterKey: 'post_date' } }
		);
		expect( gated ).toEqual( { category: [ 'news' ], post_date: [ '2024-08' ] } );
		expect( droppedAny ).toBe( true );
	} );

	it( 'keeps every key when filterConfigs covers them all', () => {
		const { gated, droppedAny } = gateActiveFilters(
			{ category: [ 'news' ] },
			{ category: { filterKey: 'category' }, post_date: { filterKey: 'post_date' } }
		);
		expect( gated ).toEqual( { category: [ 'news' ] } );
		expect( droppedAny ).toBe( false );
	} );

	it( 'returns droppedAny=false when activeFilters is empty', () => {
		const { gated, droppedAny } = gateActiveFilters( {}, { category: { filterKey: 'category' } } );
		expect( gated ).toEqual( {} );
		expect( droppedAny ).toBe( false );
	} );

	it( 'drops everything when filterConfigs is empty', () => {
		const { gated, droppedAny } = gateActiveFilters( { category: [ 'news' ] }, {} );
		expect( gated ).toEqual( {} );
		expect( droppedAny ).toBe( true );
	} );

	it( 'drops prototype-chain keys regardless of filterConfigs contents', () => {
		// `__proto__`, `constructor`, `toString`, `hasOwnProperty` etc. are
		// inherited from Object.prototype; a naive `allowedKeys[key]` lookup
		// would treat them as truthy and let them survive the gate. Use
		// JSON.parse so `__proto__` lands as an own property (object literals
		// would set the prototype instead).
		const activeFilters = JSON.parse(
			'{"__proto__":["pwn"],"constructor":["x"],"toString":["y"],"category":["news"]}'
		);
		const { gated, droppedAny } = gateActiveFilters( activeFilters, {
			category: { filterKey: 'category' },
		} );
		expect( gated ).toEqual( { category: [ 'news' ] } );
		expect( droppedAny ).toBe( true );
		// Output must not have inherited the polluted prototype value either.
		expect( Object.getPrototypeOf( gated ) ).toBeNull();
	} );

	it( 'does not allow Object.prototype keys to act as registered filter keys', () => {
		// Even if filterConfigs only mentions `category`, an attacker URL of
		// `?toString[]=…` should not survive because `toString` is inherited,
		// not own.
		const activeFilters = JSON.parse( '{"toString":["bad"]}' );
		const { gated, droppedAny } = gateActiveFilters( activeFilters, {
			category: { filterKey: 'category' },
		} );
		expect( gated ).toEqual( {} );
		expect( droppedAny ).toBe( true );
	} );
} );

describe( 'gateStaticFilterSelections', () => {
	it( 'drops keys whose filterConfigs entry is missing', () => {
		// Stale selections for a since-removed static-filter registration
		// must not survive a popstate or `initialize()` re-gate.
		const { gated, droppedAny } = gateStaticFilterSelections(
			{ section: 'guides', dropped: 'x' },
			{ section: { filterKey: 'section', kind: 'static' } }
		);
		expect( gated ).toEqual( { section: 'guides' } );
		expect( droppedAny ).toBe( true );
	} );

	it( 'reports droppedAny=false when nothing is dropped', () => {
		// `initialize()` and `handlePopState` use `droppedAny` to skip the
		// state write when the gate was a no-op — same idiom as
		// `gateActiveFilters`.
		const { gated, droppedAny } = gateStaticFilterSelections(
			{ section: 'guides' },
			{ section: { filterKey: 'section', kind: 'static' } }
		);
		expect( gated ).toEqual( { section: 'guides' } );
		expect( droppedAny ).toBe( false );
	} );

	it( 'drops keys whose filterConfigs entry exists but is not kind=static', () => {
		// A scalar URL param under a dynamic filter key (e.g. someone fat-fingered
		// `?category=news` instead of `?category[]=news`) must not pollute the
		// static-filter slice. The kind=static gate keeps the boundary explicit.
		const { gated, droppedAny } = gateStaticFilterSelections(
			{ category: 'news', section: 'guides' },
			{
				category: { filterKey: 'category', filterType: 'taxonomy' },
				section: { filterKey: 'section', kind: 'static' },
			}
		);
		expect( gated ).toEqual( { section: 'guides' } );
		expect( droppedAny ).toBe( true );
	} );

	it( 'drops empty values', () => {
		// `''` is the "cleared" state — keeping the key would round-trip
		// through pushStateToUrl and re-emit `?section=` indefinitely.
		const { gated, droppedAny } = gateStaticFilterSelections(
			{ section: '' },
			{ section: { filterKey: 'section', kind: 'static' } }
		);
		expect( gated ).toEqual( {} );
		expect( droppedAny ).toBe( true );
	} );

	it( 'returns a null-prototype object so __proto__ pollution cannot survive', () => {
		// Same defence as gateActiveFilters — JSON.parse lets `__proto__`
		// land as an own property; we must drop it because it isn't in
		// filterConfigs, and the output object must not inherit anything that
		// could be misread as a registered key downstream.
		const selections = JSON.parse( '{"__proto__":"pwn","section":"guides"}' );
		const { gated } = gateStaticFilterSelections( selections, {
			section: { filterKey: 'section', kind: 'static' },
		} );
		expect( gated ).toEqual( { section: 'guides' } );
		expect( Object.getPrototypeOf( gated ) ).toBeNull();
	} );

	it( 'tolerates undefined / null inputs', () => {
		expect( gateStaticFilterSelections( undefined, {} ).gated ).toEqual( {} );
		expect( gateStaticFilterSelections( null, {} ).gated ).toEqual( {} );
		expect( gateStaticFilterSelections( { section: 'guides' }, null ).gated ).toEqual( {} );
	} );
} );

describe( 'store callbacks', () => {
	afterEach( () => {
		jest.restoreAllMocks();
		captured.context = {};
		// Reset the static-filter slice so it doesn't leak into later cases
		// in this describe block.
		state.staticFilterSelections = {};
	} );

	it( 'isStaticFilterSelected reads filterKey + optionValue from context and compares against the store', () => {
		// Pin the reactive-binding contract. render.php emits a per-<li>
		// `data-wp-context` with `{ filterKey, optionValue }`, and each
		// radio's `data-wp-bind--checked="callbacks.isStaticFilterSelected"`
		// evaluates to this boolean. Without the binding, radios drift from
		// the store after `clearFilters()` or `handlePopState()` since the
		// `change` event only fires on user-initiated transitions.
		state.staticFilterSelections = { section: 'guides' };

		captured.context = { filterKey: 'section', optionValue: 'guides' };
		expect( captured.callbacks.isStaticFilterSelected() ).toBe( true );

		captured.context = { filterKey: 'section', optionValue: 'news' };
		expect( captured.callbacks.isStaticFilterSelected() ).toBe( false );

		// Unregistered key — defensive against a stale context that survives
		// a filter being deregistered.
		captured.context = { filterKey: 'missing', optionValue: 'whatever' };
		expect( captured.callbacks.isStaticFilterSelected() ).toBe( false );

		// Empty slice — clearFilters case. Every radio should report false.
		state.staticFilterSelections = {};
		captured.context = { filterKey: 'section', optionValue: 'guides' };
		expect( captured.callbacks.isStaticFilterSelected() ).toBe( false );
	} );

	it( 'isStaticFilterSelected tolerates an undefined staticFilterSelections slice', () => {
		// The optional-chaining guard (`state.staticFilterSelections?.[…]`)
		// handles the case where the PHP seed hasn't yet populated the slot
		// — e.g. on a page with no filter-static block. The comparison
		// falls through to `undefined === 'guides'`, which is `false`.
		// Reading the slice directly would crash; this guards the contract.
		state.staticFilterSelections = undefined;
		captured.context = { filterKey: 'section', optionValue: 'guides' };
		expect( captured.callbacks.isStaticFilterSelected() ).toBe( false );
	} );

	it( 'initializes popstate handling and runs one URL-seeded search', () => {
		// Also covers the price-only URL case: `?min_price=10` with no text
		// query and no checkbox filters seeds isLoading=true on the PHP side,
		// so initialize() must fire a fetch — hasActiveFilters counts the
		// priceRange, so the existing `searchQuery || hasActiveFilters` gate
		// is enough.
		const addEventListener = jest.spyOn( window, 'addEventListener' );
		Object.assign( actions, originalActions );
		jest.spyOn( actions, 'handlePopState' ).mockImplementation();
		const search = jest.spyOn( actions, 'search' ).mockImplementation();
		state.searchQuery = '';
		state.activeFilters = {};
		state.priceRange = { min: 10, max: null };

		captured.callbacks.initialize();
		captured.callbacks.initialize();

		expect( addEventListener ).toHaveBeenCalledTimes( 1 );
		expect( addEventListener ).toHaveBeenCalledWith( 'popstate', actions.handlePopState );
		expect( search ).toHaveBeenCalledTimes( 1 );
		expect( search ).toHaveBeenCalledWith( { syncUrl: false } );
	} );

	it( 'drops unknown activeFilters keys before running the URL-seeded search', () => {
		jest.isolateModules( () => {
			const fresh = require( '../../../src/search-blocks/store' );
			jest.spyOn( window, 'addEventListener' ).mockImplementation();
			jest.spyOn( fresh.actions, 'handlePopState' ).mockImplementation();
			const search = jest.spyOn( fresh.actions, 'search' ).mockImplementation();
			fresh.state.searchQuery = 'wordpress';
			fresh.state.priceRange = null;
			fresh.state.filterConfigs = { category: { filterKey: 'category' } };
			fresh.state.activeFilters = { category: [ 'news' ], foo: [ 'bar' ] };

			captured.callbacks.initialize();

			expect( fresh.state.activeFilters ).toEqual( { category: [ 'news' ] } );
			expect( search ).toHaveBeenCalledTimes( 1 );
			expect( search ).toHaveBeenCalledWith( { syncUrl: false } );
		} );
	} );

	it( 'clears isLoading when gating empties activeFilters and no fetch will fire', () => {
		jest.isolateModules( () => {
			const fresh = require( '../../../src/search-blocks/store' );
			jest.spyOn( window, 'addEventListener' ).mockImplementation();
			jest.spyOn( fresh.actions, 'handlePopState' ).mockImplementation();
			const search = jest.spyOn( fresh.actions, 'search' ).mockImplementation();
			fresh.state.searchQuery = '';
			fresh.state.priceRange = null;
			fresh.state.filterConfigs = { category: { filterKey: 'category' } };
			fresh.state.activeFilters = { foo: [ 'bar' ] };
			fresh.state.isLoading = true;

			captured.callbacks.initialize();

			expect( fresh.state.activeFilters ).toEqual( {} );
			expect( search ).not.toHaveBeenCalled();
			expect( fresh.state.isLoading ).toBe( false );
			// Skeleton derives closed once `isLoading` clears — otherwise the
			// pre-hydration placeholders would linger forever on a deep link
			// whose only filter keys are stale and get gated out.
			expect( fresh.state.skeletonHidden ).toBe( true );
		} );
	} );

	it( 'runs the URL-seeded search for `?s=` (empty value) via hasSearchParam (SEARCH-183)', () => {
		jest.isolateModules( () => {
			const fresh = require( '../../../src/search-blocks/store' );
			jest.spyOn( window, 'addEventListener' ).mockImplementation();
			jest.spyOn( fresh.actions, 'handlePopState' ).mockImplementation();
			const search = jest.spyOn( fresh.actions, 'search' ).mockImplementation();
			// Visitor landed on `?s=` — searchQuery is `''` and no filters are
			// selected. Without hasSearchParam the legacy guard `searchQuery ||
			// hasActiveFilters` would skip the initial fetch and leave the
			// results region empty until the visitor types.
			fresh.state.searchQuery = '';
			fresh.state.priceRange = null;
			fresh.state.filterConfigs = {};
			fresh.state.activeFilters = {};
			fresh.state.hasSearchParam = true;

			captured.callbacks.initialize();

			expect( search ).toHaveBeenCalledTimes( 1 );
			expect( search ).toHaveBeenCalledWith( { syncUrl: false } );

			// Drop the flag so it doesn't leak into the `handlePopState` describe
			// below — captured.state is a singleton across the mocked module.
			fresh.state.hasSearchParam = false;
		} );
	} );

	describe( 'dispatchInitialSearchIfNeeded (SEARCH-258)', () => {
		// The action is the shared seam between the IA-directive entry path
		// (results-list's `data-wp-init`) and the overlay-bootstrap entry
		// path (post-hydration explicit call). The flag is module-scoped, so
		// each case loads a fresh module via `jest.isolateModules` rather
		// than mutating the shared module instance — otherwise the latch from
		// the first case would silently make every later case a no-op.

		it( 'fires actions.search once on the first call and is a no-op on subsequent calls', () => {
			jest.isolateModules( () => {
				const fresh = require( '../../../src/search-blocks/store' );
				const search = jest.spyOn( fresh.actions, 'search' ).mockImplementation();
				fresh.state.searchQuery = '';
				fresh.state.priceRange = null;
				fresh.state.filterConfigs = {};
				fresh.state.activeFilters = {};
				fresh.state.hasSearchParam = true;

				captured.actions.dispatchInitialSearchIfNeeded();
				captured.actions.dispatchInitialSearchIfNeeded();
				captured.actions.dispatchInitialSearchIfNeeded();

				// The latch is what lets the IA directive AND the overlay
				// bootstrap both call this safely after hydration — only the
				// first invocation wins.
				expect( search ).toHaveBeenCalledTimes( 1 );
				expect( search ).toHaveBeenCalledWith( { syncUrl: false } );

				fresh.state.hasSearchParam = false;
			} );
		} );

		it( 'bails without dispatching when no search criteria are present', () => {
			jest.isolateModules( () => {
				const fresh = require( '../../../src/search-blocks/store' );
				const search = jest.spyOn( fresh.actions, 'search' ).mockImplementation();
				// Plain homepage: no `?s=` / `?q=`, no filters, no price range.
				fresh.state.searchQuery = '';
				fresh.state.priceRange = null;
				fresh.state.filterConfigs = {};
				fresh.state.activeFilters = {};
				fresh.state.hasSearchParam = false;

				captured.actions.dispatchInitialSearchIfNeeded();

				expect( search ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( 'initLoadMoreObserver', () => {
		let originalIO;
		let observerInstances;

		beforeEach( () => {
			originalIO = global.IntersectionObserver;
			observerInstances = [];
			// jsdom doesn't ship IntersectionObserver, and the instance methods
			// (`observe`, `unobserve`, `disconnect`) don't exist on a fresh
			// `this` either — so `jest.spyOn` has nothing to attach to. Direct
			// assignment is the right tool here.
			/* eslint-disable jest/prefer-spy-on -- nothing to spy on. */
			global.IntersectionObserver = jest.fn( function ( cb, opts ) {
				this.cb = cb;
				this.opts = opts;
				this.observe = jest.fn();
				this.unobserve = jest.fn();
				this.disconnect = jest.fn();
				observerInstances.push( this );
			} );
			/* eslint-enable jest/prefer-spy-on */
		} );

		afterEach( () => {
			if ( originalIO === undefined ) {
				delete global.IntersectionObserver;
			} else {
				global.IntersectionObserver = originalIO;
			}
			captured.element.ref = null;
		} );

		/**
		 * Build a fake wrapper DOM with the dataset + sentinel render.php emits.
		 *
		 * @param {object} dataset - dataset attributes to attach.
		 * @return {object} fake wrapper element.
		 */
		function makeWrapper( dataset ) {
			const sentinel = { tagName: 'SPAN' };
			return {
				dataset,
				querySelector: jest.fn( () => sentinel ),
				_sentinel: sentinel,
			};
		}

		it( 'no-ops when loadOnScroll is not enabled on the wrapper', () => {
			captured.element.ref = makeWrapper( {} );
			const cleanup = captured.callbacks.initLoadMoreObserver();
			expect( cleanup ).toBeUndefined();
			expect( global.IntersectionObserver ).not.toHaveBeenCalled();
		} );

		it( 'observes the sentinel with the configured rootMargin and returns a teardown', () => {
			const wrapper = makeWrapper( { loadOnScroll: '1', loadOnScrollOffset: '150' } );
			captured.element.ref = wrapper;

			const cleanup = captured.callbacks.initLoadMoreObserver();

			expect( global.IntersectionObserver ).toHaveBeenCalledTimes( 1 );
			expect( observerInstances[ 0 ].opts.rootMargin ).toBe( '0px 0px 150px 0px' );
			expect( observerInstances[ 0 ].observe ).toHaveBeenCalledWith( wrapper._sentinel );
			expect( typeof cleanup ).toBe( 'function' );

			cleanup();
			expect( observerInstances[ 0 ].disconnect ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'falls back to a 200px rootMargin when the offset is missing or unparseable', () => {
			captured.element.ref = makeWrapper( { loadOnScroll: '1' } );
			captured.callbacks.initLoadMoreObserver();
			expect( observerInstances[ 0 ].opts.rootMargin ).toBe( '0px 0px 200px 0px' );
		} );

		it( 'fires loadMore() only when showLoadMore is true and a fetch is not already in flight', () => {
			captured.element.ref = makeWrapper( { loadOnScroll: '1', loadOnScrollOffset: '200' } );
			Object.assign( actions, originalActions );
			const loadMore = jest.spyOn( actions, 'loadMore' ).mockImplementation();

			// Seed a state where the next page exists and nothing's loading.
			state.pageHandle = { offset: 10 };
			state.isLoading = false;
			state.isLoadingMore = false;

			captured.callbacks.initLoadMoreObserver();
			const observer = observerInstances[ 0 ];

			// Not intersecting → no fetch.
			observer.cb( [ { isIntersecting: false } ] );
			expect( loadMore ).not.toHaveBeenCalled();

			// Intersecting and showLoadMore (derived from pageHandle && !isLoading) → fetch.
			// Flip isLoadingMore true to mirror what `*loadMore()` would do; this
			// proves the in-flight guard prevents a second call.
			loadMore.mockImplementation( () => {
				state.isLoadingMore = true;
			} );
			observer.cb( [ { isIntersecting: true } ] );
			expect( loadMore ).toHaveBeenCalledTimes( 1 );

			// Already loading more → skipped (the store's own guard would no-op
			// too, but mirroring the check here avoids a noop generator step).
			observer.cb( [ { isIntersecting: true } ] );
			expect( loadMore ).toHaveBeenCalledTimes( 1 );

			// No more pages → skipped.
			state.isLoadingMore = false;
			state.pageHandle = null;
			observer.cb( [ { isIntersecting: true } ] );
			expect( loadMore ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'no-ops when IntersectionObserver is unavailable in the environment', () => {
			const saved = global.IntersectionObserver;
			// Match the `typeof … === 'undefined'` runtime check by removing the
			// global outright — assigning `undefined` would still leave the
			// binding declared, which doesn't trip a `typeof` guard.
			delete global.IntersectionObserver;
			captured.element.ref = makeWrapper( { loadOnScroll: '1' } );
			const cleanup = captured.callbacks.initLoadMoreObserver();
			expect( cleanup ).toBeUndefined();
			global.IntersectionObserver = saved;
		} );

		it( 're-observes the sentinel after a load settles so a short result page does not stall auto-load', () => {
			jest.useFakeTimers();
			captured.element.ref = makeWrapper( { loadOnScroll: '1', loadOnScrollOffset: '200' } );
			Object.assign( actions, originalActions );
			const loadMore = jest.spyOn( actions, 'loadMore' ).mockImplementation( () => {
				state.isLoadingMore = true;
			} );

			state.pageHandle = { offset: 10 };
			state.isLoading = false;
			state.isLoadingMore = false;

			captured.callbacks.initLoadMoreObserver();
			const observer = observerInstances[ 0 ];

			// First intersection fires loadMore and schedules a settle probe.
			observer.cb( [ { isIntersecting: true } ] );
			expect( loadMore ).toHaveBeenCalledTimes( 1 );
			expect( observer.unobserve ).not.toHaveBeenCalled();

			// Probe finds isLoadingMore still true → reschedules itself.
			jest.advanceTimersByTime( 100 );
			expect( observer.unobserve ).not.toHaveBeenCalled();

			// Fetch settles. Probe re-arms the observer so a sentinel that
			// never left the rootMargin gets a fresh initial-state event.
			state.isLoadingMore = false;
			jest.advanceTimersByTime( 100 );
			expect( observer.unobserve ).toHaveBeenCalledTimes( 1 );
			expect( observer.observe ).toHaveBeenCalledTimes( 2 );

			jest.useRealTimers();
		} );
	} );
} );

describe( 'handlePopState gating', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'drops unknown activeFilters keys even when filterConfigs is empty', async () => {
		// Empty filterConfigs is the case where urlParamsToState bypasses its
		// own gate — handlePopState must still drop stray keys before they
		// land in state and round-trip via pushStateToUrl.
		const stub = require( '../../../src/search-blocks/store/url-state' );
		jest.spyOn( stub, 'readStateFromUrl' ).mockReturnValue( {
			searchQuery: 'hello',
			hasSearchParam: true,
			sortOrder: 'relevance',
			activeFilters: { foo: [ 'bar' ] },
			filterLogic: {},
			priceRange: null,
		} );
		Object.assign( actions, originalActions );
		jest.spyOn( actions, 'search' ).mockImplementation();
		state.filterConfigs = {};

		await runGenerator( actions.handlePopState() );

		expect( state.activeFilters ).toEqual( {} );
	} );

	it( 'syncs `state.hasSearchParam` to the popped URL (SEARCH-183)', async () => {
		// `initialize()` is the only consumer today, but keeping
		// state.hasSearchParam in lockstep with the live URL avoids a
		// footgun for future readers (e.g. `showNoResults`, which now
		// gates on it). Mirrors how `state.searchQuery` is rewritten on
		// each popstate.
		const stub = require( '../../../src/search-blocks/store/url-state' );
		jest.spyOn( stub, 'readStateFromUrl' ).mockReturnValue( {
			searchQuery: '',
			hasSearchParam: true,
			sortOrder: 'relevance',
			activeFilters: {},
			filterLogic: {},
			priceRange: null,
		} );
		Object.assign( actions, originalActions );
		jest.spyOn( actions, 'search' ).mockImplementation();
		state.hasSearchParam = false;

		await runGenerator( actions.handlePopState() );

		expect( state.hasSearchParam ).toBe( true );
	} );
} );

describe( 'TrainTracks relevance events', () => {
	/**
	 * Raw API result carrying a railcar, as the search API returns it.
	 *
	 * @param {string} title - Result title.
	 * @param {number} pos   - Server fetch_position.
	 * @return {object} Raw search result with railcar.
	 */
	function railcarResult( title, pos ) {
		return {
			...createResult( title ),
			railcar: {
				railcar: `rc-${ pos }`,
				fetch_algo: 'jetpack:search/1-score_default',
				fetch_position: pos,
				fetch_query: 'boots',
				rec_blog_id: 1,
				rec_post_id: 100 + pos,
				session_id: 'sess-1',
			},
		};
	}

	beforeEach( () => {
		Object.assign( actions, originalActions );
		Object.assign( state, {
			siteId: 123,
			searchQuery: 'boots',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
			homeUrl: 'https://example.com',
			nonce: '',
			activeFilters: {},
			filterConfigs: {},
			priceRange: null,
			staticFilterSelections: {},
			staticPostTypes: null,
			retainedFilterOptions: {},
			results: [],
			resultsLayout: 'expanded',
			disableTracking: false,
			locale: 'en-US',
			isLoading: false,
			isLoadingMore: false,
			hasError: false,
			totalResults: 0,
			aggregations: {},
			strings: {},
		} );
		Object.defineProperty( global, 'fetch', {
			configurable: true,
			writable: true,
			value: jest.fn(),
		} );
		window._tkq = [];
		captured.context = {};
	} );

	afterEach( () => {
		if ( originalFetch ) {
			Object.defineProperty( global, 'fetch', {
				configurable: true,
				writable: true,
				value: originalFetch,
			} );
		} else {
			delete global.fetch;
		}
		jest.restoreAllMocks();
	} );

	it( 'fires one render event per result with absolute ui_position and the instant-search ui_algo', async () => {
		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ railcarResult( 'First', 0 ), railcarResult( 'Second', 1 ) ],
				total: 2,
				page_handle: null,
				aggregations: {},
			} )
		);
		await runGenerator( actions.search( { syncUrl: false } ) );

		const renders = window._tkq.filter(
			e => e[ 1 ] === 'jetpack_instant_search_traintracks_render'
		);
		expect( renders ).toHaveLength( 2 );
		expect( renders[ 0 ][ 2 ] ).toMatchObject( {
			fetch_algo: 'jetpack:search/1-score_default',
			fetch_position: 0,
			fetch_query: 'boots',
			railcar: 'rc-0',
			rec_blog_id: 1,
			rec_post_id: 100,
			session_id: 'sess-1',
			ui_algo: 'jetpack-instant-search-ui/v1-expanded',
			ui_position: 0,
		} );
		expect( renders[ 1 ][ 2 ] ).toMatchObject( { railcar: 'rc-1', ui_position: 1 } );
	} );

	it( 'maps the compact layout to the minimal ui_algo', async () => {
		state.resultsLayout = 'compact';
		global.fetch.mockResolvedValueOnce(
			createResponse( { results: [ railcarResult( 'Only', 0 ) ], total: 1, page_handle: null } )
		);
		await runGenerator( actions.search( { syncUrl: false } ) );

		const render = window._tkq.find( e => e[ 1 ] === 'jetpack_instant_search_traintracks_render' );
		expect( render[ 2 ].ui_algo ).toBe( 'jetpack-instant-search-ui/v1-minimal' );
	} );

	it( 'maps the product layout to the product ui_algo', async () => {
		state.resultsLayout = 'product';
		global.fetch.mockResolvedValueOnce(
			createResponse( { results: [ railcarResult( 'Only', 0 ) ], total: 1, page_handle: null } )
		);
		await runGenerator( actions.search( { syncUrl: false } ) );

		const render = window._tkq.find( e => e[ 1 ] === 'jetpack_instant_search_traintracks_render' );
		expect( render[ 2 ].ui_algo ).toBe( 'jetpack-instant-search-ui/v1-product' );
	} );

	it( 'fires no render events when tracking is disabled', async () => {
		state.disableTracking = true;
		global.fetch.mockResolvedValueOnce(
			createResponse( {
				results: [ railcarResult( 'First', 0 ), railcarResult( 'Second', 1 ) ],
				total: 2,
				page_handle: null,
			} )
		);
		await runGenerator( actions.search( { syncUrl: false } ) );

		expect(
			window._tkq.filter( e => e[ 1 ] === 'jetpack_instant_search_traintracks_render' )
		).toHaveLength( 0 );
	} );

	it( 'fires no interact event when tracking is disabled', () => {
		state.disableTracking = true;
		captured.context = { result: { index: 0, railcar: { railcar: 'rc-x' } } };
		actions.recordResultInteract();
		expect(
			window._tkq.filter( e => e[ 1 ] === 'jetpack_instant_search_traintracks_interact' )
		).toHaveLength( 0 );
	} );

	it( 'fires no event for results lacking a railcar', async () => {
		global.fetch.mockResolvedValueOnce(
			createResponse( { results: [ createResult( 'No railcar' ) ], total: 1, page_handle: null } )
		);
		await runGenerator( actions.search( { syncUrl: false } ) );

		expect(
			window._tkq.filter( e => e[ 1 ] === 'jetpack_instant_search_traintracks_render' )
		).toHaveLength( 0 );
	} );

	it( 'offsets ui_position by the existing list length on loadMore', async () => {
		// One result already on the page (ui_position 0); the next page's
		// result must report ui_position 1, not 0.
		state.results = [ { id: 'a', title: 'Already here', index: 0, railcar: null } ];
		state.pageHandle = 'page-2';
		global.fetch.mockResolvedValueOnce(
			createResponse( { results: [ railcarResult( 'Page two', 1 ) ], page_handle: null } )
		);
		await runGenerator( actions.loadMore() );

		const render = window._tkq.find( e => e[ 1 ] === 'jetpack_instant_search_traintracks_render' );
		expect( render[ 2 ].ui_position ).toBe( 1 );
	} );

	it( 'fires an interact event with action:click reading the clicked result context', () => {
		captured.context = {
			result: {
				index: 3,
				railcar: {
					railcar: 'rc-click',
					fetch_algo: 'jetpack:search/1-score_default',
					fetch_position: 3,
					fetch_query: 'boots',
					rec_blog_id: 1,
					rec_post_id: 103,
					session_id: 'sess-1',
				},
			},
		};
		actions.recordResultInteract();

		const interact = window._tkq.find(
			e => e[ 1 ] === 'jetpack_instant_search_traintracks_interact'
		);
		expect( interact[ 2 ] ).toMatchObject( {
			railcar: 'rc-click',
			ui_position: 3,
			ui_algo: 'jetpack-instant-search-ui/v1-expanded',
			action: 'click',
		} );
	} );

	it( 'fires no interact event when the clicked result has no railcar', () => {
		captured.context = { result: { index: 0, railcar: null } };
		actions.recordResultInteract();
		expect(
			window._tkq.filter( e => e[ 1 ] === 'jetpack_instant_search_traintracks_interact' )
		).toHaveLength( 0 );
	} );
} );

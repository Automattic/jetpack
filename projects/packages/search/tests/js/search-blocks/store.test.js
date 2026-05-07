// Mock the Interactivity API store so the Search block store can be exercised
// in Jest without booting the browser runtime.

const captured = {
	state: {},
	actions: {},
	callbacks: {},
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
	} ),
	{ virtual: true }
);

import {
	actions,
	computeResultsCountText,
	gateActiveFilters,
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

	it( 'flips skeletonHidden once the first search resolves (success or error)', async () => {
		// `skeletonHidden` gates the pre-hydration placeholders. Once the
		// first fetch completes, JS owns the DOM and the skeleton must
		// disappear for the rest of the session — both the success path
		// and the error path of `search()` need to flip the flag.
		state.skeletonHidden = false;
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

		// Reset and confirm the error path also closes the skeleton —
		// otherwise a connection failure would leave placeholders on screen
		// indefinitely with no visible loading indicator.
		state.skeletonHidden = false;
		global.fetch.mockRejectedValueOnce( new Error( 'network down' ) );
		await runGenerator( actions.search( { syncUrl: false } ) );
		expect( state.skeletonHidden ).toBe( true );
		expect( state.hasError ).toBe( true );
		expect( state.isLoading ).toBe( false );
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

		global.fetch.mockRejectedValueOnce( new Error( 'network down' ) );
		await runGenerator( actions.search( { syncUrl: false } ) );

		expect( state.hasError ).toBe( true );
		expect( state.results ).toEqual( [] );
		expect( state.totalResults ).toBe( 0 );
		expect( state.pageHandle ).toBeNull();
		expect( state.aggregations ).toEqual( {} );
		// `resultsCountText` reads from `totalResults` via `computeResultsCountText`,
		// so an empty count string falls out for free — no extra wiring.
		expect( state.resultsCountText ).toBe( '' );
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
		const replaceState = jest.spyOn( window.history, 'replaceState' ).mockImplementation();
		state.searchQuery = 'shoes';
		state.priceRange = { min: 10, max: 50 };

		actions.syncToUrl();

		expect( replaceState ).toHaveBeenCalledTimes( 1 );
		const writtenUrl = replaceState.mock.calls[ 0 ][ 2 ];
		expect( writtenUrl ).toContain( 'min_price=10' );
		expect( writtenUrl ).toContain( 'max_price=50' );
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

describe( 'store callbacks', () => {
	afterEach( () => {
		jest.restoreAllMocks();
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
			fresh.state.skeletonHidden = false;

			captured.callbacks.initialize();

			expect( fresh.state.activeFilters ).toEqual( {} );
			expect( search ).not.toHaveBeenCalled();
			expect( fresh.state.isLoading ).toBe( false );
			// Skeleton flips closed even though no fetch fires — otherwise the
			// pre-hydration placeholders would linger forever on a deep link
			// whose only filter keys are stale and get gated out.
			expect( fresh.state.skeletonHidden ).toBe( true );
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
			sortOrder: 'relevance',
			activeFilters: { foo: [ 'bar' ] },
			priceRange: null,
		} );
		Object.assign( actions, originalActions );
		jest.spyOn( actions, 'search' ).mockImplementation();
		state.filterConfigs = {};

		await runGenerator( actions.handlePopState() );

		expect( state.activeFilters ).toEqual( {} );
	} );
} );

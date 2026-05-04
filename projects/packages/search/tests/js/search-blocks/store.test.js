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

import { actions, gateActiveFilters, state } from '../../../src/search-blocks/store';
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
 *
 * @param {Generator} generator - Action generator.
 * @return {Promise<*>} Final generator return value.
 */
async function runGenerator( generator ) {
	let step = generator.next();
	while ( ! step.done ) {
		step = generator.next( await step.value );
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

	it( 'clears filters only when filters are active', async () => {
		const search = jest.spyOn( actions, 'search' ).mockResolvedValue();

		await runGenerator( actions.clearFilters() );
		expect( search ).not.toHaveBeenCalled();

		state.activeFilters = { tag: [ 'react' ] };
		await runGenerator( actions.clearFilters() );

		expect( state.activeFilters ).toEqual( {} );
		expect( search ).toHaveBeenCalledTimes( 1 );
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
		state.isLoading = true;
		expect( state.resultsCountText ).toBe( 'Looking…' );

		state.isLoading = false;
		state.totalResults = 1;
		expect( state.resultsCountText ).toBe( 'Found 1 item' );

		state.totalResults = 3;
		expect( state.resultsCountText ).toBe( 'Found 3 items' );

		state.totalResults = 0;
		expect( state.resultsCountText ).toBe( '' );
	} );

	it( 'derives result, load-more, and filter visibility flags', () => {
		state.results = [];
		expect( state.showNoResults ).toBe( true );

		state.hasError = true;
		expect( state.showNoResults ).toBe( false );

		state.hasError = false;
		state.pageHandle = 'next-page';
		expect( state.showLoadMore ).toBe( true );

		state.isLoading = true;
		expect( state.showLoadMore ).toBe( false );

		state.isLoading = false;
		state.activeFilters = { category: [ 'news', 'updates' ] };
		expect( state.hasActiveFilters ).toBe( true );
		expect( state.activeFilterCount ).toBe( 2 );
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
} );

describe( 'store callbacks', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'initializes popstate handling and runs one URL-seeded search', () => {
		// Also covers the price-only URL case: `?min_price=10` with no text
		// query and no checkbox filters seeds isLoading=true on the PHP side,
		// so initialize() must fire a fetch for `priceRange` alone, not just
		// for `searchQuery || hasActiveFilters`.
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
		} );
	} );
} );

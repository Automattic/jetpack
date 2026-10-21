/**
 * Tests for SEARCH-311: SearchApp should mark a query as "pending" the instant
 * a query/sort/filter change is detected, before the debounced getResults()
 * call actually dispatches makeSearchRequest — closing the gap where isLoading
 * is still false and the response is stale/empty.
 */

jest.mock( '@microsoft/fetch-event-source', () => ( {
	fetchEventSource: jest.fn(),
} ) );

let lastSearchResultsProps = {};
jest.mock( '../search-results', () => props => {
	lastSearchResultsProps = props;
	return <div data-testid="search-results" />;
} );
let lastOverlayProps = {};
jest.mock( '../overlay', () => props => {
	lastOverlayProps = props;
	return <div data-testid="overlay">{ props.children }</div>;
} );
jest.mock( '../customizer-event-handler', () => () => null );
jest.mock( '../dom-event-handler', () => () => null );

jest.mock( 'react-redux', () => ( {
	connect: () => Component => Component,
} ) );

jest.mock( '../../store/actions', () => ( {} ) );
jest.mock( '../../store/selectors', () => ( {
	getSort: jest.requireActual( '../../store/selectors' ).getSort,
} ) );

import { act, render } from '@testing-library/react';
import * as React from 'react';
import SearchApp from '../search-app';

const noop = () => {};

const defaultProps = {
	enableAnalytics: false,
	shouldIntegrateWithDom: false,
	shouldCreatePortal: false,
	isInCustomizer: false,
	initialIsVisible: false,
	initialHref: '/',
	options: {
		siteId: 123,
		locale: 'en',
		postTypes: [],
		widgets: [],
		additionalBlogIds: [],
		isPhotonEnabled: false,
		isPrivateSite: false,
		postsPerPage: 10,
		adminQueryFilter: '',
		highlightFields: [],
		customResults: {},
		hasNonSearchWidgets: false,
	},
	overlayOptions: {
		colorTheme: 'light',
		enableInfScroll: false,
		enableFilteringOpensOverlay: false,
		enableSort: false,
		enablePostDate: false,
		enableProductPrice: false,
		overlayTrigger: 'immediate',
		resultFormat: 'minimal',
		showPoweredBy: false,
		highlightColor: '#000',
		closeColor: '#000',
		defaultSort: 'relevance',
		excludedPostTypes: [],
	},
	themeOptions: { searchInputSelector: '.search-field' },
	aggregations: {},
	hasOverlayWidgets: false,
	filters: {},
	staticFilters: {},
	hasActiveQuery: false,
	hasError: false,
	isHistoryNavigation: false,
	hasNextPage: false,
	isLoading: false,
	response: {},
	searchQuery: '',
	sort: 'relevance',
	widgetOutsideOverlay: null,
	clearQueryValues: noop,
	disableQueryStringIntegration: noop,
	initializeQueryValues: noop,
	setStaticFilter: noop,
	setFilter: noop,
	setSearchQuery: noop,
	setSort: noop,
};

describe( 'SearchApp — isQueryPending', () => {
	let makeSearchRequest;

	beforeEach( () => {
		jest.useFakeTimers();
		makeSearchRequest = jest.fn();
		lastSearchResultsProps = {};
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'is false on initial render', () => {
		render(
			<SearchApp { ...defaultProps } searchQuery="" makeSearchRequest={ makeSearchRequest } />
		);
		expect( lastSearchResultsProps.isQueryPending ).toBe( false );
	} );

	it( 'becomes true synchronously when the query changes, before the debounce fires', () => {
		const utils = render(
			<SearchApp { ...defaultProps } searchQuery="" makeSearchRequest={ makeSearchRequest } />
		);
		utils.rerender(
			<SearchApp { ...defaultProps } searchQuery="hello" makeSearchRequest={ makeSearchRequest } />
		);

		expect( lastSearchResultsProps.isQueryPending ).toBe( true );
		expect( makeSearchRequest ).not.toHaveBeenCalled();
	} );

	it( 'clears isQueryPending once the debounced request dispatches, handing off to isLoading', () => {
		const utils = render(
			<SearchApp { ...defaultProps } searchQuery="" makeSearchRequest={ makeSearchRequest } />
		);
		utils.rerender(
			<SearchApp { ...defaultProps } searchQuery="hello" makeSearchRequest={ makeSearchRequest } />
		);

		act( () => {
			jest.advanceTimersByTime( 250 );
		} );

		// makeSearchRequest firing is what actually dispatches MAKE_SEARCH_REQUEST,
		// which is what flips the real (redux) isLoading to true in production;
		// this harness mocks react-redux, so isLoading itself doesn't move here.
		expect( makeSearchRequest ).toHaveBeenCalledTimes( 1 );
		expect( lastSearchResultsProps.isQueryPending ).toBe( false );

		// Model the redux handoff explicitly: once isLoading takes over, the
		// title-visible "pending" state must not get stuck permanently true.
		utils.rerender(
			<SearchApp
				{ ...defaultProps }
				searchQuery="hello"
				isLoading={ true }
				makeSearchRequest={ makeSearchRequest }
			/>
		);
		expect( lastSearchResultsProps.isLoading ).toBe( true );
		expect( lastSearchResultsProps.isQueryPending ).toBe( false );
	} );

	it( 'does not mark a query pending when the query is cleared to empty (e.g. a filter-link click)', () => {
		const utils = render(
			<SearchApp { ...defaultProps } searchQuery="foo" makeSearchRequest={ makeSearchRequest } />
		);
		// Let the mount-time request for "foo" settle first.
		act( () => {
			jest.advanceTimersByTime( 250 );
		} );
		makeSearchRequest.mockClear();
		utils.rerender(
			<SearchApp { ...defaultProps } searchQuery="" makeSearchRequest={ makeSearchRequest } />
		);

		expect( lastSearchResultsProps.isQueryPending ).toBe( false );

		act( () => {
			jest.advanceTimersByTime( 250 );
		} );

		expect( makeSearchRequest ).toHaveBeenCalledTimes( 1 );
		expect( lastSearchResultsProps.isQueryPending ).toBe( false );
	} );

	it( 'does not mark a query pending for pagination (loadNextPage)', () => {
		render(
			<SearchApp
				{ ...defaultProps }
				hasNextPage={ true }
				response={ { page_handle: 'abc' } }
				makeSearchRequest={ makeSearchRequest }
			/>
		);
		lastSearchResultsProps.onLoadNextPage();

		expect( lastSearchResultsProps.isQueryPending ).toBe( false );

		act( () => {
			jest.advanceTimersByTime( 250 );
		} );

		expect( makeSearchRequest ).toHaveBeenCalledTimes( 1 );
		expect( lastSearchResultsProps.isQueryPending ).toBe( false );
	} );
} );

describe( 'SearchApp — mount', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it.each( [ true, false ] )(
		'does not dispatch while constructing (shouldIntegrateWithDom: %s)',
		shouldIntegrateWithDom => {
			// The store is seeded at the mount site instead. See ../../../../AGENTS.md.
			const initializeQueryValues = jest.fn();
			const disableQueryStringIntegration = jest.fn();

			const app = new SearchApp( {
				...defaultProps,
				shouldIntegrateWithDom,
				initializeQueryValues,
				disableQueryStringIntegration,
			} );

			expect( app ).toBeInstanceOf( SearchApp );
			expect( initializeQueryValues ).not.toHaveBeenCalled();
			expect( disableQueryStringIntegration ).not.toHaveBeenCalled();
		}
	);

	it( 'opens the overlay for a deep link in the Customizer', () => {
		const makeSearchRequest = jest.fn();
		render(
			<SearchApp
				{ ...defaultProps }
				shouldIntegrateWithDom={ true }
				isInCustomizer={ true }
				hasActiveQuery={ true }
				searchQuery="block"
				makeSearchRequest={ makeSearchRequest }
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 250 );
		} );

		expect( lastOverlayProps.isVisible ).toBe( true );
		expect( makeSearchRequest ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'seeds static filters once when a deep link opens the overlay', () => {
		window.JetpackInstantSearchOptions = {
			staticFilters: [ { filter_id: 'group_id', selected: 'a' } ],
		};
		const setStaticFilter = jest.fn();

		try {
			render(
				<SearchApp
					{ ...defaultProps }
					shouldIntegrateWithDom={ true }
					hasActiveQuery={ true }
					searchQuery="block"
					overlayOptions={ { ...defaultProps.overlayOptions, enableFilteringOpensOverlay: true } }
					makeSearchRequest={ jest.fn() }
					setStaticFilter={ setStaticFilter }
				/>
			);
		} finally {
			delete window.JetpackInstantSearchOptions;
		}

		expect( setStaticFilter ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'requests results for a sort-only deep link without opening the overlay', () => {
		const makeSearchRequest = jest.fn();
		render(
			<SearchApp
				{ ...defaultProps }
				shouldIntegrateWithDom={ true }
				sort="newest"
				searchQuery={ null }
				makeSearchRequest={ makeSearchRequest }
			/>
		);

		act( () => {
			jest.advanceTimersByTime( 250 );
		} );

		expect( makeSearchRequest ).toHaveBeenCalledTimes( 1 );
		expect( lastOverlayProps.isVisible ).toBe( false );
	} );
} );

/**
 * Smoke tests for the AI Answers SSE wiring in SearchApp.
 *
 * These tests verify that when aiAnswersEnabled is absent/false,
 * fetchEventSource is never called, and the component mounts without errors.
 */

// Mock fetchEventSource so no real network calls are made.
jest.mock( '@microsoft/fetch-event-source', () => ( {
	fetchEventSource: jest.fn(),
} ) );

// Mock heavy child components with PALETTE / other build-time globals.
jest.mock( '../search-results', () => () => <div data-testid="search-results" /> );
jest.mock( '../overlay', () => ( { children } ) => <div data-testid="overlay">{ children }</div> );
jest.mock( '../customizer-event-handler', () => () => null );
jest.mock( '../dom-event-handler', () => () => null );

// Mock react-redux connect to pass through as a no-op wrapper so we can
// test the inner SearchApp class directly without a full Redux store.
jest.mock( 'react-redux', () => ( {
	connect: () => Component => Component,
} ) );

// Mock store actions — they are injected via connect; with connect mocked they
// won't be passed, so we supply them as props below.
jest.mock( '../../store/actions', () => ( {} ) );
jest.mock( '../../store/selectors', () => ( {} ) );

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { render } from '@testing-library/react';
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
	// Redux-injected props (normally provided by connect).
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
	// Redux-injected action creators.
	clearQueryValues: noop,
	disableQueryStringIntegration: noop,
	initializeQueryValues: noop,
	makeSearchRequest: noop,
	setStaticFilter: noop,
	setFilter: noop,
	setSearchQuery: noop,
	setSort: noop,
};

describe( 'SearchApp AI Answers SSE wiring', () => {
	beforeEach( () => {
		fetchEventSource.mockClear();
		window.JetpackInstantSearchOptions = { siteId: 123 };
	} );

	afterEach( () => {
		delete window.JetpackInstantSearchOptions;
	} );

	it( 'mounts without errors when aiAnswersEnabled is absent', () => {
		expect( () => {
			render( <SearchApp { ...defaultProps } /> );
		} ).not.toThrow();
	} );

	it( 'does not call fetchEventSource when aiAnswersEnabled is absent', () => {
		render( <SearchApp { ...defaultProps } /> );
		expect( fetchEventSource ).not.toHaveBeenCalled();
	} );
} );

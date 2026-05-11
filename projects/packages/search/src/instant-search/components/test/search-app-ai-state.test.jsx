/**
 * Tests for the AI Answers state management in SearchApp:
 * - getAiAnswer guard conditions
 * - streamAiAnswer SSE event handling
 * - handleShowMore extended-answer flow
 * - render() display-state derivation (brief vs. extended)
 */

jest.mock( '@microsoft/fetch-event-source', () => ( {
	fetchEventSource: jest.fn(),
} ) );

let lastSearchResultsProps = {};
jest.mock( '../search-results', () => props => {
	lastSearchResultsProps = props;
	return <div data-testid="search-results" />;
} );
jest.mock( '../overlay', () => ( { children } ) => <div data-testid="overlay">{ children }</div> );
jest.mock( '../customizer-event-handler', () => () => null );
jest.mock( '../dom-event-handler', () => () => null );

jest.mock( 'react-redux', () => ( {
	connect: () => Component => Component,
} ) );

jest.mock( '../../store/actions', () => ( {} ) );
jest.mock( '../../store/selectors', () => ( {} ) );

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { act, render } from '@testing-library/react';
import * as React from 'react';
import SearchApp from '../search-app';

const noop = () => {};

const BASE_OPTIONS = {
	siteId: 123,
	aiAnswersEnabled: true,
};

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
	makeSearchRequest: noop,
	setStaticFilter: noop,
	setFilter: noop,
	setSearchQuery: noop,
	setSort: noop,
};

// Renders with an initial empty query then re-renders with the given query,
// advancing fake timers past the 500 ms getAiAnswer debounce.
const renderAndTriggerQuery = ( query, windowOpts = BASE_OPTIONS ) => {
	window.JetpackInstantSearchOptions = windowOpts;
	const utils = render( <SearchApp { ...defaultProps } searchQuery="" /> );
	utils.rerender( <SearchApp { ...defaultProps } searchQuery={ query } /> );
	act( () => {
		jest.advanceTimersByTime( 600 );
	} );
	return utils;
};

// Returns the options object passed to the most recent fetchEventSource call.
const lastFetchOpts = () => fetchEventSource.mock.calls.at( -1 )[ 1 ];

// Manually fires an SSE onmessage event via the captured fetchEventSource callback.
const fireMessage = data =>
	act( () => {
		lastFetchOpts().onmessage( { data: JSON.stringify( data ) } );
	} );

describe( 'SearchApp — getAiAnswer guard conditions', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		fetchEventSource.mockClear();
		fetchEventSource.mockReturnValue( new Promise( () => {} ) );
		lastSearchResultsProps = {};
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackInstantSearchOptions;
	} );

	it( 'does not call fetchEventSource when query is empty', () => {
		window.JetpackInstantSearchOptions = BASE_OPTIONS;
		render( <SearchApp { ...defaultProps } searchQuery="" /> );
		act( () => jest.advanceTimersByTime( 600 ) );
		expect( fetchEventSource ).not.toHaveBeenCalled();
	} );

	it( 'does not call fetchEventSource when query is shorter than 3 characters', () => {
		renderAndTriggerQuery( 'hi' );
		expect( fetchEventSource ).not.toHaveBeenCalled();
	} );

	it( 'does not call fetchEventSource when aiAnswersEnabled is false', () => {
		renderAndTriggerQuery( 'reset my password', { ...BASE_OPTIONS, aiAnswersEnabled: false } );
		expect( fetchEventSource ).not.toHaveBeenCalled();
	} );

	it( 'calls fetchEventSource with the brief format for a valid query', () => {
		renderAndTriggerQuery( 'reset my password' );
		expect( fetchEventSource ).toHaveBeenCalledTimes( 1 );
		const body = JSON.parse( lastFetchOpts().body );
		expect( body.params.message.parts[ 1 ].data.clientContext.aiAnswersFormat ).toBe( 'brief' );
	} );

	it( 'posts the search query text to the AI endpoint', () => {
		renderAndTriggerQuery( 'reset my password' );
		const body = JSON.parse( lastFetchOpts().body );
		expect( body.params.message.parts[ 0 ].text ).toBe( 'reset my password' );
	} );

	it( 'passes the site ID from JetpackInstantSearchOptions', () => {
		renderAndTriggerQuery( 'reset my password', { ...BASE_OPTIONS, siteId: 999 } );
		const body = JSON.parse( lastFetchOpts().body );
		expect( body.params.message.parts[ 1 ].data.clientContext.selectedSiteId ).toBe( 999 );
	} );
} );

describe( 'SearchApp — streamAiAnswer SSE event handling', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		fetchEventSource.mockClear();
		fetchEventSource.mockReturnValue( new Promise( () => {} ) );
		lastSearchResultsProps = {};
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackInstantSearchOptions;
	} );

	it( 'sets aiStatus to streaming and accumulates text on token delta events', () => {
		renderAndTriggerQuery( 'reset my password' );

		fireMessage( {
			method: 'message/delta',
			params: { delta: { deltaType: 'content', content: 'Here is how ' } },
		} );
		fireMessage( {
			method: 'message/delta',
			params: { delta: { deltaType: 'content', content: 'to reset.' } },
		} );

		expect( lastSearchResultsProps.aiStatus ).toBe( 'streaming' );
		expect( lastSearchResultsProps.aiText ).toBe( 'Here is how to reset.' );
	} );

	it( 'sets aiStatus to done and populates citations on TaskStatusUpdateEvent completed', () => {
		renderAndTriggerQuery( 'reset my password' );

		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: {
					state: 'completed',
					message: {
						parts: [
							{
								type: 'data',
								data: {
									sources: [ { title: 'Reset guide', url: 'https://example.com/reset' } ],
								},
							},
						],
					},
				},
			},
		} );

		expect( lastSearchResultsProps.aiStatus ).toBe( 'done' );
		expect( lastSearchResultsProps.aiCitations ).toHaveLength( 1 );
		expect( lastSearchResultsProps.aiCitations[ 0 ].title ).toBe( 'Reset guide' );
	} );

	it( 'uses strict_sources when sources is absent', () => {
		renderAndTriggerQuery( 'reset my password' );

		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: {
					state: 'completed',
					message: {
						parts: [
							{
								type: 'data',
								data: {
									strict_sources: [ { title: 'Guide', url: 'https://example.com' } ],
								},
							},
						],
					},
				},
			},
		} );

		expect( lastSearchResultsProps.aiCitations ).toHaveLength( 1 );
	} );

	it( 'sets error state on task failed status', () => {
		renderAndTriggerQuery( 'reset my password' );

		fireMessage( {
			result: {
				status: {
					state: 'failed',
					message: {
						parts: [ { type: 'text', text: 'Service unavailable' } ],
					},
				},
			},
		} );

		expect( lastSearchResultsProps.aiStatus ).toBe( 'error' );
		expect( lastSearchResultsProps.aiError.message ).toBe( 'Service unavailable' );
		expect( lastSearchResultsProps.aiError.source ).toBe( 'api' );
	} );

	it( 'sets error state when data.error is present', () => {
		renderAndTriggerQuery( 'reset my password' );

		fireMessage( { error: { message: 'Bad request', code: 400 } } );

		expect( lastSearchResultsProps.aiStatus ).toBe( 'error' );
		expect( lastSearchResultsProps.aiError.code ).toBe( 400 );
	} );

	it( 'silently ignores unparseable SSE events', () => {
		renderAndTriggerQuery( 'reset my password' );

		// Should not throw.
		act( () => {
			lastFetchOpts().onmessage( { data: 'not-json{{' } );
		} );

		// Status remains at loading (initial value set by streamAiAnswer).
		expect( lastSearchResultsProps.aiStatus ).toBe( 'loading' );
	} );

	it( 'sets network error state when fetchEventSource promise rejects', async () => {
		fetchEventSource.mockReturnValueOnce( Promise.reject( new Error( 'net' ) ) );
		renderAndTriggerQuery( 'reset my password' );

		// Let the rejected promise propagate through the microtask queue.
		await act( async () => {
			await Promise.resolve();
		} );

		expect( lastSearchResultsProps.aiStatus ).toBe( 'error' );
		expect( lastSearchResultsProps.aiError.source ).toBe( 'network' );
		expect( lastSearchResultsProps.aiError.message ).toBe( 'Network request error' );
	} );
} );

describe( 'SearchApp — handleShowMore extended-answer flow', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		fetchEventSource.mockClear();
		fetchEventSource.mockReturnValue( new Promise( () => {} ) );
		lastSearchResultsProps = {};
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackInstantSearchOptions;
	} );

	it( 'calls fetchEventSource a second time with extended format on Show More', () => {
		renderAndTriggerQuery( 'reset my password' );
		expect( fetchEventSource ).toHaveBeenCalledTimes( 1 );

		// Simulate brief answer completing, which makes onShowMoreAiAnswer a function.
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: { state: 'completed', message: { parts: [] } },
			},
		} );

		// onShowMoreAiAnswer should be a function at this point (brief is done).
		act( () => {
			lastSearchResultsProps.onShowMoreAiAnswer();
		} );

		expect( fetchEventSource ).toHaveBeenCalledTimes( 2 );
		const extendedBody = JSON.parse( fetchEventSource.mock.calls[ 1 ][ 1 ].body );
		expect( extendedBody.params.message.parts[ 1 ].data.clientContext.aiAnswersFormat ).toBe(
			'extended'
		);
	} );

	it( 'passes the session ID from the brief request to the extended request', () => {
		renderAndTriggerQuery( 'reset my password' );

		// Simulate brief answer returning a session ID.
		fireMessage( { result: { sessionId: 'sess-abc-123' } } );

		// Finish brief answer.
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: { state: 'completed', message: { parts: [] } },
			},
		} );

		act( () => {
			lastSearchResultsProps.onShowMoreAiAnswer();
		} );

		const extendedBody = JSON.parse( fetchEventSource.mock.calls[ 1 ][ 1 ].body );
		expect( extendedBody.params.sessionId ).toBe( 'sess-abc-123' );
	} );
} );

describe( 'SearchApp — render display-state derivation', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		fetchEventSource.mockClear();
		fetchEventSource.mockReturnValue( new Promise( () => {} ) );
		lastSearchResultsProps = {};
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackInstantSearchOptions;
	} );

	it( 'passes brief status and text to SearchResults before Show More is clicked', () => {
		renderAndTriggerQuery( 'reset my password' );
		fireMessage( {
			method: 'message/delta',
			params: { delta: { deltaType: 'content', content: 'Brief answer.' } },
		} );

		expect( lastSearchResultsProps.aiStatus ).toBe( 'streaming' );
		expect( lastSearchResultsProps.aiText ).toBe( 'Brief answer.' );
		expect( typeof lastSearchResultsProps.onShowMoreAiAnswer ).toBe( 'undefined' );
	} );

	it( 'sets onShowMoreAiAnswer to a function when brief answer is done', () => {
		renderAndTriggerQuery( 'reset my password' );
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: { state: 'completed', message: { parts: [] } },
			},
		} );

		expect( typeof lastSearchResultsProps.onShowMoreAiAnswer ).toBe( 'function' );
	} );

	it( 'sets onShowMoreAiAnswer to null (extended mode) after Show More is clicked', () => {
		renderAndTriggerQuery( 'reset my password' );
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: { state: 'completed', message: { parts: [] } },
			},
		} );
		act( () => lastSearchResultsProps.onShowMoreAiAnswer() );

		expect( lastSearchResultsProps.onShowMoreAiAnswer ).toBeNull();
	} );

	it( 'shows brief text while extended answer is loading', () => {
		renderAndTriggerQuery( 'reset my password' );
		fireMessage( {
			method: 'message/delta',
			params: { delta: { deltaType: 'content', content: 'Brief text.' } },
		} );
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: { state: 'completed', message: { parts: [] } },
			},
		} );
		act( () => lastSearchResultsProps.onShowMoreAiAnswer() );

		// Extended request just started — status should be 'streaming' (converted from 'loading')
		// and text should still be the brief text.
		expect( lastSearchResultsProps.aiStatus ).toBe( 'streaming' );
		expect( lastSearchResultsProps.aiText ).toBe( 'Brief text.' );
	} );

	it( 'combines brief and extended text once extended starts streaming', () => {
		renderAndTriggerQuery( 'reset my password' );
		fireMessage( {
			method: 'message/delta',
			params: { delta: { deltaType: 'content', content: 'Brief.' } },
		} );
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: { state: 'completed', message: { parts: [] } },
			},
		} );
		act( () => lastSearchResultsProps.onShowMoreAiAnswer() );

		// Simulate extended token arriving.
		fireMessage( {
			method: 'message/delta',
			params: { delta: { deltaType: 'content', content: ' Extended.' } },
		} );

		expect( lastSearchResultsProps.aiText ).toBe( 'Brief.\n\n Extended.' );
	} );

	it( 'uses extended citations when extended answer is done', () => {
		renderAndTriggerQuery( 'reset my password' );
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: { state: 'completed', message: { parts: [] } },
			},
		} );
		act( () => lastSearchResultsProps.onShowMoreAiAnswer() );

		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: {
					state: 'completed',
					message: {
						parts: [
							{
								type: 'data',
								data: {
									sources: [ { title: 'Extended source', url: 'https://example.com' } ],
								},
							},
						],
					},
				},
			},
		} );

		expect( lastSearchResultsProps.aiCitations[ 0 ].title ).toBe( 'Extended source' );
	} );
} );

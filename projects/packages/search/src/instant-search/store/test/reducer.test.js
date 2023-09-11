/**
 * @jest-environment jsdom
 */

import { SERVER_OBJECT_NAME } from '../../lib/constants';
import {
	clearFilters,
	clearQueryValues,
	makeSearchRequest,
	recordSuccessfulSearchRequest,
	recordFailedSearchRequest,
	setSearchQuery,
	setSort,
	setFilter,
	setStaticFilter,
	initializeQueryValues,
} from '../actions';
import {
	filters,
	staticFilters,
	hasError,
	isHistoryNavigation,
	isLoading,
	response,
	searchQuery,
	sort,
} from '../reducer';

describe( 'hasError Reducer', () => {
	test( 'defaults to false', () => {
		const state = hasError( undefined, {} );
		expect( state ).toBe( false );
	} );
	test( 'becomes true when a failed search request is recorded', () => {
		const state = hasError( undefined, recordFailedSearchRequest( new Error( 'Some error' ) ) );
		expect( state ).toBe( true );
	} );
	test( 'becomes false when a new search request is made', () => {
		const state = hasError( true, makeSearchRequest( {} ) );
		expect( state ).toBe( false );
	} );
	test( 'becomes false when a successful search request is recorded', () => {
		const state = hasError( true, recordSuccessfulSearchRequest( {} ) );
		expect( state ).toBe( false );
	} );
} );

describe( 'isLoading Reducer', () => {
	test( 'defaults to false', () => {
		const state = isLoading( undefined, {} );
		expect( state ).toBe( false );
	} );
	test( 'becomes true when a new search request is made', () => {
		const state = isLoading( undefined, makeSearchRequest( {} ) );
		expect( state ).toBe( true );
	} );
	test( 'becomes false when a failed search request is recorded', () => {
		const state = isLoading( true, recordFailedSearchRequest( new Error( 'Some error' ) ) );
		expect( state ).toBe( false );
	} );
	test( 'becomes false when a successful search request is recorded', () => {
		const state = isLoading( true, recordSuccessfulSearchRequest( {} ) );
		expect( state ).toBe( false );
	} );
} );

describe( 'response Reducer', () => {
	const actionOptions = { pageHandle: 'someString' };
	const actionResponse = {
		total: 1,
		aggregations: { taxonomy_0: { buckets: [] } },
		results: [ { id: 1, result_type: 'post' } ],
	};
	test( 'defaults to an empty object', () => {
		const state = response( undefined, {} );
		expect( state ).toEqual( {} );
	} );
	test( 'is set to the response value when a successful search request is recorded', () => {
		const state = response(
			undefined,
			recordSuccessfulSearchRequest( {
				options: actionOptions,
				response: actionResponse,
			} )
		);
		expect( state ).toEqual( actionResponse );
	} );
	test( 'appends aggregations and results to previous paginated results', () => {
		const state = response(
			{
				total: 1,
				aggregations: { taxonomy_1: { buckets: [] } },
				results: [ { id: 2, result_type: 'page' } ],
			},
			recordSuccessfulSearchRequest( {
				options: actionOptions,
				response: actionResponse,
			} )
		);
		expect( state ).toEqual( {
			total: 2,
			aggregations: { taxonomy_1: { buckets: [] }, taxonomy_0: { buckets: [] } },
			results: [
				{ id: 2, result_type: 'page' },
				{ id: 1, result_type: 'post' },
			],
		} );
	} );
	test( 'returns the correct total value for paginated results', () => {
		// Response with an expected total and results value.
		expect(
			response(
				{
					total: 1,
					aggregations: { taxonomy_1: { buckets: [] } },
					results: [ { id: 2, result_type: 'page' } ],
				},
				recordSuccessfulSearchRequest( { options: actionOptions, response: actionResponse } )
			)
		).toEqual( {
			total: 2,
			aggregations: { taxonomy_1: { buckets: [] }, taxonomy_0: { buckets: [] } },
			results: [
				{ id: 2, result_type: 'page' },
				{ id: 1, result_type: 'post' },
			],
		} );

		// An empty response.
		const emptyResponse = { total: 0, aggregations: {}, results: [] };
		expect(
			response(
				{
					total: 1,
					aggregations: { taxonomy_1: { buckets: [] } },
					results: [ { id: 2, result_type: 'page' } ],
				},
				recordSuccessfulSearchRequest( { options: actionOptions, response: emptyResponse } )
			)
		).toEqual( {
			total: 1,
			aggregations: { taxonomy_1: { buckets: [] } },
			results: [ { id: 2, result_type: 'page' } ],
		} );

		// A response with total value bigger than stored total value.
		const biggerResponse = {
			total: 3,
			aggregations: {},
			results: [
				{ id: 1, result_type: 'page' },
				{ id: 3, result_type: 'page' },
			],
		};
		expect(
			response(
				{
					total: 1,
					aggregations: { taxonomy_1: { buckets: [] } },
					results: [ { id: 2, result_type: 'page' } ],
				},
				recordSuccessfulSearchRequest( { options: actionOptions, response: biggerResponse } )
			)
		).toEqual( {
			total: 3,
			aggregations: { taxonomy_1: { buckets: [] } },
			results: [
				{ id: 2, result_type: 'page' },
				{ id: 1, result_type: 'page' },
				{ id: 3, result_type: 'page' },
			],
		} );
	} );
	test( 'ignores responses older than the current response', () => {
		const initialState = {
			requestId: 1,
			aggregations: { taxonomy_1: { buckets: [] } },
			results: [ { id: 2, result_type: 'page' } ],
		};
		const state = response(
			initialState,
			recordSuccessfulSearchRequest( {
				options: actionOptions,
				response: { ...actionResponse, requestId: 0 },
			} )
		);
		expect( state ).toEqual( initialState );
	} );
	test( 'returns cached aggregations when no search results are available', () => {
		let state = response(
			undefined,
			recordSuccessfulSearchRequest( {
				options: { pageHandle: false },
				response: {
					requestId: 2,
					aggregations: { taxonomy_1: { buckets: [ { key: 'weekly/weekly', doc_count: 1 } ] } },
					results: [ { id: 1, result_type: 'post' } ],
				},
			} )
		);
		state = response(
			state,
			recordSuccessfulSearchRequest( {
				options: { pageHandle: false },
				response: { requestId: 3, aggregations: {}, results: [] },
			} )
		);
		expect( state ).toEqual( {
			requestId: 3,
			aggregations: { taxonomy_1: { buckets: [ { key: 'weekly/weekly', doc_count: 0 } ] } },
			results: [],
		} );
	} );
} );

describe( 'searchQuery Reducer', () => {
	test( 'defaults to null', () => {
		const state = searchQuery( undefined, {} );
		expect( state ).toBeNull();
	} );
	test( 'is updated by a set search query action', () => {
		const state = searchQuery( undefined, setSearchQuery( 'Some new query' ) );
		expect( state ).toBe( 'Some new query' );
	} );
	test( 'is set to null by a clear query values action', () => {
		const state = searchQuery( undefined, clearQueryValues() );
		expect( state ).toBeNull();
	} );
} );

describe( 'sort Reducer', () => {
	test( 'defaults to null', () => {
		const state = sort( undefined, {} );
		expect( state ).toBeNull();
	} );
	test( 'is updated by a set search query action', () => {
		const state = sort( undefined, setSort( 'newest' ) );
		expect( state ).toBe( 'newest' );
	} );
	test( 'is set to null by a clear query values action', () => {
		expect( sort( undefined, clearQueryValues() ) ).toBeNull();
		expect( sort( 'newest', clearQueryValues() ) ).toBeNull();
	} );
} );

describe( 'filters Reducer', () => {
	test( 'defaults to an empty object', () => {
		const state = filters( undefined, {} );
		expect( state ).toEqual( {} );
	} );
	test( 'is updated by a set filter action with an arrayed value', () => {
		const state = filters( undefined, setFilter( 'post_types', [ 'post', 'page' ] ) );
		expect( state ).toEqual( {
			post_types: [ 'post', 'page' ],
		} );
	} );
	test( 'is updated by a set filter action with a string value', () => {
		const state = filters( undefined, setFilter( 'post_types', 'post' ) );
		expect( state ).toEqual( {
			post_types: [ 'post' ],
		} );
	} );
	test( 'ignores set filter actions with invalid filter names', () => {
		const state = filters( undefined, setFilter( 'apple', [ 'tart' ] ) );
		expect( state ).toEqual( {} );
	} );
	test( 'ignores set filter actions with unexpected value types', () => {
		expect( filters( undefined, setFilter( 'post_types', 1 ) ) ).toEqual( {} );
		expect( filters( undefined, setFilter( 'post_types', {} ) ) ).toEqual( {} );
	} );
	test( 'is reset by a clear filters action', () => {
		const state = filters( { post_types: [ 'post' ] }, clearFilters() );
		expect( state ).toEqual( {} );
	} );
	test( 'is reset by a clear query values action', () => {
		const state = filters( { post_types: [ 'post' ] }, clearQueryValues() );
		expect( state ).toEqual( {} );
	} );
} );

describe( 'staticFilters Reducer', () => {
	test( 'defaults to empty object', () => {
		const state = staticFilters( undefined, {} );
		expect( state ).toEqual( {} );
	} );

	test( 'is set to empty object by a clear query values action', () => {
		expect( staticFilters( undefined, clearQueryValues() ) ).toEqual( {} );
		expect( staticFilters( 'newest', clearQueryValues() ) ).toEqual( {} );
	} );

	test( 'is updated by a set filter action with a string value', () => {
		const mockStaticFilters = [
			{
				filter_id: 'group_id',
				name: 'example',
				selected: null,
				type: 'group',
				values: [
					{ name: 'All P2', value: 'p2' },
					{ name: 'Lighthouse', value: 'lighthouse' },
				],
			},
		];
		const windowSpy = jest.spyOn( window, 'window', 'get' );
		windowSpy.mockImplementation( () => ( {
			[ SERVER_OBJECT_NAME ]: { staticFilters: mockStaticFilters },
		} ) );
		const state = staticFilters( undefined, setStaticFilter( 'group_id', 'p2' ) );
		expect( state ).toEqual( {
			group_id: 'p2',
		} );
		windowSpy.mockRestore();
	} );
	test( 'ignores set filter actions with invalid filter names', () => {
		const mockStaticFilters = [
			{
				filter_id: 'group_id',
				name: 'example',
				selected: null,
				type: 'group',
				values: [
					{ name: 'All P2', value: 'p2' },
					{ name: 'Lighthouse', value: 'lighthouse' },
				],
			},
		];
		const windowSpy = jest.spyOn( window, 'window', 'get' );
		windowSpy.mockImplementation( () => ( {
			[ SERVER_OBJECT_NAME ]: { staticFilters: mockStaticFilters },
		} ) );
		const state = staticFilters( undefined, setStaticFilter( 'what', 'how' ) );
		expect( state ).toEqual( {} );
		windowSpy.mockRestore();
	} );
} );

describe( 'isHistoryNavigation Reducer', () => {
	test( 'defaults to false', () => {
		expect( isHistoryNavigation( undefined, {} ) ).toBe( false );
	} );

	test( 'is updated by initializing query values action', () => {
		expect(
			isHistoryNavigation( undefined, initializeQueryValues( { isHistoryNavigation: false } ) )
		).toBe( false );
		expect(
			isHistoryNavigation( undefined, initializeQueryValues( { isHistoryNavigation: true } ) )
		).toBe( true );
	} );

	test( 'is set to false when a query value update propagates to the window', () => {
		expect( isHistoryNavigation( undefined, setSearchQuery( 'Some new query' ) ) ).toBe( false );
		expect( isHistoryNavigation( undefined, setSort( 'newest' ) ) ).toBe( false );
		expect( isHistoryNavigation( undefined, clearFilters() ) ).toBe( false );
		expect( isHistoryNavigation( undefined, setFilter( 'post_types', [ 'post', 'page' ] ) ) ).toBe(
			false
		);
	} );

	test( 'ignores query value updates not propagating to the window', () => {
		expect( isHistoryNavigation( undefined, setSearchQuery( 'Some new query', false ) ) ).toBe(
			false
		);
		expect( isHistoryNavigation( undefined, setSort( 'newest', false ) ) ).toBe( false );
		expect( isHistoryNavigation( undefined, clearFilters( false ) ) ).toBe( false );
		expect(
			isHistoryNavigation( undefined, setFilter( 'post_types', [ 'post', 'page' ], false ) )
		).toBe( false );
	} );
} );

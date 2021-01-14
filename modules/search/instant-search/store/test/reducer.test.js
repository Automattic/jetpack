/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import {
	clearFilters,
	makeSearchRequest,
	recordSuccessfulSearchRequest,
	recordFailedSearchRequest,
	setSearchQuery,
	setSort,
	setFilter,
} from '../actions';
import { filters, hasError, isLoading, response, searchQuery, sort } from '../reducer';

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
				aggregations: { taxonomy_1: { buckets: [] } },
				results: [ { id: 2, result_type: 'page' } ],
			},
			recordSuccessfulSearchRequest( {
				options: actionOptions,
				response: actionResponse,
			} )
		);
		expect( state ).toEqual( {
			aggregations: { taxonomy_1: { buckets: [] }, taxonomy_0: { buckets: [] } },
			results: [
				{ id: 2, result_type: 'page' },
				{ id: 1, result_type: 'post' },
			],
		} );
	} );
} );

describe( 'searchQuery Reducer', () => {
	test( 'defaults to an empty string', () => {
		const state = searchQuery( undefined, {} );
		expect( state ).toBe( '' );
	} );
	test( 'is updated by a set search query action', () => {
		const state = searchQuery( undefined, setSearchQuery( 'Some new query' ) );
		expect( state ).toBe( 'Some new query' );
	} );
} );

describe( 'sort Reducer', () => {
	test( 'defaults to "relevance"', () => {
		const state = sort( undefined, {} );
		expect( state ).toBe( 'relevance' );
	} );
	test( 'is updated by a set search query action', () => {
		const state = sort( undefined, setSort( 'newest' ) );
		expect( state ).toBe( 'newest' );
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
} );

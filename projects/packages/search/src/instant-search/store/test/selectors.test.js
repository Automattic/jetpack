/**
 * @jest-environment jsdom
 */

import { RELEVANCE_SORT_KEY } from '../../lib/constants';
import { getSort, getWidgetOutsideOverlay, hasActiveQuery } from '../selectors';

describe( 'getSort', () => {
	test( 'defaults to "relevance" if state value is not a string', () => {
		expect( getSort( {} ) ).toEqual( RELEVANCE_SORT_KEY );
		expect( getSort( { sort: 1 } ) ).toEqual( RELEVANCE_SORT_KEY );
		expect( getSort( { sort: null } ) ).toEqual( RELEVANCE_SORT_KEY );
		expect( getSort( { sort: {} } ) ).toEqual( RELEVANCE_SORT_KEY );
	} );
	test( 'if specified, defaults to a specified defaultSort when the state value is not a string', () => {
		expect( getSort( {}, 'abc' ) ).toBe( 'abc' );
		expect( getSort( { sort: 1 }, 'abc' ) ).toBe( 'abc' );
		expect( getSort( { sort: null }, 'abc' ) ).toBe( 'abc' );
		expect( getSort( { sort: {} }, 'abc' ) ).toBe( 'abc' );
	} );
	test( 'if a non-string defaultSort value is specified, defaults to "relevance" instead', () => {
		expect( getSort( {}, {} ) ).toBe( 'relevance' );
		expect( getSort( {}, 1 ) ).toBe( 'relevance' );
		expect( getSort( {}, null ) ).toBe( 'relevance' );
		expect( getSort( {}, true ) ).toBe( 'relevance' );
		expect( getSort( {}, undefined ) ).toBe( 'relevance' );
	} );
	test( 'returns the state value if it is a string', () => {
		expect( getSort( { sort: 'some string' } ) ).toBe( 'some string' );
		expect( getSort( { sort: 'relevance' } ) ).toBe( 'relevance' );
	} );
} );

describe( 'hasActiveQuery', () => {
	test( 'returns false if reducers are at their initial values', () => {
		expect(
			hasActiveQuery( { searchQuery: null, filters: {}, staticFilters: {}, sort: null } )
		).toBe( false );
	} );
	test( 'returns true if there is a defined search query', () => {
		expect(
			hasActiveQuery( { searchQuery: '', filters: {}, staticFilters: {}, sort: null } )
		).toBe( true );
		expect(
			hasActiveQuery( { searchQuery: 'hello', filters: {}, staticFilters: {}, sort: null } )
		).toBe( true );
		expect(
			hasActiveQuery( { searchQuery: null, filters: {}, staticFilters: {}, sort: null } )
		).toBe( false );
	} );
	test( 'returns true if there are defined filters', () => {
		expect(
			hasActiveQuery( {
				searchQuery: null,
				filters: { post_types: [ 'post', 'page' ] },
				sort: null,
			} )
		).toBe( true );
		expect(
			hasActiveQuery( { searchQuery: null, filters: {}, staticFilters: {}, sort: null } )
		).toBe( false );
	} );
	test( 'returns false if there is a defined sort value only', () => {
		expect(
			hasActiveQuery( { searchQuery: null, filters: {}, staticFilters: {}, sort: 'relevance' } )
		).toBe( false );
		expect(
			hasActiveQuery( { searchQuery: null, filters: {}, staticFilters: {}, sort: null } )
		).toBe( false );
	} );
} );

describe( 'getWidgetOutsideOverlay', () => {
	test( 'defaults to an object with an empty array for the filters value for a clean state', () => {
		expect( getWidgetOutsideOverlay( { filters: {}, serverOptions: { widgets: [] } } ) ).toEqual( {
			filters: [],
		} );
	} );

	test( 'extracts filters that could not have been selected via overlay widgets', () => {
		const state = {
			filters: {
				category: [ '1', '2' ],
				post_types: [ 'post', 'page' ],
				month_post_date: [ '2019-08-01 00:00:00' ],
				year_post_modified_gmt: [ '2019-01-01 00:00:00' ],
			},
			serverOptions: {
				widgets: [ { filters: [ { type: 'taxonomy', taxonomy: 'category' } ] } ],
			},
		};
		// Category filter is excluded since it's also available in state.serverOptions.widgets.
		expect( getWidgetOutsideOverlay( state ) ).toEqual( {
			filters: [
				{ type: 'post_type' },
				{
					field: 'post_date',
					interval: 'month',
					type: 'date_histogram',
				},
				{
					field: 'post_modified_gmt',
					interval: 'year',
					type: 'date_histogram',
				},
			],
		} );
	} );
} );

/**
 * @jest-environment jsdom
 */
/* global expect */

/**
 * Internal dependencies
 */
import { getWidgetOutsideOverlay } from '../selectors';

describe( 'getWidgetOutsideOverlay', () => {
	test( 'defaults to an empty object for a clean state', () => {
		const state = { serverOptions: {} };
		expect( getWidgetOutsideOverlay( state ) ).toEqual( {} );
	} );

	test( 'defaults to an empty object when either widget configurations are falsy', () => {
		expect(
			getWidgetOutsideOverlay( {
				serverOptions: {
					widgets: [],
					widgetsOutsideOverlay: null,
				},
			} )
		).toEqual( {} );
		expect(
			getWidgetOutsideOverlay( {
				serverOptions: {
					widgets: undefined,
					widgetsOutsideOverlay: [],
				},
			} )
		).toEqual( {} );
	} );

	test( 'extracts filter keys from widgets outside the overlay', () => {
		const state = {
			filters: { category: [ '1', '2' ], post_types: [ 'post', 'page' ] },
			serverOptions: {
				widgets: [ { filters: [ { type: 'taxonomy', taxonomy: 'category' } ] } ],
				widgetsOutsideOverlay: [
					{ filters: [ { type: 'taxonomy', taxonomy: 'category' } ] },
					{ filters: [ { type: 'date_histogram', field: 'post_date', interval: 'year' } ] },
					{ filters: [ { type: 'post_type' } ] },
				],
			},
		};
		// Category filter is excluded since it's also available in state.serverOptions.widgets.
		// Year post-date filter is excluded since it's not one of the selected filters in state.filters.
		expect( getWidgetOutsideOverlay( state ) ).toEqual( {
			filters: [ { type: 'post_type' } ],
		} );
	} );
} );

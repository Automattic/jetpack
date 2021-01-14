/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import { getWidgetOutsideOverlay } from '../selectors';

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

/**
 * @jest-environment jsdom
 */
/* global expect */
/**
 * Internal dependencies
 */
import { getFilterKeys, getSelectableFilterKeys, getUnselectableFilterKeys } from '../filters';

describe( 'getFilterKeys', () => {
	const DEFAULT_KEYS = [
		'post_types',
		'month_post_date',
		'month_post_date_gmt',
		'month_post_modified',
		'month_post_modified_gmt',
		'year_post_date',
		'year_post_date_gmt',
		'year_post_modified',
		'year_post_modified_gmt',
	];
	test( 'defaults to a fixed array when parameters are null-ish', () => {
		expect( getFilterKeys( null, undefined ) ).toEqual( DEFAULT_KEYS );
	} );

	test( 'includes taxonomies from widget configurations', () => {
		const widgets = [
			{ filters: [ { type: 'taxonomy', taxonomy: 'category' } ] },
			{ filters: [ { type: 'date_histogram', field: 'post_date', interval: 'year' } ] },
			{ filters: [ { type: 'post_type' } ] },
		];
		const widgetsOutsideOverlay = [ { filters: [ { type: 'taxonomy', taxonomy: 'post_tag' } ] } ];
		expect( getFilterKeys( widgets, widgetsOutsideOverlay ) ).toEqual( [
			'post_types',
			'month_post_date',
			'month_post_date_gmt',
			'month_post_modified',
			'month_post_modified_gmt',
			'year_post_date',
			'year_post_date_gmt',
			'year_post_modified',
			'year_post_modified_gmt',
			'category',
			'post_tag',
		] );
	} );
} );

describe( 'getSelectableFilterKeys', () => {
	test( 'defaults to an empty array on nullish inputs', () => {
		expect( getSelectableFilterKeys( null ) ).toEqual( [] );
		expect( getSelectableFilterKeys( undefined ) ).toEqual( [] );
	} );
	test( 'extracts filter keys from widgets inside the search overlay sidebar', () => {
		const widgets = [
			{ filters: [ { type: 'taxonomy', taxonomy: 'category' } ] },
			{ filters: [ { type: 'date_histogram', field: 'post_date', interval: 'year' } ] },
			{ filters: [ { type: 'post_type' } ] },
		];
		expect( getSelectableFilterKeys( widgets ) ).toEqual( [
			'category',
			'year_post_date',
			'post_types',
		] );
	} );
} );

describe( 'getUnselectableFilterKeys', () => {
	test( 'defaults to an empty array on nullish inputs', () => {
		expect( getUnselectableFilterKeys( null ) ).toEqual( [] );
		expect( getUnselectableFilterKeys( undefined ) ).toEqual( [] );
	} );
	test( 'extracts filter keys from widgets outside the search overlay sidebar', () => {
		const widgets = [];
		const widgetsOutsideOverlay = [ { filters: [ { type: 'taxonomy', taxonomy: 'post_tag' } ] } ];
		expect( getUnselectableFilterKeys( widgets, widgetsOutsideOverlay ) ).toEqual( [ 'post_tag' ] );
	} );
	test( 'excludes filter keys included in widgets inside the search overlay sidebar', () => {
		const widgets = [
			{ filters: [ { type: 'taxonomy', taxonomy: 'post_tag' } ] },
			{ filters: [ { type: 'date_histogram', field: 'post_date', interval: 'year' } ] },
			{ filters: [ { type: 'post_type' } ] },
		];
		const widgetsOutsideOverlay = [
			{
				filters: [
					{ type: 'taxonomy', taxonomy: 'category' },
					{ type: 'taxonomy', taxonomy: 'post_tag' },
				],
			},
		];
		expect( getUnselectableFilterKeys( widgets, widgetsOutsideOverlay ) ).toEqual( [ 'category' ] );
	} );
} );

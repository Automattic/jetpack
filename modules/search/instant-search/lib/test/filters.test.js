/**
 * @jest-environment jsdom
 */
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

	test( 'includes taxonomies from widget configurations without duplicates', () => {
		const widgets = [
			{ filters: [ { type: 'taxonomy', taxonomy: 'category' } ] },
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
	test( 'defaults to getFilterKeys() value on nullish inputs', () => {
		expect( getUnselectableFilterKeys( null ) ).toEqual( getFilterKeys( null, null ) );
		expect( getUnselectableFilterKeys( undefined ) ).toEqual( getFilterKeys( null, null ) );
	} );
	test( 'defaults to getFilterKeys() value on empty inputs', () => {
		const widgets = [];
		expect( getUnselectableFilterKeys( widgets ) ).toEqual( getFilterKeys( null, null ) );
	} );
	test( 'excludes filter keys included by widgets inside the search overlay sidebar', () => {
		const widgets = [
			{ filters: [ { type: 'taxonomy', taxonomy: 'post_tag' } ] },
			{ filters: [ { type: 'date_histogram', field: 'post_date', interval: 'year' } ] },
			{ filters: [ { type: 'post_type' } ] },
		];
		expect( getUnselectableFilterKeys( widgets ) ).toEqual( [
			'month_post_date',
			'month_post_date_gmt',
			'month_post_modified',
			'month_post_modified_gmt',
			'year_post_date_gmt',
			'year_post_modified',
			'year_post_modified_gmt',
		] );
	} );
} );

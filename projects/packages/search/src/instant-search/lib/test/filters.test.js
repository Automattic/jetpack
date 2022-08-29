/**
 * @jest-environment jsdom
 */
import {
	FILTER_KEYS,
	getFilterKeys,
	getSelectableFilterKeys,
	getUnselectableFilterKeys,
	mapFilterKeyToFilter,
} from '../filters';

describe( 'getFilterKeys', () => {
	test( 'defaults to a fixed array when parameters are null-ish', () => {
		expect( getFilterKeys( null, undefined ) ).toEqual( FILTER_KEYS );
	} );

	test( 'includes taxonomies from widget configurations without duplicates', () => {
		const widgets = [
			{ filters: [ { type: 'taxonomy', taxonomy: 'category' } ] },
			{ filters: [ { type: 'taxonomy', taxonomy: 'subject' } ] },
			{ filters: [ { type: 'taxonomy', taxonomy: 'category' } ] },
			{ filters: [ { type: 'taxonomy', taxonomy: 'subject' } ] },
			{ filters: [ { type: 'date_histogram', field: 'post_date', interval: 'year' } ] },
			{ filters: [ { type: 'post_type' } ] },
			{ filters: [ { type: 'author' } ] },
		];
		const widgetsOutsideOverlay = [ { filters: [ { type: 'taxonomy', taxonomy: 'post_tag' } ] } ];
		expect( getFilterKeys( widgets, widgetsOutsideOverlay ) ).toEqual( [
			'authors',
			'post_types',
			'category',
			'post_format',
			'post_tag',
			'month_post_date',
			'month_post_date_gmt',
			'month_post_modified',
			'month_post_modified_gmt',
			'year_post_date',
			'year_post_date_gmt',
			'year_post_modified',
			'year_post_modified_gmt',
			'subject',
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
			{ filters: [ { type: 'author' } ] },
		];
		expect( getSelectableFilterKeys( widgets ) ).toEqual( [
			'category',
			'year_post_date',
			'post_types',
			'authors',
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
			{ filters: [ { type: 'author' } ] },
		];
		expect( getUnselectableFilterKeys( widgets ) ).toEqual( [
			'category',
			'post_format',
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

describe( 'mapFilterKeyToFilter', () => {
	test( 'handles month-related filter keys', () => {
		expect( mapFilterKeyToFilter( 'month_post_date' ) ).toEqual( {
			field: 'post_date',
			type: 'date_histogram',
			interval: 'month',
		} );
		expect( mapFilterKeyToFilter( 'month_post_date_gmt' ) ).toEqual( {
			field: 'post_date_gmt',
			type: 'date_histogram',
			interval: 'month',
		} );
		expect( mapFilterKeyToFilter( 'month_post_modified' ) ).toEqual( {
			field: 'post_modified',
			type: 'date_histogram',
			interval: 'month',
		} );
		expect( mapFilterKeyToFilter( 'month_post_modified_gmt' ) ).toEqual( {
			field: 'post_modified_gmt',
			type: 'date_histogram',
			interval: 'month',
		} );
	} );
	test( 'handles year-related filter keys', () => {
		expect( mapFilterKeyToFilter( 'year_post_date' ) ).toEqual( {
			field: 'post_date',
			type: 'date_histogram',
			interval: 'year',
		} );
		expect( mapFilterKeyToFilter( 'year_post_date_gmt' ) ).toEqual( {
			field: 'post_date_gmt',
			type: 'date_histogram',
			interval: 'year',
		} );
		expect( mapFilterKeyToFilter( 'year_post_modified' ) ).toEqual( {
			field: 'post_modified',
			type: 'date_histogram',
			interval: 'year',
		} );
		expect( mapFilterKeyToFilter( 'year_post_modified_gmt' ) ).toEqual( {
			field: 'post_modified_gmt',
			type: 'date_histogram',
			interval: 'year',
		} );
	} );
	test( 'handles post types filter key', () => {
		expect( mapFilterKeyToFilter( 'post_types' ) ).toEqual( {
			type: 'post_type',
		} );
	} );
	test( 'handles author filter key', () => {
		expect( mapFilterKeyToFilter( 'authors' ) ).toEqual( {
			type: 'author',
		} );
	} );
	test( 'handles taxonomies-related filter keys', () => {
		expect( mapFilterKeyToFilter( 'page' ) ).toEqual( {
			type: 'taxonomy',
			taxonomy: 'page',
		} );
		expect( mapFilterKeyToFilter( 'post' ) ).toEqual( {
			type: 'taxonomy',
			taxonomy: 'post',
		} );
		expect( mapFilterKeyToFilter( 'arcade_reviews' ) ).toEqual( {
			type: 'taxonomy',
			taxonomy: 'arcade_reviews',
		} );
	} );
} );

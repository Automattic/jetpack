import { SERVER_OBJECT_NAME } from '../constants';
import {
	FILTER_KEYS,
	getAvailableStaticFilters,
	getFilterKeys,
	getSelectableFilterKeys,
	getStaticFilterKeys,
	getUnselectableFilterKeys,
	mapFilterKeyToFilter,
} from '../filters';

describe( 'getFilterKeys', () => {
	test( 'defaults to a fixed array when parameters are null-ish', () => {
		expect( getFilterKeys( null, undefined ) ).toEqual( FILTER_KEYS );
	} );

	test( 'does not crash when the localized widgets value is malformed', () => {
		try {
			window[ SERVER_OBJECT_NAME ] = { widgets: {}, widgetsOutsideOverlay: 'nope' };
			expect( getFilterKeys() ).toEqual( FILTER_KEYS );
		} finally {
			delete window[ SERVER_OBJECT_NAME ];
		}
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
			{ filters: [ { type: 'blog_id' } ] },
		];
		const widgetsOutsideOverlay = [ { filters: [ { type: 'taxonomy', taxonomy: 'post_tag' } ] } ];
		expect( getFilterKeys( widgets, widgetsOutsideOverlay ) ).toEqual( [
			'blog_ids',
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

	test( 'includes product attributes from widget configurations without duplicates', () => {
		const widgets = [
			{ filters: [ { type: 'product_attribute', attribute: 'pa_color' } ] },
			{ filters: [ { type: 'product_attribute', attribute: 'pa_size' } ] },
			{ filters: [ { type: 'product_attribute', attribute: 'pa_color' } ] },
		];
		expect( getFilterKeys( widgets, [] ) ).toEqual( [
			'blog_ids',
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
			'pa_color',
			'pa_size',
		] );
	} );
} );

describe( 'getSelectableFilterKeys', () => {
	test( 'defaults to an empty array on nullish inputs', () => {
		expect( getSelectableFilterKeys( null ) ).toEqual( [] );
		expect( getSelectableFilterKeys( undefined ) ).toEqual( [] );
	} );

	test( 'does not crash when the localized widgets value is malformed', () => {
		try {
			window[ SERVER_OBJECT_NAME ] = { widgets: 'nope' };
			expect( getSelectableFilterKeys() ).toEqual( [] );
		} finally {
			delete window[ SERVER_OBJECT_NAME ];
		}
	} );
	test( 'extracts filter keys from widgets inside the search overlay sidebar', () => {
		const widgets = [
			{ filters: [ { type: 'taxonomy', taxonomy: 'category' } ] },
			{ filters: [ { type: 'date_histogram', field: 'post_date', interval: 'year' } ] },
			{ filters: [ { type: 'post_type' } ] },
			{ filters: [ { type: 'author' } ] },
			{ filters: [ { type: 'blog_id' } ] },
		];
		expect( getSelectableFilterKeys( widgets ) ).toEqual( [
			'category',
			'year_post_date',
			'post_types',
			'authors',
			'blog_ids',
		] );
	} );
} );

describe( 'getUnselectableFilterKeys', () => {
	test( 'defaults to getFilterKeys() value on nullish inputs', () => {
		expect( getUnselectableFilterKeys( null ) ).toEqual( getFilterKeys( null, null ) );
		expect( getUnselectableFilterKeys( undefined ) ).toEqual( getFilterKeys( null, null ) );
	} );

	test( 'does not crash when the localized widgets value is malformed', () => {
		try {
			window[ SERVER_OBJECT_NAME ] = { widgets: {} };
			expect( getUnselectableFilterKeys() ).toEqual( FILTER_KEYS );
		} finally {
			delete window[ SERVER_OBJECT_NAME ];
		}
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
			{ filters: [ { type: 'blog_id' } ] },
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

describe( 'getAvailableStaticFilters', () => {
	test( 'returns an empty array when the localized value is missing', () => {
		expect( getAvailableStaticFilters() ).toEqual( [] );
	} );

	test( 'does not crash when the localized staticFilters value is a non-array', () => {
		try {
			window[ SERVER_OBJECT_NAME ] = { staticFilters: {} };
			expect( getAvailableStaticFilters() ).toEqual( [] );
			expect( getAvailableStaticFilters( 'sidebar' ) ).toEqual( [] );
		} finally {
			delete window[ SERVER_OBJECT_NAME ];
		}
	} );

	test( 'drops malformed entries instead of crashing on a variation lookup', () => {
		try {
			window[ SERVER_OBJECT_NAME ] = {
				staticFilters: [ null, { filter_id: 'group_id' } ],
			};
			expect( getAvailableStaticFilters( 'sidebar' ) ).toEqual( [ { filter_id: 'group_id' } ] );
		} finally {
			delete window[ SERVER_OBJECT_NAME ];
		}
	} );
} );

describe( 'getStaticFilterKeys', () => {
	test( 'does not crash when the localized staticFilters value is malformed', () => {
		try {
			window[ SERVER_OBJECT_NAME ] = { staticFilters: 'nope' };
			expect( getStaticFilterKeys() ).toEqual( [] );
		} finally {
			delete window[ SERVER_OBJECT_NAME ];
		}
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
	test( 'handles blog IDs filter key', () => {
		expect( mapFilterKeyToFilter( 'blog_ids' ) ).toEqual( {
			type: 'blog_id',
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
	test( 'handles product attribute filter keys', () => {
		expect( mapFilterKeyToFilter( 'pa_color' ) ).toEqual( {
			type: 'product_attribute',
			attribute: 'pa_color',
		} );
		expect( mapFilterKeyToFilter( 'pa_size' ) ).toEqual( {
			type: 'product_attribute',
			attribute: 'pa_size',
		} );
		expect( mapFilterKeyToFilter( 'pa_material' ) ).toEqual( {
			type: 'product_attribute',
			attribute: 'pa_material',
		} );
	} );
} );

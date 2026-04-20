import {
	buildSearchUrl,
	buildAggregations,
	buildFilters,
} from '../../../src/search-blocks/store/api';

const CATEGORY_CONFIG = {
	filterKey: 'category',
	esField: 'category.slug',
	aggType: 'terms',
	showCount: true,
	maxItems: 20,
	curatedValues: [],
};

const CURATED_COLOR_CONFIG = {
	filterKey: 'meta_color',
	esField: 'meta.color.value',
	aggType: 'filters',
	showCount: true,
	maxItems: 20,
	curatedValues: [ 'red', 'blue', 'green' ],
};

describe( 'buildSearchUrl', () => {
	it( 'builds public API URL for non-private sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'cats',
			activeFilters: {},
			filterConfigs: {},
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
		} );
		expect( url ).toContain( 'public-api.wordpress.com/rest/v1.3/sites/12345/search' );
		expect( url ).toContain( 'query=cats' );
	} );

	it( 'uses wpcom-origin URL for private WPcom sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: '',
			activeFilters: {},
			filterConfigs: {},
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: true,
			isWpcom: true,
			homeUrl: 'https://example.wordpress.com',
			apiRoot: 'https://example.wordpress.com/wp-json/',
		} );
		expect( url ).toContain( 'example.wordpress.com/wp-json/wpcom-origin/v1.3' );
	} );

	it( 'uses Atomic REST endpoint for private non-WPcom sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: '',
			activeFilters: {},
			filterConfigs: {},
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: true,
			isWpcom: false,
			apiRoot: 'https://mysite.com/wp-json/',
		} );
		expect( url ).toContain( 'mysite.com/wp-json/jetpack/v4/search' );
	} );
} );

describe( 'buildAggregations', () => {
	it( 'produces a terms aggregation for dynamic (terms) filters', () => {
		const aggs = buildAggregations( { category: CATEGORY_CONFIG } );
		expect( aggs.category ).toEqual( {
			terms: { field: 'category.slug', size: 20 },
		} );
	} );

	it( 'produces a filters aggregation for curated filters', () => {
		const aggs = buildAggregations( { meta_color: CURATED_COLOR_CONFIG } );
		expect( aggs.meta_color.filters.filters.red ).toEqual( {
			term: { 'meta.color.value': 'red' },
		} );
		expect( Object.keys( aggs.meta_color.filters.filters ) ).toEqual( [ 'red', 'blue', 'green' ] );
	} );

	it( 'skips filters with showCount=false', () => {
		const aggs = buildAggregations( {
			category: { ...CATEGORY_CONFIG, showCount: false },
		} );
		expect( aggs ).toEqual( {} );
	} );
} );

describe( 'buildFilters', () => {
	it( 'builds an ES terms filter from active selections', () => {
		const filter = buildFilters( { category: [ 'news', 'tech' ] }, { category: CATEGORY_CONFIG } );
		expect( filter ).toEqual( {
			bool: { must: [ { terms: { 'category.slug': [ 'news', 'tech' ] } } ] },
		} );
	} );

	it( 'returns undefined when no filters are active', () => {
		const filter = buildFilters( {}, { category: CATEGORY_CONFIG } );
		expect( filter ).toBeUndefined();
	} );

	it( 'skips unknown filter keys (no config)', () => {
		const filter = buildFilters( { unknown_key: [ 'val' ] }, {} );
		expect( filter ).toBeUndefined();
	} );
} );

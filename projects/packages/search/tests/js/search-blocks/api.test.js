import {
	SEARCH_FIELDS,
	buildAggregations,
	buildFilterClause,
	buildSearchUrl,
	resolveFilterFields,
} from '../../../src/search-blocks/store/api';

describe( 'SEARCH_FIELDS', () => {
	it( 'does not request author fields for result cards', () => {
		expect( SEARCH_FIELDS ).not.toContain( 'author.name' );
		expect( SEARCH_FIELDS ).not.toContain( 'author' );
	} );
} );

describe( 'buildSearchUrl', () => {
	it( 'builds public API URL for non-private sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'cats',
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
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: true,
			isWpcom: false,
			apiRoot: 'https://mysite.com/wp-json/',
		} );
		expect( url ).toContain( 'mysite.com/wp-json/jetpack/v4/search' );
	} );

	it( 'maps sortOrder=newest to date_desc and passes through pageHandle', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'boots',
			sortOrder: 'newest',
			pageHandle: 'abc123',
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
		} );
		expect( url ).toContain( 'sort=date_desc' );
		expect( url ).toContain( 'page_handle=abc123' );
	} );

	it( 'maps sortOrder=oldest to date_asc', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'boots',
			sortOrder: 'oldest',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
		} );
		expect( url ).toContain( 'sort=date_asc' );
	} );

	it( 'single-encodes special characters in the search query', () => {
		// `qss.encode` already runs encodeURIComponent, so the string we pass
		// in must be raw. Double-encoding would turn `&` into `%2526` and
		// send the API a search for the literal `%26` instead of a space-
		// separated query.
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'cats & dogs',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
		} );
		expect( url ).toContain( 'query=cats%20%26%20dogs' );
		expect( url ).not.toContain( '%2520' );
		expect( url ).not.toContain( '%2526' );
	} );

	it( 'falls back to score_default for unknown sort values', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'boots',
			sortOrder: 'bogus',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
		} );
		expect( url ).toContain( 'sort=score_default' );
	} );

	it( 'includes aggregations + filter clause when filters are configured and active', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'boots',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
			filterConfigs: {
				category: { filterType: 'taxonomy', taxonomy: 'category', maxItems: 10 },
				post_types: { filterType: 'post_type', maxItems: 5 },
			},
			activeFilters: { category: [ 'news' ] },
		} );
		// Aggregations (flattened to q-flat shape + URL-encoded).
		expect( url ).toContain(
			'aggregations%5Bcategory%5D%5Bterms%5D%5Bfield%5D=category.slug_slash_name'
		);
		expect( url ).toContain( 'aggregations%5Bcategory%5D%5Bterms%5D%5Bsize%5D=10' );
		expect( url ).toContain( 'aggregations%5Bpost_types%5D%5Bterms%5D%5Bfield%5D=post_type' );
		// Filter clause: single `news` selection becomes a single term clause.
		expect( url ).toContain(
			'filter%5Bbool%5D%5Bmust%5D%5B0%5D%5Bterm%5D%5Bcategory.slug%5D=news'
		);
	} );

	it( 'flattens per-filter bucketSortOrder into the aggregation URL params', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'boots',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
			filterConfigs: {
				category: {
					filterType: 'taxonomy',
					taxonomy: 'category',
					maxItems: 10,
					bucketSortOrder: 'count',
				},
				authors: { filterType: 'author', maxItems: 5, bucketSortOrder: 'alpha' },
			},
		} );
		// Default `count` → _count=desc.
		expect( url ).toContain( 'aggregations%5Bcategory%5D%5Bterms%5D%5Border%5D%5B_count%5D=desc' );
		// `alpha` → _key=asc on the per-filter agg.
		expect( url ).toContain( 'aggregations%5Bauthors%5D%5Bterms%5D%5Border%5D%5B_key%5D=asc' );
	} );

	it( 'omits aggregations and filter when no configs or selections are supplied', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'boots',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
		} );
		expect( url ).not.toContain( 'aggregations' );
		expect( url ).not.toContain( 'filter%5B' );
	} );
} );

describe( 'resolveFilterFields', () => {
	it( 'maps built-in category filter to the correct ES fields', () => {
		expect( resolveFilterFields( { filterType: 'taxonomy', taxonomy: 'category' } ) ).toEqual( {
			aggField: 'category.slug_slash_name',
			filterField: 'category.slug',
			bucketFormat: 'slash',
		} );
	} );

	it( 'maps built-in post_tag filter to the correct ES fields', () => {
		expect( resolveFilterFields( { filterType: 'taxonomy', taxonomy: 'post_tag' } ) ).toEqual( {
			aggField: 'tag.slug_slash_name',
			filterField: 'tag.slug',
			bucketFormat: 'slash',
		} );
	} );

	it( 'routes custom taxonomies through the generic taxonomy.<slug> fields', () => {
		expect( resolveFilterFields( { filterType: 'taxonomy', taxonomy: 'genre' } ) ).toEqual( {
			aggField: 'taxonomy.genre.slug_slash_name',
			filterField: 'taxonomy.genre.slug',
			bucketFormat: 'slash',
		} );
	} );

	it( 'uses plain `post_type` field for post type filters (no slug_slash_name)', () => {
		expect( resolveFilterFields( { filterType: 'post_type' } ) ).toEqual( {
			aggField: 'post_type',
			filterField: 'post_type',
			bucketFormat: 'plain',
		} );
	} );

	it( 'maps author filter to author_login_slash_name / author_login', () => {
		expect( resolveFilterFields( { filterType: 'author' } ) ).toEqual( {
			aggField: 'author_login_slash_name',
			filterField: 'author_login',
			bucketFormat: 'slash',
		} );
	} );

	it( 'returns nulls for unknown or incomplete configs', () => {
		expect( resolveFilterFields( null ) ).toEqual( {
			aggField: null,
			filterField: null,
			bucketFormat: 'plain',
		} );
		expect( resolveFilterFields( { filterType: 'taxonomy', taxonomy: '' } ) ).toEqual( {
			aggField: null,
			filterField: null,
			bucketFormat: 'slash',
		} );
	} );
} );

describe( 'buildAggregations', () => {
	it( 'builds a `terms` aggregation per registered filter', () => {
		const aggs = buildAggregations( {
			category: { filterType: 'taxonomy', taxonomy: 'category', maxItems: 7 },
			authors: { filterType: 'author', maxItems: 5 },
		} );
		expect( aggs ).toEqual( {
			category: {
				terms: {
					field: 'category.slug_slash_name',
					size: 7,
					order: { _count: 'desc' },
				},
			},
			authors: {
				terms: {
					field: 'author_login_slash_name',
					size: 5,
					order: { _count: 'desc' },
				},
			},
		} );
	} );

	it( 'defaults maxItems to 10 when omitted', () => {
		const aggs = buildAggregations( {
			category: { filterType: 'taxonomy', taxonomy: 'category' },
		} );
		expect( aggs.category.terms.size ).toBe( 10 );
	} );

	it( 'skips configs whose field mapping is unknown', () => {
		const aggs = buildAggregations( {
			bogus: { filterType: 'taxonomy', taxonomy: '' },
		} );
		expect( aggs ).toEqual( {} );
	} );

	it( 'uses `_count: desc` order by default (instant-search parity)', () => {
		const aggs = buildAggregations( {
			category: { filterType: 'taxonomy', taxonomy: 'category' },
		} );
		expect( aggs.category.terms.order ).toEqual( { _count: 'desc' } );
	} );

	it( 'maps bucketSortOrder=alpha to `_key: asc`', () => {
		const aggs = buildAggregations( {
			category: { filterType: 'taxonomy', taxonomy: 'category', bucketSortOrder: 'alpha' },
		} );
		expect( aggs.category.terms.order ).toEqual( { _key: 'asc' } );
	} );

	it( 'falls back to `_count: desc` for unknown bucketSortOrder values', () => {
		const aggs = buildAggregations( {
			category: { filterType: 'taxonomy', taxonomy: 'category', bucketSortOrder: 'bogus' },
		} );
		expect( aggs.category.terms.order ).toEqual( { _count: 'desc' } );
	} );
} );

describe( 'buildFilterClause', () => {
	it( 'emits a single `term` clause for one-value selections', () => {
		const clause = buildFilterClause(
			{ category: [ 'news' ] },
			{ category: { filterType: 'taxonomy', taxonomy: 'category' } }
		);
		expect( clause ).toEqual( {
			bool: { must: [ { term: { 'category.slug': 'news' } } ] },
		} );
	} );

	it( 'wraps multi-value selections in bool.should (OR within a filter)', () => {
		const clause = buildFilterClause(
			{ post_types: [ 'post', 'page' ] },
			{ post_types: { filterType: 'post_type' } }
		);
		expect( clause ).toEqual( {
			bool: {
				must: [
					{
						bool: {
							should: [ { term: { post_type: 'post' } }, { term: { post_type: 'page' } } ],
						},
					},
				],
			},
		} );
	} );

	it( 'ANDs different filters together at the top level', () => {
		const clause = buildFilterClause(
			{ category: [ 'news' ], post_types: [ 'post' ] },
			{
				category: { filterType: 'taxonomy', taxonomy: 'category' },
				post_types: { filterType: 'post_type' },
			}
		);
		expect( clause.bool.must ).toHaveLength( 2 );
	} );

	it( 'drops selections with no matching config', () => {
		const clause = buildFilterClause( { mystery: [ 'x' ] }, {} );
		expect( clause ).toBeUndefined();
	} );

	it( 'returns undefined when no selections are active', () => {
		expect( buildFilterClause( {}, {} ) ).toBeUndefined();
	} );
} );

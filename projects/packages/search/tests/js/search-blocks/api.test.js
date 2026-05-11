import {
	SEARCH_FIELDS,
	WC_RATING_RANGES,
	buildAggregations,
	buildFilterClause,
	buildSearchUrl,
	buildStaticPostTypeClauses,
	formatDateBucketLabel,
	resolveFilterFields,
} from '../../../src/search-blocks/store/api';

describe( 'SEARCH_FIELDS', () => {
	it( 'does not request author fields for result cards', () => {
		expect( SEARCH_FIELDS ).not.toContain( 'author.name' );
		expect( SEARCH_FIELDS ).not.toContain( 'author' );
	} );

	it( 'requests WooCommerce price and rating fields for the product layout', () => {
		expect( SEARCH_FIELDS ).toEqual(
			expect.arrayContaining( [
				'wc.formatted_price',
				'wc.formatted_regular_price',
				'wc.formatted_sale_price',
				'meta._wc_average_rating.double',
				'meta._wc_review_count.long',
			] )
		);
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

	it.each( [ 'rating_desc', 'price_asc', 'price_desc' ] )(
		'passes the product-format sort key %s through to the API verbatim (RSM-1082)',
		key => {
			// Mirrors instant-search/lib/api.js → mapSortToApiValue: the v1.3
			// API accepts these three keys unchanged. Without the pass-through
			// they'd hit the SORT_QUERY_MAP fallback and silently sort by
			// relevance, leaving deep links broken on WC sites.
			const url = buildSearchUrl( {
				siteId: 12345,
				searchQuery: 'shirt',
				sortOrder: key,
				pageHandle: null,
				isPrivateSite: false,
				isWpcom: false,
				apiRoot: 'https://example.com/wp-json/',
			} );
			expect( url ).toContain( 'sort=' + key );
			expect( url ).not.toContain( 'sort=score_default' );
		}
	);

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

	it( 'rewrites a mapped custom taxonomy onto the slot in both aggregations and the filter clause', () => {
		// End-to-end pin: a filter-checkbox block authored against `genre`
		// with a slot mapping must both aggregate against the slot field
		// and emit a term clause against the slot field. The filterKey
		// stays user-facing (`genre`), so URL params, response keys, and
		// the in-store `activeFilters` shape are all untouched — the
		// translation is a pure field-path concern.
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'paperback',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
			filterConfigs: {
				genre: { filterType: 'taxonomy', taxonomy: 'genre', maxItems: 10 },
			},
			activeFilters: { genre: [ 'fiction' ] },
			customTaxonomyMap: { genre: 'jetpack-search-tag1' },
		} );
		const decoded = decodeURIComponent( url );
		// Aggregation key stays user-facing, but the field path swaps.
		expect( decoded ).toContain(
			'aggregations[genre][terms][field]=taxonomy.jetpack-search-tag1.slug_slash_name'
		);
		// Filter clause similarly targets the slot field rather than `taxonomy.genre.*`.
		expect( decoded ).toContain(
			'filter[bool][must][0][term][taxonomy.jetpack-search-tag1.slug]=fiction'
		);
		// And we never leak the slot into the user-facing surfaces.
		expect( decoded ).not.toContain( 'aggregations[jetpack-search-tag1]' );
		expect( decoded ).not.toContain( 'taxonomy.genre.slug_slash_name' );
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

	it( 'rewrites a mapped custom taxonomy onto the reserved jetpack-search-tagN slot', () => {
		// `jetpack_search_custom_taxonomy_map` is the supported escape
		// hatch for taxonomies that aren't natively indexed by Jetpack
		// Search: the site stores their term data under one of the
		// `jetpack-search-tagN` slot taxonomies and declares the mapping
		// from the user-facing slug. The aggregation/filter requests must
		// rewrite the inner ES field path onto the slot, while the
		// aggregation KEY (and therefore `state.aggregations[ filterKey ]`)
		// stays user-facing so no response-side normalization is needed.
		expect(
			resolveFilterFields(
				{ filterType: 'taxonomy', taxonomy: 'genre' },
				{ genre: 'jetpack-search-tag1' }
			)
		).toEqual( {
			aggField: 'taxonomy.jetpack-search-tag1.slug_slash_name',
			filterField: 'taxonomy.jetpack-search-tag1.slug',
			bucketFormat: 'slash',
		} );
	} );

	it( 'falls through to the generic taxonomy fields when the map has no entry for the slug', () => {
		// Mixed map: `mood` is mapped but `genre` is not. The unmapped
		// slug must still resolve via the natural `taxonomy.<slug>.*`
		// path so a site that mixes natively-indexed taxonomies with
		// slot-mapped ones doesn't accidentally lose the former.
		expect(
			resolveFilterFields(
				{ filterType: 'taxonomy', taxonomy: 'genre' },
				{ mood: 'jetpack-search-tag2' }
			)
		).toEqual( {
			aggField: 'taxonomy.genre.slug_slash_name',
			filterField: 'taxonomy.genre.slug',
			bucketFormat: 'slash',
		} );
	} );

	it( 'leaves built-in category / post_tag fields untouched even when a map is present', () => {
		// Built-ins have their own dedicated variations and never appear
		// in the Custom Taxonomy picker, but pin the behavior anyway so
		// a malicious or accidental map entry can't redirect built-in
		// filters into a slot.
		expect(
			resolveFilterFields(
				{ filterType: 'taxonomy', taxonomy: 'category' },
				{ category: 'jetpack-search-tag1' }
			)
		).toEqual( {
			aggField: 'category.slug_slash_name',
			filterField: 'category.slug',
			bucketFormat: 'slash',
		} );
	} );

	it.each( [ 'product_cat', 'product_tag', 'product_brand' ] )(
		'leaves the WC built-in %s on its canonical field even when the map tries to redirect it',
		taxonomy => {
			// Same defensive guard as the category / post_tag case above —
			// the WC product taxonomies have their own dedicated filter
			// variations, so a saved-block deep link or a stray map entry
			// must not silently redirect them onto a reserved slot.
			expect(
				resolveFilterFields(
					{ filterType: 'taxonomy', taxonomy },
					{ [ taxonomy ]: 'jetpack-search-tag5' }
				)
			).toEqual( {
				aggField: `taxonomy.${ taxonomy }.slug_slash_name`,
				filterField: `taxonomy.${ taxonomy }.slug`,
				bucketFormat: 'slash',
			} );
		}
	);

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

	it( 'maps date filters to the WPCOM-whitelisted `date` field with bucketFormat=date', () => {
		expect( resolveFilterFields( { filterType: 'date', interval: 'year' } ) ).toEqual( {
			aggField: 'date',
			filterField: 'date',
			bucketFormat: 'date',
		} );
		expect( resolveFilterFields( { filterType: 'date', interval: 'month' } ) ).toEqual( {
			aggField: 'date',
			filterField: 'date',
			bucketFormat: 'date',
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

	it( 'emits a date_histogram (not a terms agg) for date filters', () => {
		const aggs = buildAggregations( {
			post_date: {
				filterType: 'date',
				interval: 'year',
				bucketSortOrder: 'newest',
			},
		} );
		expect( aggs.post_date ).toEqual( {
			date_histogram: {
				field: 'date',
				calendar_interval: 'year',
				format: 'yyyy',
				min_doc_count: 1,
				order: { _key: 'desc' },
			},
		} );
		expect( aggs.post_date.terms ).toBeUndefined();
	} );

	it( 'requests a yyyy-MM format for month-interval date filters', () => {
		const aggs = buildAggregations( {
			post_date: {
				filterType: 'date',
				interval: 'month',
			},
		} );
		expect( aggs.post_date.date_histogram.calendar_interval ).toBe( 'month' );
		expect( aggs.post_date.date_histogram.format ).toBe( 'yyyy-MM' );
	} );

	it( 'maps date bucketSortOrder values to ES order clauses', () => {
		const cases = [
			[ 'newest', { _key: 'desc' } ],
			[ 'oldest', { _key: 'asc' } ],
			[ 'count', { _count: 'desc' } ],
			[ 'bogus', { _key: 'desc' } ],
		];
		for ( const [ input, expected ] of cases ) {
			const aggs = buildAggregations( {
				post_date: {
					filterType: 'date',
					interval: 'year',
					bucketSortOrder: input,
				},
			} );
			expect( aggs.post_date.date_histogram.order ).toEqual( expected );
		}
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

	it( 'emits a half-open `range` clause for a single year selection', () => {
		const clause = buildFilterClause(
			{ post_date: [ '2024' ] },
			{ post_date: { filterType: 'date', interval: 'year' } }
		);
		expect( clause ).toEqual( {
			bool: {
				must: [
					{
						range: {
							date: { gte: '2024-01-01', lt: '2025-01-01' },
						},
					},
				],
			},
		} );
	} );

	it( 'rolls month boundaries forward across year wrap', () => {
		const clause = buildFilterClause(
			{ post_date: [ '2024-12' ] },
			{ post_date: { filterType: 'date', interval: 'month' } }
		);
		expect( clause.bool.must[ 0 ] ).toEqual( {
			range: {
				date: { gte: '2024-12-01', lt: '2025-01-01' },
			},
		} );
	} );

	it( 'wraps multi-value date selections in bool.should (OR within a date filter)', () => {
		const clause = buildFilterClause(
			{ post_date: [ '2024', '2023' ] },
			{ post_date: { filterType: 'date', interval: 'year' } }
		);
		expect( clause ).toEqual( {
			bool: {
				must: [
					{
						bool: {
							should: [
								{ range: { date: { gte: '2024-01-01', lt: '2025-01-01' } } },
								{ range: { date: { gte: '2023-01-01', lt: '2024-01-01' } } },
							],
						},
					},
				],
			},
		} );
	} );

	it( 'drops malformed date slugs rather than passing them through to ES', () => {
		const clause = buildFilterClause(
			{ post_date: [ 'banana' ] },
			{ post_date: { filterType: 'date', interval: 'year' } }
		);
		expect( clause ).toBeUndefined();
	} );

	it( 'keeps valid date selections when one of several values is malformed', () => {
		const clause = buildFilterClause(
			{ post_date: [ 'banana', '2024' ] },
			{ post_date: { filterType: 'date', interval: 'year' } }
		);
		expect( clause ).toEqual( {
			bool: {
				must: [ { range: { date: { gte: '2024-01-01', lt: '2025-01-01' } } } ],
			},
		} );
	} );
} );

describe( 'formatDateBucketLabel', () => {
	it( 'returns year buckets verbatim — no locale chrome added', () => {
		expect( formatDateBucketLabel( '2024', 'year' ) ).toBe( '2024' );
		expect( formatDateBucketLabel( '1999', 'year', 'fr-FR' ) ).toBe( '1999' );
	} );

	it( 'formats month buckets with a localized full-month + year', () => {
		// Intl.DateTimeFormat output varies by ICU version — match a substring.
		const enUS = formatDateBucketLabel( '2024-03', 'month', 'en-US' );
		expect( enUS ).toMatch( /^March 2024$|^March of 2024$/ );

		const frFR = formatDateBucketLabel( '2024-03', 'month', 'fr-FR' );
		expect( frFR ).toContain( '2024' );
		expect( frFR.toLowerCase() ).toContain( 'mars' );
	} );

	it( 'falls back to the raw value for malformed slugs', () => {
		expect( formatDateBucketLabel( '', 'month' ) ).toBe( '' );
		expect( formatDateBucketLabel( 'not-a-date', 'month' ) ).toBe( 'not-a-date' );
		expect( formatDateBucketLabel( '2024-13', 'month' ) ).toBe( '2024-13' );
	} );

	it( 'tolerates an invalid locale by returning the raw value', () => {
		expect( formatDateBucketLabel( '2024-03', 'month', 'definitely-not-a-locale' ) ).toMatch(
			/2024/
		);
	} );
} );

describe( 'product-shaped filter helpers', () => {
	describe( 'resolveFilterFields', () => {
		it( 'maps wc_stock_status to the product_visibility taxonomy slug', () => {
			// `_stock_status` postmeta isn't carried by the WPCOM-side ES
			// indexer (sync sends it, the indexer drops it). The
			// `outofstock` term on `product_visibility` IS carried, so
			// stock-status filters route through that taxonomy instead.
			expect( resolveFilterFields( { filterType: 'wc_stock_status' } ) ).toEqual( {
				aggField: 'taxonomy.product_visibility.slug',
				filterField: 'taxonomy.product_visibility.slug',
				bucketFormat: 'plain',
			} );
		} );

		it( 'maps wc_rating to the average-rating numeric field', () => {
			expect( resolveFilterFields( { filterType: 'wc_rating' } ) ).toEqual( {
				aggField: 'meta._wc_average_rating.double',
				filterField: 'meta._wc_average_rating.double',
				bucketFormat: 'plain',
			} );
		} );
	} );

	describe( 'buildAggregations', () => {
		it( 'probes only the outofstock bucket on product_visibility for wc_stock_status', () => {
			// The taxonomy carries other unrelated terms (`featured`,
			// `rated-N`, `exclude-from-catalog`); `include` keeps them out
			// of the response so the read side only has to look at one
			// bucket. `size: 1` matches the include cardinality.
			const aggs = buildAggregations( {
				filter_stock_status: { filterType: 'wc_stock_status', maxItems: 10 },
			} );
			expect( aggs.filter_stock_status ).toEqual( {
				terms: {
					field: 'taxonomy.product_visibility.slug',
					include: [ 'outofstock' ],
					size: 1,
				},
			} );
		} );

		it( 'emits a histogram (not terms) for wc_rating because range aggs are not whitelisted', () => {
			const aggs = buildAggregations( { rating_filter: { filterType: 'wc_rating' } } );
			expect( aggs.rating_filter ).toEqual( {
				histogram: {
					field: 'meta._wc_average_rating.double',
					interval: 1,
					offset: 0.5,
					min_doc_count: 0,
				},
			} );
		} );
	} );

	describe( 'buildFilterClause: wc_rating threshold branch', () => {
		it( 'emits a single `gte` range clause for the picked star (no upper bound)', () => {
			const clause = buildFilterClause(
				{ rating_filter: [ '4' ] },
				{ rating_filter: { filterType: 'wc_rating' } }
			);
			expect( clause ).toEqual( {
				bool: {
					must: [ { range: { 'meta._wc_average_rating.double': { gte: 3.5 } } } ],
				},
			} );
		} );

		it( 'all star thresholds are single-bound (gte only) — no `lt` cap', () => {
			for ( const r of WC_RATING_RANGES ) {
				expect( r.to ).toBeUndefined();
				expect( typeof r.from ).toBe( 'number' );
			}
		} );

		it( 'tolerates a stale multi-value URL by OR-ing the thresholds', () => {
			// Block UI is single-select, but a deep link from the prior
			// exact-bucket era could still carry two values. OR-ing them
			// collapses to the lowest threshold under "& up" semantics —
			// harmless and avoids breaking old bookmarks.
			const clause = buildFilterClause(
				{ rating_filter: [ '3', '5' ] },
				{ rating_filter: { filterType: 'wc_rating' } }
			);
			expect( clause ).toEqual( {
				bool: {
					must: [
						{
							bool: {
								should: [
									{ range: { 'meta._wc_average_rating.double': { gte: 2.5 } } },
									{ range: { 'meta._wc_average_rating.double': { gte: 4.5 } } },
								],
							},
						},
					],
				},
			} );
		} );

		it( 'drops unknown star values', () => {
			const clause = buildFilterClause(
				{ rating_filter: [ '99' ] },
				{ rating_filter: { filterType: 'wc_rating' } }
			);
			expect( clause ).toBeUndefined();
		} );
	} );

	describe( 'buildFilterClause: wc_stock_status routes through product_visibility', () => {
		const config = { filter_stock_status: { filterType: 'wc_stock_status' } };
		const term = { term: { 'taxonomy.product_visibility.slug': 'outofstock' } };

		it( 'emits a positive term clause when only outofstock is selected', () => {
			expect( buildFilterClause( { filter_stock_status: [ 'outofstock' ] }, config ) ).toEqual( {
				bool: { must: [ term ] },
			} );
		} );

		it( 'emits a must_not clause when only instock is selected (taxonomy has no positive in-stock term)', () => {
			expect( buildFilterClause( { filter_stock_status: [ 'instock' ] }, config ) ).toEqual( {
				bool: { must: [ { bool: { must_not: [ term ] } } ] },
			} );
		} );

		it( 'drops the clause when both options are selected — they would otherwise contradict and zero the result set', () => {
			expect(
				buildFilterClause( { filter_stock_status: [ 'instock', 'outofstock' ] }, config )
			).toBeUndefined();
		} );

		it( 'ignores unknown stock-status slugs', () => {
			expect( buildFilterClause( { filter_stock_status: [ 'mystery' ] }, config ) ).toBeUndefined();
		} );
	} );

	describe( 'buildSearchUrl: priceRange', () => {
		const baseOpts = {
			siteId: 1,
			searchQuery: '',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: '',
		};

		it( 'omits price range when both bounds are null', () => {
			const url = buildSearchUrl( { ...baseOpts, priceRange: { min: null, max: null } } );
			expect( url ).not.toContain( 'wc.price' );
		} );

		it( 'emits a half-open `gte` range when only min is set', () => {
			const url = buildSearchUrl( { ...baseOpts, priceRange: { min: 10, max: null } } );
			const decoded = decodeURIComponent( url );
			expect( decoded ).toContain( 'filter[bool][must][0][range][wc.price][gte]=10' );
			expect( decoded ).not.toContain( '[lte]' );
		} );

		it( 'emits a closed range when both bounds are set', () => {
			const url = buildSearchUrl( { ...baseOpts, priceRange: { min: 10, max: 50 } } );
			const decoded = decodeURIComponent( url );
			expect( decoded ).toContain( 'filter[bool][must][0][range][wc.price][gte]=10' );
			expect( decoded ).toContain( 'filter[bool][must][0][range][wc.price][lte]=50' );
		} );

		it( 'appends price range alongside an existing filter clause without overwriting it', () => {
			const url = buildSearchUrl( {
				...baseOpts,
				activeFilters: { category: [ 'news' ] },
				filterConfigs: { category: { filterType: 'taxonomy', taxonomy: 'category' } },
				priceRange: { min: 10, max: null },
			} );
			const decoded = decodeURIComponent( url );
			expect( decoded ).toContain( 'filter[bool][must][0][term][category.slug]=news' );
			expect( decoded ).toContain( 'filter[bool][must][1][range][wc.price][gte]=10' );
		} );
	} );

	describe( 'buildStaticPostTypeClauses', () => {
		it( 'returns an empty array for null / empty input', () => {
			expect( buildStaticPostTypeClauses( null ) ).toEqual( [] );
			expect( buildStaticPostTypeClauses( {} ) ).toEqual( [] );
			expect( buildStaticPostTypeClauses( { include: [], exclude: [] } ) ).toEqual( [] );
		} );

		it( 'emits a bare `term` clause when include has a single slug', () => {
			expect( buildStaticPostTypeClauses( { include: [ 'post' ] } ) ).toEqual( [
				{ term: { post_type: 'post' } },
			] );
		} );

		it( 'wraps multi-slug includes in a `bool.should`', () => {
			expect( buildStaticPostTypeClauses( { include: [ 'post', 'page' ] } ) ).toEqual( [
				{
					bool: {
						should: [ { term: { post_type: 'post' } }, { term: { post_type: 'page' } } ],
					},
				},
			] );
		} );

		it( 'emits a `bool.must_not` for excludes regardless of length', () => {
			expect( buildStaticPostTypeClauses( { exclude: [ 'jetpack-portfolio' ] } ) ).toEqual( [
				{ bool: { must_not: [ { term: { post_type: 'jetpack-portfolio' } } ] } },
			] );
		} );

		it( 'treats a non-array include as empty and skips the clause', () => {
			// The defensive `Array.isArray` guard exists so a forward-compat
			// state-shape change can not crash the URL builder. Locking it
			// in via a test makes the contract explicit.
			expect( buildStaticPostTypeClauses( { include: 'post', exclude: [] } ) ).toEqual( [] );
			expect( buildStaticPostTypeClauses( { include: null, exclude: [ 'product' ] } ) ).toEqual( [
				{ bool: { must_not: [ { term: { post_type: 'product' } } ] } },
			] );
		} );

		it( 'treats a non-array exclude as empty and emits only the include clause', () => {
			expect( buildStaticPostTypeClauses( { include: [ 'post' ], exclude: 'page' } ) ).toEqual( [
				{ term: { post_type: 'post' } },
			] );
		} );

		it( 'concatenates include and exclude clauses when both are set', () => {
			expect(
				buildStaticPostTypeClauses( { include: [ 'post', 'page' ], exclude: [ 'product' ] } )
			).toEqual( [
				{
					bool: {
						should: [ { term: { post_type: 'post' } }, { term: { post_type: 'page' } } ],
					},
				},
				{ bool: { must_not: [ { term: { post_type: 'product' } } ] } },
			] );
		} );
	} );

	describe( 'buildSearchUrl: staticPostTypes', () => {
		const baseOpts = {
			siteId: 1,
			searchQuery: '',
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: '',
		};

		it( 'omits the static clause when both lists are empty', () => {
			const url = buildSearchUrl( {
				...baseOpts,
				staticPostTypes: { include: [], exclude: [] },
			} );
			// `post_type` also appears as a result field, so assert against
			// the filter clause specifically.
			expect( decodeURIComponent( url ) ).not.toContain( 'filter[bool][must]' );
		} );

		it( 'restricts results to the include set', () => {
			const url = buildSearchUrl( {
				...baseOpts,
				staticPostTypes: { include: [ 'post', 'page' ], exclude: [] },
			} );
			const decoded = decodeURIComponent( url );
			expect( decoded ).toContain( 'filter[bool][must][0][bool][should][0][term][post_type]=post' );
			expect( decoded ).toContain( 'filter[bool][must][0][bool][should][1][term][post_type]=page' );
		} );

		it( 'subtracts the exclude set via must_not', () => {
			const url = buildSearchUrl( {
				...baseOpts,
				staticPostTypes: { include: [], exclude: [ 'product' ] },
			} );
			const decoded = decodeURIComponent( url );
			expect( decoded ).toContain(
				'filter[bool][must][0][bool][must_not][0][term][post_type]=product'
			);
		} );

		it( 'composes alongside an existing filter clause without overwriting it', () => {
			const url = buildSearchUrl( {
				...baseOpts,
				activeFilters: { category: [ 'news' ] },
				filterConfigs: { category: { filterType: 'taxonomy', taxonomy: 'category' } },
				staticPostTypes: { include: [ 'post' ], exclude: [ 'product' ] },
			} );
			const decoded = decodeURIComponent( url );
			expect( decoded ).toContain( 'filter[bool][must][0][term][category.slug]=news' );
			expect( decoded ).toContain( 'filter[bool][must][1][term][post_type]=post' );
			expect( decoded ).toContain(
				'filter[bool][must][2][bool][must_not][0][term][post_type]=product'
			);
		} );
	} );
} );

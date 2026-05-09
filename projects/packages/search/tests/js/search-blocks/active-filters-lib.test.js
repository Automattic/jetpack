import {
	buildActivePills,
	formatPriceRangeChip,
	resolveBucketValueLabel,
	resolveProductValueLabel,
} from '../../../src/search-blocks/blocks/active-filters/lib';

describe( 'resolveBucketValueLabel', () => {
	it( 'returns the slash-suffix display name when a bucket matches the slug', () => {
		// Taxonomy / author aggregations use `slug_slash_name` keys — the
		// chip should read the user-friendly name, not the raw slug.
		const state = {
			aggregations: {
				category: { buckets: [ { key: 'news/News' } ] },
			},
		};
		expect( resolveBucketValueLabel( state, 'category', 'news' ) ).toBe( 'News' );
	} );

	it( 'returns plain bucket keys verbatim for slash-less aggregations', () => {
		const state = { aggregations: { post_types: { buckets: [ { key: 'post' } ] } } };
		expect( resolveBucketValueLabel( state, 'post_types', 'post' ) ).toBe( 'post' );
	} );

	it( 'falls back to the raw slug when no bucket matches', () => {
		// Bucket counts shift per query; a selected pill must not vanish
		// just because its value dropped out of the top-N agg buckets.
		const state = { aggregations: { category: { buckets: [ { key: 'updates/Updates' } ] } } };
		expect( resolveBucketValueLabel( state, 'category', 'news' ) ).toBe( 'news' );
	} );
} );

describe( 'resolveProductValueLabel', () => {
	const state = {
		wcStockStatusLabels: {
			instock: 'In stock',
			outofstock: 'Out of stock',
			onbackorder: 'On backorder',
		},
		strings: {
			ratingStarsTop: '5 stars',
			ratingStarsAndUpSingle: '%d star and up',
			ratingStarsAndUpPlural: '%d stars and up',
		},
	};

	it( 'maps wc_stock_status slugs to the seeded labels', () => {
		expect( resolveProductValueLabel( state, { filterType: 'wc_stock_status' }, 'instock' ) ).toBe(
			'In stock'
		);
		expect(
			resolveProductValueLabel( state, { filterType: 'wc_stock_status' }, 'outofstock' )
		).toBe( 'Out of stock' );
	} );

	it( 'falls back to the raw slug when wc_stock_status has no label entry', () => {
		// Defensive: if RSM-1932 ever ships a partial map (e.g. because WC
		// added a new status mid-version), the chip stays human-readable.
		expect( resolveProductValueLabel( state, { filterType: 'wc_stock_status' }, 'preorder' ) ).toBe(
			'preorder'
		);
	} );

	it( 'formats the 1-star wc_rating value via the singular "and up" template', () => {
		expect( resolveProductValueLabel( state, { filterType: 'wc_rating' }, '1' ) ).toBe(
			'1 star and up'
		);
	} );

	it( 'formats 2-4 wc_rating values via the plural "and up" template', () => {
		expect( resolveProductValueLabel( state, { filterType: 'wc_rating' }, '4' ) ).toBe(
			'4 stars and up'
		);
	} );

	it( 'formats the 5-star wc_rating value via the top template (no "and up" suffix)', () => {
		// The 5-star row matches `avg ≥ 4.5` — semantically "exactly 5
		// stars" since there is no higher rating — so the chip drops the
		// "and up" affordance to mirror filter-wc-rating's row aria-label.
		expect( resolveProductValueLabel( state, { filterType: 'wc_rating' }, '5' ) ).toBe( '5 stars' );
	} );

	it( 'falls back to the raw value for malformed wc_rating values', () => {
		// Out-of-range or non-numeric stars keep the chip rendered rather
		// than disappearing — same defensive pattern as the bucket fallback.
		expect( resolveProductValueLabel( state, { filterType: 'wc_rating' }, '7' ) ).toBe( '7' );
		expect( resolveProductValueLabel( state, { filterType: 'wc_rating' }, 'banana' ) ).toBe(
			'banana'
		);
	} );

	it( 'returns null for non-product, non-date filter types so the bucket resolver wins', () => {
		expect( resolveProductValueLabel( state, { filterType: 'taxonomy' }, 'news' ) ).toBeNull();
		expect( resolveProductValueLabel( state, { filterType: 'post_type' }, 'post' ) ).toBeNull();
		expect( resolveProductValueLabel( state, undefined, 'whatever' ) ).toBeNull();
	} );

	it( 'formats date filter year buckets via formatDateBucketLabel', () => {
		// Year interval — value is returned verbatim by formatDateBucketLabel.
		expect(
			resolveProductValueLabel(
				{ ...state, locale: 'en-US' },
				{ filterType: 'date', interval: 'year' },
				'2024'
			)
		).toBe( '2024' );
	} );

	it( 'formats date filter month buckets as a localized month string', () => {
		// Month interval — YYYY-MM is converted to a localized name.
		const label = resolveProductValueLabel(
			{ ...state, locale: 'en-US' },
			{ filterType: 'date', interval: 'month' },
			'2024-01'
		);
		// Intl.DateTimeFormat output is locale-dependent but should contain "January".
		expect( label ).toMatch( /January/i );
	} );
} );

describe( 'formatPriceRangeChip', () => {
	const state = {
		priceCurrencySymbol: '$',
		strings: {
			priceRangeFromTo: '%1$s – %2$s',
			priceRangeFrom: '%s+',
			priceRangeUpTo: 'Under %s',
		},
	};

	it( 'formats a closed range as "<min> – <max>" with the seeded symbol', () => {
		expect( formatPriceRangeChip( state, { min: 10, max: 50 } ) ).toBe( '$10 – $50' );
	} );

	it( 'formats a min-only range with the compact "<min>+" suffix', () => {
		expect( formatPriceRangeChip( state, { min: 10, max: null } ) ).toBe( '$10+' );
	} );

	it( 'formats a max-only range as "Under <max>"', () => {
		expect( formatPriceRangeChip( state, { min: null, max: 50 } ) ).toBe( 'Under $50' );
	} );

	it( 'returns the empty string when both bounds are null', () => {
		// Caller uses this to gate the chip — no bound, no chip.
		expect( formatPriceRangeChip( state, { min: null, max: null } ) ).toBe( '' );
	} );

	it( 'honors a non-default currency symbol seeded by the price block', () => {
		expect(
			formatPriceRangeChip( { ...state, priceCurrencySymbol: '€' }, { min: 5, max: 25 } )
		).toBe( '€5 – €25' );
	} );
} );

describe( 'buildActivePills', () => {
	const baseState = {
		strings: {
			removeFilter: 'Remove %s',
			ratingStarsTop: '5 stars',
			ratingStarsAndUpSingle: '%d star and up',
			ratingStarsAndUpPlural: '%d stars and up',
			priceRangeFromTo: '%1$s – %2$s',
			priceRangeFrom: '%s+',
			priceRangeUpTo: 'Under %s',
			priceLabel: 'Price',
		},
		wcStockStatusLabels: {
			instock: 'In stock',
			outofstock: 'Out of stock',
		},
		priceCurrencySymbol: '$',
	};

	it( 'builds one filter pill per selected value with the group label prefix', () => {
		const state = {
			...baseState,
			activeFilters: { category: [ 'news', 'updates' ] },
			filterConfigs: { category: { label: 'Category', filterType: 'taxonomy' } },
			aggregations: {
				category: { buckets: [ { key: 'news/News' }, { key: 'updates/Updates' } ] },
			},
		};
		const pills = buildActivePills( state );
		expect( pills ).toHaveLength( 2 );
		expect( pills[ 0 ] ).toMatchObject( {
			id: 'category:news',
			kind: 'filter',
			filterKey: 'category',
			value: 'news',
			label: 'Category: News',
			ariaLabel: 'Remove Category: News',
		} );
		expect( pills[ 1 ] ).toMatchObject( {
			id: 'category:updates',
			kind: 'filter',
			label: 'Category: Updates',
		} );
	} );

	it( 'resolves wc_stock_status pills via the seeded label map, not via aggregation buckets', () => {
		const state = {
			...baseState,
			activeFilters: { filter_stock_status: [ 'instock' ] },
			filterConfigs: {
				filter_stock_status: { label: 'Stock status', filterType: 'wc_stock_status' },
			},
			aggregations: {},
		};
		const pills = buildActivePills( state );
		expect( pills ).toHaveLength( 1 );
		expect( pills[ 0 ].label ).toBe( 'Stock status: In stock' );
	} );

	it( 'resolves wc_rating pills via the threshold "and up" templates, with 5★ as the literal exception', () => {
		const state = {
			...baseState,
			activeFilters: { rating_filter: [ '1', '4', '5' ] },
			filterConfigs: { rating_filter: { label: 'Rating', filterType: 'wc_rating' } },
			aggregations: {},
		};
		const pills = buildActivePills( state );
		expect( pills.map( p => p.label ) ).toEqual( [
			'Rating: 1 star and up',
			'Rating: 4 stars and up',
			'Rating: 5 stars',
		] );
	} );

	it( 'appends a single price-range pill at the end with kind "priceRange"', () => {
		// Even with two active filters, the price range gets one chip — not
		// two side-by-side min/max chips. Mirrors WC's own active-filter UI.
		const state = {
			...baseState,
			activeFilters: { category: [ 'news' ] },
			filterConfigs: { category: { label: 'Category', filterType: 'taxonomy' } },
			aggregations: { category: { buckets: [ { key: 'news/News' } ] } },
			priceRange: { min: 10, max: 50 },
		};
		const pills = buildActivePills( state );
		expect( pills ).toHaveLength( 2 );
		expect( pills[ 1 ] ).toMatchObject( {
			id: 'priceRange:10:50',
			kind: 'priceRange',
			label: 'Price: $10 – $50',
			ariaLabel: 'Remove Price: $10 – $50',
		} );
	} );

	it( 'omits the price chip when both bounds are null', () => {
		const state = {
			...baseState,
			activeFilters: {},
			filterConfigs: {},
			aggregations: {},
			priceRange: { min: null, max: null },
		};
		expect( buildActivePills( state ) ).toEqual( [] );
	} );

	it( 'returns an empty list when no facet is active', () => {
		expect(
			buildActivePills( {
				...baseState,
				activeFilters: {},
				filterConfigs: {},
				aggregations: {},
				priceRange: null,
			} )
		).toEqual( [] );
	} );
} );

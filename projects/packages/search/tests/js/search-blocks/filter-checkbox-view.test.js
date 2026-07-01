// `@wordpress/interactivity` is an externalized dep — mock virtually so the
// view.js file can be required and its getters / actions captured.
const captured = {
	state: {},
	actions: {},
	callbacks: {},
};
const contextRef = { current: { filterKey: '' } };

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: ( _namespace, config ) => {
			if ( config ) {
				const descriptors = Object.getOwnPropertyDescriptors( config.state || {} );
				for ( const key of Object.keys( descriptors ) ) {
					const descriptor = descriptors[ key ];
					if ( typeof descriptor.get === 'function' ) {
						Object.defineProperty( captured.state, key, descriptor );
					} else {
						captured.state[ key ] = descriptor.value;
					}
				}
				Object.assign( captured.actions, config.actions || {} );
				Object.assign( captured.callbacks, config.callbacks || {} );
			}
			return { state: captured.state, actions: captured.actions };
		},
		getContext: () => contextRef.current,
		withSyncEvent: cb => cb,
	} ),
	{ virtual: true }
);

const { mergeRetainedFilterOptions } = require( '../../../src/search-blocks/store' );

describe( 'filter-checkbox view store — filterItems', () => {
	beforeEach( () => {
		captured.state.activeFilters = {};
		captured.state.aggregations = {};
		captured.state.retainedFilterOptions = {};
		captured.state.filterConfigs = {};
		captured.state.locale = 'en-US';
		contextRef.current = { filterKey: '' };
	} );

	it( 'pulls labels from filterConfig.valueLabels when bucket keys are bare slugs', () => {
		contextRef.current = { filterKey: 'post_types' };
		captured.state.aggregations = {
			post_types: {
				buckets: [
					{ key: 'post', doc_count: 12 },
					{ key: 'page', doc_count: 4 },
				],
			},
		};
		captured.state.filterConfigs = {
			post_types: {
				showCount: true,
				bucketSortOrder: 'count',
				valueLabels: { post: 'Post', page: 'Page' },
			},
		};
		expect( captured.state.filterItems ).toEqual( [
			{
				value: 'post',
				label: 'Post',
				showCount: true,
				countLabel: '12',
				count: 12,
				checked: false,
			},
			{ value: 'page', label: 'Page', showCount: true, countLabel: '4', count: 4, checked: false },
		] );
	} );

	it( 'post-slash-splits slug_slash_name bucket keys for taxonomy / author', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.aggregations = {
			category: {
				buckets: [
					{ key: 'news/News', doc_count: 7 },
					{ key: 'reviews/Reviews', doc_count: 3 },
				],
			},
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {} },
		};
		const labels = captured.state.filterItems.map( i => i.label );
		expect( labels ).toEqual( [ 'News', 'Reviews' ] );
	} );

	it( 'keeps selected buckets in the list and marks them checked', () => {
		// Selected buckets stay visible so the checkbox itself is the toggle
		// affordance — the active-filters chip row is a complementary view,
		// not the only place to remove a selection.
		contextRef.current = { filterKey: 'category' };
		captured.state.activeFilters = { category: [ 'news' ] };
		captured.state.aggregations = {
			category: {
				buckets: [
					{ key: 'news/News', doc_count: 7 },
					{ key: 'reviews/Reviews', doc_count: 3 },
				],
			},
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {} },
		};
		expect(
			captured.state.filterItems.map( i => ( { value: i.value, checked: i.checked } ) )
		).toEqual( [
			{ value: 'news', checked: true },
			{ value: 'reviews', checked: false },
		] );
	} );

	it( 'preserves the API order when bucketSortOrder is `count`', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.aggregations = {
			category: {
				buckets: [
					{ key: 'restaurant-reviews/Restaurant Reviews', doc_count: 9 },
					{ key: 'food-news/Food News', doc_count: 5 },
					{ key: 'apple-pie/Apple Pie', doc_count: 1 },
				],
			},
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {} },
		};
		expect( captured.state.filterItems.map( i => i.label ) ).toEqual( [
			'Restaurant Reviews',
			'Food News',
			'Apple Pie',
		] );
	} );

	it( 'resorts by display label when bucketSortOrder is `alpha`', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.aggregations = {
			category: {
				buckets: [
					{ key: 'food-news/Restaurant Reviews', doc_count: 9 },
					{ key: 'apple-pie/Apple Pie', doc_count: 1 },
					{ key: 'zebra-archive/Zebra Archive', doc_count: 5 },
				],
			},
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'alpha', valueLabels: {} },
		};
		expect( captured.state.filterItems.map( i => i.label ) ).toEqual( [
			'Apple Pie',
			'Restaurant Reviews',
			'Zebra Archive',
		] );
	} );

	it( 'sorts post-type items by valueLabels-derived label, not by slug', () => {
		contextRef.current = { filterKey: 'post_types' };
		captured.state.aggregations = {
			post_types: {
				buckets: [
					{ key: 'post', doc_count: 12 },
					{ key: 'attachment', doc_count: 8 },
					{ key: 'page', doc_count: 4 },
				],
			},
		};
		captured.state.filterConfigs = {
			post_types: {
				showCount: true,
				bucketSortOrder: 'alpha',
				valueLabels: { post: 'Post', attachment: 'Media file', page: 'Page' },
			},
		};
		expect( captured.state.filterItems.map( i => i.label ) ).toEqual( [
			'Media file',
			'Page',
			'Post',
		] );
	} );

	it( 'merges retained options no longer in current aggregation with count 0', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.aggregations = {
			category: { buckets: [ { key: 'news/News', doc_count: 7 } ] },
		};
		captured.state.retainedFilterOptions = {
			category: [
				{ value: 'news', label: 'News' },
				{ value: 'reviews', label: 'Reviews' },
			],
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {} },
		};
		const items = captured.state.filterItems;
		expect( items.map( i => i.value ) ).toEqual( [ 'news', 'reviews' ] );
		expect( items.find( i => i.value === 'reviews' ).countLabel ).toBe( '0' );
	} );

	it( 'sinks unchecked zero-count options to the bottom regardless of count sort', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.aggregations = {
			category: {
				buckets: [
					{ key: 'reviews/Reviews', doc_count: 3 },
					{ key: 'news/News', doc_count: 9 },
				],
			},
		};
		captured.state.retainedFilterOptions = {
			category: [
				{ value: 'news', label: 'News' },
				{ value: 'reviews', label: 'Reviews' },
				{ value: 'archive', label: 'Archive' }, // 0 count, retained, unchecked.
			],
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {} },
		};
		const items = captured.state.filterItems;
		expect( items.map( i => i.value ) ).toEqual( [ 'news', 'reviews', 'archive' ] );
	} );

	it( 'keeps a checked option in normal sort even when its current count is 0', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.activeFilters = { category: [ 'archive' ] };
		captured.state.aggregations = {
			category: {
				buckets: [
					{ key: 'news/News', doc_count: 9 },
					{ key: 'reviews/Reviews', doc_count: 3 },
				],
			},
		};
		captured.state.retainedFilterOptions = {
			category: [
				{ value: 'news', label: 'News' },
				{ value: 'reviews', label: 'Reviews' },
				{ value: 'archive', label: 'Archive' },
			],
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'alpha', valueLabels: {} },
		};
		// Alphabetical: Archive, News, Reviews. Archive is checked + count 0 but
		// stays in its alphabetical position because the zero-count demotion
		// only applies to UNchecked options.
		expect( captured.state.filterItems.map( i => i.value ) ).toEqual( [
			'archive',
			'news',
			'reviews',
		] );
	} );

	it( 'caps the rendered list at maxItems when retained options push it past the limit', () => {
		// Repro of SEARCH-208: the ES request is bounded at `size: maxItems`,
		// but retained options accumulated from earlier searches are appended
		// on the client. Once the merged set exceeds the cap the list must
		// still slice to `maxItems`. Sort by count, so the live (non-zero)
		// buckets win their slots and the retained-but-now-empty entries
		// drop off the bottom first.
		contextRef.current = { filterKey: 'category' };
		captured.state.aggregations = {
			category: {
				buckets: [
					{ key: 'news/News', doc_count: 9 },
					{ key: 'reviews/Reviews', doc_count: 4 },
				],
			},
		};
		captured.state.retainedFilterOptions = {
			category: [
				{ value: 'news', label: 'News' },
				{ value: 'reviews', label: 'Reviews' },
				{ value: 'archive', label: 'Archive' },
				{ value: 'opinion', label: 'Opinion' },
				{ value: 'sports', label: 'Sports' },
			],
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {}, maxItems: 3 },
		};
		const items = captured.state.filterItems;
		expect( items.map( i => i.value ) ).toEqual( [ 'news', 'reviews', 'archive' ] );
	} );

	it( 'falls back to a maxItems default of 10 when the config omits it', () => {
		contextRef.current = { filterKey: 'category' };
		const buckets = Array.from( { length: 12 }, ( _, i ) => ( {
			key: `cat-${ i }/Cat ${ i }`,
			doc_count: 12 - i,
		} ) );
		captured.state.aggregations = { category: { buckets } };
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {} },
		};
		expect( captured.state.filterItems ).toHaveLength( 10 );
	} );

	it( 'coerces a maxItems below 1 up to 1 so the slice never empties the list', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.aggregations = {
			category: { buckets: [ { key: 'news/News', doc_count: 9 } ] },
		};
		captured.state.filterConfigs = {
			category: { showCount: true, bucketSortOrder: 'count', valueLabels: {}, maxItems: 0 },
		};
		expect( captured.state.filterItems.map( i => i.value ) ).toEqual( [ 'news' ] );
	} );

	it( 'renders selected values that are not in any aggregation yet (URL-seeded deep link)', () => {
		contextRef.current = { filterKey: 'post_types' };
		captured.state.activeFilters = { post_types: [ 'post' ] };
		captured.state.aggregations = {};
		captured.state.retainedFilterOptions = {};
		captured.state.filterConfigs = {
			post_types: {
				showCount: true,
				bucketSortOrder: 'count',
				valueLabels: { post: 'Post' },
			},
		};
		const items = captured.state.filterItems;
		expect( items ).toEqual( [
			{
				value: 'post',
				label: 'Post',
				showCount: true,
				countLabel: '0',
				count: 0,
				checked: true,
			},
		] );
	} );

	it( 'date variant: keeps selected date buckets in the list and marks them checked', () => {
		// Mirrors the checkbox-variant `checked` assertion above for the
		// `filterType: 'date'` branch of filterItems / dateFilterItems.
		contextRef.current = { filterKey: 'post_date' };
		captured.state.activeFilters = { post_date: [ '2024-01-01' ] };
		captured.state.aggregations = {
			post_date: {
				buckets: [
					{ key_as_string: '2024-01-01', key: 1704067200000, doc_count: 5 },
					{ key_as_string: '2025-01-01', key: 1735689600000, doc_count: 3 },
				],
			},
		};
		captured.state.filterConfigs = {
			post_date: { filterType: 'date', interval: 'year', maxItems: 10, showCount: true },
		};
		expect(
			captured.state.filterItems.map( i => ( { value: i.value, checked: i.checked } ) )
		).toEqual( [
			{ value: '2024-01-01', checked: true },
			{ value: '2025-01-01', checked: false },
		] );
	} );
} );

describe( 'mergeRetainedFilterOptions', () => {
	it( 'adds new bucket values to the retained list', () => {
		const next = mergeRetainedFilterOptions(
			{},
			{ category: { buckets: [ { key: 'news/News' }, { key: 'reviews/Reviews' } ] } },
			{ category: { filterType: 'taxonomy', valueLabels: {} } }
		);
		expect( next ).toEqual( {
			category: [
				{ value: 'news', label: 'News' },
				{ value: 'reviews', label: 'Reviews' },
			],
		} );
	} );

	it( 'preserves earlier values not present in the new aggregation', () => {
		const prev = {
			category: [
				{ value: 'news', label: 'News' },
				{ value: 'archive', label: 'Archive' },
			],
		};
		const next = mergeRetainedFilterOptions(
			prev,
			{ category: { buckets: [ { key: 'news/News' }, { key: 'reviews/Reviews' } ] } },
			{ category: { filterType: 'taxonomy', valueLabels: {} } }
		);
		expect( next.category.map( o => o.value ) ).toEqual( [ 'news', 'archive', 'reviews' ] );
	} );

	it( 'returns the same reference when no new values are added', () => {
		const prev = { category: [ { value: 'news', label: 'News' } ] };
		const next = mergeRetainedFilterOptions(
			prev,
			{ category: { buckets: [ { key: 'news/News' } ] } },
			{ category: { filterType: 'taxonomy', valueLabels: {} } }
		);
		expect( next ).toBe( prev );
	} );

	it( 'skips date filters', () => {
		const next = mergeRetainedFilterOptions(
			{},
			{ post_date: { buckets: [ { key: 1700000000, key_as_string: '2023' } ] } },
			{ post_date: { filterType: 'date' } }
		);
		expect( next ).toEqual( {} );
	} );

	it( 'tolerates a missing `prev` map', () => {
		const next = mergeRetainedFilterOptions(
			undefined,
			{ category: { buckets: [ { key: 'news/News' } ] } },
			{ category: { filterType: 'taxonomy', valueLabels: {} } }
		);
		expect( next ).toEqual( { category: [ { value: 'news', label: 'News' } ] } );
	} );
} );

describe( 'syncFilterWrapperVisibility callback', () => {
	beforeEach( () => {
		captured.state.activeFilters = {};
		captured.state.aggregations = {};
		captured.state.retainedFilterOptions = {};
		captured.state.filterConfigs = {};
		// `skeletonHidden` is derived — drive it via the fetch lifecycle.
		captured.state.isLoading = false;
		captured.state.results = [];
		contextRef.current = { filterKey: 'category', wrapperHidden: true };
	} );

	const run = () => captured.callbacks.syncFilterWrapperVisibility();

	it( 'keeps the wrapper visible while the skeleton is still showing', () => {
		captured.state.isLoading = true;
		captured.state.results = [];
		captured.state.aggregations = {};
		run();
		expect( contextRef.current.wrapperHidden ).toBe( false );
	} );

	it( 'shows the wrapper when the latest aggregation has buckets', () => {
		captured.state.aggregations = { category: { buckets: [ { key: 'news/News' } ] } };
		run();
		expect( contextRef.current.wrapperHidden ).toBe( false );
	} );

	it( 'shows the wrapper when retained options exist even with no current buckets', () => {
		captured.state.aggregations = {};
		captured.state.retainedFilterOptions = { category: [ { value: 'news', label: 'News' } ] };
		run();
		expect( contextRef.current.wrapperHidden ).toBe( false );
	} );

	it( 'shows the wrapper when a selection exists with no buckets and nothing retained', () => {
		// URL-seeded deep link before the first fetch resolves: the user must
		// be able to see (and uncheck) the selected value, so the wrapper
		// can't hide out from under it.
		captured.state.aggregations = {};
		captured.state.retainedFilterOptions = {};
		captured.state.activeFilters = { category: [ 'cat-a' ] };
		run();
		expect( contextRef.current.wrapperHidden ).toBe( false );
	} );

	it( 'hides the wrapper only when there is nothing to show — no buckets, no retained, no selection', () => {
		captured.state.aggregations = { category: { buckets: [] } };
		captured.state.retainedFilterOptions = {};
		captured.state.activeFilters = {};
		run();
		expect( contextRef.current.wrapperHidden ).toBe( true );
	} );

	it( 'hides the date-filter wrapper when buckets are empty even with an active selection', () => {
		// dateFilterItems doesn't render selected values that aren't in the
		// current aggregation, so an active date selection alone shouldn't
		// keep an otherwise-empty wrapper visible — the active-filters pills
		// are the affordance for removing the selection in that state.
		contextRef.current = { filterKey: 'post_date', wrapperHidden: false };
		captured.state.filterConfigs = { post_date: { filterType: 'date' } };
		captured.state.aggregations = { post_date: { buckets: [] } };
		captured.state.activeFilters = { post_date: [ '2023-01-01' ] };
		run();
		expect( contextRef.current.wrapperHidden ).toBe( true );
	} );
} );

describe( 'filter-checkbox view store — onFilterChange', () => {
	// onFilterChange is display-style-agnostic: chip clicks and checkbox-list
	// clicks both flow through the same actions.onFilterChange → setFilter
	// path because the DOM (input + label + count) is identical across
	// display styles. build_config() also does not emit `displayStyle` into
	// `filterConfigs`, so the action handler has no display-style branch to
	// exercise here — one click-routing assertion covers both variants.
	it( 'routes filter clicks through actions.onFilterChange to setFilter', () => {
		contextRef.current = { filterKey: 'category' };
		captured.state.filterConfigs = { category: {} };

		const setFilter = jest
			.spyOn( captured.actions, 'setFilter' )
			.mockImplementation( function* () {} );

		const iterator = captured.actions.onFilterChange( { target: { value: 'news' } } );
		iterator.next();

		expect( setFilter ).toHaveBeenCalledWith( 'category', 'news' );
		setFilter.mockRestore();
	} );
} );

// `@wordpress/interactivity` is an externalized dep — mock virtually so the
// view.js file can be required and its getters / actions captured.
const captured = {
	state: {},
	actions: {},
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
			}
			return { state: captured.state, actions: captured.actions };
		},
		getContext: () => contextRef.current,
	} ),
	{ virtual: true }
);

require( '../../../src/search-blocks/store' );

describe( 'filter-checkbox view store — filterItems', () => {
	beforeEach( () => {
		captured.state.activeFilters = {};
		captured.state.aggregations = {};
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
			{ value: 'post', label: 'Post', checked: false, showCount: true, countLabel: '12' },
			{ value: 'page', label: 'Page', checked: false, showCount: true, countLabel: '4' },
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
		// `_key: asc` would sort by slug — `food-news`, `restaurant-reviews`,
		// `zebra-archive` — placing "Restaurant Reviews" between "Apple Pie"
		// and "Zebra Archive". Sorting by visible label puts them in true
		// alphabetical order from the visitor's POV.
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
		// Slug order would be `attachment`, `page`, `post` → "Files", "Page",
		// "Post". Label order is the trio sorted alphabetically by visible
		// name: "Files", "Page", "Post" — same in this case, but the test
		// fixture uses a slug whose first letter differs from its label so
		// the sort is provably driven by the label.
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

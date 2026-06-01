import { filterHasContent, filtersHaveNothingToShow, hasAnyActiveFilter } from '../filters-empty';

/**
 * A "search ran, hydrated, nothing to show" baseline where
 * `filtersHaveNothingToShow` is expected to return `true`. Individual cases
 * spread an override on top to assert the suppressors.
 *
 * @param {object} overrides - Fields to override on the baseline.
 * @return {object} A plain state object.
 */
function emptySearchedState( overrides = {} ) {
	return {
		searchQuery: 'test',
		hasSearchParam: true,
		isLoading: false,
		hasError: false,
		aggregations: {},
		retainedFilterOptions: {},
		activeFilters: {},
		staticFilterSelections: {},
		priceRange: null,
		filterConfigs: { category: { filterType: 'taxonomy' } },
		...overrides,
	};
}

describe( 'filtersHaveNothingToShow', () => {
	it( 'is true when a search ran but no filter has any content', () => {
		expect( filtersHaveNothingToShow( emptySearchedState() ) ).toBe( true );
	} );

	it( 'is false on a bare page with no search', () => {
		expect(
			filtersHaveNothingToShow( emptySearchedState( { searchQuery: '', hasSearchParam: false } ) )
		).toBe( false );
	} );

	it( 'is false while the search is loading', () => {
		expect( filtersHaveNothingToShow( emptySearchedState( { isLoading: true } ) ) ).toBe( false );
	} );

	it( 'is false when the fetch errored', () => {
		expect( filtersHaveNothingToShow( emptySearchedState( { hasError: true } ) ) ).toBe( false );
	} );

	it( 'is false when a filter has aggregation buckets', () => {
		expect(
			filtersHaveNothingToShow(
				emptySearchedState( {
					aggregations: { category: { buckets: [ { key: 'news', doc_count: 3 } ] } },
				} )
			)
		).toBe( false );
	} );

	it( 'is false when a filter has retained (session-cached) options', () => {
		expect(
			filtersHaveNothingToShow(
				emptySearchedState( {
					retainedFilterOptions: { category: [ { value: 'news', label: 'News' } ] },
				} )
			)
		).toBe( false );
	} );

	it( 'is false when a filter has an active selection', () => {
		expect(
			filtersHaveNothingToShow( emptySearchedState( { activeFilters: { category: [ 'news' ] } } ) )
		).toBe( false );
	} );

	it( 'is false when a price range is active', () => {
		expect(
			filtersHaveNothingToShow( emptySearchedState( { priceRange: { min: 10, max: null } } ) )
		).toBe( false );
	} );

	it( 'is false when a static filter selection is active', () => {
		expect(
			filtersHaveNothingToShow(
				emptySearchedState( { staticFilterSelections: { postType: 'post' } } )
			)
		).toBe( false );
	} );

	it( 'is false when an unselected static filter still renders its values', () => {
		expect(
			filtersHaveNothingToShow(
				emptySearchedState( {
					filterConfigs: { scope: { filterType: 'static', values: [ { value: 'docs' } ] } },
				} )
			)
		).toBe( false );
	} );
} );

describe( 'filterHasContent', () => {
	const state = ( overrides = {} ) => ( {
		aggregations: {},
		retainedFilterOptions: {},
		activeFilters: {},
		filterConfigs: {},
		...overrides,
	} );

	it( 'is true when the filter has aggregation buckets', () => {
		expect(
			filterHasContent(
				state( { aggregations: { category: { buckets: [ { key: 'news', doc_count: 1 } ] } } } ),
				'category'
			)
		).toBe( true );
	} );

	it( 'is true for a static filter with values, even with no buckets or selection', () => {
		expect(
			filterHasContent(
				state( { filterConfigs: { scope: { filterType: 'static', values: [ { value: 'a' } ] } } } ),
				'scope'
			)
		).toBe( true );
	} );

	it( 'is false for a static filter with no values', () => {
		expect(
			filterHasContent(
				state( { filterConfigs: { scope: { filterType: 'static', values: [] } } } ),
				'scope'
			)
		).toBe( false );
	} );

	it( 'bails out to false for a date filter with no buckets, ignoring retained/active', () => {
		expect(
			filterHasContent(
				state( {
					filterConfigs: { posted: { filterType: 'date' } },
					retainedFilterOptions: { posted: [ { value: '2024' } ] },
					activeFilters: { posted: [ '2024' ] },
				} ),
				'posted'
			)
		).toBe( false );
	} );

	it( 'is true when a non-date filter has retained options', () => {
		expect(
			filterHasContent(
				state( { retainedFilterOptions: { category: [ { value: 'news' } ] } } ),
				'category'
			)
		).toBe( true );
	} );

	it( 'is true when a non-date filter has an active selection', () => {
		expect(
			filterHasContent( state( { activeFilters: { category: [ 'news' ] } } ), 'category' )
		).toBe( true );
	} );
} );

describe( 'hasAnyActiveFilter', () => {
	it( 'is false when nothing is selected', () => {
		expect(
			hasAnyActiveFilter( { activeFilters: {}, staticFilterSelections: {}, priceRange: null } )
		).toBe( false );
	} );

	it( 'is true with a dynamic selection', () => {
		expect( hasAnyActiveFilter( { activeFilters: { category: [ 'news' ] } } ) ).toBe( true );
	} );

	it( 'is true with a static selection', () => {
		expect( hasAnyActiveFilter( { staticFilterSelections: { scope: 'docs' } } ) ).toBe( true );
	} );

	it( 'is true with a half-open price range', () => {
		expect( hasAnyActiveFilter( { priceRange: { min: 10, max: null } } ) ).toBe( true );
	} );
} );

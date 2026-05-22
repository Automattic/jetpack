import { filtersHaveNothingToShow } from '../filters-empty';

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
		skeletonHidden: true,
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

	it( 'is false while the pre-hydration skeleton is up', () => {
		expect( filtersHaveNothingToShow( emptySearchedState( { skeletonHidden: false } ) ) ).toBe(
			false
		);
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
} );

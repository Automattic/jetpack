/**
 * Filter-visibility predicates, kept as pure functions of a plain state object
 * so they're unit-testable without the Interactivity runtime. The store wires
 * them into `data-wp-bind` via thin getters.
 */

/**
 * True when a filter key has anything to render: live aggregation buckets,
 * session-retained options, or an active selection. Drives wrapper
 * visibility — without the retained / selection check a narrower query
 * could hide the section that holds the user's own selection.
 *
 * Date filters bail out before the retention / selection clauses: they
 * don't accumulate retained options (mergeRetainedFilterOptions skips
 * them) and dateFilterItems doesn't render selected values that aren't
 * in the current aggregation, so an empty bucket list means an empty
 * <ul> and the wrapper should hide. Selections still surface via the
 * active-filters pills.
 *
 * @param {object} sharedState - Live store state.
 * @param {string} filterKey   - Filter key.
 * @return {boolean} True when the wrapper has something to show.
 */
export function filterHasContent( sharedState, filterKey ) {
	if ( ( sharedState.aggregations?.[ filterKey ]?.buckets?.length ?? 0 ) > 0 ) {
		return true;
	}
	if ( sharedState.filterConfigs?.[ filterKey ]?.filterType === 'date' ) {
		return false;
	}
	return (
		( sharedState.retainedFilterOptions?.[ filterKey ]?.length ?? 0 ) > 0 ||
		( sharedState.activeFilters?.[ filterKey ]?.length ?? 0 ) > 0
	);
}

/**
 * True when any facet is active — selected filter values, a static-filter
 * selection, or a price range. priceRange counts so a price-only selection
 * (including a half-open range like `?min_price=10`) still reads as active.
 *
 * @param {object} sharedState - Live store state.
 * @return {boolean} Whether any filter is active.
 */
export function hasAnyActiveFilter( sharedState ) {
	const hasSelections = Object.values( sharedState.activeFilters ?? {} ).some(
		v => Array.isArray( v ) && v.length > 0
	);
	if ( hasSelections ) {
		return true;
	}
	const hasStaticSelections = Object.values( sharedState.staticFilterSelections ?? {} ).some(
		v => !! v
	);
	if ( hasStaticSelections ) {
		return true;
	}
	const range = sharedState.priceRange;
	return !! range && ( range.min != null || range.max != null );
}

/**
 * True when the `filters` / `filters-product` containers have nothing to show
 * and should surface their empty state. Those are layout-only wrappers, so
 * when a search resolves with no buckets, no retained (session-cached)
 * options, and no active selections, every child filter hides itself and the
 * wrapper renders an empty box.
 *
 * Gated like `showNoResults` (a search has run, hydration is done, not
 * loading, no error) so it doesn't flash on a bare `/search/` page or
 * mid-fetch. Any active filter short-circuits it because the active-filters /
 * clear-filters children still have something to show. `filterHasContent`
 * already counts `retainedFilterOptions`, so a cached filter keeps this false.
 *
 * @param {object} sharedState - Live store state.
 * @return {boolean} True when the filters empty state should show.
 */
export function filtersHaveNothingToShow( sharedState ) {
	if ( ! ( sharedState.searchQuery || sharedState.hasSearchParam ) ) {
		return false;
	}
	if ( ! sharedState.skeletonHidden || sharedState.isLoading || sharedState.hasError ) {
		return false;
	}
	if ( hasAnyActiveFilter( sharedState ) ) {
		return false;
	}
	for ( const filterKey of Object.keys( sharedState.filterConfigs ?? {} ) ) {
		if ( filterHasContent( sharedState, filterKey ) ) {
			return false;
		}
	}
	return true;
}

/**
 * Filter-visibility predicates as pure state-only functions (Jest-testable
 * without the IA runtime). Wired into `data-wp-bind` via thin getters.
 */

/**
 * Does this filter have anything to show — live buckets, retained options,
 * or an active selection. Static filters count their server `values`
 * regardless. Date filters skip the retained/selected clauses since
 * `dateFilterItems` doesn't render selected values that aren't in the agg.
 *
 * @param {object} sharedState - Live store state.
 * @param {string} filterKey   - Filter key.
 * @return {boolean} True when the wrapper has content.
 */
export function filterHasContent( sharedState, filterKey ) {
	if ( ( sharedState.aggregations?.[ filterKey ]?.buckets?.length ?? 0 ) > 0 ) {
		return true;
	}
	const config = sharedState.filterConfigs?.[ filterKey ];
	if ( config?.filterType === 'static' ) {
		return ( config.values?.length ?? 0 ) > 0;
	}
	if ( config?.filterType === 'date' ) {
		return false;
	}
	return (
		( sharedState.retainedFilterOptions?.[ filterKey ]?.length ?? 0 ) > 0 ||
		( sharedState.activeFilters?.[ filterKey ]?.length ?? 0 ) > 0
	);
}

/**
 * Whether any facet is active — values, static selection, or price range
 * (half-open `?min_price=10` counts).
 *
 * @param {object} sharedState - Live store state.
 * @return {boolean} True when a facet is active.
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
 * Filters empty-state visibility. Gated like `showNoResults` — search has run,
 * not loading, no error. Any active filter short-circuits.
 *
 * @param {object} sharedState - Live store state.
 * @return {boolean} True when the empty state should show.
 */
export function filtersHaveNothingToShow( sharedState ) {
	if ( ! ( sharedState.searchQuery || sharedState.hasSearchParam ) ) {
		return false;
	}
	if ( sharedState.isLoading || sharedState.hasError ) {
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

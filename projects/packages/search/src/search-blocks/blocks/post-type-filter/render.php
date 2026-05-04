<?php
/**
 * Post-type-filter block render.
 *
 * Hidden block: contributes an include/exclude constraint to the shared
 * Interactivity state and emits no markup. JS reads `state.staticPostTypes`
 * when building the search URL and merges it into the ES filter clause as
 * `bool.should` (include) and `bool.must_not` (exclude) clauses.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

if ( ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$lists = Post_Type_Filter::build_lists( (array) $attributes );

if ( empty( $lists['include'] ) && empty( $lists['exclude'] ) ) {
	// Nothing to contribute. Bailing keeps the seeded `staticPostTypes` shape
	// untouched so an empty / unconfigured block can't accidentally widen or
	// narrow results.
	return;
}

$current         = wp_interactivity_state( 'jetpack-search' );
$existing_static = (array) ( $current['staticPostTypes'] ?? array() );
$merged          = Post_Type_Filter::merge_state( $existing_static, $lists );

wp_interactivity_state(
	'jetpack-search',
	array( 'staticPostTypes' => $merged )
);

<?php
/**
 * Filter-post-type block render: writes a `staticPostTypes` constraint to
 * the Interactivity store and emits no markup.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

if ( ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$constraint = Filter_Post_Type::build_constraint( (array) $attributes );

if ( empty( $constraint['include'] ) && empty( $constraint['exclude'] ) ) {
	return;
}

$current         = wp_interactivity_state( 'jetpack-search' );
$existing_static = (array) ( $current['staticPostTypes'] ?? array() );
$merged          = Filter_Post_Type::merge_state( $existing_static, $constraint );

wp_interactivity_state( 'jetpack-search', array( 'staticPostTypes' => $merged ) );

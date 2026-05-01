<?php
/**
 * Compatibility for Beaver Builder (both lite and Pro versions).
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Beaver_Builder;

/**
 * Exclude Beaver Builder custom post types from list of posts to generate critical CSS for.
 *
 * @param array $post_types Post types.
 */
function exclude_beaver_builder_custom_post_types( $post_types ) {
	unset( $post_types['fl-builder-template'] );
	unset( $post_types['fl-theme-layout'] );

	return $post_types;
}

add_filter( 'jetpack_boost_critical_css_post_types_singular', __NAMESPACE__ . '\exclude_beaver_builder_custom_post_types' );
add_filter( 'jetpack_boost_critical_css_post_types_archives', __NAMESPACE__ . '\exclude_beaver_builder_custom_post_types' );

/**
 * Disable JS concatenation when Beaver Builder editor is active.
 * The editor depends on specific script execution order that concatenation breaks.
 *
 * @param bool   $do_concat Whether to concatenate the script.
 * @param string $handle    Script handle.
 * @return bool
 */
function disable_js_concatenate_for_beaver_builder( $do_concat, $handle ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	// Check for fl_builder query parameter (BB editor mode)
	// BB uses ?fl_builder (no value) to indicate editor mode
	$is_bb_editor = filter_input( INPUT_GET, 'fl_builder' );
	if ( null !== $is_bb_editor ) {
		return false;
	}

	// Fallback: Check BB's native function for builder active state
	// @phan-suppress-next-line PhanUndeclaredClassReference
	if ( class_exists( 'FLBuilderModel' ) && method_exists( 'FLBuilderModel', 'is_builder_active' ) ) {
		/** @phan-suppress-next-line PhanUndeclaredClassMethod */
		if ( \FLBuilderModel::is_builder_active() ) {
			return false;
		}
	}

	return $do_concat;
}

add_filter( 'js_do_concat', __NAMESPACE__ . '\disable_js_concatenate_for_beaver_builder', 10, 2 );

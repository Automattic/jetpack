<?php
/**
 * Compatibility functions for Divi Builder
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Divi;

/**
 * Defer JS can break Divi Builder.
 */
function disable_defer_js_for_divi_builder( $should_defer_js ) {
	$is_divi_builder = filter_input( INPUT_GET, 'et_fb', FILTER_VALIDATE_INT );

	if ( 1 === (int) $is_divi_builder ) {
		return false;
	}

	$is_divi_preview = filter_input(
		INPUT_GET,
		'et_pb_preview',
		FILTER_VALIDATE_BOOLEAN,
		array(
			'flags' => FILTER_NULL_ON_FAILURE,
		)
	);

	if ( true === $is_divi_preview ) {
		return false;
	}

	if ( function_exists( 'is_et_pb_preview' ) ) {
		/** @phan-suppress-next-line PhanUndeclaredFunction */
		if ( \is_et_pb_preview() ) {
			return false;
		}
	}

	return $should_defer_js;
}

add_filter( 'jetpack_boost_should_defer_js', __NAMESPACE__ . '\disable_defer_js_for_divi_builder' );

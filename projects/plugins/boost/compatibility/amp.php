<?php
/**
 * Compatibility functions for AMP.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Amp;

/**
 * Disable stylesheet loading method update for AMP pages.
 *
 * @param array $method Loading method for stylesheets.
 */
function disable_amp_asynchronize_stylesheets( $method ) {
	return amp_is_request() ? false : $method;
}

add_filter( 'jetpack_boost_async_style', __NAMESPACE__ . '\disable_amp_asynchronize_stylesheets' );

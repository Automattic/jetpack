<?php
/**
 * Compatibility functions for AMP.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Amp;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS;

/**
 * Init AMP compatibility actions after modules are initialized.
 *
 * @param Critical_CSS $module Critical_CSS Module instance.
 */
function init_amp_compatibility( $module ) {
	// Todo: Temporary. Find a way to remove `display_critical_css` action after amp_is_request() is available.
	add_action( 'wp', function() use ( $module ) {
		if ( amp_is_request() ) {
			remove_action( 'wp', array( $module, 'display_critical_css' ) );
		}
	}, 0 );
}

add_action( 'jetpack_boost_critical-css_initialized', __NAMESPACE__ . '\init_amp_compatibility' );

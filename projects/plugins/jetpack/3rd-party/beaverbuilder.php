<?php
/**
 * Beaverbuilder Compatibility.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Third_Party;

use Automattic\Jetpack\Status\Host;

add_action( 'init', __NAMESPACE__ . '\beaverbuilder_refresh' );

/**
 * If masterbar module is active force BeaverBuilder to refresh when publishing a layout.
 */
function beaverbuilder_refresh() {
	if ( ( new Host() )->is_woa_site() ) {
		add_filter( 'fl_builder_should_refresh_on_publish', '__return_true' );
	}
}

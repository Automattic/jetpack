<?php
/**
 * Block Editor - SEO feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Seo;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

/**
 * Register SEO plugin.
 *
 * @return void
 */
function register_plugins() {
	// Register SEO.
	// We want to show SEO tools only for Business plans and above.
	$is_wpcom_simple = ( new Host() )->is_wpcom_simple();
	$show_on_atomic  = $is_wpcom_simple && Jetpack_Plan::supports( 'advanced-seo' );
	if (
		$show_on_atomic
		|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() )
	) {
		Jetpack_Gutenberg::set_extension_available( 'jetpack-seo' );
	}
}

add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

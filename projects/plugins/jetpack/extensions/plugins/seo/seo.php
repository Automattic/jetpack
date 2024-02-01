<?php
/**
 * Block Editor - SEO feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Seo;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

/**
 * Register SEO plugin.
 *
 * @return void
 */
function register_plugins() {
	// Setting availability for Advanced SEO plan.
	Jetpack_Gutenberg::set_availability_for_plan( 'advanced-seo' );

	// On WPCOM sites we handle plan with Upsell message if needed.
	// On Self-Hosted we check if there's an active connection and if the site is not in offline mode.
	$is_wpcom_platform = ( new Host() )->is_wpcom_platform();
	if (
		$is_wpcom_platform
		|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() )
	) {
		Jetpack_Gutenberg::set_extension_available( 'jetpack-seo' );
	}
}

add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array( 'advanced-seo' )
		);
	}
);

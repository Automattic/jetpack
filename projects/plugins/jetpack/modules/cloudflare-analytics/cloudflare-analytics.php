<?php
/**
 * Cloudflare Analytics
 * Let WPCOM users automatically insert a Cloudflare analytics JS snippet into their site header.
 *
 * @deprecated 13.4 Moved to mu-wpcom.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Cloudflare_Analytics;

_deprecated_file( __FILE__, 'jetpack-13.4' );

/**
 * Add Cloudflare Analytics tracking code to the head.
 * This is currently only available to Atomic and WordPress.com Simple sites.
 *
 * @deprecated 13.4 Moved to mu-wpcom.
 * @since 9.5.0
 *
 * @return void
 */
function insert_tracking_id() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.4', 'Automattic\\Jetpack\\Jetpack_Mu_Wpcom\\Cloudflare_Analytics\\insert_tracking_id' );
}

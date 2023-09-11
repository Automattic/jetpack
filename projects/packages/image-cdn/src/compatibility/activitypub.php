<?php
/**
 * Compatibility functions for the ActivityPub plugin.
 *
 * @since 0.2.2
 *
 * @package automattic/jetpack-image-cdn
 */

namespace Automattic\Jetpack\Image_CDN\Compatibility;

use Automattic\Jetpack\Image_CDN\Image_CDN;

/**
 * Hook the compatibility functions into ActivityPub filters if necessary.
 *
 * @since 0.2.2
 *
 * @return void
 */
function load_activitypub_compat() {
	if (
		/**
		 * Allow disabling Jetpack's image CDN for ActivityPub requests.
		 *
		 * @since 0.2.2
		 *
		 * @param bool $should_disable_photon Should the CDN be disabled for that request. Default to false.
		 */
		apply_filters( 'jetpack_activitypub_post_disable_cdn', false )
	) {
		add_action( 'activitypub_get_image_pre', __NAMESPACE__ . '\disable_photon' );
		add_action( 'activitypub_get_image_post', __NAMESPACE__ . '\enable_photon' );
	}
}
add_action( 'plugins_loaded', __NAMESPACE__ . '\load_activitypub_compat' );

/**
 * Disable Jetpack's Image CDN processing for this request.
 *
 * @see https://github.com/pfefferle/wordpress-activitypub/pull/309
 *
 * @return void
 */
function disable_photon() {
	remove_filter( 'image_downsize', array( Image_CDN::instance(), 'filter_image_downsize' ) );
}

/**
 * Re-enable Jetpack's Image CDN processing after the request.
 *
 * @see https://github.com/pfefferle/wordpress-activitypub/pull/309
 *
 * @return void
 */
function enable_photon() {
	add_filter( 'image_downsize', array( Image_CDN::instance(), 'filter_image_downsize' ), 10, 3 );
}

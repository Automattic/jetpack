<?php
/**
 * Compatibility for Photon
 *
 * Replace photon with image-cdn.
 *
 * @package automattic/jetpack-image-cdn
 */

namespace Automattic\Jetpack\Image_CDN\Compatibility;

/**
 * Disable the unpackaged photon version living in Jetpack.
 *
 * At the time of writing, Jetpack still has the photon functionality in the Jetpack plugin. To avoid double
 * activation, we need to disable the photon functionality in Jetpack. If this package is installed via a
 * different plugin, e.g. Boost, Image CDN should be served instead of the photon module in Jetpack.
 */
function jetpack_image_cdn_photon_compat() {
	remove_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
	remove_filter( 'jetpack_photon_pre_args', 'jetpack_photon_parse_wpcom_query_args', 10, 2 );
	remove_filter( 'jetpack_photon_skip_for_url', 'jetpack_photon_banned_domains', 9, 2 );
	remove_filter( 'widget_text', 'jetpack_photon_support_text_widgets' );

	// If photon is active, fake loading the module in Jetpack itself. This will prevent jetpack from loading
	// the photon module, and we will use the image CDN package instead.
	if ( class_exists( 'Jetpack' ) && \Jetpack::is_module_active( 'photon' ) ) {
		do_action( 'jetpack_module_loaded_photon' );
	}
}

/*
 * Remove the hooks that Jetpack uses to load photon and pretend that the module is already loaded.
 *
 * Jetpack hooks the filters as it loads. So, we can remove the filters when `plugins_loaded` fires.
 * This would make sure Jetpack has already loaded and hooked the filters.
 */
add_action( 'plugins_loaded', __NAMESPACE__ . '\jetpack_image_cdn_photon_compat' );

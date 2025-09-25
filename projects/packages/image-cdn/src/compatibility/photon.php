<?php
/**
 * Compatibility for Photon
 *
 * Replace photon with image-cdn.
 *
 * @package automattic/jetpack-image-cdn
 */

namespace Automattic\Jetpack\Image_CDN\Compatibility;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Disable the unpackaged photon version living in Jetpack.
 *
 * Before the package, Jetpack had the photon functionality within the plugin. To avoid double
 * activation, we need to disable the photon functionality in Jetpack to avoid potential conflicts.
 *
 * If this package is installed via a different plugin, e.g. Boost, Image CDN should be served instead
 * of the photon module in Jetpack.
 */
function jetpack_image_cdn_photon_compat() {
	/*
	 * Photon used have different functions names. They are later replaced by methods in
	 * Image_CDN_Core class. And the filters are now handled by the Image_CDN_Core class itself.
	 */
	remove_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10 );
	remove_filter( 'jetpack_photon_pre_args', 'jetpack_photon_parse_wpcom_query_args', 10 );
	remove_filter( 'jetpack_photon_skip_for_url', 'jetpack_photon_banned_domains', 9 );
	remove_filter( 'widget_text', 'jetpack_photon_support_text_widgets' );

	/*
	 * If photon is active in an old version of Jetpack which is using the unpackaged photon
	 * fake loading the module in Jetpack itself. This will prevent jetpack from loading
	 * the photon module, and we will use the image CDN package instead.
	 *
	 * When this is happening, the package is likely being loaded from a different plugin, e.g. Boost.
	 */
	if ( class_exists( 'Jetpack' ) && defined( 'JETPACK__VERSION' ) && ( version_compare( JETPACK__VERSION, '12.1', '<=' ) ) ) {
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

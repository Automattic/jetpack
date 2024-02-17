<?php
/**
 * Deprecated since version 12.8.0.
 *
 * Jetpack’s Lazy Loading feature was first introduced in 2018.
 * At the time, few other tools offered such functionality.
 * It offered a much needed performance boost to WordPress sites,
 * especially those with a large number of images.
 *
 * A couple of years later, a new lazy loading web standard was introduced,
 * and WordPress itself started supporting this standard.
 * Today, modern browsers all support lazy loading,
 * and WordPress itself comes with built-in lazy loading functionality for images and videos.
 *
 * Considering this positive change, Jetpack’s Lazy Loading feature is no longer necessary.
 *
 * @deprecated
 * @package automattic/jetpack
 */

/**
 * Deactivate module if it is still active.
 *
 * @since 12.8
 */
if ( Jetpack::is_module_active( 'lazy-images' ) ) {
	Jetpack::deactivate_module( 'lazy-images' );
}

_deprecated_file( basename( __FILE__ ), 'jetpack-12.8' );

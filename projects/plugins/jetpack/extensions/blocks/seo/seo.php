<?php
/**
 * Block Editor - SEO feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing;

use Jetpack_Gutenberg;

/**
 * Register SEO plugin.
 *
 * @return void
 */
function register_plugins() {
	// Register SEO.
	Jetpack_Gutenberg::set_extension_available( 'jetpack-seo' );
}

add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

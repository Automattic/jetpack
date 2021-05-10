<?php
/**
 * Action Hooks for the WordPress.com's Posts enhancements.
 *
 * @package automattic/jetpack-wpcom-posts
 */

namespace Automattic\Jetpack\WPcom\Posts;

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

/**
 * Initializes the thumbnail enhancements.
 */
function setup_thumbnail() {
	new Thumbnail();
}

add_action( 'init', __NAMESPACE__ . '\setup_thumbnail' );

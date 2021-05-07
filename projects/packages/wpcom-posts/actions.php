<?php
/**
 * Action Hooks for the WordPress.com's Posts enhancements.
 *
 * @package automattic/jetpack-wpcom-posts
 */

use Automattic\Jetpack\WPcom\Posts;

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

add_action(
	'init',
	function () {
		new Posts\Thumbnail();
	}
);

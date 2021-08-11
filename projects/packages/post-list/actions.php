<?php
/**
 * Action Hooks for the PostList.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\PostList;

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

/**
 * Start the Jetpack Post List engines.
 */
function init_posts_list() {
	Admin::init();
}

add_action( 'init', __NAMESPACE__ . '\init_posts_list' );

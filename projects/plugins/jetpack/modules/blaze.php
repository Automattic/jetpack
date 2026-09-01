<?php
/**
 * Module Name: Blaze
 * Module Description: Promote your posts and pages across millions of sites in the WordPress.com and Tumblr ad network.
 * Sort Order: 22
 * Recommendation Order: 12
 * First Introduced: 12.3
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Traffic, Social
 * Additional Search Queries: advertising, ads
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Blaze;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Blaze::init();

/**
 * Remove post row Blaze actions in the Jetpack plugin.
 * Keep them on for products.
 *
 * @param bool    $are_quick_links_enabled Should Blaze row actions be enabled.
 * @param WP_Post $post                    The current post in the post list table.
 *
 * @return bool
 */
function jetpack_blaze_post_row_actions_disable( $are_quick_links_enabled, $post ) {
	if ( 'product' !== $post->post_type ) {
		return false;
	}

	return $are_quick_links_enabled;
}
add_filter( 'jetpack_blaze_post_row_actions_enable', 'jetpack_blaze_post_row_actions_disable', 10, 2 );

<?php
/**
 * Add tracks events for Quick links and the Stats icon.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare(strict_types=1);

/**
 * Add tracks for the post list.
 *
 * @return void
 */
function wpcom_post_list_add_stats_tracking() {
	global $post_type;

	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-post-list-tracks', array( 'js' ) );

	wp_localize_script( $handle, 'wpcomPostListData', array( 'postType' => $post_type ) );
}

add_action( 'admin_print_scripts-edit.php', 'wpcom_post_list_add_stats_tracking' );

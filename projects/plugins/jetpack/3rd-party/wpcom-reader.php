<?php
/**
 * This provides minor tweaks to improve the experience for Jetpack feed in the WordPress.com Reader.
 *
 * This does not make sites available in the Reader—that depends on the public access to /feed/ as a method on the WP.com side
 * to check if a site is public. It also does not add any content to the feed. Any content that should not be displayed in the Reader
 * or other RSS readers should be filtered out elsewhere.
 *
 * These hooks were originally part of the now-deprecated Enhanced Distribution.
 *
 * @since 13.3
 * @package Automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

foreach ( array( 'rss_head', 'rss1_head', 'rss2_head' ) as $rss_head_action ) {
	add_action( $rss_head_action, 'jetpack_wpcomreader_feed_id' );
}
foreach ( array( 'rss_item', 'rss1_item', 'rss2_item' ) as $rss_item_action ) {
	add_action( $rss_item_action, 'jetpack_wpcomreader_post_id' );
}
add_action( 'the_post', 'jetpack_wpcomreader_set_up_post_id' );

/**
 * Output feed identifier based on blog ID.
 *
 * @return void
 */
function jetpack_wpcomreader_feed_id() {
	if (
		( new Host() )->is_wpcom_simple()
		|| (
			( new Connection_Manager() )->is_connected()
			&& ! ( new Status() )->is_offline_mode()
		)
	) {
		$blog_id = Connection_Manager::get_site_id( true ); // Silence since we're not wanting to handle the error state.
		if ( ! $blog_id ) {
			return;
		}

		printf(
			'<site xmlns="com-wordpress:feed-additions:1">%d</site>',
			(int) $blog_id
		);
	}
}

/**
 * Track the post most recently set up by a loop, and hand its ID out once.
 *
 * @since $$next-version$$
 *
 * @param WP_Post|null $post Post being set up, or null to read and clear the tracked ID.
 * @return int ID of the post set up before this call, or 0.
 */
function jetpack_wpcomreader_set_up_post_id( $post = null ) {
	static $set_up_post_id = 0;

	$previous_id    = $set_up_post_id;
	$set_up_post_id = $post instanceof WP_Post ? (int) $post->ID : 0;

	return $previous_id;
}

/**
 * Output feed item identifier based on current post ID.
 *
 * Custom feed templates can fire the item actions without setting up a post for each item,
 * leaving the global post on the main query's; only print an ID set up for this item.
 *
 * @return void
 */
function jetpack_wpcomreader_post_id() {
	$id = get_the_ID();
	if ( ! $id || jetpack_wpcomreader_set_up_post_id() !== $id ) {
		return;
	}

	printf(
		'<post-id xmlns="com-wordpress:feed-additions:1">%d</post-id>',
		(int) $id
	);
}

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
 * @since $$next-version$$
 * @package Automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

add_action( 'rss_head', 'jetpack_wpcomreader_feed_id' );
add_action( 'rss_item', 'jetpack_wpcomreader_post_id' );
add_action( 'rss1_head', 'jetpack_wpcomreader_feed_id' );
add_action( 'rss1_item', 'jetpack_wpcomreader_post_id' );

/**
 * Output feed identifier based on blog ID.
 *
 * @return string|void XML output or void if not connected.
 */
function jetpack_wpcomreader_feed_id() {
	if ( ( new Status() )->is_offline_mode() ) {
		return;
	}
	$connection = new Connection_Manager();
	if ( ( new Host() )->is_wpcom_simple() || $connection->is_connected() ) {
		$id = $connection->get_site_id( true ); // Silence since we're not wanting to handle the error state.
		if ( ! $id ) {
			return;
		}
		$output = sprintf( '<site xmlns="com-wordpress:feed-additions:0">%d</site>', $id );
		echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

/**
 * Output feed item identifier based on current post ID.
 */
function jetpack_wpcomreader_post_id() {
	$id = (int) get_the_ID();
	if ( $id ) {
		$output = sprintf( '<post-id xmlns="com-wordpress:feed-additions:0">%d</post-id>', $id );
		echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

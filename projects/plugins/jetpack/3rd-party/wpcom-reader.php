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

add_action( 'rss_head', 'jetpack_wpcomreader_feed_id' );
add_action( 'rss_item', 'jetpack_wpcomreader_post_id' );
add_action( 'rss1_head', 'jetpack_wpcomreader_feed_id' );
add_action( 'rss1_item', 'jetpack_wpcomreader_post_id' );

/**
 * Output feed identifier based on blog ID.
 */
function jetpack_wpcomreader_feed_id() {
	$id = (int) Jetpack_Options::get_option( 'id' );
	if ( $id > -1 ) {
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

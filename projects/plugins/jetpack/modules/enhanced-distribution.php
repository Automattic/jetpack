<?php
/**
 * Module formerly known as Enhanced Distribution.
 *
 * @deprecated 13.2.0
 *
 * @package automattic/jetpack
 */

add_action( 'rss_head', 'jetpack_enhanced_distribution_feed_id' );
add_action( 'rss_item', 'jetpack_enhanced_distribution_post_id' );
add_action( 'rss2_head', 'jetpack_enhanced_distribution_feed_id' );
add_action( 'rss2_item', 'jetpack_enhanced_distribution_post_id' );

/**
 * Output feed identifier based on blog ID.
 */
function jetpack_enhanced_distribution_feed_id() {
	$id = (int) Jetpack_Options::get_option( 'id' );
	if ( $id > 0 ) {
		$output = sprintf( '<site xmlns="com-wordpress:feed-additions:1">%d</site>', $id );
		echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

/**
 * Output feed item identifier based on current post ID.
 */
function jetpack_enhanced_distribution_post_id() {
	$id = (int) get_the_ID();
	if ( $id ) {
		$output = sprintf( '<post-id xmlns="com-wordpress:feed-additions:1">%d</post-id>', $id );
		echo $output; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

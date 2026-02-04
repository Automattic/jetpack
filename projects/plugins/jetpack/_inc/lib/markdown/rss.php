<?php
/**
 * Markdown RSS feed support.
 *
 * Outputs a <source:markdown> element in RSS feed items
 * for posts that have Markdown source content.
 *
 * @package automattic/jetpack
 * @since ___
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Output a source:markdown element for the current post in an RSS feed.
 *
 * Only outputs when the current post was written with Markdown
 * and has content stored in post_content_filtered.
 *
 * @since ___
 * @return void
 */
function jetpack_markdown_rss_output_source_markdown() {
	$post_id = get_the_ID();
	if ( ! $post_id ) {
		return;
	}

	if ( ! get_post_meta( $post_id, '_wpcom_is_markdown', true ) ) {
		return;
	}

	$post = get_post( $post_id );
	if ( ! $post || empty( $post->post_content_filtered ) ) {
		return;
	}

	$markdown = str_replace( ']]>', ']]&gt;', $post->post_content_filtered );

	echo "\t\t";
	printf( '<source:markdown><![CDATA[%s]]></source:markdown>', $markdown ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Content is wrapped in CDATA with ]]> escaped.
	echo "\n";
}

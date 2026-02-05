<?php
/**
 * Markdown RSS feed support.
 *
 * Outputs a <source:markdown> element in RSS feed items
 * for posts that have Markdown source content.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Output the source namespace declaration for RSS2 feeds.
 *
 * @since $$next-version$$
 * @return void
 */
function jetpack_markdown_rss_namespace() {
	echo 'xmlns:source="https://source.scripting.com/"';
}

/**
 * Output a source:markdown element for the current post in an RSS feed.
 *
 * Only outputs when the current post was written with Markdown
 * and has content stored in post_content_filtered.
 *
 * @since $$next-version$$
 * @return void
 */
function jetpack_markdown_rss_output_source_markdown() {
	$post = get_post();
	if ( ! $post ) {
		return;
	}

	if ( ! get_post_meta( $post->ID, WPCom_Markdown::IS_MD_META, true ) ) {
		return;
	}

	if ( empty( $post->post_content_filtered ) ) {
		return;
	}

	$markdown = str_replace( ']]>', ']]&gt;', $post->post_content_filtered );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Content is wrapped in CDATA with ]]> escaped.
	echo "\t\t<source:markdown><![CDATA[" . $markdown . "]]></source:markdown>\n";
}

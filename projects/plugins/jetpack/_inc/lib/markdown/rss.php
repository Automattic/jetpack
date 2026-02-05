<?php
/**
 * Markdown RSS feed support.
 *
 * Outputs a <source:markdown> element in RSS feed items.
 * Uses raw Markdown from post_content_filtered when available,
 * otherwise falls back to the rendered post content.
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
 * Uses raw Markdown from post_content_filtered when the post was written
 * with the Markdown module. Falls back to post_content for all other posts,
 * so the element is always present for RSS readers to consume.
 *
 * @since $$next-version$$
 * @return void
 */
function jetpack_markdown_rss_output_source_markdown() {
	$post = get_post();
	if ( ! $post ) {
		return;
	}

	if (
		get_post_meta( $post->ID, WPCom_Markdown::IS_MD_META, true )
		&& ! empty( $post->post_content_filtered )
	) {
		$content = $post->post_content_filtered;
	} elseif ( ! empty( $post->post_content ) ) {
		// Apply the_content filters to render Gutenberg blocks and shortcodes into clean HTML.
		$content = apply_filters( 'the_content', $post->post_content );
	} else {
		return;
	}

	$content = str_replace( ']]>', ']]&gt;', $content );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Content is wrapped in CDATA with ]]> escaped.
	echo "\t\t<source:markdown><![CDATA[" . $content . "]]></source:markdown>\n";
}

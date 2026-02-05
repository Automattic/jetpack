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
	static $output = false;
	if ( $output ) {
		return;
	}
	$output = true;
	echo 'xmlns:source="https://source.scripting.com/"';
}

/**
 * Check if post content contains any jetpack/markdown blocks.
 *
 * Uses WP_Block_Processor for efficient streaming detection
 * without parsing the full block tree.
 *
 * @since $$next-version$$
 * @param string $post_content The post content to check.
 * @return bool True if at least one jetpack/markdown block is found.
 */
function jetpack_markdown_rss_post_has_markdown_block( $post_content ) {
	$processor = new WP_Block_Processor( $post_content );
	return $processor->next_block( 'jetpack/markdown' );
}

/**
 * Output a source:markdown element for posts containing jetpack/markdown blocks.
 *
 * Scans post_content with WP_Block_Processor to find Markdown blocks,
 * replaces them with placeholders, renders the rest through the_content,
 * then splices raw Markdown source back in.
 *
 * @since $$next-version$$
 * @return void
 */
function jetpack_markdown_block_rss_output_source_markdown() {
	$post = get_post();
	if ( ! $post || empty( $post->post_content ) ) {
		return;
	}

	if ( ! class_exists( 'WP_Block_Processor' ) ) {
		return;
	}

	if ( ! jetpack_markdown_rss_post_has_markdown_block( $post->post_content ) ) {
		return;
	}

	// First pass: find Markdown blocks, extract sources, record byte offsets.
	$processor = new WP_Block_Processor( $post->post_content );
	$sources   = array();
	$regions   = array(); // Each entry: array( 'start' => int, 'end' => int ).
	$index     = 0;

	while ( $processor->next_block( 'jetpack/markdown' ) ) {
		$span        = $processor->get_span();
		$block_start = $span->start;
		$attrs       = $processor->allocate_and_return_parsed_attributes();
		$source      = ( is_array( $attrs ) && isset( $attrs['source'] ) ) ? $attrs['source'] : '';

		$sources[ $index ] = $source;

		// Advance past the full block (opener + innerHTML + closer).
		$processor->extract_full_block_and_advance();

		// After extraction, get_span() returns the span of the closer token.
		// Use start + length to find the byte offset right after the block.
		$next_span = $processor->get_span();
		$block_end = $next_span ? $next_span->start + $next_span->length : strlen( $post->post_content );

		$regions[ $index ] = array(
			'start' => $block_start,
			'end'   => $block_end,
		);

		++$index;
	}

	if ( empty( $sources ) ) {
		return;
	}

	// Build modified content with placeholders replacing Markdown blocks.
	$modified_content = '';
	$cursor           = 0;

	foreach ( $regions as $i => $region ) {
		// Append content before this block.
		$modified_content .= substr( $post->post_content, $cursor, $region['start'] - $cursor );
		// Insert placeholder.
		$modified_content .= '%%JETPACK_MARKDOWN_' . $i . '%%';
		$cursor            = $region['end'];
	}

	// Append any remaining content after the last block.
	$modified_content .= substr( $post->post_content, $cursor );

	// Render all non-Markdown content through the standard pipeline.
	$rendered = apply_filters( 'the_content', $modified_content );

	// Substitute placeholders with raw Markdown sources.
	foreach ( $sources as $i => $source ) {
		$rendered = str_replace( '%%JETPACK_MARKDOWN_' . $i . '%%', $source, $rendered );
	}

	$rendered = str_replace( ']]>', ']]&gt;', $rendered );

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Content is wrapped in CDATA with ]]> escaped.
	echo "\t\t<source:markdown><![CDATA[" . $rendered . "]]></source:markdown>\n";
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

	// If the post contains Markdown blocks, let the block function handle it.
	if (
		class_exists( 'WP_Block_Processor' )
		&& jetpack_markdown_rss_post_has_markdown_block( $post->post_content )
	) {
		return;
	}

	if (
		get_post_meta( $post->ID, '_wpcom_is_markdown', true )
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

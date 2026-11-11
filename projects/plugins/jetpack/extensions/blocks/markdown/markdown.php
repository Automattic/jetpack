<?php
/**
 * Markdown Block.
 *
 * @since 6.8.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Markdown;

use Automattic\Jetpack\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_email_callback' => __NAMESPACE__ . '\render_email',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render the block for an email.
 *
 * @param string $block_content     The saved block markup.
 * @param array  $parsed_block      The parsed block.
 * @param object $rendering_context The email rendering context.
 * @return string|null Rendered markup, or null to let the email engine render the block.
 */
function render_email( $block_content, array $parsed_block, $rendering_context ) {
	if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Fallback' ) ||
		! class_exists( 'WP_HTML_Tag_Processor' ) ) {
		return null;
	}

	$renderer = new \Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Fallback();

	return $renderer->render( make_content_email_safe( (string) $block_content ), $parsed_block, $rendering_context );
}

/**
 * Let a table cell or a code fence wrap, so it can't widen the whole email.
 *
 * Markdown saves rendered HTML, so these reach the email as plain `<table>` and `<pre>`
 * with none of the block classes the email engine styles. A cell or a line holding a word
 * too long to break then sets the width of the message and it scrolls sideways.
 *
 * @param string $html Block markup.
 * @return string
 */
function make_content_email_safe( $html ) {
	$styles = array(
		'TD'  => 'word-break: break-word;',
		'TH'  => 'word-break: break-word;',
		'PRE' => 'white-space: pre-wrap; word-break: break-word;',
	);

	$processor = new \WP_HTML_Tag_Processor( $html );

	while ( $processor->next_tag() ) {
		$tag = (string) $processor->get_tag();

		if ( ! isset( $styles[ $tag ] ) ) {
			continue;
		}

		$existing = rtrim( trim( (string) $processor->get_attribute( 'style' ) ), ';' );
		$processor->set_attribute( 'style', '' === $existing ? $styles[ $tag ] : $existing . '; ' . $styles[ $tag ] );
	}

	return $processor->get_updated_html();
}

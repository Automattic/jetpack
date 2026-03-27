<?php
/**
 * VideoPress video block email renderer class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Handles rendering VideoPress video blocks for email contexts.
 */
class Video_Block_Email_Renderer {

	/**
	 * Render VideoPress video block for email.
	 *
	 * @param string $block_content     The original block HTML content.
	 * @param array  $parsed_block      The parsed block data including attributes.
	 * @param object $rendering_context Email rendering context.
	 *
	 * @return string
	 */
	public static function render( $block_content, $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Validate input parameters and required dependencies.
		if ( ! isset( $parsed_block['attrs'] ) || ! is_array( $parsed_block['attrs'] ) ||
			! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Embed' ) ) {
			return '';
		}

		$attributes = $parsed_block['attrs'];

		// Get the VideoPress URL from the guid attribute.
		$videopress_url = self::get_videopress_url( $attributes );

		if ( empty( $videopress_url ) ) {
			return '';
		}

		// For private videos, render a simple link to the post since the video isn't accessible on VideoPress.
		// The isPrivate attribute is pre-computed by the block editor based on video and site settings.
		if ( isset( $attributes['isPrivate'] ) && true === $attributes['isPrivate'] ) {
			return self::render_link( $parsed_block );
		}

		// Create a mock embed block structure that WooCommerce's embed renderer can handle.
		// The embed renderer will detect VideoPress from the URL and render it appropriately.
		$mock_embed_block = array(
			'blockName' => 'core/embed',
			'attrs'     => array(
				'url'              => $videopress_url,
				'providerNameSlug' => 'videopress',
			),
			'innerHTML' => sprintf(
				'<figure class="wp-block-embed is-type-video is-provider-videopress"><div class="wp-block-embed__wrapper">%s</div></figure>',
				esc_url( $videopress_url )
			),
		);

		// Preserve email_attrs if present (used for spacing/width calculations).
		if ( ! empty( $parsed_block['email_attrs'] ) ) {
			$mock_embed_block['email_attrs'] = $parsed_block['email_attrs'];
		}

		// Use WooCommerce's core embed renderer.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
		$woo_embed_renderer = new \Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Embed();

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
		return $woo_embed_renderer->render( $mock_embed_block['innerHTML'], $mock_embed_block, $rendering_context );
	}

	/**
	 * Render a simple link for private VideoPress videos in emails.
	 * Links to the post containing the video since private videos aren't accessible on VideoPress.
	 *
	 * @param array $parsed_block The parsed block data.
	 *
	 * @return string The rendered link HTML.
	 */
	private static function render_link( $parsed_block ) {
		$post_url = get_the_permalink();

		if ( empty( $post_url ) ) {
			return '';
		}

		$link_text = __( 'Visit the post to watch the video', 'jetpack-videopress-pkg' );

		$link_html = sprintf(
			'<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
			esc_url( $post_url ),
			esc_html( $link_text )
		);

		// Wrap with spacing if email_attrs are present.
		$email_attrs = $parsed_block['email_attrs'] ?? array();
		if ( ! empty( $email_attrs['padding'] ) ) {
			$link_html = sprintf(
				'<p style="padding: %s;">%s</p>',
				esc_attr( $email_attrs['padding'] ),
				$link_html
			);
		}

		return $link_html;
	}

	/**
	 * Get the VideoPress URL from block attributes for email rendering.
	 *
	 * @param array $attributes Block attributes.
	 *
	 * @return string VideoPress URL or empty string.
	 */
	private static function get_videopress_url( $attributes ) {
		// Construct URL from guid attribute.
		if ( ! empty( $attributes['guid'] ) ) {
			$guid = $attributes['guid'];

			// VideoPress guids are alphanumeric only (e.g., "nfbj0J36").
			// Validate format to prevent any injection issues.
			if ( preg_match( '/^[a-zA-Z0-9]+$/', $guid ) ) {
				return 'https://videopress.com/v/' . $guid;
			}
		}

		return '';
	}
}

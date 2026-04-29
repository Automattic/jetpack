<?php
/**
 * Plan checks and email rendering for the core/audio block.
 *
 * @package automattic/jetpack
 **/

namespace Automattic\Jetpack\Extensions\Core_Audio;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Populate the available extensions with core/audio.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			(array) $extensions,
			array(
				'core/audio',
			)
		);
	}
);

// Set the core/audio block availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_availability_for_plan( 'core/audio' );
	}
);

// Inject a render_email_callback onto core/audio so that newsletter emails link
// to the host post permalink instead of the raw audio file URL.
add_filter(
	'register_block_type_args',
	function ( $args, $block_type ) {
		if ( 'core/audio' !== $block_type ) {
			return $args;
		}

		// Respect any callback that beat us (e.g. a host platform setting its own).
		if ( ! empty( $args['render_email_callback'] ) ) {
			return $args;
		}

		$args['render_email_callback'] = __NAMESPACE__ . '\render_email';
		return $args;
	},
	10,
	2
);

/**
 * Render the core/audio block for newsletter emails.
 *
 * The default WooCommerce Email Editor audio renderer turns the `<audio src>`
 * value into the link href — for core/audio that is the raw audio URL, which
 * sends subscribers to a black page playing the file. Swap the src for the
 * host post permalink before delegating to the WooCommerce renderer.
 *
 * @since $$next-version$$
 *
 * @param string $block_content     The original block HTML content.
 * @param array  $parsed_block      The parsed block data including attributes.
 * @param object $rendering_context Email rendering context.
 *
 * @return string
 */
function render_email( $block_content, array $parsed_block, $rendering_context ) {
	if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Audio' ) ) {
		return '';
	}

	$post_url = get_the_permalink();

	if ( empty( $post_url ) ) {
		return '';
	}

	$escaped_post_url   = esc_url( $post_url );
	$block_content_html = sprintf( '<audio src="%s"></audio>', $escaped_post_url );

	$mock_parsed_block = array(
		'attrs' => array(
			'src'   => $escaped_post_url,
			'label' => __( 'Listen to the audio', 'jetpack' ),
		),
	);

	if ( ! empty( $parsed_block['email_attrs'] ) ) {
		$mock_parsed_block['email_attrs'] = $parsed_block['email_attrs'];
	}

	$woo_audio_renderer = new \Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Audio();

	return $woo_audio_renderer->render( $block_content_html, $mock_parsed_block, $rendering_context );
}

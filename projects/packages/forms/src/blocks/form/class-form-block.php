<?php
/**
 * Form Block.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

use Automattic\Jetpack\Blocks;

/**
 * Form block registration and rendering.
 * This block allows inserting reusable forms from the forms library.
 */
class Form_Block {
	/**
	 * Register the Form block.
	 * This block only registers when the reusable-forms feature flag is enabled.
	 */
	public static function register_block() {
		// Point to the dist folder where the compiled block.json and assets are
		$block_dir = dirname( __DIR__, 3 ) . '/dist/blocks/form';

		Blocks::jetpack_register_block(
			$block_dir,
			array(
				'render_callback' => array( __CLASS__, 'render' ),
			)
		);
	}

	/**
	 * Render the form block.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string
	 */
	public static function render( $atts, $content = '' ) {
		// Get the form reference ID
		$ref = isset( $atts['ref'] ) ? absint( $atts['ref'] ) : 0;

		if ( ! $ref ) {
			return '';
		}

		unset( $content );

		// Get the referenced form post
		$form_post = get_post( $ref );

		// Verify the post exists and is a jetpack-form post type
		if ( ! $form_post || 'jetpack-form' !== $form_post->post_type ) {
			return '';
		}

		// Return the form content rendered with do_blocks
		return do_blocks( $form_post->post_content );
	}
}

<?php
/**
 * Subscriptions Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form;

/**
 * Contact Form block render callback.
 */
class Contact_Form_Block {
	/**
	 * Register the Contact Form block.
	 */
	public static function register_block() {
		Blocks::jetpack_register_block(
			'jetpack/contact-form',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_form' ),
			)
		);
	}

	/**
	 * Render the gutenblock form.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string
	 */
	public static function gutenblock_render_form( $atts, $content ) {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'load_editor_scripts' ) );

		self::load_view_scripts();

		return Contact_Form::parse( $atts, do_blocks( $content ) );
	}

	/**
	 * Loads scripts
	 */
	public static function load_editor_scripts() {
		Assets::register_script(
			'jp-forms-blocks',
			'../../../dist/blocks/editor.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-forms',
				'enqueue'    => true,
			)
		);
	}

	/**
	 * Loads scripts
	 */
	public static function load_view_scripts() {
		Assets::register_script(
			'jp-forms-blocks',
			'../../../dist/blocks/view.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-forms',
				'enqueue'    => true,
			)
		);
	}
}

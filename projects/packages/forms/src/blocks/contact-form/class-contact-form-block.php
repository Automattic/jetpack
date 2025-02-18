<?php
/**
 * Contact Form Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Jetpack;

/**
 * Contact Form block render callback.
 */
class Contact_Form_Block {
	/**
	 * Register the Contact Form block.
	 * We are core block only wether jetpack contact form plugin
	 * is active or not. This is allowing us to make it more discoverable
	 * and enable plugin in one click
	 */
	public static function register_block() {
		Blocks::jetpack_register_block(
			'jetpack/contact-form',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_form' ),
			)
		);

		add_filter( 'render_block_data', array( __CLASS__, 'find_nested_html_block' ), 10, 3 );
		add_filter( 'render_block_core/html', array( __CLASS__, 'render_wrapped_html_block' ), 10, 2 );
	}

	/**
	 *  Find nested html block that reside in the contact form block.
	 *  We are using this to wrap the html block with div if it is nested inside contact form block. So that the elements render as expected.
	 *
	 *  @param array  $parsed_block - the parsed block.
	 *  @param array  $source_block - the source block.
	 *  @param object $parent_block - the parent WP_Block.
	 *
	 *  @return array
	 */
	public static function find_nested_html_block( $parsed_block, $source_block, $parent_block ) {
		if ( $parsed_block['blockName'] === 'core/html' && isset( $parent_block->parsed_block ) && $parent_block->parsed_block['blockName'] === 'jetpack/contact-form' ) {
			$parsed_block['hasJPFormParent'] = true;
		}
		return $parsed_block;
	}

	/**
	 * Render wrapped html block that is inside the form block with a wrapped div so that the elements render as expected.
	 * The extra div is needed because the form block has a `flex: 0 0 100%;` applied to all the children of the form block.
	 * This cases all the elementes inside the block to render in a single line and make it not possible to add have inline elements.
	 *
	 * @param string $content - the content of the block.
	 * @param array  $parsed_block - the parsed block.
	 *
	 * @return string
	 */
	public static function render_wrapped_html_block( $content, $parsed_block ) {
		if ( ! empty( $parsed_block['hasJPFormParent'] ) ) {
			return '<div>' . $content . '</div>';
		}

		return $content;
	}

	/**
	 * Register the Child blocks of Contact Form
	 * We are registering child blocks only when Contact Form plugin is Active
	 */
	public static function register_child_blocks() {
		// Field render methods.
		Blocks::jetpack_register_block(
			'jetpack/field-text',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_text' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-name',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_name' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-email',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_email' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-url',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_url' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-date',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_date' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-telephone',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_telephone' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-textarea',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_textarea' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-checkbox',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_checkbox' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-checkbox-multiple',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_checkbox_multiple' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-option-checkbox',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_option' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-radio',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_radio' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-option-radio',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_option' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-select',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_select' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-consent',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_consent' ),
			)
		);

		Blocks::jetpack_register_block(
			'jetpack/field-number',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_number' ),
			)
		);

		$blocks_variation = apply_filters( 'jetpack_blocks_variation', \Automattic\Jetpack\Constants::get_constant( 'JETPACK_BLOCKS_VARIATION' ) );
		if ( 'beta' === $blocks_variation ) {
			self::register_beta_blocks();
		}
	}

	/**
	 * Register beta blocks
	 */
	private static function register_beta_blocks() {
		Blocks::jetpack_register_block(
			'jetpack/field-file',
			array(
				'render_callback' => array( Contact_Form_Plugin::class, 'gutenblock_render_field_file' ),
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
		// We should not render block is module is disabled
		if ( ! Jetpack::is_module_active( 'contact-form' ) ) {
			return '';
		}
		// Render fallback in other contexts than frontend (i.e. feed, emails, API, etc.), unless the form is being submitted.
		if ( ! jetpack_is_frontend() && ! isset( $_POST['contact-form-id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return sprintf(
				'<div class="%1$s"><a href="%2$s" target="_blank" rel="noopener noreferrer">%3$s</a></div>',
				esc_attr( Blocks::classes( 'contact-form', $atts ) ),
				esc_url( get_the_permalink() ),
				esc_html__( 'Submit a form.', 'jetpack-forms' )
			);
		}

		self::load_view_scripts();

		return Contact_Form::parse( $atts, do_blocks( $content ) );
	}

	/**
	 * Loads scripts
	 */
	public static function load_editor_scripts() {

		$handle = 'jp-forms-blocks';

		Assets::register_script(
			$handle,
			'../../../dist/blocks/editor.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-forms',
				'enqueue'    => true,
			)
		);

		// Create a Contact_Form instance to get the default values
		$contact_form = new Contact_Form( array() );
		$defaults     = $contact_form->defaults;

		$data = array(
			'defaults' => array(
				'to'      => $defaults['to'],
				'subject' => $defaults['subject'],
			),
		);

		wp_add_inline_script( $handle, 'window.jpFormsBlocks = ' . wp_json_encode( $data ) . ';', 'before' );
	}

	/**
	 * Loads scripts
	 */
	public static function load_view_scripts() {
		if ( is_admin() ) {
			// A block's view assets will not be required in wp-admin.
			return;
		}

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

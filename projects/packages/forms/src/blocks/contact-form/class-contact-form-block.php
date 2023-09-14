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
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_text' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-name',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_name' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-email',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_email' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-url',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_url' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-date',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_date' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-telephone',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_telephone' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-textarea',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_textarea' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-checkbox',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_checkbox' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-checkbox-multiple',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_checkbox_multiple' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-option-checkbox',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_option' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-radio',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_radio' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-option-radio',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_option' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-select',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_select' ),
			)
		);
		Blocks::jetpack_register_block(
			'jetpack/field-consent',
			array(
				'render_callback' => array( __CLASS__, 'gutenblock_render_field_consent' ),
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

	/**
	 * Turn block attribute to shortcode attributes.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $type - the type.
	 *
	 * @return array
	 */
	public static function block_attributes_to_shortcode_attributes( $atts, $type ) {
		$atts['type'] = $type;
		if ( isset( $atts['className'] ) ) {
			$atts['class'] = $atts['className'];
			unset( $atts['className'] );
		}

		if ( isset( $atts['defaultValue'] ) ) {
			$atts['default'] = $atts['defaultValue'];
			unset( $atts['defaultValue'] );
		}

		return $atts;
	}

	/**
	 * Render the text field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_text( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'text' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the name field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_name( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'name' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the email field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_email( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'email' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the url field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_url( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'url' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the date field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_date( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'date' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the telephone field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_telephone( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'telephone' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the text area field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_textarea( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'textarea' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the checkbox field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_checkbox( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'checkbox' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the multiple checkbox field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_checkbox_multiple( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'checkbox-multiple' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the multiple choice field option.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_option( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'field-option' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the radio button field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_radio( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'radio' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the select field.
	 *
	 * @param array  $atts - the block attributes.
	 * @param string $content - html content.
	 *
	 * @return string HTML for the contact form field.
	 */
	public static function gutenblock_render_field_select( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'select' );
		return Contact_Form::parse_contact_field( $atts, $content );
	}

	/**
	 * Render the consent field.
	 *
	 * @param string $atts consent attributes.
	 * @param string $content html content.
	 */
	public static function gutenblock_render_field_consent( $atts, $content ) {
		$atts = self::block_attributes_to_shortcode_attributes( $atts, 'consent' );

		if ( ! isset( $atts['implicitConsentMessage'] ) ) {
			$atts['implicitConsentMessage'] = __( "By submitting your information, you're giving us permission to email you. You may unsubscribe at any time.", 'jetpack-forms' );
		}

		if ( ! isset( $atts['explicitConsentMessage'] ) ) {
			$atts['explicitConsentMessage'] = __( 'Can we send you an email from time to time?', 'jetpack-forms' );
		}

		return Contact_Form::parse_contact_field( $atts, $content );
	}
}

<?php
/**
 * Form Field Text Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

use Automattic\Jetpack\Blocks;

/**
 * Field Text Block.
 */
class Field_Text_Block {
	/**
	 * Register the text field block.
	 * Registers a block for a text input field that can be used in forms.
	 */
	public static function register_block() {
		Blocks::jetpack_register_block(
			'jetpack/field-text',
			array(
				'render_callback' => array( __CLASS__, 'render' ),
				'attributes'      => array(
					'required' => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'requiredText' => array(
						'type'    => 'string',
						'default' => __( '(required)', 'jetpack-forms' ),
					),
					'label'    => array(
						'type'    => 'string',
						'default' => __( 'Text', 'jetpack-forms' ),
					),
				),
			)
		);
	}

	/**
	 * Returns the computed field value for a field. It uses the POST, GET, Logged in data.
	 *
	 * @module contact-form
	 *
	 * @param string $field_id The field id.
	 *
	 * @return string
	 */
	private static function get_value( $field_id ) {
		// Use the POST Field if it is available.
		if ( isset( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			if ( is_array( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
				return array_map( 'sanitize_textarea_field', wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			}

			return Contact_Form_Plugin::strip_tags( sanitize_textarea_field( wp_unslash( $_POST[ $field_id ] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
		}

		// Use the GET Field if it is available.
		if ( isset( $_GET[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
			if ( is_array( $_GET[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
				return array_map( 'sanitize_textarea_field', wp_unslash( $_GET[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
			}

			return Contact_Form_Plugin::strip_tags( sanitize_textarea_field( wp_unslash( $_GET[ $field_id ] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
		}
	}

	/**
	 * Checks if the current request requires field validation.
	 *
	 * Validates that:
	 * - The request is a form submission
	 * - The form ID matches
	 * - The form hash matches to prevent tampering
	 *
	 * @todo Add form hash and ID, possibly via block context
	 * @return bool Whether validation is required
	 */
	private static function requires_validation() {
		// TODO - we don't have the form hash or id.
		// The id can be provided via block context.
		// The form hash looks to be a sha1 of all the form attributes.
		// Maybe this can be processed via a filter and provided by block context from the form block.
		$form_hash = 'TODO';
		$form_id   = 'TODO';

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		return (
			isset( $_POST['action'] ) &&
			'grunion-contact-form' === $_POST['action'] &&
			isset( $_POST['contact-form-id'] ) &&
			(string) $form_id === $_POST['contact-form-id'] &&
			isset( $_POST['contact-form-hash'] ) &&
			is_string( $_POST['contact-form-hash'] ) &&
			hash_equals( $form_hash, wp_unslash( $_POST['contact-form-hash'] ) )
		);
		// phpcs:enable WordPress.Security.NonceVerification.Missing
	}

	/**
	 * Get validation errors for a text field.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $value The field value.
	 * @return string|null The validation error message if validation fails, null otherwise.
	 */
	private static function get_validation_errors( $attributes, $value ) {
			// TODO - the shortcode also sets validation errors on the parent form (via an `add_error` method).
		// We need to find a way to replicate this behavior. Child blocks can't traditionally pass data to a parent.
		// Possible solutions
		// - Use the interactivity API (somehow).
		// - Use a view script to scrape for field errors and accumulate them.
		// - Use some kind of singleton form object that can store errors per form id.
		// Ideally, in the future there may also be a 'Form Errors' block that can be used to display errors.
		// Think about a way that would work nicely with such a block.

		if ( ! is_string( $value ) || ! strlen( trim( $value ) ) ) {
			/* translators: %s is the name of a form field */
			return sprintf( __( '%s is required', 'jetpack-forms' ), $attributes['label'] );
		}
	}

	/**
	 * Render a text field block.
	 *
	 * @param array $attributes The block attributes.
	 * @return string The rendered text field HTML.
	 */
	public static function render( $attributes, $content, $block ) {
		$form_id = $block->context['jetpack/contact-form/id'];
		$form_hash = $block->context['jetpack/contact-form/hash'];

		$should_validate   = $attributes['required'] && self::requires_validation( $form_id, $form_hash );
		$validation_errors = null;
		$value             = self::get_value( $attributes['id'] );


		if ( $should_validate ) {
			$validation_errors = self::get_validation_errors( $attributes, $value );
		}

		$is_required           = ! empty( $attributes['required'] );
		$required_label_markup = '';
		if ( $is_required ) {
			$required_label_text   =
				wp_kses_post( apply_filters( 'jetpack_required_field_text', $attributes['requiredText'] ) );
			$required_label_markup =
				'<span class="grunion-label-required" aria-hidden="true">'
				. $required_label_text
				. '</span>';
		}

		$label_classes = array( 'grunion-field-label', 'text' );
		if ( ! empty( $validation_errors ) ) {
			$label_classes[] = 'form-error';
		}

		$label = sprintf(
			'<label for="%s" class="%s">%s%s</label>',
			esc_attr( $attributes['id'] ),
			implode( ' ', $label_classes ),
			wp_kses_post( $attributes['label'] ),
			$required_label_markup
		);

		$id               = esc_attr( $attributes['id'] );
		$input_attributes = array(
			'type="text"',
			'name="' . $id . '"',
			'id="' . $id . '"',
		);
		if ( ! empty( $attributes['defaultValue'] ) ) {
			$defaulted_value    = esc_attr( $attributes['defaultValue'] );
			$input_attributes[] = 'value="' . $defaulted_value . '"';
		}
		if ( ! empty( $attributes['placeholder'] ) ) {
			$placeholder_value  = esc_attr( $attributes['placeholder'] );
			$input_attributes[] = "placeholder=\"$placeholder_value\"";
		}
		if ( $is_required ) {
			$input_attributes[] = 'aria-required="true"';
		}
		$input_classes = array( 'grunion-field', 'text' );
		$input         = sprintf(
			'<input class="%s" %s />',
			implode( ' ', $input_classes ),
			implode( ' ', $input_attributes )
		);

		$field_classes = array( 'grunion-field-wrap', 'grunion-field-name-wrap' );
		if ( empty( $attributes['label'] ) ) {
			$field_classes[] = 'no-label';
		}
		if ( ! empty( $attributes['width'] ) ) {
			$width           = $attributes['width'];
			$field_classes[] = "grunion-field-width-$width-wrap";
		}

		return sprintf(
			'<div class="%s">%s%s</div>',
			implode( ' ', $field_classes ),
			$label,
			$input
		);
	}
}

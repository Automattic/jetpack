<?php
/**
 * Jetpack CRM integration for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field;

/**
 * Tells Jetpack CRM which contact field each form field fills.
 *
 * Jetpack CRM's own submission handler only maps a field onto a contact when the field's
 * id is `jetpackcrm-<contact key>`, which the form editor has no way to set. This passes
 * that handler copies of the fields carrying those ids, so the CRM keeps doing the saving.
 */
class Jetpack_CRM_Integration {

	/**
	 * Jetpack CRM's callback on `grunion_after_feedback_post_inserted`.
	 *
	 * @var string
	 */
	const CRM_HANDLER = 'zero_bs_crm_capture_jetpack_form';

	/**
	 * The id prefix Jetpack CRM reads a contact field key from.
	 *
	 * @var string
	 */
	const CRM_FIELD_PREFIX = 'jetpackcrm-';

	/**
	 * Hands the submission to Jetpack CRM's handler with its fields mapped to contact keys.
	 *
	 * Hooked ahead of the CRM's own callback, which it unhooks so the submission is saved once.
	 *
	 * @param int                  $post_id      The feedback post ID.
	 * @param Contact_Form_Field[] $fields       The submitted fields.
	 * @param bool                 $is_spam      Whether the submission is spam.
	 * @param array                $entry_values The feedback entry values.
	 */
	public static function handle_jetpack_crm_integration( $post_id, $fields, $is_spam, $entry_values ) {
		$crm_priority = has_action( 'grunion_after_feedback_post_inserted', self::CRM_HANDLER );
		$our_priority = has_action( 'grunion_after_feedback_post_inserted', array( self::class, 'handle_jetpack_crm_integration' ) );

		// The CRM's callback has to be still to come, or the submission would be saved twice.
		if ( false === $crm_priority || ! function_exists( self::CRM_HANDLER ) || $crm_priority <= $our_priority ) {
			return;
		}

		remove_action( 'grunion_after_feedback_post_inserted', self::CRM_HANDLER, $crm_priority );

		call_user_func( self::CRM_HANDLER, $post_id, self::map_fields( (array) $fields ), $is_spam, $entry_values );
	}

	/**
	 * Returns the fields with each one that matches a contact field renamed to its CRM key.
	 *
	 * Fields are cloned, never changed, because the other integrations read the same objects.
	 *
	 * @param Contact_Form_Field[] $fields The submitted fields.
	 * @return Contact_Form_Field[]
	 */
	public static function map_fields( array $fields ) {
		$custom_fields = self::get_contact_custom_fields();
		$claimed       = array();

		// Ids the form author already prefixed win over anything inferred here.
		foreach ( $fields as $field ) {
			$id = (string) $field->get_attribute( 'id' );
			if ( str_starts_with( $id, self::CRM_FIELD_PREFIX ) ) {
				$claimed[ substr( $id, strlen( self::CRM_FIELD_PREFIX ) ) ] = true;
			}
		}

		$mapped = array();
		foreach ( $fields as $key => $field ) {
			$id = (string) $field->get_attribute( 'id' );
			if ( str_starts_with( $id, self::CRM_FIELD_PREFIX ) || ! self::has_value( $field ) ) {
				$mapped[ $key ] = $field;
				continue;
			}

			$values = self::get_contact_values( $field, $custom_fields );

			/**
			 * Filters the Jetpack CRM contact fields a form field fills.
			 *
			 * @since $$next-version$$
			 *
			 * @param array              $values Submitted values keyed by CRM contact field key,
			 *                                   such as `fname`, `email` or a custom field slug.
			 * @param Contact_Form_Field $field  The form field.
			 */
			$values = (array) apply_filters( 'jetpack_forms_jetpack_crm_contact_values', $values, $field );

			$unclaimed = array_diff_key( $values, $claimed );
			if ( empty( $unclaimed ) ) {
				$mapped[ $key ] = $field;
				continue;
			}

			foreach ( $unclaimed as $crm_key => $value ) {
				$copy                   = clone $field;
				$copy->attributes['id'] = self::CRM_FIELD_PREFIX . $crm_key;
				$copy->value            = $value;
				$mapped[ $key . '|' . self::CRM_FIELD_PREFIX . $crm_key ] = $copy;
				$claimed[ $crm_key ]                                      = true;
			}
		}

		return $mapped;
	}

	/**
	 * Works out which contact fields a form field fills.
	 *
	 * @param Contact_Form_Field $field         The form field.
	 * @param array              $custom_fields CRM contact custom field keys, keyed by normalized label.
	 * @return array Values keyed by CRM contact field key.
	 */
	private static function get_contact_values( $field, array $custom_fields ) {
		$id    = (string) $field->get_attribute( 'id' );
		$value = $field->value;

		switch ( $field->get_attribute( 'type' ) ) {
			case 'email':
				return array( 'email' => $value );

			case 'telephone':
			case 'phone':
				return array( 'hometel' => $value );

			case 'name':
				if ( preg_match( '/^first-?name(?:-\d+)?$/', $id ) ) {
					return array( 'fname' => $value );
				}
				if ( preg_match( '/^last-?name(?:-\d+)?$/', $id ) ) {
					return array( 'lname' => $value );
				}
				if ( ! is_string( $value ) ) {
					return array();
				}
				$parts = explode( ' ', trim( $value ), 2 );
				return array_filter(
					array(
						'fname' => $parts[0],
						'lname' => $parts[1] ?? '',
					),
					'strlen'
				);
		}

		$label = self::normalize( (string) $field->get_attribute( 'label' ) );
		if ( '' !== $label && isset( $custom_fields[ $label ] ) ) {
			return array( $custom_fields[ $label ] => $value );
		}

		return array();
	}

	/**
	 * Lists Jetpack CRM's contact custom fields, so form fields can be matched to them by label.
	 *
	 * @return array Custom field keys, keyed by both their normalized label and their key.
	 */
	private static function get_contact_custom_fields() {
		global $zbs;

		if ( ! defined( 'ZBS_TYPE_CONTACT' ) || ! isset( $zbs->DAL ) || ! method_exists( $zbs->DAL, 'getActiveCustomFields' ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			return array();
		}

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$fields = $zbs->DAL->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_CONTACT ) );

		$by_label = array();
		foreach ( (array) $fields as $key => $definition ) {
			$by_label[ self::normalize( (string) $key ) ] = (string) $key;
			if ( is_array( $definition ) && isset( $definition[1] ) ) {
				$by_label[ self::normalize( (string) $definition[1] ) ] = (string) $key;
			}
		}

		return $by_label;
	}

	/**
	 * Reduces a label or key to lowercase letters and digits, so "Job title" matches `job-title`.
	 *
	 * @param string $text The label or key.
	 * @return string
	 */
	private static function normalize( $text ) {
		return (string) preg_replace( '/[^a-z0-9]/', '', strtolower( wp_strip_all_tags( $text ) ) );
	}

	/**
	 * Whether the visitor filled the field in.
	 *
	 * @param Contact_Form_Field $field The form field.
	 * @return bool
	 */
	private static function has_value( $field ) {
		return isset( $field->value ) && '' !== $field->value && array() !== $field->value;
	}
}

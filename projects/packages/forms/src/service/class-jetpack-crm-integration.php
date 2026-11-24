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
 * Jetpack CRM maps a field by id only when it is `jetpackcrm-<contact key>`, which authors
 * rarely set, and otherwise guesses one email, phone and name. This hands its handler copies
 * of the fields it can't guess (last name, custom fields) under those ids; CRM does the rest.
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
	 * Puts this integration in place of Jetpack CRM's handler for the current submission.
	 *
	 * Called only for forms with the Jetpack CRM integration on, and a no-op without Jetpack CRM.
	 */
	public static function register_for_submission() {
		$priority = has_action( 'grunion_after_feedback_post_inserted', self::CRM_HANDLER );
		if ( false === $priority ) {
			return;
		}

		// Same slot as the CRM's callback, so the contact is saved once and in the same order.
		remove_action( 'grunion_after_feedback_post_inserted', self::CRM_HANDLER, $priority );
		add_action( 'grunion_after_feedback_post_inserted', array( self::class, 'handle_jetpack_crm_integration' ), $priority, 4 );
	}

	/**
	 * Hands the submission to Jetpack CRM's handler with its fields mapped to contact keys.
	 *
	 * @param int                  $post_id      The feedback post ID.
	 * @param Contact_Form_Field[] $fields       The submitted fields.
	 * @param bool                 $is_spam      Whether the submission is spam.
	 * @param array                $entry_values The feedback entry values.
	 */
	public static function handle_jetpack_crm_integration( $post_id, $fields, $is_spam, $entry_values ) {
		// Jetpack CRM ignores spam too.
		if ( $is_spam ) {
			return;
		}

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
		$custom_fields = null;

		// Ids the form author already prefixed win over anything inferred here.
		$explicit = array();
		foreach ( $fields as $key => $field ) {
			$id = (string) $field->get_attribute( 'id' );
			if ( str_starts_with( $id, self::CRM_FIELD_PREFIX ) ) {
				$explicit[ $key ] = substr( $id, strlen( self::CRM_FIELD_PREFIX ) );
			}
		}
		$claimed = array_fill_keys( $explicit, true );

		$mapped = array();
		foreach ( $fields as $key => $field ) {
			$unclaimed = array();
			if ( ! isset( $explicit[ $key ] ) && self::has_value( $field ) ) {
				/**
				 * Filters the Jetpack CRM contact fields a form field fills.
				 *
				 * @since $$next-version$$
				 *
				 * @param array              $values Submitted values keyed by CRM contact field key,
				 *                                   such as `fname`, `email` or a custom field slug.
				 * @param Contact_Form_Field $field  The form field.
				 */
				$values    = (array) apply_filters( 'jetpack_forms_jetpack_crm_contact_values', self::get_contact_values( $field, $custom_fields ), $field );
				$unclaimed = array_diff_key( $values, $claimed );
			}

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
	 * @param array|null         $custom_fields CRM contact custom field keys by normalized label; loaded on first use.
	 * @return array Values keyed by CRM contact field key.
	 */
	private static function get_contact_values( $field, &$custom_fields ) {
		$id    = (string) $field->get_attribute( 'id' );
		$value = is_string( $field->value ) ? trim( $field->value ) : $field->value;

		// CRM's own fallback handles email, phone and a single Name field.
		if ( 'name' === $field->get_attribute( 'type' ) ) {
			if ( preg_match( '/^first-name(?:-\d+)?$/', $id ) ) {
				return array( 'fname' => $value );
			}
			if ( preg_match( '/^last-name(?:-\d+)?$/', $id ) ) {
				return array( 'lname' => $value );
			}
			return array();
		}

		$label = self::normalize( (string) $field->get_attribute( 'label' ) );
		if ( '' === $label ) {
			return array();
		}

		$custom_fields ??= self::get_contact_custom_fields();

		return isset( $custom_fields[ $label ] ) ? array( $custom_fields[ $label ] => $value ) : array();
	}

	/**
	 * Lists Jetpack CRM's contact custom fields, so form fields can be matched to them by label.
	 *
	 * @return array Custom field keys, keyed by both their normalized label and their key.
	 */
	private static function get_contact_custom_fields() {
		global $zbs;

		$dal = $zbs->DAL ?? null; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( ! defined( 'ZBS_TYPE_CONTACT' ) || ! is_object( $dal ) || ! method_exists( $dal, 'getActiveCustomFields' ) ) {
			return array();
		}

		$by_label = array();
		foreach ( (array) $dal->getActiveCustomFields( array( 'objtypeid' => ZBS_TYPE_CONTACT ) ) as $key => $definition ) {
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
	 * Whether the visitor filled the field in; whitespace alone doesn't count.
	 *
	 * @param Contact_Form_Field $field The form field.
	 * @return bool
	 */
	private static function has_value( $field ) {
		$value = $field->value ?? null;
		if ( is_array( $value ) ) {
			return array() !== array_filter(
				$value,
				static function ( $item ) {
					return is_scalar( $item ) && '' !== trim( (string) $item );
				}
			);
		}
		return is_scalar( $value ) && '' !== trim( (string) $value );
	}
}

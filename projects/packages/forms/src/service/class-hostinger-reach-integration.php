<?php
/**
 * Hostinger Reach Integration for Jetpack Contact Forms.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Feedback;

/**
 * Class Hostinger_Reach_Integration
 *
 * Scaffolding for handling integration with Hostinger Reach for Jetpack Contact Forms.
 * Public API docs are limited; this class mirrors the structure of MailPoet_Integration
 * and will be implemented once the Hostinger Reach plugin APIs are confirmed.
 */
class Hostinger_Reach_Integration {
	/**
	 * Placeholder for a Hostinger Reach API instance, if needed later.
	 *
	 * @var mixed
	 */
	protected static $hostinger_api = null;

	/**
	 * Submit contact to Hostinger Reach.
	 *
	 * @param mixed  $api_handler     Reach API handler.
	 * @param array  $subscriber_data Associative array: email, first_name, last_name.
	 * @param string $group_name      Target group name.
	 * @return void
	 */
	protected static function submit_contact( $api_handler, array $subscriber_data, $group_name ) {
		if ( ! $api_handler || empty( $subscriber_data['email'] ) ) {
			return;
		}

		$subscriber_data['group'] = $group_name;
		$api_handler->post_contact( $subscriber_data );
	}

	/**
	 * Get the Hostinger Reach API instance.
	 *
	 * @return mixed
	 */
	protected static function get_api() {
		if (
			null === self::$hostinger_api
			// @phan-suppress-next-line PhanUndeclaredClassReference
			&& class_exists( \Hostinger\Reach\Api\Handlers\ReachApiHandler::class )
			// @phan-suppress-next-line PhanUndeclaredClassReference
			&& class_exists( \Hostinger\Reach\Functions::class )
			// @phan-suppress-next-line PhanUndeclaredClassReference
			&& class_exists( \Hostinger\Reach\Api\ApiKeyManager::class )
		) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			self::$hostinger_api = new \Hostinger\Reach\Api\Handlers\ReachApiHandler(
				// @phan-suppress-next-line PhanUndeclaredClassMethod
				new \Hostinger\Reach\Functions(),
				// @phan-suppress-next-line PhanUndeclaredClassMethod
				new \Hostinger\Reach\Api\ApiKeyManager()
			);
		}

		return self::$hostinger_api;
	}

	/**
	 * Get group name from form attributes, falling back to 'Jetpack Forms'.
	 *
	 * @param mixed $form Contact form instance.
	 * @return string
	 */
	protected static function get_group_name( $form ) {
		$group_name = ! empty( $form->attributes['hostingerReach']['groupName'] ?? '' )
			? trim( $form->attributes['hostingerReach']['groupName'] )
			: 'Jetpack Forms';
		return $group_name;
	}

	/**
	 * Extract subscriber data (email, first_name, last_name) using Feedback API (v2 storage).
	 *
	 * @param Feedback $feedback Feedback object for the submission.
	 * @return array Associative array with at least 'email', optionally 'first_name', 'last_name'. Empty array if no email found.
	 */
	protected static function get_subscriber_data( $feedback ) {
		if ( ! $feedback->get_author_email() ) {
			return array();
		}

		$subscriber_data          = array();
		$subscriber_data['email'] = $feedback->get_author_email();

		if ( $feedback->get_field_value_by_label( 'First Name' ) ) {
			$subscriber_data['name'] = $feedback->get_field_value_by_label( 'First Name' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'firstname' ) ) {
			$subscriber_data['name'] = $feedback->get_field_value_by_form_field_id( 'firstname' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'first-name' ) ) {
			$subscriber_data['name'] = $feedback->get_field_value_by_form_field_id( 'first-name' );
		}
		if ( $feedback->get_field_value_by_label( 'Last Name' ) ) {
			$subscriber_data['surname'] = $feedback->get_field_value_by_label( 'Last Name' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'lastname' ) ) {
			$subscriber_data['surname'] = $feedback->get_field_value_by_form_field_id( 'lastname' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'last-name' ) ) {
			$subscriber_data['surname'] = $feedback->get_field_value_by_form_field_id( 'last-name' );
		}

		return $subscriber_data;
	}

	/**
	 * Extract subscriber data (email, first_name, last_name) from legacy field data (v1 storage).
	 *
	 * @param array $fields Collection of Contact_Form_Field instances.
	 * @return array Associative array with at least 'email', optionally 'first_name', 'last_name'. Empty array if no email found.
	 */
	protected static function get_subscriber_data_from_fields( $fields ) {
		// Try and get the form from any of the fields
		$form = null;
		foreach ( $fields as $field ) {
			if ( ! empty( $field->form ) ) {
				$form = $field->form;
				break;
			}
		}
		if ( ! $form || ! is_a( $form, 'Automattic\\Jetpack\\Forms\\ContactForm\\Contact_Form' ) ) {
			return array();
		}

		$subscriber_data = array();

		foreach ( $form->fields as $field ) {
			$id    = strtolower( str_replace( array( ' ', '_' ), '', $field->get_attribute( 'id' ) ) );
			$label = strtolower( str_replace( array( ' ', '_' ), '', $field->get_attribute( 'label' ) ) );

			if ( ! is_string( $field->value ) ) {
				continue;
			}

			$value = trim( $field->value );

			if ( ( $id === 'email' || $label === 'email' ) && ! empty( $value ) ) {
				$subscriber_data['email'] = $value;
			} elseif ( ( $id === 'firstname' || $label === 'firstname' ) && ! empty( $value ) ) {
				$subscriber_data['name'] = $value;
			} elseif ( ( $id === 'lastname' || $label === 'lastname' ) && ! empty( $value ) ) {
				$subscriber_data['surname'] = $value;
			}
		}

		if ( empty( $subscriber_data['email'] ) ) {
			return array();
		}

		return $subscriber_data;
	}

	/**
	 * Check if submission has consent when required.
	 *
	 * @param Feedback $feedback Feedback object for the submission.
	 * @param mixed    $form     Contact form instance.
	 * @param bool     $is_v2    Whether the data comes from v2 storage.
	 * @return bool True if consent is present or not required; false otherwise.
	 */
	protected static function has_consent( $feedback, $form, $is_v2 ) {
		if ( $is_v2 ) {
			if ( $feedback->has_field_type( 'consent' ) && ! $feedback->has_consent() ) {
				return false;
			}
			return true;
		}

		$consent_field = null;
		if ( is_object( $form ) && is_array( $form->fields ) ) {
			foreach ( $form->fields as $form_field ) {
				if ( 'consent' === $form_field->get_attribute( 'type' ) ) {
					$consent_field = $form_field;
					break;
				}
			}
		}
		if ( $consent_field ) {
			$consent_type = strtolower( (string) $consent_field->get_attribute( 'consenttype' ) );
			if ( 'explicit' === $consent_type && ! $consent_field->value ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Handle Hostinger Reach integration after feedback post is inserted.
	 *
	 * For now, this only validates preconditions and returns early; real actions will be implemented later.
	 *
	 * @param int   $post_id The post ID for the feedback CPT.
	 * @param array $fields  Collection of Contact_Form_Field instances.
	 * @param bool  $is_spam Whether the submission is spam.
	 */
	public static function handle_hostinger_reach_integration( $post_id, $fields, $is_spam ) {
		if ( $is_spam ) {
			return;
		}

		// Try and get the form from any of the fields
		$form = null;
		foreach ( $fields as $field ) {
			if ( ! empty( $field->form ) ) {
				$form = $field->form;
				break;
			}
		}
		if ( ! $form || ! is_a( $form, 'Automattic\\Jetpack\\Forms\\ContactForm\\Contact_Form' ) ) {
			return;
		}

		// Feature is toggled per-form.
		if ( empty( $form->attributes['hostingerReach']['enabledForForm'] ?? null ) ) {
			return;
		}

		$feedback = Feedback::get( $post_id );
		if ( ! $feedback ) {
			return;
		}

		$api_handler = self::get_api();
		if ( ! $api_handler ) {
			return;
		}

		// Respect consent if a consent field exists.
		$post       = get_post( $post_id );
		$is_v2_data = ( $post && $post->post_mime_type === 'v2' );
		if ( ! self::has_consent( $feedback, $form, $is_v2_data ) ) {
			return;
		}

		$subscriber_data = $is_v2_data ? self::get_subscriber_data( $feedback ) : self::get_subscriber_data_from_fields( $fields );
		if ( empty( $subscriber_data ) ) {
			return;
		}

		$group_name = self::get_group_name( $form );

		self::submit_contact( $api_handler, $subscriber_data, $group_name );
	}
}

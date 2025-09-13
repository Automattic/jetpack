<?php
/**
 * MailPoet Integration for Jetpack Contact Forms.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Feedback;

/**
 * Class MailPoet_Integration
 *
 * Handles integration with MailPoet for Jetpack Contact Forms.
 */
class MailPoet_Integration {
	/**
	 * MailPoet API instance
	 *
	 * @var mixed
	 */
	protected static $mailpoet_api = null;

	/**
	 * Get the MailPoet API instance (v1), instantiating if necessary.
	 *
	 * @return mixed
	 */
	protected static function get_api() {
		if ( null === self::$mailpoet_api && class_exists( '\MailPoet\API\API' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			self::$mailpoet_api = \MailPoet\API\API::MP( 'v1' );
		}
		return self::$mailpoet_api;
	}

	/**
	 * Get or create a MailPoet list for Jetpack Forms.
	 *
	 * @param mixed       $mailpoet_api The MailPoet API instance.
	 * @param string|null $list_id Optional. The ID of the list to use if it exists.
	 * @param string|null $list_name Optional. The name of the list to create if no ID is provided. Defaults to 'Jetpack Form Subscribers'.
	 * @return string|null List ID or null on failure.
	 */
	protected static function get_or_create_list_id( $mailpoet_api, $list_id = null, $list_name = null ) {
		// 1. If listId is provided, check if it exists
		if ( $list_id ) {
			try {
				$lists = $mailpoet_api->getLists();
				foreach ( $lists as $list ) {
					if ( $list['id'] === $list_id && empty( $list['deleted_at'] ) ) {
						return $list['id'];
					}
				}
			} catch ( \Exception $e ) { // phpcs:ignore Squiz.PHP.EmptyCatchComment,Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				// Intentionally empty: fall through to next step
			}
		}

		// 2. If listName is provided, create a new list
		if ( $list_name ) {
			try {
				$new_list = $mailpoet_api->addList(
					array(
						'name'        => $list_name,
						'description' => 'Created by Jetpack Forms',
					)
				);
				return $new_list['id'];
			} catch ( \Exception $e ) { // phpcs:ignore Squiz.PHP.EmptyCatchComment,Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				// Intentionally empty: fall through to default
			}
		}

		// 3. Fallback: use or create the default list
		$default_list_name        = 'Jetpack Forms';
		$default_list_description = __( 'Subscribers from Jetpack Forms', 'jetpack-forms' );
		try {
			$lists = $mailpoet_api->getLists();
			foreach ( $lists as $list ) {
				if ( $list['name'] === $default_list_name && empty( $list['deleted_at'] ) ) {
					return $list['id'];
				}
			}
			$new_list = $mailpoet_api->addList(
				array(
					'name'        => $default_list_name,
					'description' => $default_list_description,
				)
			);
			return $new_list['id'];
		} catch ( \Exception $e ) {
			return null;
		}
	}

	/**
	 * Add a subscriber to a MailPoet list.
	 *
	 * @param mixed  $mailpoet_api The MailPoet API instance.
	 * @param string $list_id The MailPoet list ID.
	 * @param array  $subscriber_data Associative array with at least 'email', optionally 'first_name', 'last_name'.
	 * @return array|null Subscriber data on success, or null on failure.
	 */
	protected static function add_subscriber_to_list( $mailpoet_api, $list_id, $subscriber_data ) {
		try {
			$subscriber = $mailpoet_api->addSubscriber(
				$subscriber_data,
				array( $list_id )
			);
			return $subscriber;
		} catch ( \Exception $e ) {
			return null;
		}
	}

	/**
	 * Extract subscriber data (email, first_name, last_name) from form fields.
	 * Once refactored form storage is in place, use get_subscriber_data() instead.
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
		if ( ! $form || ! is_a( $form, 'Automattic\Jetpack\Forms\ContactForm\Contact_Form' ) ) {
			return array();
		}

		$subscriber_data = array();
		foreach ( $form->fields as $field ) {
			$id    = strtolower( str_replace( array( ' ', '_' ), '', $field->get_attribute( 'id' ) ) );
			$label = strtolower( str_replace( array( ' ', '_' ), '', $field->get_attribute( 'label' ) ) );

			// If value is not a string, we already know it's not a valid name or email.
			if ( ! is_string( $field->value ) ) {
				continue;
			}

			$value = trim( $field->value );

			if ( ( $id === 'email' || $label === 'email' ) && ! empty( $value ) ) {
				$subscriber_data['email'] = $value;
			} elseif ( ( $id === 'firstname' || $label === 'firstname' ) && ! empty( $value ) ) {
				$subscriber_data['first_name'] = $value;
			} elseif ( ( $id === 'lastname' || $label === 'lastname' ) && ! empty( $value ) ) {
				$subscriber_data['last_name'] = $value;
			}
		}

		if ( empty( $subscriber_data['email'] ) ) {
			return array();
		}

		return $subscriber_data;
	}

	/**
	 * Extract subscriber data (email, first_name, last_name) from form fields.
	 *
	 * @param Feedback $feedback Feedback object for the submission.
	 * @return array Associative array with at least 'email', optionally 'first_name', 'last_name'. Empty array if no email found.
	 */
	protected static function get_subscriber_data( $feedback ) {
		if ( ! $feedback->get_author_email() ) {
			return array();
		}

		// Get email using new Feedback API.
		$subscriber_data          = array();
		$subscriber_data['email'] = $feedback->get_author_email();

		// Try getting first and name from Feedback API.
		if ( $feedback->get_field_value_by_label( 'First Name' ) ) {
			$subscriber_data['first_name'] = $feedback->get_field_value_by_label( 'First Name' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'firstname' ) ) {
			$subscriber_data['first_name'] = $feedback->get_field_value_by_form_field_id( 'firstname' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'first-name' ) ) {
			$subscriber_data['first_name'] = $feedback->get_field_value_by_form_field_id( 'first-name' );
		}
		if ( $feedback->get_field_value_by_label( 'Last Name' ) ) {
			$subscriber_data['last_name'] = $feedback->get_field_value_by_label( 'Last Name' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'lastname' ) ) {
			$subscriber_data['last_name'] = $feedback->get_field_value_by_form_field_id( 'lastname' );
		} elseif ( $feedback->get_field_value_by_form_field_id( 'last-name' ) ) {
			$subscriber_data['last_name'] = $feedback->get_field_value_by_form_field_id( 'last-name' );
		}

		return $subscriber_data;
	}

	/**
	 * Handle MailPoet integration after feedback post is inserted.
	 *
	 * @param int   $post_id      The post ID for the feedback CPT.
	 * @param array $fields       Collection of Contact_Form_Field instances.
	 * @param bool  $is_spam      Whether the submission is spam.
	 */
	public static function handle_mailpoet_integration( $post_id, $fields, $is_spam ) {
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
		if ( ! $form || ! is_a( $form, 'Automattic\Jetpack\Forms\ContactForm\Contact_Form' ) ) {
			return;
		}

		if ( empty( $form->attributes['mailpoet']['enabledForForm'] ?? null ) ) {
			return;
		}

		$feedback = Feedback::get( $post_id );
		if ( ! $feedback ) {
			return;
		}

		$post       = get_post( $post_id );
		$is_v2_data = ( $post && $post->post_mime_type === 'v2' );

		if ( $is_v2_data ) {
			if ( $feedback->has_field_type( 'consent' ) && ! $feedback->has_consent() ) {
				return;
			}
		} else {
			$consent_field = null;
			if ( is_array( $form->fields ) ) {
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
					return;
				}
			}
		}

		$mailpoet_api = self::get_api();
		if ( ! $mailpoet_api ) {
			// MailPoet is not active or not loaded.
			return;
		}

		// Get listId and listName from the mailpoet attribute
		$mailpoet_attr = is_array( $form->attributes['mailpoet'] ) ? $form->attributes['mailpoet'] : array();
		$list_id       = $mailpoet_attr['listId'] ?? null;
		$list_name     = $mailpoet_attr['listName'] ?? null;

		$list_id = self::get_or_create_list_id( $mailpoet_api, $list_id, $list_name );
		if ( ! $list_id ) {
			// Could not get or create the list; bail out.
			return;
		}

		$subscriber_data = $is_v2_data ? self::get_subscriber_data( $feedback ) : self::get_subscriber_data_from_fields( $fields );
		if ( empty( $subscriber_data ) ) {
			// Email is required for MailPoet subscribers.
			return;
		}

		self::add_subscriber_to_list( $mailpoet_api, $list_id, $subscriber_data );
	}

	/**
	 * Get all MailPoet lists.
	 *
	 * @return array List of MailPoet lists, or empty array on failure.
	 */
	public static function get_all_lists() {
		$mailpoet_api = self::get_api();
		if ( ! $mailpoet_api ) {
			return array();
		}
		try {
			return $mailpoet_api->getLists();
		} catch ( \Exception $e ) {
			return array();
		}
	}
}

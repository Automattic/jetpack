<?php
/**
 * MailPoet Integration for Jetpack Contact Forms.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\Service;

/**
 * Class MailPoet_Integration
 *
 * Handles integration with MailPoet for Jetpack Contact Forms.
 */
class MailPoet_Integration {
	/**
	 * Singleton instance
	 *
	 * @var MailPoet_Integration
	 */
	private static $instance = null;

	/**
	 * MailPoet API instance
	 *
	 * @var mixed
	 */
	protected $mailpoet_api = null;

	/**
	 * Initialize and return singleton instance.
	 *
	 * @return MailPoet_Integration
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * MailPoet_Integration class constructor.
	 * Hooks on `grunion_after_feedback_post_inserted` action to handle MailPoet integration.
	 */
	private function __construct() {
		add_action( 'grunion_after_feedback_post_inserted', array( $this, 'handle_mailpoet_integration' ), 15, 4 );
	}

	/**
	 * Get the MailPoet API instance (v1), instantiating if necessary.
	 *
	 * @return mixed
	 */
	protected function get_api() {
		if ( null === $this->mailpoet_api && class_exists( '\MailPoet\API\API' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- dynamic plugin API
			$this->mailpoet_api = \MailPoet\API\API::MP( 'v1' );
		}
		return $this->mailpoet_api;
	}

	/**
	 * Get or create a MailPoet list for Jetpack Forms.
	 *
	 * @param mixed       $mailpoet_api The MailPoet API instance.
	 * @param string|null $list_name Optional. The name of the list to get or create. Defaults to 'Jetpack Form Subscribers'.
	 * @return string|null List ID or null on failure.
	 */
	protected function get_or_create_list_id( $mailpoet_api, $list_name = null ) {
		$default_list_name        = 'Jetpack Form Subscribers';
		$default_list_description = 'Subscribers from Jetpack Forms';
		$list_name                = $list_name ? $list_name : $default_list_name;
		$list_description         = $list_name === $default_list_name ? $default_list_description : $list_name;
		try {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- dynamic plugin API
			$lists = $mailpoet_api->getLists();
			// Look for an existing list with the given name (not deleted)
			foreach ( $lists as $list ) {
				if ( $list['name'] === $list_name && empty( $list['deleted_at'] ) ) {
					return $list['id'];
				}
			}
			// Not found, create it
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- dynamic plugin API
			$new_list = $mailpoet_api->addList(
				array(
					'name'        => $list_name,
					'description' => $list_description,
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
	protected function add_subscriber_to_list( $mailpoet_api, $list_id, $subscriber_data ) {
		try {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- dynamic plugin API
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
	 *
	 * @param array $fields Collection of Contact_Form_Field instances.
	 * @return array Associative array with at least 'email', optionally 'first_name', 'last_name'. Empty array if no email found.
	 */
	protected function get_subscriber_data_from_fields( $fields ) {
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

		// Extract email, first_name, last_name from form fields.
		$subscriber_data = array();
		foreach ( $form->fields as $field ) {
			$id    = strtolower( str_replace( array( ' ', '_' ), '', $field->get_attribute( 'id' ) ) );
			$label = strtolower( str_replace( array( ' ', '_' ), '', $field->get_attribute( 'label' ) ) );
			$value = trim( $field->value );

			if ( ( $id === 'email' || $label === 'email' ) && ! empty( $value ) ) {
				$subscriber_data['email'] = $value;
			} elseif ( ( $id === 'firstname' || $label === 'firstname' ) && ! empty( $value ) ) {
				$subscriber_data['first_name'] = $value;
			} elseif ( ( $id === 'lastname' || $label === 'lastname' ) && ! empty( $value ) ) {
				$subscriber_data['last_name'] = $value;
			}
		}

		// Only return the subscriber data if we have an email.
		if ( empty( $subscriber_data['email'] ) ) {
			return array();
		}

		return $subscriber_data;
	}

	/**
	 * Handle MailPoet integration after feedback post is inserted.
	 *
	 * @param int   $post_id      The post ID for the feedback CPT.
	 * @param array $fields       Collection of Contact_Form_Field instances.
	 * @param bool  $is_spam      Whether the submission is spam.
	 * @param array $entry_values Extra fields from the contact form.
	 */
	public function handle_mailpoet_integration( $post_id, $fields, $is_spam, $entry_values ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( $is_spam ) {
			return;
		}
		$mailpoet_api = $this->get_api();
		if ( ! $mailpoet_api ) {
			// MailPoet is not active or not loaded.
			return;
		}

		$list_id = $this->get_or_create_list_id( $mailpoet_api );
		if ( ! $list_id ) {
			// Could not get or create the list.
			return;
		}

		$subscriber_data = $this->get_subscriber_data_from_fields( $fields );
		if ( empty( $subscriber_data ) ) {
			// Could not get minimum required subscriber data (email).
			return;
		}

		$this->add_subscriber_to_list( $mailpoet_api, $list_id, $subscriber_data );
	}
}

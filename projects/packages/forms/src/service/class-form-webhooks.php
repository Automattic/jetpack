<?php
/**
 * Form Webhooks for Jetpack Contact Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use WP_Error;

/**
 * Class Form_Webhooks
 *
 * Hooks on Jetpack's Contact form to send form data to configured webhooks.
 */
class Form_Webhooks {
	/**
	 * Singleton instance
	 *
	 * @var Form_Webhooks
	 */
	private static $instance = null;

	/**
	 * Initialize and return singleton instance.
	 *
	 * @return Form_Webhooks
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Form_Webhooks class constructor.
	 * Hooks on `grunion_after_feedback_post_inserted` action to send form data to configured webhooks.
	 * NOTE: As a singleton, this constructor is private and only callable from ::init, which will return the singleton instance,
	 * effectively preventing multiple instances of this class (hence, multiple hooks triggering the webhook requests).
	 */
	private function __construct() {
		add_action( 'grunion_after_feedback_post_inserted', array( $this, 'send_webhooks' ), 10, 4 );
	}

	/**
	 * Send form data to configured webhooks.
	 *
	 * @param int   $post_id - the post_id for the CPT that is created.
	 * @param array $fields - a collection of Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field instances.
	 * @param bool  $is_spam - marked as spam by Akismet(?).
	 * @param array $entry_values - extra fields added to from the contact form.
	 *
	 * @return null|void
	 */
	public function send_webhooks( $post_id, $fields, $is_spam, $entry_values ) {
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

		// if spam (hinted by akismet?), don't process
		if ( $is_spam ) {
			return;
		}

		$webhooks = $this->get_enabled_webhooks( $form->attributes );

		if ( empty( $webhooks ) ) {
			return;
		}

		$form_data = $this->get_form_data( $form );

		// Iterate through each webhook and send the request
		foreach ( $webhooks as $webhook ) {
			$result = $this->send_webhook( $form_data, $webhook );

			if ( is_wp_error( $result ) ) {
				// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- figuring out what to do with the error.
				$message = sprintf(
					'JETPACK %s - Jetpack Forms: Webhook request to "%s" failed: "%s" at %s',
					constant( 'JETPACK__VERSION' ),
					$webhook['url'],
					$result->get_error_message(),
					$entry_values['entry_permalink']
				);
				// TODO: not sure what to do with the error. Is not useful at frontend and it would be difficult to
				// solve for a non tech-savvy user. We should log it somewhere, but it could turn messy.
				// Maybe email the owner?
			}
		}
	}

	/**
	 * Get the enabled webhooks from the form attributes.
	 *
	 * @param array $attributes - the attributes of the contact form.
	 * @return array Array of enabled webhooks.
	 */
	private function get_enabled_webhooks( $attributes = array() ) {
		if ( empty( $attributes['webhooks'] ) || ! is_array( $attributes['webhooks'] ) ) {
			return array();
		}

		$enabled_webhooks = array();
		foreach ( $attributes['webhooks'] as $webhook ) {
			// Validate webhook configuration
			if ( empty( $webhook['enabled'] ) || empty( $webhook['url'] ) ) {
				continue;
			}

			// Validate format
			$format = ! empty( $webhook['format'] ) ? $webhook['format'] : 'json';
			if ( ! in_array( $format, array( 'urlencoded', 'json' ), true ) ) {
				continue;
			}

			// Validate method
			$method = ! empty( $webhook['method'] ) ? strtoupper( $webhook['method'] ) : 'POST';
			if ( ! in_array( $method, array( 'POST', 'GET', 'PUT' ), true ) ) {
				continue;
			}

			$enabled_webhooks[] = array(
				'webhook_id' => ! empty( $webhook['webhook_id'] ) ? $webhook['webhook_id'] : '',
				'url'        => $webhook['url'],
				'format'     => $format,
				'method'     => $method,
			);
		}

		return $enabled_webhooks;
	}

	/**
	 * Send webhook request
	 *
	 * @param array $data The data key/value pairs to send.
	 * @param array $webhook Webhook configuration.
	 *
	 * @return array|WP_Error The result value from wp_remote_request
	 */
	private function send_webhook( $data, $webhook ) {
		global $wp_version;

		/**
		 * Filters the form data before sending it to the webhook.
		 *
		 * Allows developers to modify or augment the form data before it's sent to the webhook endpoint.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $webhook_id The unique identifier for this webhook.
		 * @param array  $form_data  The form data to be sent (field IDs as keys, values as values).
		 *
		 * @return array The form data to be sent (field IDs as keys, values as values).
		 */
		$data = apply_filters( 'jetpack_forms_before_webhook_request', $webhook['webhook_id'], $data );

		$user_agent = "WordPress/{$wp_version} | Jetpack/" . constant( 'JETPACK__VERSION' ) . '; ' . get_bloginfo( 'url' );
		$url        = $webhook['url'];
		$format     = $webhook['format'] === 'urlencoded' ? 'application/x-www-form-urlencoded' : 'application/json';
		$method     = $webhook['method'];

		// Encode body based on format
		$body = $webhook['format'] === 'json' ? wp_json_encode( $data ) : $data;

		$args = array(
			'method'    => $method,
			'body'      => $body,
			'headers'   => array(
				'Content-Type' => $format,
				'user-agent'   => $user_agent,
			),
			'sslverify' => true,
		);

		// phpcs:ignore Universal.CodeAnalysis.ConstructorDestructorReturn.ReturnValueFound -- this is no constructor
		return wp_remote_request( $url, $args );
	}

	/**
	 * Gather fields key/value pairs from the form
	 * Sanitizes the hidden fields values
	 *
	 * @param \Automattic\Jetpack\Forms\ContactForm\Contact_Form $form The form instance being processed/submitted.
	 */
	private function get_form_data( $form ) {
		$fields = array();
		foreach ( $form->fields as $field ) {
			$fields[ $field->get_attribute( 'id' ) ] = $field->value;
		}

		if ( ! empty( $form->attributes['hiddenFields'] ) ) {
			foreach ( $form->attributes['hiddenFields'] as $hidden_field ) {
				$fields[ $hidden_field['name'] ] = sanitize_text_field( $hidden_field['value'] );
			}
		}

		return $fields;
	}
}

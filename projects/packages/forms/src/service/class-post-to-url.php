<?php
/**
 * Post to URL using Jetpack Contact Forms.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\Service;

use WP_Error;

/**
 * Class Post_To_Url
 *
 * Hooks on Jetpack's Contact form to post form data to webhooks.
 * Uses provider pattern to support different webhook services (generic, Salesforce, etc.)
 */
class Post_To_Url {
	/**
	 * Singleton instance
	 *
	 * @var Post_To_Url
	 */
	private static $instance = null;

	/**
	 * Current webhook provider
	 *
	 * @var Webhook_Provider
	 */
	private $provider;

	/**
	 * Initialize and return singleton instance.
	 *
	 * @return Post_To_Url
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Post_To_Url class constructor.
	 * Hooks on `grunion_after_feedback_post_inserted` action to send form data to specified URL.
	 * NOTE: As a singleton, this constructor is private and only callable from ::init, which will return the singleton instance,
	 * effectively preventing multiple instances of this class (hence, multiple hooks triggering the POST request).
	 */
	private function __construct() {
		add_action( 'grunion_after_feedback_post_inserted', array( $this, 'feedback_post_hook' ), 10, 4 );
	}

	/**
	 * Determine which provider to use based on form attributes.
	 *
	 * @param array $attributes Form attributes.
	 * @return Webhook_Provider|null The appropriate webhook provider or null.
	 */
	private function get_provider( $attributes ) {
		// Check for Salesforce first (backwards compatibility)
		if ( ! empty( $attributes['salesforceData'] ) && ! empty( $attributes['salesforceData']['organizationId'] ) ) {
			return new Salesforce_Webhook_Provider( $attributes );
		}

		if ( apply_filters( 'jetpack_forms_webhooks_enabled', false ) ) {
			return new Generic_Webhook_Provider( $attributes );
		}

		return null;
	}

	/**
	 * Hook on `grunion_after_feedback_post_inserted` action to send form data to specified URL.
	 *
	 * @param int   $post_id - the post_id for the CPT that is created.
	 * @param array $fields - a collection of Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field instances.
	 * @param bool  $is_spam - marked as spam by Akismet(?).
	 * @param array $entry_values - extra fields added to from the contact form.
	 *
	 * @return null|void
	 */
	public function feedback_post_hook( $post_id, $fields, $is_spam, $entry_values ) {
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

		// Get appropriate provider based on form attributes
		$this->provider = $this->get_provider( $form->attributes );

		if ( ! $this->provider || ! $this->provider->is_enabled() ) {
			// no provider found or provider is not enabled
			return;
		}

		$setup = $this->provider->get_setup();

		if ( ! $setup ) {
			return;
		}

		// Get base form data
		$form_data = $this->get_form_data( $form );

		// Let provider transform the data
		$form_data = $this->provider->transform_data( $form_data, $form, $entry_values );

		$result = $this->post_to_url( $form_data, $setup );

		if ( is_wp_error( $result ) ) {
			// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- figuring out what to do with the error.
			$message = sprintf(
				'JETPACK %s - Jetpack Forms: POSTing to URL failed: "%s" at %s',
				constant( 'JETPACK__VERSION' ),
				$result->get_error_message(),
				$entry_values['entry_permalink']
			);
			// TODO: not sure what to do with the error. Is not useful at frontend and it would be difficult to
			// solve for a non tech-savvy user. We should log it somewhere, but it could turn messy.
			// Maybe email the owner?
		}
	}

	/**
	 * POST to URL
	 *
	 * @param array $data The data key/value pairs to send in POST.
	 * @param array $options Options for POST.
	 *
	 * @return array|WP_Error The result value from wp_remote_post
	 *
	 * TODO: do complex fields (MC, etc) need to be handled differently? JSON should be fine, but URLencoded might need to be serialized.
	 */
	private function post_to_url( $data, $options = array() ) {
		global $wp_version;

		$user_agent = "WordPress/{$wp_version} | Jetpack/" . constant( 'JETPACK__VERSION' ) . '; ' . get_bloginfo( 'url' );
		$url        = $options['url'];
		$format     = $options['format'] === 'urlencoded' ? 'application/x-www-form-urlencoded' : 'application/json';
		$args       = array(
			'body'      => $options['format'] === 'urlencoded' ? $data : wp_json_encode( $data ),
			'headers'   => array(
				'Content-Type' => $format,
				'user-agent'   => $user_agent,
			),
			'sslverify' => empty( $options['sslverify'] ) ? false : $options['sslverify'],
		);
		// phpcs:ignore Universal.CodeAnalysis.ConstructorDestructorReturn.ReturnValueFound -- this is no constructor
		return wp_remote_post( $url, $args );
	}

	/**
	 * Gather base fields key/value pairs from the form.
	 * Sanitizes the hidden fields values.
	 * Service-specific fields are added by the provider's transform_data method.
	 *
	 * @param \Automattic\Jetpack\Forms\ContactForm\Contact_Form $form The form instance being processed/submitted.
	 * @return array Base form data with field id => value pairs.
	 */
	private function get_form_data( $form ) {
		$fields = array();
		foreach ( $form->fields as $field ) {
			$fields[ $field->get_attribute( 'id' ) ] = $field->value;
		}

		// Generic hidden fields support
		if ( ! empty( $form->attributes['hiddenFields'] ) ) {
			foreach ( $form->attributes['hiddenFields'] as $hidden_field ) {
				$fields[ $hidden_field['name'] ] = sanitize_text_field( $hidden_field['value'] );
			}
		}

		return $fields;
	}
}

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
 * Hooks on Jetpack's Contact form to post form data to some URL.
 */
class Post_To_Url {
	/**
	 * Singleton instance
	 *
	 * @var Post_To_Url
	 */
	private static $instance = null;

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
	 * Get the setup for the post to URL.
	 *
	 * Salesforce-only: posts to the fixed Salesforce Web-to-Lead endpoint when
	 * the form has a salesforceData.organizationId attribute. The legacy
	 * postToUrl override is intentionally NOT honored here — postToUrl is
	 * deprecated and the new pipeline (Form_Webhooks) already handles it with
	 * proper URL validation. Honoring it here too would let an Editor with
	 * Salesforce enabled override the destination to an arbitrary URL,
	 * including internal/cloud-metadata endpoints (SSRF).
	 *
	 * @param array $attributes - the attributes of the contact form.
	 * @return array|bool Array setup, or false if Salesforce isn't configured.
	 */
	private function get_setup( $attributes = array() ) {
		if ( empty( $attributes['salesforceData']['organizationId'] ) ) {
			return false;
		}

		return array(
			'url'    => 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
			'format' => 'urlencoded',
		);
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

		$setup = $this->get_setup( $form->attributes );

		if ( ! $setup ) {
			return;
		}

		$form_data = $this->get_form_data( $form, $entry_values );

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
	 * @return array|WP_Error The result value from wp_safe_remote_post
	 *
	 * TODO: do complex fields (MC, etc) need to be handled differently? JSON should be fine, but URLencoded might need to be serialized.
	 */
	private function post_to_url( $data, $options = array() ) {
		global $wp_version;

		$user_agent = "WordPress/{$wp_version} | Jetpack/" . constant( 'JETPACK__VERSION' ) . '; ' . get_bloginfo( 'url' );
		$format     = $options['format'] === 'urlencoded' ? 'application/x-www-form-urlencoded' : 'application/json';
		$args       = array(
			'body'    => $data,
			'headers' => array(
				'Content-Type' => $format,
				'user-agent'   => $user_agent,
			),
		);
		return wp_safe_remote_post( $options['url'], $args );
	}

	/**
	 * Gather fields key/value pairs from the form
	 * Sanitizes the hidden fields values
	 *
	 * @param \Automattic\Jetpack\Forms\ContactForm\Contact_Form $form The form instance being processed/submitted.
	 * @param array                                              $entry_values The feedback entry values.
	 */
	private function get_form_data( $form, $entry_values ) {
		$fields = array();
		foreach ( $form->fields as $field ) {
			$fields[ $field->get_attribute( 'id' ) ] = $field->value;
		}

		// Right in the middle, backwards compatibility for salesforceData implementation.
		$salesforce_data = (array) ( $form->attributes['salesforceData'] ?? array() );
		if ( ! empty( $salesforce_data['organizationId'] ) ) {
			$fields['oid']         = sanitize_text_field( $salesforce_data['organizationId'] );
			$fields['lead_source'] = $entry_values['entry_permalink'];
		}

		// `hiddenFields` is a legacy attribute that may appear in a few shapes on forms
		// in the wild: an array of `{ name, value }` objects (its original design), an
		// associative `name => value` map, or a JSON-encoded string. Iterating it blindly
		// and accessing `['name']`/`['value']` on a non-array element fatals on PHP 8 with
		// "Cannot access offset of type string on string", so normalize defensively.
		$hidden_fields = $form->attributes['hiddenFields'] ?? array();
		if ( is_string( $hidden_fields ) ) {
			$decoded       = json_decode( $hidden_fields, true );
			$hidden_fields = is_array( $decoded ) ? $decoded : array();
		}
		foreach ( (array) $hidden_fields as $key => $hidden_field ) {
			if ( is_array( $hidden_field ) ) {
				// Original `{ name, value }` object shape.
				if ( isset( $hidden_field['name'] ) ) {
					$fields[ $hidden_field['name'] ] = sanitize_text_field( $hidden_field['value'] ?? '' );
				}
			} elseif ( ! is_int( $key ) ) {
				// Associative `name => value` shape.
				$fields[ $key ] = sanitize_text_field( (string) $hidden_field );
			}
		}

		return $fields;
	}
}

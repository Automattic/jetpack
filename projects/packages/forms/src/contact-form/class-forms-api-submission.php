<?php
/**
 * Forms API Submission class.
 *
 * Handles REST API submissions for AI agents and programmatic form submissions.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * REST API endpoint for programmatic form submissions.
 *
 * This allows AI agents and other programmatic clients to submit forms
 * using the JWT token embedded in the form HTML.
 */
class Forms_API_Submission {

	/**
	 * Initialize the API submission handler.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( self::class, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v1',
			'/forms/submit',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'handle_submission' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'token'  => array(
						'required'          => true,
						'type'              => 'string',
						'description'       => __( 'JWT token from form', 'jetpack-forms' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
					'fields' => array(
						'required'    => true,
						'type'        => 'object',
						'description' => __( 'Form field values', 'jetpack-forms' ),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v1',
			'/forms/discover',
			array(
				'methods'             => 'GET',
				'callback'            => array( self::class, 'handle_discover' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'url'     => array(
						'required'          => false,
						'type'              => 'string',
						'description'       => __( 'Page URL containing the form', 'jetpack-forms' ),
						'sanitize_callback' => 'esc_url_raw',
					),
					'post_id' => array(
						'required'          => false,
						'type'              => 'integer',
						'description'       => __( 'Post ID containing the form', 'jetpack-forms' ),
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Handle form discovery request.
	 *
	 * Returns form metadata including JWT token and field information.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response with form info, or error.
	 */
	public static function handle_discover( WP_REST_Request $request ) {
		$url     = $request->get_param( 'url' );
		$post_id = $request->get_param( 'post_id' );

		// Validate URL belongs to this site.
		if ( $url && ! $post_id ) {
			$site_host   = wp_parse_url( home_url(), PHP_URL_HOST );
			$target_host = wp_parse_url( $url, PHP_URL_HOST );

			if ( ! $target_host || strcasecmp( $target_host, $site_host ) !== 0 ) {
				return new WP_Error(
					'invalid_url',
					__( 'URL must belong to this site', 'jetpack-forms' ),
					array( 'status' => 400 )
				);
			}

			$post_id = url_to_postid( $url );
		}

		if ( ! $post_id ) {
			return new WP_Error(
				'invalid_request',
				__( 'Please provide a valid url or post_id parameter', 'jetpack-forms' ),
				array( 'status' => 400 )
			);
		}

		$post = get_post( $post_id );
		if ( ! $post ) {
			return new WP_Error(
				'not_found',
				__( 'Post not found', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		// Only expose forms from published, publicly accessible posts.
		if ( $post->post_status !== 'publish' || ! empty( $post->post_password ) ) {
			return new WP_Error(
				'not_accessible',
				__( 'This content is not publicly accessible', 'jetpack-forms' ),
				array( 'status' => 403 )
			);
		}

		// Parse the post content for contact form blocks.
		$blocks = parse_blocks( $post->post_content );
		$forms  = self::find_forms_in_blocks( $blocks, $post );

		if ( empty( $forms ) ) {
			return new WP_Error(
				'no_forms',
				__( 'No forms found on this page', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		return new WP_REST_Response(
			array(
				'submit_endpoint' => '/wp-json/jetpack/v1/forms/submit',
				'forms'           => $forms,
			),
			200
		);
	}

	/**
	 * Recursively find forms in blocks.
	 *
	 * @param array   $blocks The blocks to search.
	 * @param WP_Post $post   The post object.
	 * @return array Array of form data.
	 */
	private static function find_forms_in_blocks( $blocks, $post ) {
		$forms = array();

		foreach ( $blocks as $block ) {
			if ( 'jetpack/contact-form' === $block['blockName'] ) {
				$form_data = self::extract_form_data( $block, $post );
				if ( $form_data ) {
					$forms[] = $form_data;
				}
			}

			// Check inner blocks recursively.
			if ( ! empty( $block['innerBlocks'] ) ) {
				array_push( $forms, ...self::find_forms_in_blocks( $block['innerBlocks'], $post ) );
			}
		}

		return $forms;
	}

	/**
	 * Extract form data from a contact form block.
	 *
	 * @param array   $block The block data.
	 * @param WP_Post $post  The post object.
	 * @return array|null Form data or null if extraction fails.
	 */
	private static function extract_form_data( $block, $post ) {
		$attrs = $block['attrs'] ?? array();

		// Generate form instance - this parses content and populates $form->fields with correct IDs.
		$form = new Contact_Form( $attrs, $block['innerHTML'] ?? '' );
		// Use post permalink as request_url so JWT matches what the form page generates.
		$source = new Feedback_Source( $post->ID, $post->post_title, 1, 'single', get_permalink( $post ) );
		$form->set_source( $source );

		// Extract field info from the form's actual field objects.
		$fields = array();
		if ( ! empty( $form->fields ) ) {
			foreach ( $form->fields as $field_id => $field ) {
				$fields[] = array(
					'id'       => $field_id,
					'type'     => $field->get_attribute( 'type' ),
					'label'    => $field->get_attribute( 'label' ),
					'required' => (bool) $field->get_attribute( 'required' ),
				);
			}
		}

		return array(
			'title'  => $attrs['formTitle'] ?? $post->post_title ?? 'Contact Form',
			'token'  => $form->get_jwt(),
			'fields' => $fields,
		);
	}

	/**
	 * Handle a form submission via REST API.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, error on failure.
	 */
	public static function handle_submission( WP_REST_Request $request ) {
		$token  = $request->get_param( 'token' );
		$fields = $request->get_param( 'fields' );

		// Validate JWT and reconstruct form.
		try {
			$form = Contact_Form::get_instance_from_jwt( $token, true );
		} catch ( \Exception $e ) {
			return new WP_Error(
				'invalid_token',
				$e->getMessage(),
				array( 'status' => 400 )
			);
		}

		if ( ! $form || ! $form->has_verified_jwt ) {
			return new WP_Error(
				'invalid_token',
				__( 'Invalid or expired form token', 'jetpack-forms' ),
				array( 'status' => 400 )
			);
		}

		// Build POST data array matching existing submission format.
		$post_data = self::build_post_data( $form, $fields );

		// Create Feedback object.
		$feedback = Feedback::from_submission( $post_data, $form );
		$feedback->set_source( $form->get_source() );

		// Run Akismet check.
		$plugin         = Contact_Form_Plugin::init();
		$akismet_values = $plugin->prepare_for_akismet( $feedback->get_akismet_vars() );

		/**
		 * Filter to determine if a form submission is spam.
		 *
		 * @param bool  $is_spam       Whether the submission is spam.
		 * @param array $akismet_values Values to check against Akismet.
		 */
		$is_spam = apply_filters( 'jetpack_contact_form_is_spam', false, $akismet_values );

		if ( is_wp_error( $is_spam ) ) {
			return new WP_Error(
				'spam_rejected',
				__( 'Submission rejected as spam', 'jetpack-forms' ),
				array( 'status' => 403 )
			);
		}

		// Set status based on spam check.
		$feedback->set_status( $is_spam ? 'spam' : 'publish' );

		// Save feedback.
		$feedback_post = $feedback->save();

		if ( ! $feedback_post || is_wp_error( $feedback_post ) ) {
			return new WP_Error(
				'save_failed',
				__( 'Failed to save submission', 'jetpack-forms' ),
				array( 'status' => 500 )
			);
		}

		$post_id = $feedback_post->ID;

		// Store Akismet values for potential later reporting.
		if ( ! empty( $akismet_values ) ) {
			update_post_meta( $post_id, '_feedback_akismet_values', $form->addslashes_deep( $akismet_values ) );
		}

		return new WP_REST_Response(
			array(
				'success'     => true,
				'feedback_id' => $post_id,
				'message'     => __( 'Your message has been sent', 'jetpack-forms' ),
			),
			200
		);
	}

	/**
	 * Build POST data array from REST fields.
	 *
	 * Converts REST API field format to the POST format expected by Feedback::from_submission().
	 *
	 * @param Contact_Form $form   The form instance.
	 * @param array        $fields The submitted field values.
	 * @return array POST data array.
	 */
	private static function build_post_data( $form, $fields ) {
		$post_data = array(
			'action'            => 'grunion-contact-form',
			'contact-form-id'   => $form->get_attribute( 'id' ),
			'contact-form-hash' => $form->hash,
		);

		foreach ( $fields as $key => $value ) {
			$post_data[ $key ] = is_array( $value ) ? $value : sanitize_textarea_field( $value );
		}

		return $post_data;
	}
}

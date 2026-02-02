<?php
/**
 * Jetpack Forms Abilities Registration.
 *
 * @package automattic/jetpack-forms
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Ability API added in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this line when we drop WP <6.9.

namespace Automattic\Jetpack\Forms\Abilities;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin;
use Automattic\Jetpack\Forms\ContactForm\Feedback;

/**
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 */
class Forms_Abilities {

	/**
	 * The category slug for forms abilities.
	 *
	 * @var string
	 */
	const CATEGORY_SLUG = 'jetpack-forms';

	/**
	 * Initialize the abilities registration.
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( 'wp_abilities_api_categories_init' ) ) {
			self::register_category();
		} else {
			add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
		}

		if ( did_action( 'wp_abilities_api_init' ) ) {
			self::register_abilities();
		} else {
			add_action( 'wp_abilities_api_init', array( __CLASS__, 'register_abilities' ) );
		}
	}

	/**
	 * Register the Jetpack Forms ability category.
	 *
	 * @return void
	 */
	public static function register_category() {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}

		wp_register_ability_category(
			self::CATEGORY_SLUG,
			array(
				// "Jetpack Forms" is a product name and should not be translated.
				'label'       => 'Jetpack Forms',
				'description' => __( 'Abilities for managing Jetpack Forms responses.', 'jetpack-forms' ),
			)
		);
	}

	/**
	 * Register all Jetpack Forms abilities.
	 *
	 * @return void
	 */
	public static function register_abilities() {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		self::register_get_responses_ability();
		self::register_update_response_ability();
		self::register_get_status_counts_ability();
		self::register_get_forms_ability();
		self::register_submit_form_ability();
	}

	/**
	 * Register ability to get form responses.
	 *
	 * @return void
	 */
	private static function register_get_responses_ability() {
		wp_register_ability(
			'jetpack-forms/get-responses',
			array(
				'label'               => __( 'Get form responses', 'jetpack-forms' ),
				'description'         => __( 'List or search form responses. Returns response data including sender info, form fields, and metadata. Supports filtering by status, date range, read state, and search terms.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'ids'       => array(
							'type'        => 'array',
							'description' => __( 'Fetch specific responses by their IDs.', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
						'page'      => array(
							'type'        => 'integer',
							'description' => __( 'Page number for paginated results.', 'jetpack-forms' ),
							'default'     => 1,
						),
						'per_page'  => array(
							'type'        => 'integer',
							'description' => __( 'Number of responses to return per page (max 100).', 'jetpack-forms' ),
							'default'     => 10,
						),
						'parent'    => array(
							'type'        => 'array',
							'description' => __( 'Filter by the page or post ID where the form is embedded.', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
						'status'    => array(
							'type'        => 'string',
							'description' => __( 'Filter by response status.', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft', 'spam', 'trash' ),
						),
						'is_unread' => array(
							'type'        => 'boolean',
							'description' => __( 'Set true for unread only, false for read only.', 'jetpack-forms' ),
						),
						'search'    => array(
							'type'        => 'string',
							'description' => __( 'Search within response content and sender info.', 'jetpack-forms' ),
						),
						'before'    => array(
							'type'        => 'string',
							'description' => __( 'Only responses before this date (ISO8601 format).', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
						'after'     => array(
							'type'        => 'string',
							'description' => __( 'Only responses after this date (ISO8601 format).', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_form_responses' ),
				'permission_callback' => array( __CLASS__, 'can_edit_pages' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register ability to update a form response.
	 *
	 * @return void
	 */
	private static function register_update_response_ability() {
		wp_register_ability(
			'jetpack-forms/update-response',
			array(
				'label'               => __( 'Update form response', 'jetpack-forms' ),
				'description'         => __( 'Modify a form response. Use to mark as spam, move to trash, restore from trash, or toggle read/unread state.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id' ),
					'properties'           => array(
						'id'        => array(
							'type'        => 'integer',
							'description' => __( 'The response ID to update.', 'jetpack-forms' ),
						),
						'status'    => array(
							'type'        => 'string',
							'description' => __( 'New status: "publish" (restore), "spam" (mark spam), "trash" (soft delete).', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft', 'spam', 'trash' ),
						),
						'is_unread' => array(
							'type'        => 'boolean',
							'description' => __( 'Set false to mark as read, true to mark as unread.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'update_form_response' ),
				'permission_callback' => array( __CLASS__, 'can_edit_pages' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register ability to get status counts.
	 *
	 * @return void
	 */
	private static function register_get_status_counts_ability() {
		wp_register_ability(
			'jetpack-forms/get-status-counts',
			array(
				'label'               => __( 'Get response status counts', 'jetpack-forms' ),
				'description'         => __( 'Get a summary of form responses grouped by status. Returns counts for inbox (active), spam, and trash. Useful for dashboard stats or checking if there are new responses.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'search'    => array(
							'type'        => 'string',
							'description' => __( 'Only count responses matching this search term.', 'jetpack-forms' ),
						),
						'parent'    => array(
							'type'        => 'integer',
							'description' => __( 'Only count responses from a specific page or post.', 'jetpack-forms' ),
						),
						'before'    => array(
							'type'        => 'string',
							'description' => __( 'Only count responses before this date (ISO8601 format).', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
						'after'     => array(
							'type'        => 'string',
							'description' => __( 'Only count responses after this date (ISO8601 format).', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
						'is_unread' => array(
							'type'        => 'boolean',
							'description' => __( 'Set true to count only unread, false for only read.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_status_counts' ),
				'permission_callback' => array( __CLASS__, 'can_edit_pages' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register ability to list available forms and their fields.
	 *
	 * @return void
	 */
	private static function register_get_forms_ability() {
		wp_register_ability(
			'jetpack-forms/get-forms',
			array(
				'label'               => __( 'List available forms', 'jetpack-forms' ),
				'description'         => __( 'Discover forms on this site that can be filled out. Returns up to 50 forms with IDs, titles, and field definitions including labels, types, and options.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'post_id' => array(
							'type'        => 'integer',
							'description' => __( 'Only return forms embedded in this specific page or post.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_forms' ),
				'permission_callback' => '__return_true',
				'meta'                => array(
					'annotations'  => array(
						'public'      => true,
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register ability to submit a form.
	 *
	 * @return void
	 */
	private static function register_submit_form_ability() {
		wp_register_ability(
			'jetpack-forms/submit-form',
			array(
				'label'               => __( 'Submit a form', 'jetpack-forms' ),
				'description'         => __( 'Submit a form response. Provide the form ID and field values as key-value pairs matching the field labels.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'form_id', 'fields' ),
					'properties'           => array(
						'form_id' => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the form to submit (from get-forms results).', 'jetpack-forms' ),
						),
						'fields'  => array(
							'type'        => 'object',
							'description' => __( 'Field values as key-value pairs. Keys should match field labels from the form definition.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'submit_form' ),
				'permission_callback' => '__return_true',
				'meta'                => array(
					'annotations'  => array(
						'public'      => true,
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => false,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Check if user can edit pages.
	 *
	 * @return bool
	 */
	public static function can_edit_pages() {
		return current_user_can( 'edit_pages' );
	}

	/**
	 * Helper to set multiple parameters on a request from args array.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @param array            $args    The arguments array.
	 * @param array            $keys    The keys to copy from args to request.
	 * @return void
	 */
	private static function set_params_from_args( $request, $args, $keys ) {
		foreach ( $keys as $key ) {
			if ( isset( $args[ $key ] ) ) {
				$request->set_param( $key, $args[ $key ] );
			}
		}
	}

	/**
	 * Get form responses callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns array of responses or WP_Error on failure.
	 */
	public static function get_form_responses( $args = array() ) {
		$args     = is_array( $args ) ? $args : array();
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback' );

		self::set_params_from_args(
			$request,
			$args,
			array( 'page', 'per_page', 'parent', 'status', 'is_unread', 'search', 'before', 'after' )
		);

		if ( isset( $args['ids'] ) && is_array( $args['ids'] ) ) {
			$request->set_param( 'include', $args['ids'] );
		}

		$response = $endpoint->get_items( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Update form response callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns updated response data or WP_Error on failure.
	 */
	public static function update_form_response( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Response ID is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$result   = array();

		if ( isset( $args['status'] ) ) {
			$request = new \WP_REST_Request( 'POST', '/wp/v2/feedback/' . $args['id'] );
			$request->set_url_params( array( 'id' => $args['id'] ) );
			$request->set_body_params( array( 'status' => $args['status'] ) );

			$response = $endpoint->update_item( $request );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			$result = $response->get_data();
		}

		if ( isset( $args['is_unread'] ) ) {
			$request = new \WP_REST_Request( 'POST', '/wp/v2/feedback/' . $args['id'] . '/read' );
			$request->set_url_params( array( 'id' => $args['id'] ) );
			$request->set_body_params( array( 'is_unread' => $args['is_unread'] ) );

			$response = $endpoint->update_read_status( $request );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			$result = array_merge( $result, $response->get_data() );
		}

		return $result;
	}

	/**
	 * Get available forms callback.
	 *
	 * Queries published jetpack_form posts and extracts field definitions from blocks.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns array of forms with field definitions.
	 */
	public static function get_forms( $args = array() ) {
		$args = is_array( $args ) ? $args : array();

		$query_args = array(
			'post_type'      => Contact_Form::POST_TYPE,
			'post_status'    => 'publish',
			'posts_per_page' => 50,
		);

		if ( ! empty( $args['post_id'] ) ) {
			$query_args['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'   => Contact_Form::SOURCE_META_KEY,
					'value' => absint( $args['post_id'] ),
				),
			);
		}

		$posts = get_posts( $query_args );
		$forms = array();

		foreach ( $posts as $post ) {
			$fields  = self::extract_fields_from_post( $post );
			$forms[] = array(
				'id'     => $post->ID,
				'title'  => $post->post_title,
				'fields' => $fields,
			);
		}

		return $forms;
	}

	/**
	 * Extract field definitions from a form post's block content.
	 *
	 * @param \WP_Post $post The form post.
	 * @return array Array of field definitions.
	 */
	private static function extract_fields_from_post( $post ) {
		$blocks = parse_blocks( $post->post_content );
		$fields = array();

		self::extract_fields_from_blocks( $blocks, $fields );

		return $fields;
	}

	/**
	 * Recursively extract field definitions from blocks.
	 *
	 * @param array $blocks The blocks to process.
	 * @param array $fields Reference to the fields array being built.
	 */
	private static function extract_fields_from_blocks( $blocks, &$fields ) {
		foreach ( $blocks as $block ) {
			if ( strpos( $block['blockName'] ?? '', 'jetpack/field-' ) === 0 ) {
				$attrs = $block['attrs'] ?? array();
				$label = $attrs['label'] ?? '';

				// Skip fields without a label — they can't be submitted by key.
				if ( '' === $label ) {
					continue;
				}

				$field = array(
					'label'    => $label,
					'type'     => str_replace( 'jetpack/field-', '', $block['blockName'] ),
					'required' => ! empty( $attrs['required'] ),
				);

				if ( ! empty( $attrs['options'] ) ) {
					$field['options'] = $attrs['options'];
				}

				if ( ! empty( $attrs['placeholder'] ) ) {
					$field['placeholder'] = $attrs['placeholder'];
				}

				$fields[] = $field;
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				self::extract_fields_from_blocks( $block['innerBlocks'], $fields );
			}
		}
	}

	/**
	 * Submit a form callback.
	 *
	 * Creates a feedback post from the provided field values.
	 *
	 * @todo Extract shared submission logic from Contact_Form::process_submission()
	 *       so both the browser flow and this API flow use the same pipeline for
	 *       sanitization, spam checking, and post creation.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns success data or WP_Error on failure.
	 */
	public static function submit_form( $args ) {
		if ( empty( $args['form_id'] ) || ! isset( $args['fields'] ) || ! is_array( $args['fields'] ) ) {
			return new \WP_Error( 'missing_params', __( 'form_id and fields are required.', 'jetpack-forms' ) );
		}

		$form_post = get_post( absint( $args['form_id'] ) );
		if ( ! $form_post || $form_post->post_type !== Contact_Form::POST_TYPE || $form_post->post_status !== 'publish' ) {
			return new \WP_Error( 'invalid_form', __( 'Form not found.', 'jetpack-forms' ), array( 'status' => 404 ) );
		}

		$form_fields = self::extract_fields_from_post( $form_post );
		if ( empty( $form_fields ) ) {
			return new \WP_Error( 'no_fields', __( 'Form has no fields.', 'jetpack-forms' ) );
		}

		$submitted = $args['fields'];

		// Validate required fields and option values in a single pass.
		foreach ( $form_fields as $field_def ) {
			$label = $field_def['label'];
			$value = $submitted[ $label ] ?? null;

			if ( $field_def['required'] ) {
				if ( null === $value || ( is_scalar( $value ) && '' === trim( (string) $value ) ) ) {
					return new \WP_Error(
						'missing_field',
						/* translators: %s is the field label */
						sprintf( __( 'Required field "%s" is missing.', 'jetpack-forms' ), $label ),
						array( 'status' => 400 )
					);
				}
			}

			if ( ! empty( $field_def['options'] ) && null !== $value && '' !== $value ) {
				if ( ! in_array( $value, $field_def['options'], true ) ) {
					return new \WP_Error(
						'invalid_option',
						/* translators: %s is the field label */
						sprintf( __( 'Invalid option for field "%s".', 'jetpack-forms' ), $label ),
						array( 'status' => 400 )
					);
				}
			}
		}

		// Build field data with type-appropriate sanitization.
		$fields_data = array();
		$all_values  = array();
		$i           = 1;
		foreach ( $form_fields as $field_def ) {
			$label = $field_def['label'];
			$value = isset( $submitted[ $label ] ) ? self::sanitize_field_value( $submitted[ $label ], $field_def['type'] ) : '';
			$key   = $i . '_' . $label;

			$fields_data[]      = array(
				'key'   => $key,
				'label' => $label,
				'value' => $value,
				'type'  => $field_def['type'],
			);
			$all_values[ $key ] = $value;
			++$i;
		}

		// Run spam check via the same filter used by the normal form flow.
		$plugin         = Contact_Form_Plugin::init();
		$akismet_vars   = array(
			'comment_content' => implode( "\n", array_column( $fields_data, 'value' ) ),
		);
		$akismet_values = $plugin->prepare_for_akismet( $akismet_vars );

		/** This filter is documented in class-contact-form.php */
		$is_spam = apply_filters( 'jetpack_contact_form_is_spam', false, $akismet_values );
		if ( is_wp_error( $is_spam ) ) {
			return $is_spam;
		}

		/** This filter is documented in class-contact-form.php */
		$in_disallowed_list = apply_filters( 'jetpack_contact_form_in_comment_disallowed_list', false, $akismet_values );

		if ( $in_disallowed_list ) {
			$feedback_status = 'trash';
		} elseif ( $is_spam ) {
			$feedback_status = 'spam';
		} else {
			$feedback_status = 'publish';
		}

		$feedback_time  = current_time( 'mysql' );
		$author         = __( 'API Submission', 'jetpack-forms' );
		$feedback_title = "{$author} - {$feedback_time}";

		$serialized_fields = array(
			'subject'   => $form_post->post_title,
			'ip'        => Contact_Form_Plugin::get_ip_address(),
			'source_id' => 0,
			'fields'    => $fields_data,
		);

		if ( apply_filters( 'jetpack_contact_form_forget_ip_address', false, $serialized_fields['ip'] ) ) {
			$serialized_fields['ip'] = null;
		}

		// Force post_author to 0, matching the normal form submission flow.
		$zero_author = function ( $data ) {
			$data['post_author'] = 0;
			return $data;
		};
		add_filter( 'wp_insert_post_data', $zero_author );

		$post_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => $feedback_status,
				'post_title'     => $feedback_title,
				'post_date'      => $feedback_time,
				'post_name'      => md5( $feedback_title ),
				'post_content'   => addslashes( wp_json_encode( $serialized_fields, JSON_UNESCAPED_SLASHES ) ),
				'post_mime_type' => 'v3',
				'post_parent'    => $form_post->ID,
				'post_author'    => 0,
				'comment_status' => Feedback::STATUS_UNREAD,
			)
		);

		remove_filter( 'wp_insert_post_data', $zero_author );

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		if ( defined( 'AKISMET_VERSION' ) ) {
			update_post_meta( $post_id, '_feedback_akismet_values', $akismet_values );
		}

		/**
		 * This action is documented in class-contact-form.php.
		 *
		 * Note: 2nd arg is empty because this flow doesn't have Contact_Form_Field
		 * objects. Hook consumers should use $all_values (4th arg) instead.
		 */
		do_action(
			'grunion_after_feedback_post_inserted',
			$post_id,
			array(),
			$is_spam,
			$all_values
		);

		if ( 'publish' === $feedback_status ) {
			Contact_Form_Plugin::recalculate_unread_count();
		}

		return array( 'success' => true );
	}

	/**
	 * Sanitize a field value based on its type.
	 *
	 * @param mixed  $value The value to sanitize.
	 * @param string $type  The field type (e.g. 'email', 'url', 'textarea', 'name', 'text').
	 * @return string The sanitized value.
	 */
	private static function sanitize_field_value( $value, $type ) {
		$value = (string) $value;

		switch ( $type ) {
			case 'email':
				return sanitize_email( $value );
			case 'url':
				return esc_url_raw( $value );
			case 'textarea':
				return sanitize_textarea_field( $value );
			default:
				return sanitize_text_field( $value );
		}
	}

	/**
	 * Get status counts callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns status counts or WP_Error on failure.
	 */
	public static function get_status_counts( $args = array() ) {
		$args     = is_array( $args ) ? $args : array();
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback/counts' );

		self::set_params_from_args(
			$request,
			$args,
			array( 'search', 'parent', 'before', 'after', 'is_unread' )
		);

		$response = $endpoint->get_status_counts( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}
}

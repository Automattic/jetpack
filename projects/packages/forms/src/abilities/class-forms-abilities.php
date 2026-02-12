<?php
/**
 * Jetpack Forms Abilities Registration
 *
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-forms
 * @since 1.0.0
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Ability API added in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this line when we drop WP <6.9.

namespace Automattic\Jetpack\Forms\Abilities;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint;
use Automattic\Jetpack\Forms\ContactForm\Jetpack_Form_Endpoint;

/**
 * Class Forms_Abilities
 *
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 * Provides abilities for managing forms, form responses, and status counts.
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
		// Register category
		if ( did_action( 'wp_abilities_api_categories_init' ) ) {
			self::register_category();
		} else {
			add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
		}

		// Register abilities
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
				'description' => __( 'Abilities for managing Jetpack Forms and their responses.', 'jetpack-forms' ),
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

		self::register_list_forms_ability();
		self::register_get_form_ability();
		self::register_create_form_ability();
		self::register_delete_form_ability();
		self::register_get_responses_ability();
		self::register_update_response_ability();
		self::register_bulk_update_responses_ability();
		self::register_get_status_counts_ability();
	}

	/**
	 * Register ability to list forms with admin-level detail.
	 *
	 * @return void
	 */
	private static function register_list_forms_ability() {
		wp_register_ability(
			'jetpack-forms/list-forms',
			array(
				'label'               => __( 'List forms (admin)', 'jetpack-forms' ),
				'description'         => __( 'List all forms with admin detail including response counts, status, and edit URLs. Supports pagination, search, and status filtering.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'page'     => array(
							'type'        => 'integer',
							'description' => __( 'Page number for paginated results.', 'jetpack-forms' ),
							'default'     => 1,
						),
						'per_page' => array(
							'type'        => 'integer',
							'description' => __( 'Number of forms per page (max 100).', 'jetpack-forms' ),
							'default'     => 10,
						),
						'search'   => array(
							'type'        => 'string',
							'description' => __( 'Search forms by title.', 'jetpack-forms' ),
						),
						'status'   => array(
							'type'        => 'string',
							'description' => __( 'Filter by form status.', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft', 'trash' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'list_forms' ),
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
	 * Register ability to get a single form's full details.
	 *
	 * @return void
	 */
	private static function register_get_form_ability() {
		wp_register_ability(
			'jetpack-forms/get-form',
			array(
				'label'               => __( 'Get form details', 'jetpack-forms' ),
				'description'         => __( 'Get a single form with its full structure, field definitions, response count, status, and preview URL.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id' ),
					'properties'           => array(
						'id' => array(
							'type'        => 'integer',
							'description' => __( 'The form ID.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_form' ),
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
	 * Register ability to create a new form.
	 *
	 * @return void
	 */
	private static function register_create_form_ability() {
		wp_register_ability(
			'jetpack-forms/create-form',
			array(
				'label'               => __( 'Create a form', 'jetpack-forms' ),
				'description'         => __( 'Create a new form with a title. Optionally provide block content for the form structure. Returns the new form ID and edit URL.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'title' ),
					'properties'           => array(
						'title'   => array(
							'type'        => 'string',
							'description' => __( 'The form title/name.', 'jetpack-forms' ),
						),
						'content' => array(
							'type'        => 'string',
							'description' => __( 'Block content for the form structure. If omitted, creates an empty form with a submit button.', 'jetpack-forms' ),
						),
						'status'  => array(
							'type'        => 'string',
							'description' => __( 'Initial form status.', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft' ),
							'default'     => 'publish',
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'create_form' ),
				'permission_callback' => array( __CLASS__, 'can_edit_pages' ),
				'meta'                => array(
					'annotations'  => array(
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
	 * Register ability to delete a form.
	 *
	 * @return void
	 */
	private static function register_delete_form_ability() {
		wp_register_ability(
			'jetpack-forms/delete-form',
			array(
				'label'               => __( 'Delete a form', 'jetpack-forms' ),
				'description'         => __( 'Move a form to the trash. Does not permanently delete. Trashed forms can be restored.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id' ),
					'properties'           => array(
						'id' => array(
							'type'        => 'integer',
							'description' => __( 'The form ID to delete.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'delete_form' ),
				'permission_callback' => array( __CLASS__, 'can_edit_pages' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			)
		);
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
	 * Register ability to bulk-update form responses.
	 *
	 * @return void
	 */
	private static function register_bulk_update_responses_ability() {
		wp_register_ability(
			'jetpack-forms/bulk-update-responses',
			array(
				'label'               => __( 'Bulk update form responses', 'jetpack-forms' ),
				'description'         => __( 'Mark multiple responses as spam or not-spam in a single operation.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'action', 'ids' ),
					'properties'           => array(
						'action' => array(
							'type'        => 'string',
							'description' => __( 'The bulk action to perform.', 'jetpack-forms' ),
							'enum'        => array( 'mark_as_spam', 'mark_as_not_spam' ),
						),
						'ids'    => array(
							'type'        => 'array',
							'description' => __( 'Response IDs to update.', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'bulk_update_responses' ),
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

		// Filter by specific IDs if provided
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

		// Update status if provided
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

		// Update read status if provided
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
		if ( $response instanceof \WP_Error ) {
			return $response;
		}

		return (array) $response->get_data();
	}

	/**
	 * List forms with admin-level detail callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns array of forms with admin detail.
	 */
	public static function list_forms( $args = array() ) {
		$args     = is_array( $args ) ? $args : array();
		$endpoint = new Jetpack_Form_Endpoint();
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/jetpack-forms' );

		self::set_params_from_args( $request, $args, array( 'page', 'per_page', 'search', 'status' ) );

		// Request dashboard context to include entries_count and edit_url.
		$request->set_param( 'jetpack_forms_context', 'dashboard' );

		$response = $endpoint->get_items( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$result = array();
		foreach ( $response->get_data() as $form ) {
			$result[] = array(
				'id'            => $form['id'],
				'title'         => $form['title']['rendered'] ?? '',
				'status'        => $form['status'],
				'entries_count' => $form['entries_count'] ?? 0,
				'edit_url'      => $form['edit_url'] ?? '',
				'date'          => $form['date'],
				'modified'      => $form['modified'],
			);
		}

		return $result;
	}

	/**
	 * Get a single form's full details callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns form data with fields, or WP_Error.
	 */
	public static function get_form( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Form ID is required.', 'jetpack-forms' ) );
		}

		$form_post = get_post( absint( $args['id'] ) );
		if ( ! $form_post || Contact_Form::POST_TYPE !== $form_post->post_type ) {
			return new \WP_Error( 'not_found', __( 'Form not found.', 'jetpack-forms' ), array( 'status' => 404 ) );
		}

		$fields = self::extract_fields_from_post( $form_post );

		return array(
			'id'       => $form_post->ID,
			'title'    => $form_post->post_title,
			'status'   => $form_post->post_status,
			'fields'   => $fields,
			'date'     => $form_post->post_date,
			'modified' => $form_post->post_modified,
			'edit_url' => get_edit_post_link( $form_post->ID, 'raw' ),
		);
	}

	/**
	 * Create a new form callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns new form data or WP_Error.
	 */
	public static function create_form( $args ) {
		if ( empty( $args['title'] ) ) {
			return new \WP_Error( 'missing_title', __( 'Form title is required.', 'jetpack-forms' ) );
		}

		$content = $args['content'] ?? '';
		if ( '' === $content ) {
			// Default form structure with a submit button.
			$content = '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/button {"element":"button","text":"Submit","lock":{"remove":true}} /--><!-- /wp:jetpack/contact-form -->';
		}

		$status  = $args['status'] ?? 'publish';
		$post_id = wp_insert_post(
			array(
				'post_type'    => Contact_Form::POST_TYPE,
				'post_title'   => sanitize_text_field( $args['title'] ),
				'post_content' => $content,
				'post_status'  => $status,
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		return array(
			'id'       => $post_id,
			'title'    => get_the_title( $post_id ),
			'status'   => get_post_status( $post_id ),
			'edit_url' => get_edit_post_link( $post_id, 'raw' ),
		);
	}

	/**
	 * Delete (trash) a form callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns deletion result or WP_Error.
	 */
	public static function delete_form( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Form ID is required.', 'jetpack-forms' ) );
		}

		$form_post = get_post( absint( $args['id'] ) );
		if ( ! $form_post || Contact_Form::POST_TYPE !== $form_post->post_type ) {
			return new \WP_Error( 'not_found', __( 'Form not found.', 'jetpack-forms' ), array( 'status' => 404 ) );
		}

		$result = wp_trash_post( $form_post->ID );
		if ( ! $result ) {
			return new \WP_Error( 'delete_failed', __( 'Failed to delete form.', 'jetpack-forms' ) );
		}

		return array(
			'id'      => $form_post->ID,
			'deleted' => true,
			'status'  => 'trash',
		);
	}

	/**
	 * Bulk update responses callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns update result or WP_Error.
	 */
	public static function bulk_update_responses( $args ) {
		if ( empty( $args['action'] ) || empty( $args['ids'] ) || ! is_array( $args['ids'] ) ) {
			return new \WP_Error( 'missing_params', __( 'Action and IDs are required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_body_params(
			array(
				'action'   => $args['action'],
				'post_ids' => array_map( 'absint', $args['ids'] ),
			)
		);

		$response = $endpoint->bulk_actions( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
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

				// Skip fields without a label.
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
}

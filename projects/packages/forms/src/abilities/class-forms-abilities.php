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

/**
 * Class Forms_Abilities
 *
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 * Ability callbacks delegate to REST endpoints via rest_do_request()
 * so they inherit endpoint validation, sanitization, and hooks.
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
		// Register category.
		if ( did_action( 'wp_abilities_api_categories_init' ) ) {
			self::register_category();
		} else {
			add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
		}

		// Register abilities.
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
				'description'         => __( 'Get a single form with its full structure including field definitions, status, and edit URL.', 'jetpack-forms' ),
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
	 * Dispatch an internal REST request and return its data or WP_Error.
	 *
	 * @param \WP_REST_Request $request The REST request to dispatch.
	 * @return array|\WP_Error Response data array, or WP_Error on failure.
	 */
	private static function dispatch( $request ) {
		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}

	/**
	 * List forms with admin-level detail callback.
	 *
	 * Delegates to GET /wp/v2/jetpack-forms with dashboard context,
	 * then reshapes to a compact format for AI consumption.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns array of forms with admin detail.
	 */
	public static function list_forms( $args = array() ) {
		$args    = is_array( $args ) ? $args : array();
		$request = new \WP_REST_Request( 'GET', '/wp/v2/jetpack-forms' );

		$request->set_param( 'jetpack_forms_context', 'dashboard' );

		foreach ( array( 'page', 'per_page', 'search', 'status' ) as $key ) {
			if ( isset( $args[ $key ] ) ) {
				$request->set_param( $key, $args[ $key ] );
			}
		}

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$result = array();
		'@phan-var array[] $data'; // Phan doesn't narrow after is_wp_error + return.
		foreach ( $data as $form ) {
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
	 * Delegates to GET /wp/v2/jetpack-forms/{id} for the base data,
	 * then enriches with extracted field definitions from block content.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns form data with fields, or WP_Error.
	 */
	public static function get_form( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Form ID is required.', 'jetpack-forms' ) );
		}

		$request = new \WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . absint( $args['id'] ) );
		$request->set_param( 'context', 'edit' );

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$post   = get_post( absint( $args['id'] ) );
		$fields = $post ? self::extract_fields_from_post( $post ) : array();

		return array(
			'id'       => $data['id'],
			'title'    => $data['title']['raw'] ?? $data['title']['rendered'] ?? '',
			'status'   => $data['status'],
			'fields'   => $fields,
			'date'     => $data['date'],
			'modified' => $data['modified'],
			'edit_url' => $data['link'] ?? get_edit_post_link( $data['id'], 'raw' ),
		);
	}

	/**
	 * Create a new form callback.
	 *
	 * Delegates to POST /wp/v2/jetpack-forms, which handles
	 * sanitization, validation, and all insert hooks.
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
			$content = '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/button {"element":"button","text":"Submit","lock":{"remove":true}} /--><!-- /wp:jetpack/contact-form -->';
		}

		$request = new \WP_REST_Request( 'POST', '/wp/v2/jetpack-forms' );
		$request->set_body_params(
			array(
				'title'   => $args['title'],
				'content' => $content,
				'status'  => $args['status'] ?? 'publish',
			)
		);

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return array(
			'id'       => $data['id'],
			'title'    => $data['title']['rendered'] ?? $data['title']['raw'] ?? '',
			'status'   => $data['status'],
			'edit_url' => get_edit_post_link( $data['id'], 'raw' ),
		);
	}

	/**
	 * Delete (trash) a form callback.
	 *
	 * Delegates to DELETE /wp/v2/jetpack-forms/{id}, which handles
	 * permission checks and trash logic.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns deletion result or WP_Error.
	 */
	public static function delete_form( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Form ID is required.', 'jetpack-forms' ) );
		}

		$request = new \WP_REST_Request( 'DELETE', '/wp/v2/jetpack-forms/' . absint( $args['id'] ) );

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return array(
			'id'      => $data['id'] ?? absint( $args['id'] ),
			'deleted' => true,
			'status'  => $data['status'] ?? 'trash',
		);
	}

	/**
	 * Get form responses callback.
	 *
	 * Delegates to GET /wp/v2/feedback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns array of responses or WP_Error on failure.
	 */
	public static function get_form_responses( $args = array() ) {
		$args    = is_array( $args ) ? $args : array();
		$request = new \WP_REST_Request( 'GET', '/wp/v2/feedback' );

		foreach ( array( 'page', 'per_page', 'parent', 'status', 'is_unread', 'search', 'before', 'after' ) as $key ) {
			if ( isset( $args[ $key ] ) ) {
				$request->set_param( $key, $args[ $key ] );
			}
		}

		if ( isset( $args['ids'] ) && is_array( $args['ids'] ) ) {
			$request->set_param( 'include', $args['ids'] );
		}

		return self::dispatch( $request );
	}

	/**
	 * Update form response callback.
	 *
	 * Delegates to POST /wp/v2/feedback/{id} for status changes
	 * and POST /wp/v2/feedback/{id}/read for read state changes.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns updated response data or WP_Error on failure.
	 */
	public static function update_form_response( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Response ID is required.', 'jetpack-forms' ) );
		}

		$id     = absint( $args['id'] );
		$result = array();

		if ( isset( $args['status'] ) ) {
			$request = new \WP_REST_Request( 'POST', '/wp/v2/feedback/' . $id );
			$request->set_body_params( array( 'status' => $args['status'] ) );

			$data = self::dispatch( $request );
			if ( is_wp_error( $data ) ) {
				return $data;
			}
			$result = $data;
		}

		if ( isset( $args['is_unread'] ) ) {
			$request = new \WP_REST_Request( 'POST', '/wp/v2/feedback/' . $id . '/read' );
			$request->set_body_params( array( 'is_unread' => $args['is_unread'] ) );

			$data = self::dispatch( $request );
			if ( is_wp_error( $data ) ) {
				return $data;
			}
			$result = array_merge( $result, $data );
		}

		return $result;
	}

	/**
	 * Bulk update responses callback.
	 *
	 * Delegates to POST /wp/v2/feedback/bulk_actions.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns update result or WP_Error.
	 */
	public static function bulk_update_responses( $args ) {
		if ( empty( $args['action'] ) || empty( $args['ids'] ) || ! is_array( $args['ids'] ) ) {
			return new \WP_Error( 'missing_params', __( 'Action and IDs are required.', 'jetpack-forms' ) );
		}

		$request = new \WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_body_params(
			array(
				'action'   => $args['action'],
				'post_ids' => array_map( 'absint', $args['ids'] ),
			)
		);

		return self::dispatch( $request );
	}

	/**
	 * Get status counts callback.
	 *
	 * Delegates to GET /wp/v2/feedback/counts.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns status counts or WP_Error on failure.
	 */
	public static function get_status_counts( $args = array() ) {
		$args    = is_array( $args ) ? $args : array();
		$request = new \WP_REST_Request( 'GET', '/wp/v2/feedback/counts' );

		foreach ( array( 'search', 'parent', 'before', 'after', 'is_unread' ) as $key ) {
			if ( isset( $args[ $key ] ) ) {
				$request->set_param( $key, $args[ $key ] );
			}
		}

		return self::dispatch( $request );
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

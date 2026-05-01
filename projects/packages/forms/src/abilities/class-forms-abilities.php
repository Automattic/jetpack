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

use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Class Forms_Abilities
 *
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 * Ability callbacks delegate to REST endpoints via rest_do_request()
 * so they inherit endpoint validation, sanitization, and hooks.
 */
class Forms_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-forms';

	/**
	 * Form post statuses accepted by list-forms.
	 */
	const FORM_STATUSES = array( 'publish', 'draft', 'trash' );

	/**
	 * Form post statuses accepted by create-form.
	 */
	const CREATE_FORM_STATUSES = array( 'publish', 'draft' );

	/**
	 * Response post statuses accepted by get-responses / update-response.
	 */
	const RESPONSE_STATUSES = array( 'publish', 'draft', 'spam', 'trash' );

	/**
	 * Bulk actions accepted by bulk-update-responses.
	 */
	const BULK_ACTIONS = array( 'mark_as_spam', 'mark_as_not_spam' );

	/**
	 * Default block content used when create-form is called without `content`.
	 */
	const DEFAULT_FORM_CONTENT = '<!-- wp:jetpack/contact-form --><!-- wp:jetpack/button {"element":"button","text":"Submit","lock":{"remove":true}} /--><!-- /wp:jetpack/contact-form -->';

	/**
	 * Register the category and abilities.
	 *
	 * Forms abilities shipped (see #45998) before the
	 * `jetpack_wp_abilities_enabled` rollout filter existed, so this
	 * deliberately bypasses that gate — backing the `get-responses`,
	 * `update-response`, and `get-status-counts` abilities out behind a
	 * default-off filter would silently break consumers that already
	 * dispatch them. The newer admin abilities ride along for parity:
	 * Forms abilities are uniformly available wherever the package is
	 * loaded.
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( self::CATEGORIES_INIT_ACTION ) ) {
			static::register_category();
		} else {
			add_action( self::CATEGORIES_INIT_ACTION, array( static::class, 'register_category' ) );
		}

		if ( did_action( self::ABILITIES_INIT_ACTION ) ) {
			static::register_abilities();
		} else {
			add_action( self::ABILITIES_INIT_ACTION, array( static::class, 'register_abilities' ) );
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack Forms" is a product name and should not be translated.
			'label'       => 'Jetpack Forms',
			'description' => __( 'Abilities for managing Jetpack Forms and their responses.', 'jetpack-forms' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-forms/list-forms'            => self::spec_list_forms(),
			'jetpack-forms/get-form'              => self::spec_get_form(),
			'jetpack-forms/create-form'           => self::spec_create_form(),
			'jetpack-forms/delete-form'           => self::spec_delete_form(),
			'jetpack-forms/get-responses'         => self::spec_get_responses(),
			'jetpack-forms/update-response'       => self::spec_update_response(),
			'jetpack-forms/bulk-update-responses' => self::spec_bulk_update_responses(),
			'jetpack-forms/get-status-counts'     => self::spec_get_status_counts(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-forms/list-forms.
	 */
	private static function spec_list_forms(): array {
		return array(
			'label'               => __( 'List forms (admin)', 'jetpack-forms' ),
			'description'         => __( 'List all forms with admin detail including response counts, status, and edit URLs. Supports pagination, search, and status filtering.', 'jetpack-forms' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'page'     => array(
						'type'        => 'integer',
						'description' => __( 'Page number for paginated results.', 'jetpack-forms' ),
						'default'     => 1,
						'minimum'     => 1,
					),
					'per_page' => array(
						'type'        => 'integer',
						'description' => __( 'Number of forms per page.', 'jetpack-forms' ),
						'default'     => 10,
						'minimum'     => 1,
						'maximum'     => 100,
					),
					'search'   => array(
						'type'        => 'string',
						'description' => __( 'Search forms by title.', 'jetpack-forms' ),
					),
					'status'   => array(
						'type'        => 'string',
						'description' => __( 'Filter by form status.', 'jetpack-forms' ),
						'enum'        => self::FORM_STATUSES,
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
		);
	}

	/**
	 * Spec: jetpack-forms/get-form.
	 */
	private static function spec_get_form(): array {
		return array(
			'label'               => __( 'Get form details', 'jetpack-forms' ),
			'description'         => __( 'Get a single form with its full structure including field definitions, status, and edit URL.', 'jetpack-forms' ),
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
		);
	}

	/**
	 * Spec: jetpack-forms/create-form.
	 */
	private static function spec_create_form(): array {
		return array(
			'label'               => __( 'Create a form', 'jetpack-forms' ),
			'description'         => __( 'Create a new form with a title. Optionally provide block content for the form structure. Returns the new form ID and edit URL.', 'jetpack-forms' ),
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
						'enum'        => self::CREATE_FORM_STATUSES,
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
		);
	}

	/**
	 * Spec: jetpack-forms/delete-form.
	 */
	private static function spec_delete_form(): array {
		return array(
			'label'               => __( 'Delete a form', 'jetpack-forms' ),
			'description'         => __( 'Move a form to the trash. Does not permanently delete. Trashed forms can be restored.', 'jetpack-forms' ),
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
		);
	}

	/**
	 * Spec: jetpack-forms/get-responses.
	 */
	private static function spec_get_responses(): array {
		return array(
			'label'               => __( 'Get form responses', 'jetpack-forms' ),
			'description'         => __( 'List or search form responses. Returns response data including sender info, form fields, and metadata. Supports filtering by status, date range, read state, and search terms.', 'jetpack-forms' ),
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
						'minimum'     => 1,
					),
					'per_page'  => array(
						'type'        => 'integer',
						'description' => __( 'Number of responses to return per page.', 'jetpack-forms' ),
						'default'     => 10,
						'minimum'     => 1,
						'maximum'     => 100,
					),
					'parent'    => array(
						'type'        => 'array',
						'description' => __( 'Filter by the page or post ID where the form is embedded.', 'jetpack-forms' ),
						'items'       => array( 'type' => 'integer' ),
					),
					'status'    => array(
						'type'        => 'string',
						'description' => __( 'Filter by response status.', 'jetpack-forms' ),
						'enum'        => self::RESPONSE_STATUSES,
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
		);
	}

	/**
	 * Spec: jetpack-forms/update-response.
	 */
	private static function spec_update_response(): array {
		return array(
			'label'               => __( 'Update form response', 'jetpack-forms' ),
			'description'         => __( 'Modify a form response. Use to mark as spam, move to trash, restore from trash, or toggle read/unread state.', 'jetpack-forms' ),
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
						'enum'        => self::RESPONSE_STATUSES,
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
		);
	}

	/**
	 * Spec: jetpack-forms/bulk-update-responses.
	 */
	private static function spec_bulk_update_responses(): array {
		return array(
			'label'               => __( 'Bulk update form responses', 'jetpack-forms' ),
			'description'         => __( 'Mark multiple responses as spam (or restore from spam) in a single call. Each response is processed individually; the result reports per-id success and any per-id failures so callers can see exactly which responses were updated. Also teaches Akismet from the successful updates.', 'jetpack-forms' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'action', 'ids' ),
				'properties'           => array(
					'action' => array(
						'type'        => 'string',
						'description' => __( 'The bulk action to perform.', 'jetpack-forms' ),
						'enum'        => self::BULK_ACTIONS,
					),
					'ids'    => array(
						'type'        => 'array',
						'description' => __( 'Response IDs to update.', 'jetpack-forms' ),
						'items'       => array( 'type' => 'integer' ),
						'minItems'    => 1,
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
		);
	}

	/**
	 * Spec: jetpack-forms/get-status-counts.
	 */
	private static function spec_get_status_counts(): array {
		return array(
			'label'               => __( 'Get response status counts', 'jetpack-forms' ),
			'description'         => __( 'Get a summary of form responses grouped by status. Returns counts for inbox (active), spam, and trash. Useful for dashboard stats or checking if there are new responses.', 'jetpack-forms' ),
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
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission callback shared by every Forms ability. The delegated REST
	 * controller re-checks the user's edit permission per-route, so this is
	 * a coarse early-rejection gate, not the authoritative authorization.
	 *
	 * @return bool
	 */
	public static function can_edit_pages() {
		return current_user_can( 'edit_pages' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-forms.
	 *
	 * Delegates to GET /wp/v2/jetpack-forms with dashboard context, then
	 * reshapes to a compact format for AI consumption.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
	 */
	public static function list_forms( $args = array() ) {
		$args    = is_array( $args ) ? $args : array();
		$request = new \WP_REST_Request( 'GET', '/wp/v2/jetpack-forms' );
		$request->set_param( 'jetpack_forms_context', 'dashboard' );
		self::set_params_from_args( $request, $args, array( 'page', 'per_page', 'search', 'status' ) );

		$data = self::dispatch( $request );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		if ( ! is_array( $data ) ) {
			return array();
		}

		$result = array();
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
	 * Execute: get-form.
	 *
	 * Delegates to GET /wp/v2/jetpack-forms/{id} with `context=edit` so the
	 * raw block content comes back in the response — no second `get_post()`
	 * fetch needed.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
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

		$raw_content = $data['content']['raw'] ?? '';

		return array(
			'id'       => $data['id'],
			'title'    => $data['title']['raw'] ?? $data['title']['rendered'] ?? '',
			'status'   => $data['status'],
			'fields'   => self::extract_fields_from_content( $raw_content ),
			'date'     => $data['date'],
			'modified' => $data['modified'],
			'edit_url' => $data['link'] ?? get_edit_post_link( $data['id'], 'raw' ),
		);
	}

	/**
	 * Execute: create-form.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
	 */
	public static function create_form( $args ) {
		if ( empty( $args['title'] ) ) {
			return new \WP_Error( 'missing_title', __( 'Form title is required.', 'jetpack-forms' ) );
		}

		$content = $args['content'] ?? '';
		if ( '' === $content ) {
			$content = self::DEFAULT_FORM_CONTENT;
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
			'title'    => $data['title']['raw'] ?? $data['title']['rendered'] ?? '',
			'status'   => $data['status'],
			'edit_url' => get_edit_post_link( $data['id'], 'raw' ),
		);
	}

	/**
	 * Execute: delete-form.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
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
	 * Execute: get-responses.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
	 */
	public static function get_form_responses( $args = array() ) {
		$args    = is_array( $args ) ? $args : array();
		$request = new \WP_REST_Request( 'GET', '/wp/v2/feedback' );
		self::set_params_from_args( $request, $args, array( 'page', 'per_page', 'parent', 'status', 'is_unread', 'search', 'before', 'after' ) );

		if ( isset( $args['ids'] ) && is_array( $args['ids'] ) ) {
			$request->set_param( 'include', $args['ids'] );
		}

		return self::dispatch( $request );
	}

	/**
	 * Execute: update-response.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
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
	 * Execute: bulk-update-responses.
	 *
	 * The `/wp/v2/feedback/bulk_actions` REST endpoint only teaches Akismet —
	 * it does not change post status. The dashboard handles bulk spam/not-spam
	 * by issuing per-id status updates first, then calling bulk_actions to
	 * teach Akismet from the successful flips. We mirror that here so callers
	 * get a faithful per-id confirmation: each id either lands in `succeeded`
	 * or in `failed` with the underlying error code/message.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
	 */
	public static function bulk_update_responses( $args ) {
		if ( empty( $args['action'] ) || empty( $args['ids'] ) || ! is_array( $args['ids'] ) ) {
			return new \WP_Error( 'missing_params', __( 'Action and IDs are required.', 'jetpack-forms' ) );
		}

		$action        = $args['action'];
		$target_status = 'mark_as_spam' === $action ? 'spam' : 'publish';
		$ids           = array_values( array_unique( array_map( 'absint', $args['ids'] ) ) );

		$succeeded = array();
		$failed    = array();
		foreach ( $ids as $id ) {
			if ( $id <= 0 ) {
				$failed[] = array(
					'id'      => $id,
					'code'    => 'invalid_id',
					'message' => __( 'Response IDs must be positive integers.', 'jetpack-forms' ),
				);
				continue;
			}
			$request = new \WP_REST_Request( 'POST', '/wp/v2/feedback/' . $id );
			$request->set_body_params( array( 'status' => $target_status ) );
			$data = self::dispatch( $request );
			if ( is_wp_error( $data ) ) {
				$failed[] = array(
					'id'      => $id,
					'code'    => $data->get_error_code(),
					'message' => $data->get_error_message(),
				);
				continue;
			}
			$succeeded[] = $id;
		}

		// Teach Akismet from the responses whose status actually flipped.
		// Akismet learning is best-effort and independent of the status update,
		// so a failure here doesn't roll back the per-id changes above.
		if ( ! empty( $succeeded ) ) {
			$teach = new \WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
			$teach->set_body_params(
				array(
					'action'   => $action,
					'post_ids' => $succeeded,
				)
			);
			self::dispatch( $teach );
		}

		return array(
			'action'    => $action,
			'succeeded' => $succeeded,
			'failed'    => $failed,
		);
	}

	/**
	 * Execute: get-status-counts.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error
	 */
	public static function get_status_counts( $args = array() ) {
		$args    = is_array( $args ) ? $args : array();
		$request = new \WP_REST_Request( 'GET', '/wp/v2/feedback/counts' );
		self::set_params_from_args( $request, $args, array( 'search', 'parent', 'before', 'after', 'is_unread' ) );

		return self::dispatch( $request );
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Dispatch an internal REST request and unwrap the response.
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
	 * Copy a whitelisted subset of `$args` onto a REST request as parameters.
	 *
	 * @param \WP_REST_Request $request Target request.
	 * @param array            $args    Caller-supplied arguments.
	 * @param array            $keys    Allowed keys to forward.
	 */
	private static function set_params_from_args( \WP_REST_Request $request, array $args, array $keys ): void {
		foreach ( $keys as $key ) {
			if ( isset( $args[ $key ] ) ) {
				$request->set_param( $key, $args[ $key ] );
			}
		}
	}

	/**
	 * Extract field definitions from raw block content.
	 *
	 * Walks `jetpack/field-*` blocks and projects each into a compact
	 * `{ label, type, required, options?, placeholder? }` shape. Modern
	 * field blocks store the label/placeholder in `jetpack/label` and
	 * `jetpack/input` sub-blocks; legacy fixtures keep them inline as
	 * top-level attrs. Both layouts are supported.
	 *
	 * @param string $raw_content Raw block content (typically `content.raw` from REST).
	 * @return array
	 */
	private static function extract_fields_from_content( string $raw_content ): array {
		if ( '' === $raw_content ) {
			return array();
		}
		$fields = array();
		self::collect_field_blocks( parse_blocks( $raw_content ), $fields );
		return $fields;
	}

	/**
	 * Recursively walk parsed blocks and append field definitions to `$fields`.
	 *
	 * Field blocks are not recursed into — their inner blocks are layout
	 * sub-blocks (`jetpack/label`, `jetpack/input`), not nested fields.
	 * Non-field containers (columns, groups, the contact-form block itself)
	 * are recursed so fields nested inside them still get picked up.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param array $fields Reference to the fields array being built.
	 */
	private static function collect_field_blocks( array $blocks, array &$fields ): void {
		foreach ( $blocks as $block ) {
			$name = $block['blockName'] ?? '';

			if ( strpos( $name, 'jetpack/field-' ) === 0 ) {
				$summary = self::summarize_field_block( $block );
				if ( null !== $summary ) {
					$fields[] = $summary;
				}
				continue;
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				self::collect_field_blocks( $block['innerBlocks'], $fields );
			}
		}
	}

	/**
	 * Project a single `jetpack/field-*` block into the compact field shape.
	 *
	 * @param array $block Parsed block array.
	 * @return array|null Field summary, or null if the block has no usable label.
	 */
	private static function summarize_field_block( array $block ): ?array {
		$attrs       = $block['attrs'] ?? array();
		$inner_attrs = self::collect_inner_attrs( $block['innerBlocks'] ?? array() );
		$label_attrs = $inner_attrs['jetpack/label'] ?? array();
		$input_attrs = $inner_attrs['jetpack/input'] ?? array();

		$label = (string) ( $label_attrs['label'] ?? $attrs['label'] ?? '' );
		if ( '' === $label ) {
			return null;
		}

		$field = array(
			'label'    => $label,
			'type'     => str_replace( 'jetpack/field-', '', (string) ( $block['blockName'] ?? '' ) ),
			'required' => ! empty( $attrs['required'] ),
		);

		if ( ! empty( $attrs['options'] ) ) {
			$field['options'] = $attrs['options'];
		}

		$placeholder = $input_attrs['placeholder'] ?? $attrs['placeholder'] ?? '';
		if ( '' !== $placeholder ) {
			$field['placeholder'] = $placeholder;
		}

		return $field;
	}

	/**
	 * Build a `block_name => attrs` lookup from the field's direct children.
	 *
	 * @param array $inner_blocks Direct children of a field block.
	 * @return array
	 */
	private static function collect_inner_attrs( array $inner_blocks ): array {
		$out = array();
		foreach ( $inner_blocks as $child ) {
			$name = $child['blockName'] ?? '';
			if ( '' !== $name && ! isset( $out[ $name ] ) ) {
				$out[ $name ] = $child['attrs'] ?? array();
			}
		}
		return $out;
	}
}

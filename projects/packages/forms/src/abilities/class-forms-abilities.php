<?php
/**
 * Jetpack Forms Abilities Registration
 *
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-forms
 * @since 1.0.0
 */

namespace Automattic\Jetpack\Forms\Abilities;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Forms_Abilities
 *
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 * Provides abilities for managing form submissions, integrations, and status counts.
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
		// Register the ability category first
		add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );

		// Then register abilities
		add_action( 'wp_abilities_api_init', array( __CLASS__, 'register_abilities' ) );

		// If the API is already initialized, register immediately
		if ( did_action( 'wp_abilities_api_categories_init' ) ) {
			self::register_category();
		}
		if ( did_action( 'wp_abilities_api_init' ) ) {
			self::register_abilities();
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
				'label'       => __( 'Jetpack Forms', 'jetpack-forms' ),
				'description' => __( 'Abilities for managing Jetpack contact form submissions and integrations.', 'jetpack-forms' ),
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

		self::register_get_submissions_ability();
		self::register_update_submission_ability();
		self::register_delete_submission_ability();
		self::register_get_integrations_ability();
		self::register_get_status_counts_ability();
	}

	/**
	 * Register ability to get form submissions.
	 *
	 * @return void
	 */
	private static function register_get_submissions_ability() {
		wp_register_ability(
			'jetpack-forms/get-submissions',
			array(
				'label'               => __( 'Get Form Submissions', 'jetpack-forms' ),
				'description'         => __( 'Retrieve form submissions. Pass ids array to get specific submissions, or use filters for a list.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'ids'       => array(
							'type'        => 'array',
							'description' => __( 'Get specific submissions by IDs (e.g., [123] or [1, 2, 3]).', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
						'page'      => array(
							'type'        => 'integer',
							'description' => __( 'Page number for pagination.', 'jetpack-forms' ),
							'default'     => 1,
						),
						'per_page'  => array(
							'type'        => 'integer',
							'description' => __( 'Number of items per page.', 'jetpack-forms' ),
							'default'     => 10,
						),
						'parent'    => array(
							'type'        => 'array',
							'description' => __( 'Filter by parent post IDs where the form was submitted.', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
						'status'    => array(
							'type'        => 'string',
							'description' => __( 'Filter by post status (publish, draft, spam, trash).', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft', 'spam', 'trash' ),
						),
						'is_unread' => array(
							'type'        => 'boolean',
							'description' => __( 'Filter by read/unread status.', 'jetpack-forms' ),
						),
						'search'    => array(
							'type'        => 'string',
							'description' => __( 'Search term to filter submissions.', 'jetpack-forms' ),
						),
						'before'    => array(
							'type'        => 'string',
							'description' => __( 'Limit results to submissions before this ISO8601 date.', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
						'after'     => array(
							'type'        => 'string',
							'description' => __( 'Limit results to submissions after this ISO8601 date.', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_form_submissions' ),
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
	 * Register ability to update a form submission.
	 *
	 * @return void
	 */
	private static function register_update_submission_ability() {
		wp_register_ability(
			'jetpack-forms/update-submission',
			array(
				'label'               => __( 'Update Form Submission', 'jetpack-forms' ),
				'description'         => __( 'Update a form submission. Set status to "spam" to mark as spam, "publish" to restore, or "trash" to delete. Set is_unread to mark as read/unread.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id' ),
					'properties'           => array(
						'id'        => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the form submission to update.', 'jetpack-forms' ),
						),
						'status'    => array(
							'type'        => 'string',
							'description' => __( 'The new status for the submission.', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft', 'spam', 'trash' ),
						),
						'is_unread' => array(
							'type'        => 'boolean',
							'description' => __( 'Set to false to mark as read, true to mark as unread.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'update_form_submission' ),
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
	 * Register ability to delete a form submission.
	 *
	 * @return void
	 */
	private static function register_delete_submission_ability() {
		wp_register_ability(
			'jetpack-forms/delete-submission',
			array(
				'label'               => __( 'Delete Form Submission', 'jetpack-forms' ),
				'description'         => __( 'Permanently delete a form submission.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id' ),
					'properties'           => array(
						'id' => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the form submission to delete.', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'delete_form_submission' ),
				'permission_callback' => array( __CLASS__, 'can_delete_posts' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => false,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	/**
	 * Register ability to get integrations.
	 *
	 * @return void
	 */
	private static function register_get_integrations_ability() {
		wp_register_ability(
			'jetpack-forms/get-integrations',
			array(
				'label'               => __( 'Get Form Integrations', 'jetpack-forms' ),
				'description'         => __( 'Retrieve form integrations (Akismet, MailPoet, Salesforce, Google Drive, etc.) and their status. Optionally pass a slug to get a single integration.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'slug' => array(
							'type'        => 'string',
							'description' => __( 'Optional integration slug to get a single integration (e.g., akismet, mailpoet, salesforce, google-drive).', 'jetpack-forms' ),
						),
					),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_integrations' ),
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
	 * Register ability to get status counts.
	 *
	 * @return void
	 */
	private static function register_get_status_counts_ability() {
		wp_register_ability(
			'jetpack-forms/get-status-counts',
			array(
				'label'               => __( 'Get Submission Status Counts', 'jetpack-forms' ),
				'description'         => __( 'Get counts of form submissions by status (inbox, spam, trash) with optional filtering.', 'jetpack-forms' ),
				'category'            => self::CATEGORY_SLUG,
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'search'    => array(
							'type'        => 'string',
							'description' => __( 'Search term to filter counts.', 'jetpack-forms' ),
						),
						'parent'    => array(
							'type'        => 'integer',
							'description' => __( 'Filter by parent post ID.', 'jetpack-forms' ),
						),
						'before'    => array(
							'type'        => 'string',
							'description' => __( 'Limit to submissions before this ISO8601 date.', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
						'after'     => array(
							'type'        => 'string',
							'description' => __( 'Limit to submissions after this ISO8601 date.', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
						'is_unread' => array(
							'type'        => 'boolean',
							'description' => __( 'Filter by read/unread status.', 'jetpack-forms' ),
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
	 * Check if user can delete posts.
	 *
	 * @return bool
	 */
	public static function can_delete_posts() {
		return current_user_can( 'delete_posts' );
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
	 * Get form submissions callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns array of submissions or WP_Error on failure.
	 */
	public static function get_form_submissions( $args = array() ) {
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
	 * Update form submission callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns updated submission data or WP_Error on failure.
	 */
	public static function update_form_submission( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Submission ID is required.', 'jetpack-forms' ) );
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
	 * Delete form submission callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns deletion result or WP_Error on failure.
	 */
	public static function delete_form_submission( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Submission ID is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'DELETE', '/wp/v2/feedback/' . $args['id'] );
		$request->set_url_params( array( 'id' => $args['id'] ) );
		$request->set_param( 'force', true );

		$response = $endpoint->delete_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Get integrations callback.
	 *
	 * @param array $args Arguments from the ability input.
	 * @return array|\WP_Error Returns integrations data or WP_Error on failure.
	 */
	public static function get_integrations( $args = array() ) {
		$args     = is_array( $args ) ? $args : array();
		$endpoint = new Contact_Form_Endpoint( 'feedback' );

		// If slug provided, get single integration
		if ( isset( $args['slug'] ) ) {
			$request = new \WP_REST_Request( 'GET', '/wp/v2/feedback/integrations/' . $args['slug'] );
			$request->set_url_params( array( 'slug' => $args['slug'] ) );
			$response = $endpoint->get_single_integration_status( $request );
		} else {
			$request = new \WP_REST_Request( 'GET', '/wp/v2/feedback/integrations' );
			$request->set_param( 'version', 2 );
			$response = $endpoint->get_all_integrations_status( $request );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
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

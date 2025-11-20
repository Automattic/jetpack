<?php
/**
 * Jetpack Forms Abilities Registration
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Abilities;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form_Endpoint;
use Automattic\Jetpack\Forms\ContactForm\Feedback;
use Automattic\Jetpack\Forms\Dashboard\Dashboard as Forms_Dashboard;
use Automattic\Jetpack\Forms\Jetpack_Forms;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Forms_Abilities
 * Registers Jetpack Forms abilities with the WordPress Feature API.
 */
class Forms_Abilities {

	/**
	 * Initialize the abilities registration.
	 *
	 * @return void
	 */
	public static function init() {
		// Wait for the Feature API to be initialized
		add_action( 'wp_feature_api_init', array( __CLASS__, 'register_abilities' ) );

		// If the API is already initialized, register immediately
		if ( did_action( 'wp_feature_api_init' ) ) {
			self::register_abilities();
		}
	}

	/**
	 * Register all Jetpack Forms abilities.
	 *
	 * @return void
	 */
	public static function register_abilities() {
		// Check if wp_register_feature function exists
		if ( ! function_exists( 'wp_register_feature' ) ) {
			return;
		}

		// Register all abilities.
		self::register_get_form_submissions_ability();
		self::register_get_form_submission_ability();
		self::register_update_form_submission_ability();
		self::register_delete_form_submission_ability();
		self::register_mark_submission_as_spam_ability();
		self::register_mark_submission_as_not_spam_ability();
		self::register_mark_submission_as_read_ability();
		self::register_get_form_config_ability();
		self::register_get_integrations_ability();
		self::register_get_integration_ability();
		self::register_get_form_filters_ability();
		self::register_get_status_counts_ability();
	}

	/**
	 * Register ability to get form submissions.
	 */
	private static function register_get_form_submissions_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/get-submissions',
				'name'        => __( 'Get Form Submissions', 'jetpack-forms' ),
				'description' => __( 'Retrieve a list of form submissions (feedback) with filtering and pagination support.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'get_form_submissions' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'page'        => array(
							'type'        => 'integer',
							'description' => __( 'Page number for pagination.', 'jetpack-forms' ),
							'default'     => 1,
						),
						'per_page'    => array(
							'type'        => 'integer',
							'description' => __( 'Number of items per page.', 'jetpack-forms' ),
							'default'     => 10,
						),
						'parent'      => array(
							'type'        => 'array',
							'description' => __( 'Filter by parent post IDs where the form was submitted.', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
						'status'      => array(
							'type'        => 'string',
							'description' => __( 'Filter by post status (publish, draft, spam, trash).', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft', 'spam', 'trash' ),
						),
						'is_unread'   => array(
							'type'        => 'boolean',
							'description' => __( 'Filter by read/unread status.', 'jetpack-forms' ),
						),
						'search'      => array(
							'type'        => 'string',
							'description' => __( 'Search term to filter submissions.', 'jetpack-forms' ),
						),
						'before'      => array(
							'type'        => 'string',
							'description' => __( 'Limit results to submissions before this ISO8601 date.', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
						'after'       => array(
							'type'        => 'string',
							'description' => __( 'Limit results to submissions after this ISO8601 date.', 'jetpack-forms' ),
							'format'      => 'date-time',
						),
					),
				),
				'categories'  => array( 'forms', 'submissions', 'read' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to get a single form submission.
	 */
	private static function register_get_form_submission_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/get-submission',
				'name'        => __( 'Get Form Submission', 'jetpack-forms' ),
				'description' => __( 'Retrieve a single form submission by ID.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'get_form_submission' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'id' => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the form submission to retrieve.', 'jetpack-forms' ),
						),
					),
					'required'   => array( 'id' ),
				),
				'categories'  => array( 'forms', 'submissions', 'read' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to update a form submission.
	 */
	private static function register_update_form_submission_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/update-submission',
				'name'        => __( 'Update Form Submission', 'jetpack-forms' ),
				'description' => __( 'Update a form submission, including changing its status (e.g., from spam to publish).', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'update_form_submission' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'id'     => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the form submission to update.', 'jetpack-forms' ),
						),
						'status' => array(
							'type'        => 'string',
							'description' => __( 'The new status for the submission.', 'jetpack-forms' ),
							'enum'        => array( 'publish', 'draft', 'spam', 'trash' ),
						),
					),
					'required'   => array( 'id' ),
				),
				'categories'  => array( 'forms', 'submissions', 'write' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to delete a form submission.
	 */
	private static function register_delete_form_submission_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/delete-submission',
				'name'        => __( 'Delete Form Submission', 'jetpack-forms' ),
				'description' => __( 'Permanently delete a form submission.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'delete_form_submission' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'id' => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the form submission to delete.', 'jetpack-forms' ),
						),
					),
					'required'   => array( 'id' ),
				),
				'categories'  => array( 'forms', 'submissions', 'write' ),
				'is_eligible' => array( __CLASS__, 'can_delete_posts' ),
			)
		);
	}

	/**
	 * Register ability to mark submission as spam.
	 */
	private static function register_mark_submission_as_spam_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/mark-as-spam',
				'name'        => __( 'Mark Submission as Spam', 'jetpack-forms' ),
				'description' => __( 'Mark one or more form submissions as spam.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'mark_as_spam' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'ids' => array(
							'type'        => 'array',
							'description' => __( 'Array of submission IDs to mark as spam.', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
					),
					'required'   => array( 'ids' ),
				),
				'categories'  => array( 'forms', 'submissions', 'write', 'spam' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to mark submission as not spam.
	 */
	private static function register_mark_submission_as_not_spam_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/mark-as-not-spam',
				'name'        => __( 'Mark Submission as Not Spam', 'jetpack-forms' ),
				'description' => __( 'Mark one or more form submissions as not spam (restore from spam).', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'mark_as_not_spam' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'ids' => array(
							'type'        => 'array',
							'description' => __( 'Array of submission IDs to mark as not spam.', 'jetpack-forms' ),
							'items'       => array( 'type' => 'integer' ),
						),
					),
					'required'   => array( 'ids' ),
				),
				'categories'  => array( 'forms', 'submissions', 'write', 'spam' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to mark submission as read/unread.
	 */
	private static function register_mark_submission_as_read_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/mark-as-read',
				'name'        => __( 'Mark Submission as Read/Unread', 'jetpack-forms' ),
				'description' => __( 'Mark a form submission as read or unread.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'mark_as_read' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'id'        => array(
							'type'        => 'integer',
							'description' => __( 'The ID of the form submission.', 'jetpack-forms' ),
						),
						'is_unread' => array(
							'type'        => 'boolean',
							'description' => __( 'True to mark as unread, false to mark as read.', 'jetpack-forms' ),
						),
					),
					'required'   => array( 'id', 'is_unread' ),
				),
				'categories'  => array( 'forms', 'submissions', 'write' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to get form configuration.
	 */
	private static function register_get_form_config_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/get-config',
				'name'        => __( 'Get Forms Configuration', 'jetpack-forms' ),
				'description' => __( 'Retrieve Jetpack Forms configuration including integration settings and dashboard URLs.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'get_form_config' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(),
				),
				'categories'  => array( 'forms', 'configuration', 'read' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to get all integrations.
	 */
	private static function register_get_integrations_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/get-integrations',
				'name'        => __( 'Get Form Integrations', 'jetpack-forms' ),
				'description' => __( 'Retrieve a list of all available form integrations (Akismet, MailPoet, Salesforce, Google Drive, etc.) and their status.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'get_integrations' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'version' => array(
							'type'        => 'integer',
							'description' => __( 'API version (1 for object format, 2 for array format).', 'jetpack-forms' ),
							'default'     => 2,
							'enum'        => array( 1, 2 ),
						),
					),
				),
				'categories'  => array( 'forms', 'integrations', 'read' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to get a single integration.
	 */
	private static function register_get_integration_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/get-integration',
				'name'        => __( 'Get Form Integration', 'jetpack-forms' ),
				'description' => __( 'Retrieve details about a specific form integration by slug.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'get_integration' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
						'slug' => array(
							'type'        => 'string',
							'description' => __( 'The integration slug (e.g., akismet, mailpoet, salesforce, google-drive).', 'jetpack-forms' ),
						),
					),
					'required'   => array( 'slug' ),
				),
				'categories'  => array( 'forms', 'integrations', 'read' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to get form filters.
	 */
	private static function register_get_form_filters_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/get-filters',
				'name'        => __( 'Get Form Submission Filters', 'jetpack-forms' ),
				'description' => __( 'Retrieve available filter options for form submissions (dates and source posts).', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'get_form_filters' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(),
				),
				'categories'  => array( 'forms', 'submissions', 'read' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
			)
		);
	}

	/**
	 * Register ability to get status counts.
	 */
	private static function register_get_status_counts_ability() {
		wp_register_feature(
			array(
				'id'          => 'jetpack-forms/get-status-counts',
				'name'        => __( 'Get Submission Status Counts', 'jetpack-forms' ),
				'description' => __( 'Get counts of form submissions by status (inbox, spam, trash) with optional filtering.', 'jetpack-forms' ),
				'type'        => 'tool',
				'callback'    => array( __CLASS__, 'get_status_counts' ),
				'input_schema' => array(
					'type'       => 'object',
					'properties' => array(
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
				),
				'categories'  => array( 'forms', 'submissions', 'read' ),
				'is_eligible' => array( __CLASS__, 'can_edit_pages' ),
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
	 * Get form submissions callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error Returns array of submissions or WP_Error on failure.
	 */
	public static function get_form_submissions( $args ) {
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback' );

		// Set query parameters
		if ( isset( $args['page'] ) ) {
			$request->set_param( 'page', $args['page'] );
		}
		if ( isset( $args['per_page'] ) ) {
			$request->set_param( 'per_page', $args['per_page'] );
		}
		if ( isset( $args['parent'] ) ) {
			$request->set_param( 'parent', $args['parent'] );
		}
		if ( isset( $args['status'] ) ) {
			$request->set_param( 'status', $args['status'] );
		}
		if ( isset( $args['is_unread'] ) ) {
			$request->set_param( 'is_unread', $args['is_unread'] );
		}
		if ( isset( $args['search'] ) ) {
			$request->set_param( 'search', $args['search'] );
		}
		if ( isset( $args['before'] ) ) {
			$request->set_param( 'before', $args['before'] );
		}
		if ( isset( $args['after'] ) ) {
			$request->set_param( 'after', $args['after'] );
		}

		$response = $endpoint->get_items( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Get form submission callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function get_form_submission( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Submission ID is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback/' . $args['id'] );
		$request->set_url_params( array( 'id' => $args['id'] ) );

		$response = $endpoint->get_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Update form submission callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function update_form_submission( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Submission ID is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'POST', '/wp/v2/feedback/' . $args['id'] );
		$request->set_url_params( array( 'id' => $args['id'] ) );

		if ( isset( $args['status'] ) ) {
			$request->set_body_params( array( 'status' => $args['status'] ) );
		}

		$response = $endpoint->update_item( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Delete form submission callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
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
	 * Mark submissions as spam callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function mark_as_spam( $args ) {
		if ( ! isset( $args['ids'] ) || ! is_array( $args['ids'] ) ) {
			return new \WP_Error( 'missing_ids', __( 'Submission IDs array is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_body_params(
			array(
				'action'   => 'mark_as_spam',
				'post_ids' => $args['ids'],
			)
		);

		$response = $endpoint->bulk_actions( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Mark submissions as not spam callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function mark_as_not_spam( $args ) {
		if ( ! isset( $args['ids'] ) || ! is_array( $args['ids'] ) ) {
			return new \WP_Error( 'missing_ids', __( 'Submission IDs array is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'POST', '/wp/v2/feedback/bulk_actions' );
		$request->set_body_params(
			array(
				'action'   => 'mark_as_not_spam',
				'post_ids' => $args['ids'],
			)
		);

		$response = $endpoint->bulk_actions( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Mark submission as read/unread callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function mark_as_read( $args ) {
		if ( ! isset( $args['id'] ) ) {
			return new \WP_Error( 'missing_id', __( 'Submission ID is required.', 'jetpack-forms' ) );
		}
		if ( ! isset( $args['is_unread'] ) ) {
			return new \WP_Error( 'missing_is_unread', __( 'is_unread parameter is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'POST', '/wp/v2/feedback/' . $args['id'] . '/read' );
		$request->set_url_params( array( 'id' => $args['id'] ) );
		$request->set_body_params(
			array(
				'is_unread' => $args['is_unread'],
			)
		);

		$response = $endpoint->update_read_status( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Get form config callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function get_form_config( $args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback/config' );

		$response = $endpoint->get_forms_config( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Get integrations callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function get_integrations( $args ) {
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback/integrations' );

		if ( isset( $args['version'] ) ) {
			$request->set_param( 'version', $args['version'] );
		}

		$response = $endpoint->get_all_integrations_status( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Get integration callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function get_integration( $args ) {
		if ( ! isset( $args['slug'] ) ) {
			return new \WP_Error( 'missing_slug', __( 'Integration slug is required.', 'jetpack-forms' ) );
		}

		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback/integrations/' . $args['slug'] );
		$request->set_url_params( array( 'slug' => $args['slug'] ) );

		$response = $endpoint->get_single_integration_status( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Get form filters callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function get_form_filters( $args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback/filters' );

		$response = $endpoint->get_filters( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}

	/**
	 * Get status counts callback.
	 *
	 * @param array $args Arguments.
	 * @return array|WP_Error
	 */
	public static function get_status_counts( $args ) {
		$endpoint = new Contact_Form_Endpoint( 'feedback' );
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/feedback/counts' );

		if ( isset( $args['search'] ) ) {
			$request->set_param( 'search', $args['search'] );
		}
		if ( isset( $args['parent'] ) ) {
			$request->set_param( 'parent', $args['parent'] );
		}
		if ( isset( $args['before'] ) ) {
			$request->set_param( 'before', $args['before'] );
		}
		if ( isset( $args['after'] ) ) {
			$request->set_param( 'after', $args['after'] );
		}
		if ( isset( $args['is_unread'] ) ) {
			$request->set_param( 'is_unread', $args['is_unread'] );
		}

		$response = $endpoint->get_status_counts( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return $response->get_data();
	}
}


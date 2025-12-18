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

/**
 * Class Forms_Abilities
 *
 * Registers Jetpack Forms abilities with the WordPress Abilities API.
 * Provides abilities for managing form responses and status counts.
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
}

<?php
/**
 * Jetpack_Form_Endpoint class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_REST_Request;

/**
 * REST endpoint for the jetpack_form custom post type.
 */
class Jetpack_Form_Endpoint extends \WP_REST_Posts_Controller {
	/**
	 * Cached map of form_id => entries count for the current request.
	 *
	 * @var array<int,int>|null
	 */
	private $entries_count_by_form_id = null;

	/**
	 * Whether the current request filters by has_responses.
	 *
	 * @var bool
	 */
	public $has_responses_filter = true;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( Contact_Form::POST_TYPE );
	}

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		parent::register_routes();

		// Register custom preview-url route.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/preview-url',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_preview_url' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
				'args'                => array(
					'id' => array(
						'description'       => __( 'Unique identifier for the form.', 'jetpack-forms' ),
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// Get form status counts.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/status-counts',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'callback'            => array( $this, 'get_status_counts' ),
			)
		);
	}

	/**
	 * Retrieves per-status counts for the jetpack_form post type.
	 *
	 * Uses wp_count_posts() which returns all status counts in a single query.
	 *
	 * @return \WP_REST_Response Response object with status counts.
	 */
	public function get_status_counts() {
		$counts = wp_count_posts( Contact_Form::POST_TYPE );

		$publish = (int) ( $counts->publish ?? 0 );
		$draft   = (int) ( $counts->draft ?? 0 );
		$pending = (int) ( $counts->pending ?? 0 );
		$future  = (int) ( $counts->future ?? 0 );
		$private = (int) ( $counts->{'private'} ?? 0 );
		$trash   = (int) ( $counts->trash ?? 0 );

		return rest_ensure_response(
			array(
				'all'     => $publish + $draft + $pending + $future + $private,
				'publish' => $publish,
				'draft'   => $draft,
				'pending' => $pending,
				'future'  => $future,
				'private' => $private,
				'trash'   => $trash,
			)
		);
	}

	/**
	 * Get the preview URL for a form.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error Response object or WP_Error.
	 */
	public function get_preview_url( $request ) {
		$form_id     = $request->get_param( 'id' );
		$preview_url = Form_Preview::generate_preview_url( $form_id );

		if ( ! $preview_url ) {
			return new \WP_Error(
				'rest_cannot_preview',
				__( 'Unable to generate preview URL.', 'jetpack-forms' ),
				array( 'status' => 403 )
			);
		}

		return rest_ensure_response( array( 'preview_url' => $preview_url ) );
	}

	/**
	 * Add opt-in dashboard fields.
	 *
	 * @return array
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();

		// Note: We do not use the built-in WP REST "context" param for this, because it's validated
		// against core values (view/embed/edit). This param is for Jetpack Forms dashboard usage only.
		$params['jetpack_forms_context'] = array(
			'description'       => __( 'Request context for Jetpack Forms. Use "dashboard" to include dashboard-only fields.', 'jetpack-forms' ),
			'type'              => 'string',
			'default'           => '',
			'enum'              => array( '', 'dashboard' ),
			'sanitize_callback' => 'sanitize_key',
		);

		$params['has_responses'] = array(
			'description'       => __( 'Filter forms by whether they have responses. "true" returns only forms with responses, "false" returns only forms without.', 'jetpack-forms' ),
			'type'              => 'string',
			'enum'              => array( '', 'true', 'false' ),
			'default'           => '',
			'sanitize_callback' => 'sanitize_key',
		);

		return $params;
	}

	/**
	 * Return a collection of forms.
	 *
	 * We override this to compute dashboard aggregate fields in a single pass.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_items( $request ) {
		$has_responses = (string) $request->get_param( 'has_responses' );
		if ( '' !== $has_responses ) {
			$this->has_responses_filter = ( 'true' === $has_responses );
			add_filter( 'posts_clauses', array( $this, 'filter_by_responses' ), 10, 2 );
		}

		$response = parent::get_items( $request );

		if ( '' !== $has_responses ) {
			remove_filter( 'posts_clauses', array( $this, 'filter_by_responses' ), 10 );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$forms_context = (string) $request->get_param( 'jetpack_forms_context' );
		if ( 'dashboard' !== $forms_context ) {
			return $response;
		}

		$forms = $response->get_data();
		if ( ! is_array( $forms ) || empty( $forms ) ) {
			return $response;
		}

		$form_ids = array();
		foreach ( $forms as $form ) {
			if ( isset( $form['id'] ) ) {
				$form_ids[] = (int) $form['id'];
			}
		}
		$form_ids = array_values( array_unique( array_filter( $form_ids ) ) );

		$this->entries_count_by_form_id = $this->get_entries_count_by_form_id( $form_ids );

		foreach ( $forms as &$form ) {
			$form_id               = isset( $form['id'] ) ? (int) $form['id'] : 0;
			$form['entries_count'] = (int) ( $this->entries_count_by_form_id[ $form_id ] ?? 0 );
			if ( $form_id ) {
				$form['edit_url'] = get_edit_post_link( $form_id, 'raw' );
			}
		}

		$response->set_data( $forms );
		return $response;
	}

	/**
	 * Batch compute feedback counts for a list of form IDs.
	 *
	 * @param int[] $form_ids Form IDs to count entries for.
	 * @return array<int,int> Map of form_id => count
	 */
	private function get_entries_count_by_form_id( array $form_ids ): array {
		global $wpdb;

		$form_ids = array_values( array_unique( array_map( 'absint', $form_ids ) ) );
		if ( empty( $form_ids ) ) {
			return array();
		}

		// Count only "inbox-visible" feedback statuses.
		// Note: This is about feedback (response) statuses, not form post statuses (publish/draft/pending/future/private).
		$statuses = array( 'publish', 'draft' );

		// Cache the grouped counts briefly to avoid repeated DB hits (e.g. on reload / concurrent requests).
		sort( $form_ids );
		$cache_key   = 'feedback_counts_' . md5( implode( ',', $form_ids ) . '|' . implode( ',', $statuses ) );
		$cache_group = 'jetpack_forms';
		$cached      = wp_cache_get( $cache_key, $cache_group );
		if ( false !== $cached && is_array( $cached ) ) {
			return $cached;
		}

		$args = array_merge( array( Feedback::POST_TYPE ), $form_ids, $statuses );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows              = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT post_parent, COUNT(1) AS entry_count
				FROM {$wpdb->posts}
				WHERE post_type = %s
				  AND post_parent IN (" . implode( ',', array_fill( 0, count( $form_ids ), '%d' ) ) . ')
				  AND post_status IN (' . implode( ',', array_fill( 0, count( $statuses ), '%s' ) ) . ')
				GROUP BY post_parent',
				$args
			)
		);
		$counts_by_form_id = array();
		foreach ( (array) $rows as $row ) {
			$counts_by_form_id[ (int) $row->post_parent ] = (int) $row->entry_count;
		}

		wp_cache_set( $cache_key, $counts_by_form_id, $cache_group, 15 ); // 15 seconds.
		return $counts_by_form_id;
	}

	/**
	 * Filter posts_clauses to include/exclude forms that have feedback responses.
	 *
	 * @param array     $clauses SQL clauses.
	 * @param \WP_Query $query   The current WP_Query instance.
	 * @return array Modified clauses.
	 */
	public function filter_by_responses( $clauses, $query ) {
		global $wpdb;

		// Only modify the query for jetpack_form post type.
		if ( $query->get( 'post_type' ) !== $this->post_type ) {
			return $clauses;
		}

		$feedback_type = Feedback::POST_TYPE;
		$operator      = $this->has_responses_filter ? 'EXISTS' : 'NOT EXISTS';

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$subquery = $wpdb->prepare(
			"SELECT 1 FROM {$wpdb->posts} AS feedback
			WHERE feedback.post_parent = {$wpdb->posts}.ID
			AND feedback.post_type = %s
			AND feedback.post_status IN (%s, %s)",
			$feedback_type,
			'publish',
			'draft'
		);

		$clauses['where'] .= " AND $operator ($subquery)";

		return $clauses;
	}

	/**
	 * Checks if a given request has access to get items.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );

		if ( ! current_user_can( $post_type->cap->edit_posts ) ) {
			return new \WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to view forms.', 'jetpack-forms' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Checks if a given request has access to create items.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );

		if ( ! current_user_can( $post_type->cap->create_posts ) ) {
			return new \WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to create forms.', 'jetpack-forms' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::create_item_permissions_check( $request );
	}

	/**
	 * Checks if a jetpack-form can be read.
	 *
	 * @param \WP_Post $post Post object that backs the block.
	 * @return bool Whether the pattern can be read.
	 */
	public function check_read_permission( $post ) {
		// By default the read_post capability is mapped to edit_posts.
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return false;
		}

		return parent::check_read_permission( $post );
	}
}

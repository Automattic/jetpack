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
	 * Users who can edit others' forms (e.g. admins and editors) receive
	 * site-wide counts via wp_count_posts(). Users who cannot (e.g. authors)
	 * receive counts scoped to the forms they authored, so aggregate counts of
	 * other users' forms are not leaked.
	 *
	 * @return \WP_REST_Response Response object with status counts.
	 */
	public function get_status_counts() {
		$post_type_object = get_post_type_object( $this->post_type );

		if ( $post_type_object && current_user_can( $post_type_object->cap->edit_others_posts ) ) {
			$counts = (array) wp_count_posts( Contact_Form::POST_TYPE );
		} else {
			$counts = $this->get_status_counts_for_author( get_current_user_id() );
		}

		$publish = (int) ( $counts['publish'] ?? 0 );
		$draft   = (int) ( $counts['draft'] ?? 0 );
		$pending = (int) ( $counts['pending'] ?? 0 );
		$future  = (int) ( $counts['future'] ?? 0 );
		$private = (int) ( $counts['private'] ?? 0 );
		$trash   = (int) ( $counts['trash'] ?? 0 );

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
	 * Count forms authored by a specific user, grouped by post status.
	 *
	 * The wp_count_posts() function cannot be scoped by author (its second argument is a
	 * permission level, not query args), so a direct query is used to mirror its
	 * shape while restricting results to a single author. The result is
	 * user-scoped and computed by a single grouped aggregate run once per request
	 * (the dashboard preloads this endpoint), so it is intentionally not cached --
	 * unlike get_entries_count_by_form_id(), whose lookup is shared across forms
	 * and benefits from a short-lived cache.
	 *
	 * @param int $author_id User ID to scope the counts to.
	 * @return array<string,int> Map of post_status => count.
	 */
	private function get_status_counts_for_author( int $author_id ): array {
		global $wpdb;

		// Intentionally uncached: the result is user-scoped and computed once per request.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT post_status, COUNT(1) AS num_posts
				FROM {$wpdb->posts}
				WHERE post_type = %s
				  AND post_author = %d
				GROUP BY post_status",
				Contact_Form::POST_TYPE,
				$author_id
			)
		);

		$counts = array();
		foreach ( (array) $rows as $row ) {
			$counts[ $row->post_status ] = (int) $row->num_posts;
		}

		return $counts;
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
	 * Attach the `is_collecting_responses` flag to admin (edit-context) responses.
	 *
	 * Exposed on both the forms list and single-form fetches so the dashboard can
	 * warn about forms that drop their submissions. Only added for the `edit`
	 * context, which is permission-gated to users who can manage forms.
	 *
	 * @since 7.23.0
	 *
	 * @param \WP_Post         $item    Post object.
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );

		if ( 'edit' === $request->get_param( 'context' ) && isset( $item->ID ) ) {
			$data                            = $response->get_data();
			$data['is_collecting_responses'] = $this->is_form_collecting_responses( (int) $item->ID );
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Whether a stored form is configured to collect its responses anywhere.
	 *
	 * Parses the form's block content and applies the shared detection rule.
	 * Returns true (no warning) when the form has no contact-form block to read.
	 *
	 * @since 7.23.0
	 *
	 * @param int $form_id Form (jetpack_form) post ID.
	 * @return bool
	 */
	private function is_form_collecting_responses( int $form_id ): bool {
		$post = get_post( $form_id );
		if ( ! $post instanceof \WP_Post || '' === $post->post_content ) {
			return true;
		}

		foreach ( parse_blocks( $post->post_content ) as $block ) {
			$attributes = $this->find_contact_form_attributes( $block );
			if ( null !== $attributes ) {
				return Contact_Form::is_collecting_responses( $attributes );
			}
		}

		return true;
	}

	/**
	 * Recursively locate the first jetpack/contact-form block's attributes.
	 *
	 * @since 7.23.0
	 *
	 * @param array $block A parsed block.
	 * @return array|null The block attributes, or null when not found.
	 */
	private function find_contact_form_attributes( array $block ): ?array {
		if ( isset( $block['blockName'] ) && 'jetpack/contact-form' === $block['blockName'] ) {
			return isset( $block['attrs'] ) && is_array( $block['attrs'] ) ? $block['attrs'] : array();
		}

		if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
			foreach ( $block['innerBlocks'] as $inner_block ) {
				$attributes = $this->find_contact_form_attributes( $inner_block );
				if ( null !== $attributes ) {
					return $attributes;
				}
			}
		}

		return null;
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

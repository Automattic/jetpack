<?php
/**
 * Jetpack_Form_Endpoint class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * REST endpoint for the jetpack_form custom post type.
 */
class Jetpack_Form_Endpoint extends \WP_REST_Posts_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( Contact_Form::POST_TYPE );
	}

	/**
	 * Registers the default post routes plus our custom stats endpoint.
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<id>[\d]+)/stats',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'callback'            => array( $this, 'get_form_stats' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
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

	/**
	 * Adds custom fields to the REST representation.
	 *
	 * @param \WP_Post         $post    Form post.
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function prepare_item_for_response( $post, $request ) {
		$response = parent::prepare_item_for_response( $post, $request );
		$data     = $response->get_data();
		$fields   = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'responses_count', $fields ) ) {
			$data['responses_count'] = $this->get_form_responses_count( $post->ID );
		}

		if ( rest_is_field_included( 'edit_link', $fields ) ) {
			$edit_link         = get_edit_post_link( $post->ID, 'raw' );
			$data['edit_link'] = $edit_link ? $edit_link : '';
		}

		$response->set_data( $data );

		return $response;
	}

	/**
	 * Extends the schema with extra properties.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['responses_count'] = array(
			'description' => __( 'Number of responses submitted via this form.', 'jetpack-forms' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'edit' ),
			'readonly'    => true,
		);

		$schema['properties']['edit_link'] = array(
			'description' => __( 'Admin edit URL for the form.', 'jetpack-forms' ),
			'type'        => 'string',
			'context'     => array( 'edit' ),
			'readonly'    => true,
		);

		return $schema;
	}

	/**
	 * Returns daily placeholder stats for a form.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_form_stats( \WP_REST_Request $request ) {
		$form_id = (int) $request['id'];
		$form    = get_post( $form_id );

		if ( ! $form || Contact_Form::POST_TYPE !== $form->post_type ) {
			return new \WP_Error(
				'rest_form_not_found',
				__( 'Form not found.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		if ( ! $this->check_read_permission( $form ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view this form.', 'jetpack-forms' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$responses_count = $this->get_form_responses_count( $form_id );
		$activity        = array();

		for ( $day_offset = 6; $day_offset >= 0; $day_offset-- ) {
			$timestamp  = time() - ( DAY_IN_SECONDS * $day_offset );
			$activity[] = array(
				'date'   => gmdate( 'Y-m-d', $timestamp ),
				'count'  => 0,
				/* translators: Abbreviated date used in the form stats sidebar. */
				'pretty' => wp_date( _x( 'M j', 'form stats date', 'jetpack-forms' ), $timestamp ),
			);
		}

		return rest_ensure_response(
			array(
				'id'              => $form_id,
				'responses_count' => $responses_count,
				'activity'        => $activity,
			)
		);
	}

	/**
	 * Helper to count feedback posts linked to a reusable form.
	 *
	 * @param int $form_id Form ID.
	 * @return int
	 */
	protected function get_form_responses_count( $form_id ) {
		if ( ! $form_id ) {
			return 0;
		}

		$query = new \WP_Query(
			array(
				'post_type'              => 'feedback',
				'post_status'            => array( 'publish', 'draft', 'spam', 'trash' ),
				'meta_query'             => array(
					array(
						'key'   => 'jetpack_form_id',
						'value' => (string) $form_id,
					),
				),
				'fields'                 => 'ids',
				'posts_per_page'         => 1,
				'no_found_rows'          => false,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'suppress_filters'       => true,
			)
		);

		return (int) $query->found_posts;
	}
}

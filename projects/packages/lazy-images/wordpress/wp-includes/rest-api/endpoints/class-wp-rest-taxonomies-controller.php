<?php
/**
 * REST API: WP_REST_Taxonomies_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 4.7.0
 */

/**
 * Core class used to manage taxonomies via the REST API.
 *
 * @since 4.7.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Taxonomies_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 4.7.0
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'taxonomies';
	}

	/**
	 * Registers the routes for taxonomies.
	 *
	 * @since 4.7.0
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<taxonomy>[\w-]+)',
			array(
				'args'   => array(
					'taxonomy' => array(
						'description' => __( 'An alphanumeric identifier for the taxonomy.' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read taxonomies.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( 'edit' === $request['context'] ) {
			if ( ! empty( $request['type'] ) ) {
				$taxonomies = get_object_taxonomies( $request['type'], 'objects' );
			} else {
				$taxonomies = get_taxonomies( '', 'objects' );
			}

			foreach ( $taxonomies as $taxonomy ) {
				if ( ! empty( $taxonomy->show_in_rest ) && current_user_can( $taxonomy->cap->assign_terms ) ) {
					return true;
				}
			}

			return new WP_Error(
				'rest_cannot_view',
				__( 'Sorry, you are not allowed to manage terms in this taxonomy.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves all public taxonomies.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		// Retrieve the list of registered collection query parameters.
		$registered = $this->get_collection_params();

		if ( isset( $registered['type'] ) && ! empty( $request['type'] ) ) {
			$taxonomies = get_object_taxonomies( $request['type'], 'objects' );
		} else {
			$taxonomies = get_taxonomies( '', 'objects' );
		}

		$data = array();

		foreach ( $taxonomies as $tax_type => $value ) {
			if ( empty( $value->show_in_rest ) || ( 'edit' === $request['context'] && ! current_user_can( $value->cap->assign_terms ) ) ) {
				continue;
			}

			$tax               = $this->prepare_item_for_response( $value, $request );
			$tax               = $this->prepare_response_for_collection( $tax );
			$data[ $tax_type ] = $tax;
		}

		if ( empty( $data ) ) {
			// Response should still be returned as a JSON object when it is empty.
			$data = (object) $data;
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has access to a taxonomy.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, otherwise false or WP_Error object.
	 */
	public function get_item_permissions_check( $request ) {

		$tax_obj = get_taxonomy( $request['taxonomy'] );

		if ( $tax_obj ) {
			if ( empty( $tax_obj->show_in_rest ) ) {
				return false;
			}

			if ( 'edit' === $request['context'] && ! current_user_can( $tax_obj->cap->assign_terms ) ) {
				return new WP_Error(
					'rest_forbidden_context',
					__( 'Sorry, you are not allowed to manage terms in this taxonomy.' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		}

		return true;
	}

	/**
	 * Retrieves a specific taxonomy.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$tax_obj = get_taxonomy( $request['taxonomy'] );

		if ( empty( $tax_obj ) ) {
			return new WP_Error(
				'rest_taxonomy_invalid',
				__( 'Invalid taxonomy.' ),
				array( 'status' => 404 )
			);
		}

		$data = $this->prepare_item_for_response( $tax_obj, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a taxonomy object for serialization.
	 *
	 * @since 4.7.0
	 * @since 5.9.0 Renamed `$taxonomy` to `$item` to match parent class for PHP 8 named parameter support.
	 *
	 * @param WP_Taxonomy     $item    Taxonomy data.
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Restores the more descriptive, specific name for use within this method.
		$taxonomy = $item;

		$base = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;

		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( in_array( 'name', $fields, true ) ) {
			$data['name'] = $taxonomy->label;
		}

		if ( in_array( 'slug', $fields, true ) ) {
			$data['slug'] = $taxonomy->name;
		}

		if ( in_array( 'capabilities', $fields, true ) ) {
			$data['capabilities'] = $taxonomy->cap;
		}

		if ( in_array( 'description', $fields, true ) ) {
			$data['description'] = $taxonomy->description;
		}

		if ( in_array( 'labels', $fields, true ) ) {
			$data['labels'] = $taxonomy->labels;
		}

		if ( in_array( 'types', $fields, true ) ) {
			$data['types'] = array_values( $taxonomy->object_type );
		}

		if ( in_array( 'show_cloud', $fields, true ) ) {
			$data['show_cloud'] = $taxonomy->show_tagcloud;
		}

		if ( in_array( 'hierarchical', $fields, true ) ) {
			$data['hierarchical'] = $taxonomy->hierarchical;
		}

		if ( in_array( 'rest_base', $fields, true ) ) {
			$data['rest_base'] = $base;
		}

		if ( in_array( 'rest_namespace', $fields, true ) ) {
			$data['rest_namespace'] = $taxonomy->rest_namespace;
		}

		if ( in_array( 'visibility', $fields, true ) ) {
			$data['visibility'] = array(
				'public'             => (bool) $taxonomy->public,
				'publicly_queryable' => (bool) $taxonomy->publicly_queryable,
				'show_admin_column'  => (bool) $taxonomy->show_admin_column,
				'show_in_nav_menus'  => (bool) $taxonomy->show_in_nav_menus,
				'show_in_quick_edit' => (bool) $taxonomy->show_in_quick_edit,
				'show_ui'            => (bool) $taxonomy->show_ui,
			);
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$response->add_links( $this->prepare_links( $taxonomy ) );
		}

		/**
		 * Filters a taxonomy returned from the REST API.
		 *
		 * Allows modification of the taxonomy data right before it is returned.
		 *
		 * @since 4.7.0
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param WP_Taxonomy      $item     The original taxonomy object.
		 * @param WP_REST_Request  $request  Request used to generate the response.
		 */
		return apply_filters( 'rest_prepare_taxonomy', $response, $taxonomy, $request );
	}

	/**
	 * Prepares links for the request.
	 *
	 * @since 6.1.0
	 *
	 * @param WP_Taxonomy $taxonomy The taxonomy.
	 * @return array Links for the given taxonomy.
	 */
	protected function prepare_links( $taxonomy ) {
		return array(
			'collection'              => array(
				'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
			),
			'https://api.w.org/items' => array(
				'href' => rest_url( rest_get_route_for_taxonomy_items( $taxonomy->name ) ),
			),
		);
	}

	/**
	 * Retrieves the taxonomy's schema, conforming to JSON Schema.
	 *
	 * @since 4.7.0
	 * @since 5.0.0 The `visibility` property was added.
	 * @since 5.9.0 The `rest_namespace` property was added.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'taxonomy',
			'type'       => 'object',
			'properties' => array(
				'capabilities'   => array(
					'description' => __( 'All capabilities used by the taxonomy.' ),
					'type'        => 'object',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'description'    => array(
					'description' => __( 'A human-readable description of the taxonomy.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'hierarchical'   => array(
					'description' => __( 'Whether or not the taxonomy should have children.' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'labels'         => array(
					'description' => __( 'Human-readable labels for the taxonomy for various contexts.' ),
					'type'        => 'object',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'name'           => array(
					'description' => __( 'The title for the taxonomy.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'slug'           => array(
					'description' => __( 'An alphanumeric identifier for the taxonomy.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'show_cloud'     => array(
					'description' => __( 'Whether or not the term cloud should be displayed.' ),
					'type'        => 'boolean',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'types'          => array(
					'description' => __( 'Types associated with the taxonomy.' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'rest_base'      => array(
					'description' => __( 'REST base route for the taxonomy.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'rest_namespace' => array(
					'description' => __( 'REST namespace route for the taxonomy.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'visibility'     => array(
					'description' => __( 'The visibility settings for the taxonomy.' ),
					'type'        => 'object',
					'context'     => array( 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'public'             => array(
							'description' => __( 'Whether a taxonomy is intended for use publicly either via the admin interface or by front-end users.' ),
							'type'        => 'boolean',
						),
						'publicly_queryable' => array(
							'description' => __( 'Whether the taxonomy is publicly queryable.' ),
							'type'        => 'boolean',
						),
						'show_ui'            => array(
							'description' => __( 'Whether to generate a default UI for managing this taxonomy.' ),
							'type'        => 'boolean',
						),
						'show_admin_column'  => array(
							'description' => __( 'Whether to allow automatic creation of taxonomy columns on associated post-types table.' ),
							'type'        => 'boolean',
						),
						'show_in_nav_menus'  => array(
							'description' => __( 'Whether to make the taxonomy available for selection in navigation menus.' ),
							'type'        => 'boolean',
						),
						'show_in_quick_edit' => array(
							'description' => __( 'Whether to show the taxonomy in the quick/bulk edit panel.' ),
							'type'        => 'boolean',
						),

					),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the query params for collections.
	 *
	 * @since 4.7.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$new_params            = array();
		$new_params['context'] = $this->get_context_param( array( 'default' => 'view' ) );
		$new_params['type']    = array(
			'description' => __( 'Limit results to taxonomies associated with a specific post type.' ),
			'type'        => 'string',
		);
		return $new_params;
	}
}

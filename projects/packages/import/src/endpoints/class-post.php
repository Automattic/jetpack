<?php
/**
 * Posts REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

if ( ! function_exists( 'post_exists' ) ) {
	require_once ABSPATH . 'wp-admin/includes/post.php';
}

/**
 * Class Post
 */
class Post extends \WP_REST_Posts_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Whether the controller supports batching.
	 *
	 * @var array
	 */
	protected $allow_batch = array( 'v1' => true );

	/**
	 * Constructor.
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type = 'post' ) {
		parent::__construct( $post_type );

		// @see add_post_meta
		$this->import_id_meta_type = $post_type;
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Posts_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			self::$rest_namespace,
			'/' . $this->rest_base,
			$this->get_route_options()
		);
	}

	/**
	 * Adds the schema from additional fields to a schema array.
	 *
	 * The type of object is inferred from the passed schema.
	 *
	 * @param array $schema Schema array.
	 * @return array Modified Schema array.
	 */
	public function add_additional_fields_schema( $schema ) {
		// WXR saves terms as slugs, so we need to overwrite the schema.
		$schema['properties']['categories']['items']['type'] = 'string';
		$schema['properties']['tags']['items']['type']       = 'string';

		// Add the import unique ID to the schema.
		return $this->add_unique_identifier_to_schema( $schema );
	}

	/**
	 * Creates a single post.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		// Skip if the post already exists.
		$post_id = \post_exists(
			$request['title'],
			'',
			$request['date'],
			$this->post_type,
			$request['status']
		);

		if ( $post_id ) {
			return new \WP_Error(
				'post_exists',
				__( 'Cannot create existing post.', 'jetpack-import' ),
				array(
					'status'  => 400,
					'post_id' => $post_id,
				)
			);
		}

		// WXR saves terms as slugs, so we need to convert them to IDs before send the data to the legacy endpoint.
		foreach ( array( 'categories', 'tags' ) as $taxonomy ) {
			$request[ $taxonomy ] = $this->extract_terms_ids( $request, $taxonomy );
		}

		$response = parent::create_item( $request );

		return $this->add_import_id_metadata( $request, $response );
	}

	/**
	 * Extract terms IDs from slugs.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @param string          $taxonomy Taxonomy name.
	 * @return array List of terms IDs.
	 */
	protected function extract_terms_ids( $request, $taxonomy ) {
		$ret = is_array( $request[ $taxonomy ] ) ? $request[ $taxonomy ] : array();

		if ( ! count( $ret ) ) {
			return $ret;
		}

		// Extract the terms by ID.
		$ids = get_terms(
			array(
				'fields'     => 'ids',
				'hide_empty' => false,
				'slug'       => $ret,
				'taxonomy'   => $taxonomy === 'tags' ? 'post_tag' : 'category',
			)
		);

		if ( is_array( $ids ) ) {
			return $ids;
		} else {
			// Flush away any invalid terms.
			return array();
		}
	}
}

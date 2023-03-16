<?php
/**
 * Attachments REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Attachment
 */
class Attachment extends \WP_REST_Attachments_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Whether the controller supports batching. Default false.
	 *
	 * @var false
	 */
	protected $allow_batch = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'attachment' );

		// @see add_term_meta
		$this->import_id_meta_type = 'post';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Terms_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			self::$rest_namespace,
			'/' . $this->rest_base,
			$this->get_route_options()
		);

		register_rest_route(
			self::$rest_namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args'        => array(
					'id' => array(
						'description' => __( 'Unique identifier for the attachment.', 'jetpack-import' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_Server::EDITABLE ),
				),
				'allow_batch' => array( 'v1' => true ),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			self::$rest_namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/post-process',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'post_process_item' ),
				'permission_callback' => array( $this, 'import_permissions_callback' ),
				'args'                => array(
					'id'     => array(
						'description' => __( 'Unique identifier for the attachment.', 'jetpack-import' ),
						'type'        => 'integer',
					),
					'action' => array(
						'type'     => 'string',
						'enum'     => array( 'create-image-subsizes' ),
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Create a single attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$this->set_upload_dir( $request );
		return parent::create_item( $request );
	}

	/**
	 * Updates a single attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$response = parent::update_item( $request );

		return $this->add_import_id_metadata( $request, $response );
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

		// Validate the upload_date, used for placing the uploaded file in the correct upload directory.
		$schema['properties']['upload_date'] = array(
			'description' => __( 'The date for the upload directory of the attachment.', 'jetpack-import' ),
			'type'        => array( 'string', 'null' ),
			'pattern'     => '^\d{4}\/\d{2}$',
			'required'    => false,
		);

		// The unique identifier is only required for PUT requests.
		return $this->add_unique_identifier_to_schema( $schema, isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'PUT' );
	}

	/**
	 * Performs post-processing on an attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function post_process_item( $request ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';

		\wp_update_image_subsizes( $request['id'] );
		$request['context'] = 'edit';

		return $this->prepare_item_for_response( \get_post( $request['id'] ), $request );
	}

	/**
	 * Add a filter that rewrites the upload path.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 *
	 * @return void
	 * @throws \Exception If the date is invalid.
	 */
	protected function set_upload_dir( $request ) {

		if ( ! $request->get_param( 'upload_date' ) ) {
			return;
		}

		add_filter(
			'upload_dir',
			static function ( $data ) use ( $request ) {
				$date              = $request->get_param( 'upload_date' );
				$fields_to_rewrite = array( 'path', 'url', 'subdir' );
				foreach ( $fields_to_rewrite as $field ) {
					$data[ $field ] = preg_replace( '/\d{4}\/\d{2}$/', $date, $data[ $field ] );
				}

				return $data;
			}
		);
	}
}

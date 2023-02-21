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
			'/' . $this->rest_base . '/(?P<id>[\d]+)/post-process',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'post_process_item' ),
				'permission_callback' => array( $this, 'import_permissions_callback' ),
				'args'                => array(
					'id' => array(
						'description' => __( 'Unique identifier for the attachment.', 'jetpack-import' ),
						'type'        => 'integer',
					),
				),
			)
		);
	}

	/**
	 * Performs post processing on an attachment.
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
}

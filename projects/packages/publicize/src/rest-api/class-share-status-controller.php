<?php
/**
 * The Jetpack Social Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Share_Status;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Jetpack Social Controller class.
 */
class Share_Status_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/share-status';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
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
					'args'                => array(
						'post_id' => array(
							'type'        => 'integer',
							'required'    => true,
							'description' => __( 'The post ID to filter the items by.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Get Jetpack Social data.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		$post_id = $request->get_param( 'post_id' );

		$post = get_post( $post_id );

		if ( empty( $post ) ) {
			return new WP_Error(
				'post_not_found',
				__( 'Cannot find that post.', 'jetpack-publicize-pkg' ),
				array( 'status' => 404 )
			);
		}

		if ( 'publish' !== $post->post_status ) {
			return new WP_Error(
				'post_not_published',
				__( 'Cannot get share status for an unpublished post', 'jetpack-publicize-pkg' ),
				array( 'status' => 400 )
			);
		}

		return rest_ensure_response( Share_Status::get_post_share_status( $post_id ) );
	}

	/**
	 * Verify that the request has access to Jetpack Social data.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->publicize_permissions_check();
	}

	/**
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-social-share-status',
			'type'       => 'object',
			'properties' => array(
				'shares' => array(
					'description' => __( 'List of shares.', 'jetpack-publicize-pkg' ),
					'type'        => 'array',
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'status'          => array(
								'description' => __( 'Status of the share.', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
							),
							'message'         => array(
								'description' => __( 'Share message or link.', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
							),
							'timestamp'       => array(
								'description' => __( 'Timestamp of the share.', 'jetpack-publicize-pkg' ),
								'type'        => 'integer',
							),
							'service'         => array(
								'description' => __( 'The service to which it was shared.', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
							),
							'connection_id'   => array(
								'description' => __( 'Connection ID for the share.', 'jetpack-publicize-pkg' ),
								'type'        => 'integer',
							),
							'external_id'     => array(
								'description' => __( 'External ID of the shared post.', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
							),
							'external_name'   => array(
								'description' => __( 'External name of the shared post.', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
							),
							'profile_picture' => array(
								'description' => __( 'Profile picture URL of the account sharing.', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
							),
							'profile_link'    => array(
								'description' => __( 'Profile link of the sharing account.', 'jetpack-publicize-pkg' ),
								'type'        => 'string',
							),
						),
					),
				),
				'done'   => array(
					'description' => __( 'Indicates if the process is completed.', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}
}

<?php
/**
 * The Publicize Connections Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Publicize\Connections;
use Automattic\Jetpack\Publicize\Publicize_Utils;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Connections Controller class.
 */
class Connections_Controller extends Base_Controller {

	/**
	 * The API version.
	 *
	 * @var string
	 */
	protected $version = 'v2';

	/**
	 * The base API path.
	 *
	 * @var string
	 */
	protected $base_api_path = 'wpcom';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/connections';

		$this->allow_requests_as_blog = true;

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
						'test_connections' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether to test connections.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}
		$deprecated_fields = array(
			'id'                   => array(
				'type'        => 'string',
				'description' => __( 'Unique identifier for the Jetpack Social connection.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'connection_id'
				),
			),
			'username'             => array(
				'type'        => 'string',
				'description' => __( 'Username of the connected account.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'external_handle'
				),
			),
			'profile_display_name' => array(
				'type'        => 'string',
				'description' => __( 'The name to display in the profile of the connected account.', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'display_name'
				),
			),
			'global'               => array(
				'type'        => 'boolean',
				'description' => __( 'Is this connection available to all users?', 'jetpack-publicize-pkg' ) . ' ' . sprintf(
					/* translators: %s is the new field name */
					__( 'Deprecated in favor of %s.', 'jetpack-publicize-pkg' ),
					'shared'
				),
			),
		);

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection',
			'type'       => 'object',
			'properties' => array_merge(
				$deprecated_fields,
				self::get_the_item_schema()
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get the schema for the connection item.
	 *
	 * @return array
	 */
	public static function get_the_item_schema() {
		return array(
			'connection_id'   => array(
				'type'        => 'string',
				'description' => __( 'Connection ID of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'display_name'    => array(
				'type'        => 'string',
				'description' => __( 'Display name of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'external_handle' => array(
				'type'        => 'string',
				'description' => __( 'The external handle or username of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'external_id'     => array(
				'type'        => 'string',
				'description' => __( 'The external ID of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'profile_link'    => array(
				'type'        => 'string',
				'description' => __( 'Profile link of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'profile_picture' => array(
				'type'        => 'string',
				'description' => __( 'URL of the profile picture of the connected account.', 'jetpack-publicize-pkg' ),
			),
			'service_label'   => array(
				'type'        => 'string',
				'description' => __( 'Human-readable label for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
			),
			'service_name'    => array(
				'type'        => 'string',
				'description' => __( 'Alphanumeric identifier for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
			),
			'shared'          => array(
				'type'        => 'boolean',
				'description' => __( 'Whether the connection is shared with other users.', 'jetpack-publicize-pkg' ),
			),
			'status'          => array(
				'type'        => 'string',
				'description' => __( 'The connection status.', 'jetpack-publicize-pkg' ),
				'enum'        => array(
					'ok',
					'broken',
					'must_reauth',
				),
			),
			'user_id'         => array(
				'type'        => 'integer',
				'description' => __( 'ID of the user the connection belongs to. It is the user ID on wordpress.com', 'jetpack-publicize-pkg' ),
			),
		);
	}

	/**
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		if ( Publicize_Utils::is_wpcom() ) {
			$args = array(
				'context'          => self::is_authorized_blog_request() ? 'blog' : 'user',
				'test_connections' => $request->get_param( 'test_connections' ),
			);

			$connections = Connections::wpcom_get_connections( $args );
		} else {
			$proxy = new Proxy_Requests( $this->rest_base );

			$connections = $proxy->proxy_request_to_wpcom( $request );
		}

		if ( is_wp_error( $connections ) ) {
			return $connections;
		}

		$items = array();

		foreach ( $connections as $item ) {
			$data = $this->prepare_item_for_response( $item, $request );

			$items[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
	}
}

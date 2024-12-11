<?php
/**
 * The Publicize services Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Rest_Endpoints;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Services Controller class.
 */
class Services_Controller extends Base_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->rest_base = 'publicize/services';

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
					'permission_callback' => array( $this, 'get_items_permission_check' ),
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
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-connection',
			'type'       => 'object',
			'properties' => array(
				'ID'                                => array(
					'type'        => 'string',
					'description' => __( 'Alphanumeric identifier for the service.', 'jetpack-publicize-pkg' ),
				),
				'label'                             => array(
					'type'        => 'string',
					'description' => __( 'Human-readable label for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
				),
				'type'                              => array(
					'type'        => 'string',
					'description' => __( 'Type of service.', 'jetpack-publicize-pkg' ),
					'enum'        => array(
						'publicize',
						'other',
					),
				),
				'description'                       => array(
					'type'        => 'string',
					'description' => __( 'Description for the service.', 'jetpack-publicize-pkg' ),
				),
				'connect_URL'                       => array(
					'type'        => 'string',
					'description' => __( 'URL to use for connecting an account for the service.', 'jetpack-publicize-pkg' ),
				),
				'external_users_only'               => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the service supports only the external users and not the main user account.', 'jetpack-publicize-pkg' ),
				),
				'multiple_external_user_ID_support' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the service is supported for multiple external user accounts.', 'jetpack-publicize-pkg' ),
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Get a list of Publicize supported services.
	 *
	 * @return array
	 */
	public static function get_supported_services() {
		if ( self::is_wpcom() ) {
			if ( function_exists( 'require_lib' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction - phan is dumb not to see the function_exists check.
				require_lib( 'external-connections' );
			}

			// @phan-suppress-next-line PhanUndeclaredClassMethod - We are here because we are on WPCOM.
			$external_connections = \WPCOM_External_Connections::init();

			$services = $external_connections->get_external_services_list( 'publicize', get_current_blog_id() );

			$services = array_values( $services );

			return $services;

		} else {
			$site_id = Manager::get_site_id( true );
			if ( ! $site_id ) {
				return array();
			}

			$path = sprintf( '/sites/%d/publicize/services', $site_id );

			$response = Client::wpcom_json_api_request_as_user( $path, 'v3', array( 'method' => 'GET' ) );

			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				// TODO log error.
				return array();
			}

			$body = wp_remote_retrieve_body( $response );

			$items = json_decode( $body, true );

			return $items ? $items : array();
		}
	}

	/**
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		$items = array();

		foreach ( self::get_supported_services() as $item ) {
			$data = $this->prepare_item_for_response( $item, $request );

			$items[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
	}
}

if ( Base_Controller::is_wpcom() ) {
	wpcom_rest_api_v2_load_plugin( Services_Controller::class );
}

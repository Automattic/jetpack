<?php
/**
 * The Publicize services Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Rest_Endpoints;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers the REST routes
 */
class Services_Controller extends WP_REST_Controller {

	/**
	 * Whether we are on WPCOM.
	 *
	 * @var bool $is_wpcom
	 */
	protected $is_wpcom = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v3';
		$this->rest_base = 'publicize/services';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );

		$this->is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;

		$this->wpcom_is_wpcom_only_endpoint = true;
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
	 * Get list of connected Publicize connections.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		if ( $this->is_wpcom ) {
			if ( function_exists( 'require_lib' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction - phan is dumb not to see the function_exists check.
				require_lib( 'external-connections' );
			}

			// @phan-suppress-next-line PhanUndeclaredClassMethod - We are here because we are on WPCOM.
			$external_connections = \WPCOM_External_Connections::init();

			$services = $external_connections->get_external_services_list( 'publicize', get_current_blog_id() );

			$services = array_values( $services );

			return rest_ensure_response( $services );

		} else {
			$site_id = Manager::get_site_id( true );
			if ( ! $site_id ) {
				return rest_ensure_response( array() );
			}

			$path = add_query_arg(
				$request->get_query_params(),
				sprintf( '/sites/%d/' . $this->rest_base, $site_id )
			);

			$response = Client::wpcom_json_api_request_as_user( $path, 'v3', array( 'method' => 'GET' ) );

			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				// TODO log error.
				return rest_ensure_response( array() );
			}

			return rest_ensure_response(
				json_decode( wp_remote_retrieve_body( $response ), true )
			);
		}
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $item    Item to prepare.
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response filtered item
	 */
	public function prepare_item_for_response( $item, $request ) {
		if ( ! is_callable( array( $this, 'get_fields_for_response' ) ) ) {
			return rest_ensure_response( $item );
		}

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $item as $field => $value ) {
			if ( in_array( $field, $fields, true ) ) {
				$response_data[ $field ] = $value;
			}
		}

		return rest_ensure_response( $response_data );
	}

	/**
	 * Verify that user can access Publicize data
	 *
	 * @return true|WP_Error
	 */
	public function get_items_permission_check() {
		global $publicize;

		if ( ! $publicize ) {
			return new WP_Error(
				'publicize_not_available',
				__( 'Sorry, Jetpack Social is not available on your site right now.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Jetpack Social data on this site.', 'jetpack-publicize-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( Services_Controller::class );
}

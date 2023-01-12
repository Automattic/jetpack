<?php
/**
 * REST API endpoint for the Instagram connections.
 *
 * @package automattic/jetpack
 * @since 8.5.0
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

/**
 * Instagram connections helper API.
 *
 * @since 8.5
 */
class WPCOM_REST_API_V2_Endpoint_Instagram_Gallery extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'instagram-gallery';
		$this->is_wpcom  = false;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;

			if ( ! class_exists( 'WPCOM_Instagram_Gallery_Helper' ) ) {
				\require_lib( 'instagram-gallery-helper' );
			}
		}

		if ( ! class_exists( 'Jetpack_Instagram_Gallery_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-instagram-gallery-helper.php';
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/connect-url',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_instagram_connect_url' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/connections',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_instagram_connections' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/gallery',
			array(
				'args'                => array(
					'access_token' => array(
						'description'       => __( 'An Instagram Keyring access token.', 'jetpack' ),
						'type'              => 'integer',
						'required'          => true,
						'minimum'           => 1,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param ) && (int) $param > 0;
						},
					),
					'count'        => array(
						'description'       => __( 'How many Instagram posts?', 'jetpack' ),
						'type'              => 'integer',
						'required'          => true,
						'minimum'           => 1,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param ) && (int) $param > 0;
						},
					),
				),
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_instagram_gallery' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Get the Instagram connect URL.
	 *
	 * @return mixed
	 */
	public function get_instagram_connect_url() {
		if ( $this->is_wpcom ) {
			return WPCOM_Instagram_Gallery_Helper::get_connect_url();
		}

		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$path     = sprintf( '/sites/%d/external-services', $site_id );
		$response = Client::wpcom_json_api_request_as_user( $path );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		if ( ! property_exists( $body, 'services' ) || ! property_exists( $body->services, 'instagram-basic-display' ) ) {
			return new WP_Error(
				'bad_request',
				__( 'An error occurred. Please try again later.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		return $body->services->{ 'instagram-basic-display' }->connect_URL;
	}

	/**
	 * Get a list of stored Instagram connections for the current user.
	 *
	 * @return mixed
	 */
	public function get_instagram_connections() {
		if ( $this->is_wpcom ) {
			return WPCOM_Instagram_Gallery_Helper::get_connections();
		}

		$response = Client::wpcom_json_api_request_as_user( '/me/connections' );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$body = json_decode( wp_remote_retrieve_body( $response ) );

		$connections = array();

		if ( isset( $body->connections ) && is_array( $body->connections ) ) {
			foreach ( $body->connections as $connection ) {
				if ( 'instagram-basic-display' === $connection->service && 'ok' === $connection->status ) {
					$connections[] = array(
						'token'    => (string) $connection->ID,
						'username' => $connection->external_name,
					);
				}
			}
		}
		return $connections;
	}

	/**
	 * Get the Instagram Gallery.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return mixed
	 */
	public function get_instagram_gallery( $request ) {
		return Jetpack_Instagram_Gallery_Helper::get_instagram_gallery( $request['access_token'], $request['count'] );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Instagram_Gallery' );

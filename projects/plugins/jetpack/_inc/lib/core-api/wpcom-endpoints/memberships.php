<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName
/**
 * Memberships: API to communicate with "product" database.
 *
 * @package    Jetpack
 * @since      7.3.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Memberships
 * This introduces V2 endpoints.
 */
class WPCOM_REST_API_V2_Endpoint_Memberships extends WP_REST_Controller {

	/**
	 * WPCOM_REST_API_V2_Endpoint_Memberships constructor.
	 */
	public function __construct() {
		$this->namespace                       = 'wpcom/v2';
		$this->rest_base                       = 'memberships';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/status',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_status' ),
					'permission_callback' => array( $this, 'get_status_permission_check' ),
					'args'                => array(
						'type'   => array(
							'type'              => 'string',
							'required'          => false,
							'validate_callback' => function ( $param ) {
								return in_array( $param, array( 'donation', 'all' ), true );
							},
						),
						'source' => array(
							'type'              => 'string',
							'required'          => false,
							'validate_callback' => function ( $param ) {
								return in_array( $param, array( 'calypso', 'earn', 'gutenberg', 'gutenberg-wpcom' ), true );
							},
						),
					),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/product',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_product' ),
					'permission_callback' => array( $this, 'get_status_permission_check' ),
					'args'                => array(
						'title'    => array(
							'type'     => 'string',
							'required' => true,
						),
						'price'    => array(
							'type'     => 'float',
							'required' => true,
						),
						'currency' => array(
							'type'     => 'string',
							'required' => true,
						),
						'interval' => array(
							'type'     => 'string',
							'required' => true,
						),
					),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/products',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_products' ),
					'permission_callback' => array( $this, 'get_status_permission_check' ),
				),
			)
		);
	}

	/**
	 * Ensure the user has proper permissions
	 *
	 * @return boolean
	 */
	public function get_status_permission_check() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Do create a product based on data, or pass request to wpcom.
	 *
	 * @param object $request - request passed from WP.
	 *
	 * @return array|WP_Error
	 */
	public function create_product( $request ) {
		if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			jetpack_require_lib( 'memberships' );
			$connected_destination_account_id = Jetpack_Memberships::get_connected_account_id();
			if ( ! $connected_destination_account_id ) {
				return new WP_Error( 'no-destination-account', __( 'Please set up a Stripe account for this site first', 'jetpack' ) );
			}
			$product = Memberships_Product::create(
				get_current_blog_id(),
				array(
					'title'                            => $request['title'],
					'price'                            => $request['price'],
					'currency'                         => $request['currency'],
					'interval'                         => $request['interval'],
					'connected_destination_account_id' => $connected_destination_account_id,
				)
			);
			if ( is_wp_error( $product ) ) {
				return new WP_Error( $product->get_error_code(), __( 'Creating product has failed.', 'jetpack' ) );
			}
			return $product->to_array();
		} else {
			$blog_id  = Jetpack_Options::get_option( 'id' );
			$response = Client::wpcom_json_api_request_as_user(
				"/sites/$blog_id/{$this->rest_base}/product",
				'v2',
				array(
					'method' => 'POST',
				),
				array(
					'title'    => $request['title'],
					'price'    => $request['price'],
					'currency' => $request['currency'],
					'interval' => $request['interval'],
				)
			);
			if ( is_wp_error( $response ) ) {
				if ( $response->get_error_code() === 'missing_token' ) {
					return new WP_Error( 'missing_token', __( 'Please connect your user account to WordPress.com', 'jetpack' ), 404 );
				}
				return new WP_Error( 'wpcom_connection_error', __( 'Could not connect to WordPress.com', 'jetpack' ), 404 );
			}
			$data = isset( $response['body'] ) ? json_decode( $response['body'], true ) : null;
			// If endpoint returned error, we have to detect it.
			if ( 200 !== $response['response']['code'] && $data['code'] && $data['message'] ) {
				return new WP_Error( $data['code'], $data['message'], 401 );
			}
			return $data;
		}

		return $request;
	}

	/**
	 * Automatically generate products according to type.
	 *
	 * @param object $request - request passed from WP.
	 *
	 * @return array|WP_Error
	 */
	public function create_products( $request ) {
		if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			jetpack_require_lib( 'memberships' );
			$connected_destination_account_id = Jetpack_Memberships::get_connected_account_id();
			if ( ! $connected_destination_account_id ) {
				return new WP_Error( 'no-destination-account', __( 'Please set up a Stripe account for this site first', 'jetpack' ) );
			}
			$result = Memberships_Product::generate_default_products( get_current_blog_id(), $request['type'], $request['currency'], $connected_destination_account_id );
			if ( is_wp_error( $result ) ) {
				$status = 'invalid_param' === $result->get_error_code() ? 400 : 500;
				return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => $status ) );
			}
			return $result;
		} else {
			$blog_id  = Jetpack_Options::get_option( 'id' );
			$response = Client::wpcom_json_api_request_as_user(
				"/sites/$blog_id/{$this->rest_base}/products",
				'v2',
				array(
					'method' => 'POST',
				),
				array(
					'type'     => $request['type'],
					'currency' => $request['currency'],
				)
			);
			if ( is_wp_error( $response ) ) {
				if ( $response->get_error_code() === 'missing_token' ) {
					return new WP_Error( 'missing_token', __( 'Please connect your user account to WordPress.com', 'jetpack' ), 404 );
				}
				return new WP_Error( 'wpcom_connection_error', __( 'Could not connect to WordPress.com', 'jetpack' ), 404 );
			}
			$data = isset( $response['body'] ) ? json_decode( $response['body'], true ) : null;
			// If endpoint returned error, we have to detect it.
			if ( 200 !== $response['response']['code'] && $data['code'] ) {
				return new WP_Error( $data['code'], $data['message'] ? $data['message'] : '', 401 );
			}
			return $data;
		}

		return $request;
	}

	/**
	 * Get a status of connection for the site. If this is Jetpack, pass the request to wpcom.
	 *
	 * @param \WP_REST_Request $request - request passed from WP.
	 *
	 * @return WP_Error|array ['products','connected_account_id','connect_url','should_upgrade_to_access_memberships','upgrade_url']
	 */
	public function get_status( \WP_REST_Request $request ) {
		$product_type = $request['type'];
		$source       = $request['source'];
		if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			jetpack_require_lib( 'memberships' );
			$blog_id = get_current_blog_id();
			return (array) get_memberships_settings_for_site( $blog_id, $product_type );
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
			$path    = "/sites/$blog_id/{$this->rest_base}/status";
			if ( $product_type ) {
				$path = add_query_arg(
					array(
						'type'   => $product_type,
						'source' => $source,
					),
					$path
				);
			}
			$response = Client::wpcom_json_api_request_as_user( $path, 'v2' );
			if ( is_wp_error( $response ) ) {
				if ( $response->get_error_code() === 'missing_token' ) {
					return new WP_Error( 'missing_token', __( 'Please connect your user account to WordPress.com', 'jetpack' ), 404 );
				}
				return new WP_Error( 'wpcom_connection_error', __( 'Could not connect to WordPress.com', 'jetpack' ), 404 );
			}
			$data = isset( $response['body'] ) ? json_decode( $response['body'], true ) : null;
			if ( 200 !== $response['response']['code'] && $data['code'] && $data['message'] ) {
				return new WP_Error( $data['code'], $data['message'], 401 );
			}
			return $data;
		}
	}
}

if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) {
	wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Memberships' );
}

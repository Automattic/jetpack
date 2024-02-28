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
			$this->rest_base . '/status/?',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_status' ),
					'permission_callback' => array( $this, 'get_status_permission_check' ),
					'args'                => array(
						'type'        => array(
							'type'              => 'string',
							'required'          => false,
							'validate_callback' => function ( $param ) {
								return in_array( $param, array( 'donation', 'all' ), true );
							},
						),
						'source'      => array(
							'type'              => 'string',
							'required'          => false,
							'validate_callback' => function ( $param ) {
								return in_array(
									$param,
									array(
										'calypso',
										'earn',
										'earn-newsletter',
										'gutenberg',
										'gutenberg-wpcom',
										'launchpad',
									),
									true
								);
							},
						),
						'is_editable' => array(
							'type'     => 'boolean',
							'required' => false,
						),
					),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/product/?',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_product' ),
					'permission_callback' => array( $this, 'get_status_permission_check' ),
					'args'                => array(
						'title'                   => array(
							'type'     => 'string',
							'required' => true,
						),
						'price'                   => array(
							'type'     => 'float',
							'required' => true,
						),
						'currency'                => array(
							'type'     => 'string',
							'required' => true,
						),
						'interval'                => array(
							'type'     => 'string',
							'required' => true,
						),
						'is_editable'             => array(
							'type'     => 'boolean',
							'required' => false,
						),
						'buyer_can_change_amount' => array(
							'type' => 'boolean',
						),
						'tier'                    => array(
							'type'     => 'integer',
							'required' => false,
						),
					),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/products/?',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_products' ),
					'permission_callback' => array( $this, 'can_modify_products_permission_check' ),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'list_products' ),
					'permission_callback' => array( $this, 'get_status_permission_check' ),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/product/(?P<product_id>[0-9]+)/?',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_product' ),
					'permission_callback' => array( $this, 'can_modify_products_permission_check' ),
					'args'                => array(
						'title'                   => array(
							'type'     => 'string',
							'required' => true,
						),
						'price'                   => array(
							'type'     => 'float',
							'required' => true,
						),
						'currency'                => array(
							'type'     => 'string',
							'required' => true,
						),
						'interval'                => array(
							'type'     => 'string',
							'required' => true,
						),
						'is_editable'             => array(
							'type'     => 'boolean',
							'required' => false,
						),
						'buyer_can_change_amount' => array(
							'type' => 'boolean',
						),
						'tier'                    => array(
							'type'     => 'integer',
							'required' => false,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_product' ),
					'permission_callback' => array( $this, 'can_modify_products_permission_check' ),
					'args'                => array(
						'cancel_subscriptions' => array(
							'type'     => 'boolean',
							'required' => false,
						),
					),
				),
			)
		);
	}

	/**
	 * Ensure the user has proper permissions for getting status and listing products
	 *
	 * @return boolean
	 */
	public function get_status_permission_check() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Ensure the user has proper permissions to modify products
	 *
	 * @return boolean
	 */
	public function can_modify_products_permission_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Automatically generate products according to type.
	 *
	 * @param object $request - request passed from WP.
	 *
	 * @return array|WP_Error
	 */
	public function create_products( $request ) {
		$is_editable = isset( $request['is_editable'] ) ? (bool) $request['is_editable'] : null;

		if ( $this->is_wpcom() ) {
			require_lib( 'memberships' );

			$result = Memberships_Product::generate_default_products( get_current_blog_id(), $request['type'], $request['currency'], $is_editable );

			if ( is_wp_error( $result ) ) {
				$status = 'invalid_param' === $result->get_error_code() ? 400 : 500;
				return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => $status ) );
			}
			return $result;
		} else {
			$payload = array(
				'type'     => $request['type'],
				'currency' => $request['currency'],
			);

			// If we pass directly is_editable as null, it would break API argument validation.
			if ( null !== $is_editable ) {
				$payload['is_editable'] = $is_editable;
			}

			$blog_id  = Jetpack_Options::get_option( 'id' );
			$response = Client::wpcom_json_api_request_as_user(
				"/sites/$blog_id/{$this->rest_base}/products",
				'v2',
				array(
					'method' => 'POST',
				),
				$payload
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
	 * List already-created products.
	 *
	 * @param \WP_REST_Request $request - request passed from WP.
	 *
	 * @return WP_Error|array ['products']
	 */
	public function list_products( WP_REST_Request $request ) {
		$query       = null;
		$is_editable = isset( $request['is_editable'] ) ? (bool) $request['is_editable'] : null;
		$type        = isset( $request['type'] ) ? $request['type'] : null;

		if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			require_lib( 'memberships' );
			require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';
			try {
				return array( 'products' => $this->list_products_from_wpcom( $request, $type, $is_editable ) );
			} catch ( \Exception $e ) {
				return array( 'error' => $e->getMessage() );
			}
		} else {
			$query_parts = array();
			if ( $type !== null ) {
				$query_parts[] = 'type=' . $type;
			}
			if ( $is_editable !== null ) {
				$query_parts[] = 'is_editable=' . $is_editable;
			}
			if ( ! empty( $query_parts ) ) {
				$query = '?' . implode( '&', $query_parts );
			}
			return $this->proxy_request_to_wpcom( "products$query", 'GET' );
		}
	}

	/**
	 * Do create a product based on data, or pass request to wpcom.
	 *
	 * @param WP_REST_Request $request - request passed from WP.
	 *
	 * @return array|WP_Error
	 */
	public function create_product( WP_REST_Request $request ) {
		$payload = $this->get_payload_for_product( $request );

		if ( $this->is_wpcom() ) {
			require_lib( 'memberships' );
			try {
				return $this->create_product_from_wpcom( $payload );
			} catch ( \Exception $e ) {
				return array( 'error' => $e->getMessage() );
			}
		} else {
			return $this->proxy_request_to_wpcom( 'product', 'POST', $payload );
		}
	}

	/**
	 * Update an existing memberships product
	 *
	 * @param \WP_REST_Request $request The request passed from WP.
	 *
	 * @return array|WP_Error
	 */
	public function update_product( \WP_REST_Request $request ) {
		$product_id = $request->get_param( 'product_id' );
		$payload    = $this->get_payload_for_product( $request );

		if ( $this->is_wpcom() ) {
			require_lib( 'memberships' );
			try {
				return array( 'product' => $this->update_product_from_wpcom( $product_id, $payload ) );
			} catch ( \Exception $e ) {
				return array( 'error' => $e->getMessage() );
			}
		} else {
			return $this->proxy_request_to_wpcom( "product/$product_id", 'POST', $payload );
		}
	}

	/**
	 * Delete an existing memberships product
	 *
	 * @param \WP_REST_Request $request The request passed from WP.
	 *
	 * @return array|WP_Error
	 */
	public function delete_product( \WP_REST_Request $request ) {
		$product_id           = $request->get_param( 'product_id' );
		$cancel_subscriptions = $request->get_param( 'cancel_subscriptions' );
		if ( $this->is_wpcom() ) {
			require_lib( 'memberships' );
			try {
				$this->delete_product_from_wpcom( $product_id, $cancel_subscriptions );
				return array( 'deleted' => true );
			} catch ( \Exception $e ) {
				return array( 'error' => $e->getMessage() );
			}
		} else {
			return $this->proxy_request_to_wpcom(
				"product/$product_id",
				'DELETE',
				array( 'cancel_subscriptions' => $cancel_subscriptions )
			);
		}
	}

	/**
	 * Get a status of connection for the site. If this is Jetpack, pass the request to wpcom.
	 *
	 * @param \WP_REST_Request $request - request passed from WP.
	 *
	 * @return WP_Error|array ['products','connected_account_id','connect_url']
	 */
	public function get_status( \WP_REST_Request $request ) {
		$product_type = $request['type'];

		if ( ! empty( $request['source'] ) ) {
			$source = sanitize_text_field( wp_unslash( $request['source'] ) );
		} else {
			$source = 'gutenberg';
		}

		$is_editable = ! isset( $request['is_editable'] ) ? null : (bool) $request['is_editable'];

		if ( $this->is_wpcom() ) {
			require_lib( 'memberships' );
			$blog_id             = get_current_blog_id();
			$membership_settings = get_memberships_settings_for_site( $blog_id, $product_type, $is_editable, $source );

			if ( is_wp_error( $membership_settings ) ) {
				// Get error messages from the $membership_settings.
				$error_codes    = $membership_settings->get_error_codes();
				$error_messages = array();

				foreach ( $error_codes as $code ) {
					$messages = $membership_settings->get_error_messages( $code );
					foreach ( $messages as $message ) {
						// Sanitize error message
						$error_messages[] = esc_html( $message );
					}
				}

				$error_messages_string = implode( ' ', $error_messages );
				// translators: %s is a list of error messages.
				$base_message = __( 'Could not get the membership settings due to the following error(s): %s', 'jetpack' );
				$full_message = sprintf( $base_message, $error_messages_string );

				return new WP_Error( 'membership_settings_error', $full_message, array( 'status' => 404 ) );
			}

			return (array) $membership_settings;
		} else {
			$payload = array(
				'type'   => $request['type'],
				'source' => $source,
			);

			// If we pass directly is_editable as null, it would break API argument validation.
			// This also needs to be converted to int because boolean false is ignored by add_query_arg.
			if ( null !== $is_editable ) {
				$payload['is_editable'] = (int) $is_editable;
			}

			$blog_id = Jetpack_Options::get_option( 'id' );
			$path    = "/sites/$blog_id/{$this->rest_base}/status";
			if ( $product_type ) {
				$path = add_query_arg(
					$payload,
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

	/**
	 * Proxy a request to WPCOM, look for errors and return a response or a WP_Error.
	 *
	 * @param string     $uri Whatever would go at the end of the url after /sites/$blog_id/$this->rest_base/. This is usually `product`, `products`, or `product/$product_id`.
	 * @param string     $method The HTTP method being used.
	 * @param array|null $payload An optional payload to be sent with the request.
	 * @return string    The response from WPCOM
	 */
	private function proxy_request_to_wpcom( $uri, $method, $payload = null ) {
		// get blog id
		$blog_id = Jetpack_Options::get_option( 'id' );

		// proxy request to wpcom
		$response = Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/{$this->rest_base}/$uri",
			'v2',
			array(
				'method' => strtoupper( $method ),
			),
			$payload
		);
		if ( is_wp_error( $response ) ) {
			if ( $response->get_error_code() === 'missing_token' ) {
				return new WP_Error( 'missing_token', __( 'Please connect your user account to WordPress.com', 'jetpack' ), 404 );
			}
			return new WP_Error( 'wpcom_connection_error', __( 'Could not connect to WordPress.com', 'jetpack' ), 404 );
		}

		// decode response
		$data = isset( $response['body'] ) ? json_decode( $response['body'], true ) : null;
		// If endpoint returned error, we have to detect it.
		if ( 200 !== $response['response']['code'] && $data['code'] && $data['message'] ) {
			return new WP_Error( $data['code'], $data['message'], 401 );
		}

		// return response
		return $data;
	}

	/**
	 * This function throws an exception if it is run outside of wpcom.
	 *
	 * @return void
	 * @throws \Exception If the function is run outside of WPCOM.
	 */
	private function prevent_running_outside_of_wpcom() {
		if ( ! $this->is_wpcom() || ! class_exists( 'Memberships_Product' ) ) {
			throw new \Exception( 'This function is intended to be run from WPCOM' );
		}
	}

	/**
	 * List products via the WPCOM-specific Memberships_Product class.
	 *
	 * @param WP_REST_Request $request The request for this endpoint.
	 * @param ?string         $type The type of the products to list.
	 * @param ?string         $is_editable This string will be interpreted as a bool to determine if we are looking for editable or non-editable products.
	 * @throws \Exception If blog is not known or if there is an error getting products.
	 * @return array List of products.
	 */
	private function list_products_from_wpcom( WP_REST_Request $request, $type, $is_editable ) {
		$this->prevent_running_outside_of_wpcom();
		$blog_id = $request->get_param( 'blog_id' );
		if ( is_wp_error( $blog_id ) ) {
			throw new \Exception( 'Unknown blog' );
		}
		$list = Memberships_Product::get_product_list( get_current_blog_id(), $type, $is_editable );
		if ( is_wp_error( $list ) ) {
			throw new \Exception( $list->get_error_message() );
		}
		return $list;
	}

	/**
	 * Find a product by product id via the WPCOM-specific Memberships_Product class.
	 *
	 * @param string|int $product_id The ID of the product to be found.
	 * @throws \Exception If there is an error getting the product or if the product was not found.
	 * @return object The found product.
	 */
	private function find_product_from_wpcom( $product_id ) {
		$this->prevent_running_outside_of_wpcom();
		$product = Memberships_Product::get_from_post( get_current_blog_id(), $product_id );
		if ( is_wp_error( $product ) ) {
			throw new \Exception( $product->get_error_message() );
		}
		if ( ! $product || ! $product instanceof Memberships_Product ) {
			throw new \Exception( __( 'Product not found.', 'jetpack' ) );
		}
		return $product;
	}

	/**
	 * Create a product via the WPCOM-specific Memberships_Product class.
	 *
	 * @param array $payload The request payload which contains details about the product.
	 * @throws \Exception When the product failed to be created.
	 * @return object The newly created product.
	 */
	private function create_product_from_wpcom( $payload ) {
		$this->prevent_running_outside_of_wpcom();
		$product = Memberships_Product::create( get_current_blog_id(), $payload );
		if ( is_wp_error( $product ) ) {
			throw new \Exception( __( 'Creating product has failed.', 'jetpack' ) );
		}
		return $product->to_array();
	}

	/**
	 * Update a product via the WPCOM-specific Memberships_Product class.
	 *
	 * @param string|int $product_id The ID of the product being updated.
	 * @param array      $payload The request payload which contains details about the product.
	 * @throws \Exception When there is a problem updating the product.
	 * @return object The newly updated product.
	 */
	private function update_product_from_wpcom( $product_id, $payload ) {
		$product         = $this->find_product_from_wpcom( $product_id ); // prevents running outside of wpcom
		$updated_product = $product->update( $payload );
		if ( is_wp_error( $updated_product ) ) {
			throw new \Exception( $updated_product->get_error_message() );
		}
		return $updated_product->to_array();
	}

	/**
	 * Delete a product via the WPCOM-specific Memberships_Product class.
	 *
	 * @param string|int $product_id The ID of the product being deleted.
	 * @param bool       $cancel_subscriptions Whether to cancel subscriptions to the product as well.
	 * @throws \Exception When there is a problem deleting the product.
	 * @return void
	 */
	private function delete_product_from_wpcom( $product_id, $cancel_subscriptions = false ) {
		$product = $this->find_product_from_wpcom( $product_id ); // prevents running outside of wpcom
		$result  = $product->delete( $cancel_subscriptions ? Memberships_Product::CANCEL_SUBSCRIPTIONS : Memberships_Product::KEEP_SUBSCRIPTIONS );
		if ( is_wp_error( $result ) ) {
			throw new \Exception( $result->get_error_message() );
		}
	}

	/**
	 * Get a payload for creating or updating products by parsing the request.
	 *
	 * @param WP_REST_Request $request The request for this endpoint, containing the details needed to build the payload.
	 * @return array The built payload.
	 */
	private function get_payload_for_product( WP_REST_Request $request ) {
		$is_editable             = isset( $request['is_editable'] ) ? (bool) $request['is_editable'] : null;
		$type                    = isset( $request['type'] ) ? $request['type'] : null;
		$tier                    = isset( $request['tier'] ) ? $request['tier'] : null;
		$buyer_can_change_amount = isset( $request['buyer_can_change_amount'] ) && (bool) $request['buyer_can_change_amount'];

		$payload = array(
			'title'                        => $request['title'],
			'price'                        => $request['price'],
			'currency'                     => $request['currency'],
			'buyer_can_change_amount'      => $buyer_can_change_amount,
			'interval'                     => $request['interval'],
			'type'                         => $type,
			'welcome_email_content'        => $request['welcome_email_content'],
			'subscribe_as_site_subscriber' => $request['subscribe_as_site_subscriber'],
			'multiple_per_user'            => $request['multiple_per_user'],
		);

		if ( null !== $tier ) {
			$payload['tier'] = $tier;
		}

		// If we pass directly the value "null", it will break the argument validation.
		if ( null !== $is_editable ) {
			$payload['is_editable'] = $is_editable;
		}
		return $payload;
	}

	/**
	 * Returns true if run from WPCOM.
	 *
	 * @return boolean true if run from wpcom, otherwise false.
	 */
	private function is_wpcom() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM;
	}
}

if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_connection_ready() ) {
	wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Memberships' );
}

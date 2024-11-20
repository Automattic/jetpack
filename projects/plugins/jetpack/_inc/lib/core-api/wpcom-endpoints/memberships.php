<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName
/**
 * Memberships: API to communicate with "product" database.
 *
 * @package    Jetpack
 * @since      7.3.0
 */

require_once __DIR__ . '/trait-wpcom-rest-api-proxy-request-trait.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Memberships
 * This introduces V2 endpoints.
 */
class WPCOM_REST_API_V2_Endpoint_Memberships extends WP_REST_Controller {

	use WPCOM_REST_API_Proxy_Request_Trait;

	/**
	 * WPCOM_REST_API_V2_Endpoint_Memberships constructor.
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
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
										'import-paid-subscribers',
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
							'type'     => 'number',
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
					'args'                => array(
						'currency'    => array(
							'type'     => 'string',
							'required' => true,
						),
						'type'        => array(
							'type'     => 'string',
							'required' => true,
						),
						'is_editable' => array(
							'type'     => 'boolean',
							'required' => false,
						),
					),
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
							'type'     => 'number',
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
			Memberships_Store_Sandbox::get_instance()->init( true );

			$result = Memberships_Product::generate_default_products( get_current_blog_id(), $request['type'], $request['currency'], $is_editable );

			if ( is_wp_error( $result ) ) {
				$status = 'invalid_param' === $result->get_error_code() ? 400 : 500;
				return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => $status ) );
			}
			return $result;
		} else {
			return $this->proxy_request_to_wpcom_as_user( $request, 'products' );
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

			return $this->proxy_request_to_wpcom_as_user( $request, 'products' );
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
			return $this->proxy_request_to_wpcom_as_user( $request, 'product' );
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
			return $this->proxy_request_to_wpcom_as_user( $request, "product/$product_id" );
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
			return $this->proxy_request_to_wpcom_as_user( $request, "product/$product_id" );
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
			Memberships_Store_Sandbox::get_instance()->init( true );
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
			return $this->proxy_request_to_wpcom_as_user( $request, 'status' );
		}
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
	 * @param ?bool           $is_editable If we are looking for editable or non-editable products.
	 * @throws \Exception If blog is not known or if there is an error getting products.
	 * @return array List of products.
	 */
	private function list_products_from_wpcom( WP_REST_Request $request, $type, $is_editable ) {
		$this->prevent_running_outside_of_wpcom();
		Memberships_Store_Sandbox::get_instance()->init( true );
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
		Memberships_Store_Sandbox::get_instance()->init( true );
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
	 * @return array The newly created product.
	 */
	private function create_product_from_wpcom( $payload ) {
		$this->prevent_running_outside_of_wpcom();
		Memberships_Store_Sandbox::get_instance()->init( true );
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
		Memberships_Store_Sandbox::get_instance()->init( true );
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
		Memberships_Store_Sandbox::get_instance()->init( true );
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

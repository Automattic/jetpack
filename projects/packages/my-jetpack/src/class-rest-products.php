<?php
/**
 * Sets up the Products REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers the REST routes for Products.
 *
 * @phan-constructor-used-for-side-effects
 */
class REST_Products {
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'site/products',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_products_api_data',
					'permission_callback' => __CLASS__ . '::view_products_permissions_callback',
					'args'                => array(
						'products' => array(
							'description'       => __( 'Comma-separated list of product slugs that should be retrieved.', 'jetpack-my-jetpack' ),
							'type'              => 'string',
							'required'          => false,
							'validate_callback' => __CLASS__ . '::check_products_string',
						),
					),
				),
				'schema' => array( $this, 'get_products_schema' ),
			)
		);

		$products_arg = array(
			'description'       => __( 'Array of Product slugs', 'jetpack-my-jetpack' ),
			'type'              => 'array',
			'items'             => array(
				'enum' => Products::get_products_slugs(),
				'type' => 'string',
			),
			'required'          => true,
			'validate_callback' => __CLASS__ . '::check_products_argument',
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/products/install',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::install_plugins',
					'permission_callback' => __CLASS__ . '::edit_permissions_callback',
					'args'                => array(
						'products' => $products_arg,
					),
				),
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/products/activate',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::activate_products',
					'permission_callback' => __CLASS__ . '::edit_permissions_callback',
					'args'                => array(
						'products' => $products_arg,
					),
				),
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/products/interstitials',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_interstitials_state' ),
					'permission_callback' => array( self::class, 'edit_permissions_callback' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( self::class, 'update_interstitials_state' ),
					'permission_callback' => array( self::class, 'edit_permissions_callback' ),
					'args'                => array(
						'products' => array(
							'description'          => __( 'Key-value pairs of product slugs and their interstitial states.', 'jetpack-my-jetpack' ),
							'type'                 => 'object',
							'required'             => true,
							'properties'           => array_fill_keys(
								Products::get_products_slugs(),
								array(
									'type' => 'boolean',
								)
							),
							'additionalProperties' => false,
							'minProperties'        => 1,
						),
					),
				),
				'schema' => array( self::class, 'get_interstitials_schema' ),
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/products/deactivate',
			array(
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => __CLASS__ . '::deactivate_products',
					'permission_callback' => __CLASS__ . '::edit_permissions_callback',
					'args'                => array(
						'products' => $products_arg,
					),
				),
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/products-ownership',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_products_by_ownership',
					'permission_callback' => __CLASS__ . '::view_products_permissions_callback',
				),
			)
		);
	}

	/**
	 * Get the schema for the products endpoint
	 *
	 * @return array
	 */
	public function get_products_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'products',
			'type'       => 'object',
			'properties' => Products::get_product_data_schema(),
		);
	}

	/**
	 * Get the schema for the interstitials endpoint
	 *
	 * @return array
	 */
	public static function get_interstitials_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'Products interstitials',
			'type'       => 'object',
			'properties' => array(
				'products' => array(
					'type'        => 'object',
					'description' => __( 'Key-value pairs of product slugs and their interstitial states.', 'jetpack-my-jetpack' ),
					'properties'  => array_fill_keys(
						Products::get_products_slugs(),
						array(
							'description' => __( 'Interstitial state for the product. True means that the user has seen the interstitial for the product.', 'jetpack-my-jetpack' ),
							'type'        => 'boolean',
						)
					),
				),
			),
		);
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if the user is permitted to view the product and product info
	 *
	 * @return bool
	 */
	public static function view_products_permissions_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Check Products string (comma-separated string).
	 *
	 * @access public
	 * @static
	 *
	 * @param  mixed $value - Value of the 'product' argument.
	 * @return true|WP_Error   True if the value is valid, WP_Error otherwise.
	 */
	public static function check_products_string( $value ) {
		if ( ! is_string( $value ) ) {
			return new WP_Error(
				'rest_invalid_param',
				esc_html__( 'The product argument must be a string.', 'jetpack-my-jetpack' ),
				array( 'status' => 400 )
			);
		}

		$products_array = explode( ',', $value );
		$all_products   = Products::get_products_slugs();

		foreach ( $products_array as $product_slug ) {
			if ( ! in_array( $product_slug, $all_products, true ) ) {
				return new WP_Error(
					'rest_invalid_param',
					esc_html(
						sprintf(
							/* translators: %s is the product_slug, it should Not be translated. */
							__( 'The specified product argument %s is an invalid product.', 'jetpack-my-jetpack' ),
							$product_slug
						)
					),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Check Products argument.
	 *
	 * @access public
	 * @static
	 *
	 * @param  mixed $value - Value of the 'product' argument.
	 * @return true|WP_Error   True if the value is valid, WP_Error otherwise.
	 */
	public static function check_products_argument( $value ) {
		if ( ! is_array( $value ) ) {
			return new WP_Error(
				'rest_invalid_param',
				esc_html__( 'The product argument must be an array.', 'jetpack-my-jetpack' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Site products endpoint.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_Error|\WP_REST_Response
	 */
	public static function get_products( $request ) {
		$slugs         = $request->get_param( 'products' );
		$product_slugs = ! empty( $slugs ) ? array_map( 'trim', explode( ',', $slugs ) ) : array();

		$response = Products::get_products( $product_slugs );
		return rest_ensure_response( $response );
	}

	/**
	 * Site API product data endpoint
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return WP_Error|\WP_REST_Response
	 */
	public static function get_products_api_data( $request ) {
		$slugs         = $request->get_param( 'products' );
		$product_slugs = ! empty( $slugs ) ? array_map( 'trim', explode( ',', $slugs ) ) : array();

		$response = Products::get_products_api_data( $product_slugs );
		return rest_ensure_response( $response );
	}

	/**
	 * Site products endpoint.
	 *
	 * @return \WP_REST_Response of site products list.
	 */
	public static function get_products_by_ownership() {
		$response = array(
			'unownedProducts' => Products::get_products_by_ownership( 'unowned' ),
			'ownedProducts'   => Products::get_products_by_ownership( 'owned' ),
		);
		return rest_ensure_response( $response );
	}

	/**
	 * Check permission to edit product
	 *
	 * @return bool
	 */
	public static function edit_permissions_callback() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return false;
		}
		if ( is_multisite() && ! current_user_can( 'manage_network' ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Callback for activating products
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function activate_products( $request ) {
		$products_array = $request->get_param( 'products' );

		foreach ( $products_array as $product_slug ) {
			$product = Products::get_product( $product_slug );
			if ( ! isset( $product['class'] ) ) {
				return new \WP_Error(
					'product_class_handler_not_found',
					sprintf(
						/* translators: %s is the product_slug */
						__( 'The product slug %s does not have an associated class handler.', 'jetpack-my-jetpack' ),
						$product_slug
					),
					array( 'status' => 501 )
				);
			}

			$activate_product_result = call_user_func( array( $product['class'], 'activate' ) );
			if ( is_wp_error( $activate_product_result ) ) {
				$activate_product_result->add_data( array( 'status' => 400 ) );
				return $activate_product_result;
			}
		}
		set_transient( 'my_jetpack_product_activated', implode( ',', $products_array ), 10 );

		return rest_ensure_response( Products::get_products( $products_array ) );
	}

	/**
	 * Callback for deactivating products
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function deactivate_products( $request ) {
		$products_array = $request->get_param( 'products' );

		foreach ( $products_array as $product_slug ) {
			$product = Products::get_product( $product_slug );
			if ( ! isset( $product['class'] ) ) {
				return new \WP_Error(
					'product_class_handler_not_found',
					sprintf(
						/* translators: %s is the product_slug */
						__( 'The product slug %s does not have an associated class handler.', 'jetpack-my-jetpack' ),
						$product_slug
					),
					array( 'status' => 501 )
				);
			}

			$deactivate_product_result = call_user_func( array( $product['class'], 'deactivate' ) );
			if ( is_wp_error( $deactivate_product_result ) ) {
				$deactivate_product_result->add_data( array( 'status' => 400 ) );
				return $deactivate_product_result;
			}
		}

		return rest_ensure_response( Products::get_products( $products_array ) );
	}

	/**
	 * Callback for installing (and activating) multiple product plugins.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function install_plugins( $request ) {
		$products_array = $request->get_param( 'products' );

		foreach ( $products_array as $product_slug ) {
			$product = Products::get_product( $product_slug );
			if ( ! isset( $product['class'] ) ) {
				return new \WP_Error(
					'product_class_handler_not_found',
					sprintf(
						/* translators: %s is the product_slug */
						__( 'The product slug %s does not have an associated class handler.', 'jetpack-my-jetpack' ),
						$product_slug
					),
					array( 'status' => 501 )
				);
			}

			$install_product_result = call_user_func( array( $product['class'], 'install_and_activate_standalone' ) );
			if ( is_wp_error( $install_product_result ) ) {
				$install_product_result->add_data( array( 'status' => 400 ) );
				return $install_product_result;
			}
		}

		return rest_ensure_response( Products::get_products( $products_array ) );
	}

	/**
	 * Get interstitials state for the products
	 *
	 * @return WP_REST_Response
	 */
	public static function get_interstitials_state() {

		return rest_ensure_response(
			array(
				'products' => Products::get_interstitials_state(),
			)
		);
	}

	/**
	 * Update interstitials state for the products
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_interstitials_state( WP_REST_Request $request ) {

		$success = Products::update_interstitials_state( $request->get_param( 'products' ) );

		if ( ! $success ) {
			return new WP_Error(
				'my_jetpack_interstitials_update_error',
				__( 'Failed to update interstitials state.', 'jetpack-my-jetpack' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'products' => Products::get_interstitials_state(),
			)
		);
	}
}

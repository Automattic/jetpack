<?php
/**
 * Sets up the Products REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Registers the REST routes for Products.
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
					'callback'            => __CLASS__ . '::get_products',
					'permission_callback' => __CLASS__ . '::permissions_callback',
				),
				'schema' => array( $this, 'get_products_schema' ),
			)
		);

		$product_arg = array(
			'description'       => __( 'Product slug', 'jetpack-my-jetpack' ),
			'type'              => 'string',
			'enum'              => Products::get_product_names(),
			'required'          => false,
			'validate_callback' => __CLASS__ . '::check_product_argument',
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/products/(?P<product>[a-z\-]+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_product',
					'permission_callback' => __CLASS__ . '::permissions_callback',
					'args'                => array(
						'product' => $product_arg,
					),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::activate_product',
					'permission_callback' => __CLASS__ . '::edit_permissions_callback',
					'args'                => array(
						'product' => $product_arg,
					),
				),
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => __CLASS__ . '::deactivate_product',
					'permission_callback' => __CLASS__ . '::edit_permissions_callback',
					'args'                => array(
						'product' => $product_arg,
					),
				),
			)
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
	 * Check Product arguments.
	 *
	 * @access public
	 * @static
	 *
	 * @param  mixed $value - Value of the 'product' argument.
	 * @return true|WP_Error   True if the value is valid, WP_Error otherwise.
	 */
	public static function check_product_argument( $value ) {
		if ( ! is_string( $value ) ) {
			return new WP_Error(
				'rest_invalid_param',
				esc_html__( 'The product argument must be a string.', 'jetpack-my-jetpack' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Site products endpoint.
	 *
	 * @return array of site products list.
	 */
	public static function get_products() {
		$response = array(
			'products' => Products::get_products(),
		);
		return rest_ensure_response( $response, 200 );
	}

	/**
	 * Site single product endpoint.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return array of site products list.
	 */
	public static function get_product( $request ) {
		$product_slug = $request->get_param( 'product' );
		$response     = array(
			'products' => array( Products::get_product( $product_slug ) ),
		);
		return rest_ensure_response( $response, 200 );
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
	 * Callback for activating a product
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response
	 */
	public static function activate_product( $request ) {
		$product_slug = $request->get_param( 'product' );
		$product      = Products::get_product( $product_slug );
		if ( ! isset( $product['class'] ) ) {
			return new \WP_REST_Response(
				array(
					'error_message' => 'not_implemented',
				),
				400
			);
		}

		$success       = call_user_func( array( $product['class'], 'activate' ) );
		$error_code    = '';
		$error_message = '';
		if ( is_wp_error( $success ) ) {
			$error_code    = $success->get_error_code();
			$error_message = $success->get_error_message();
			$success       = false;
		}
		$response = array(
			'success'       => $success,
			'products'      => array( Products::get_product( $product_slug ) ),
			'error_code'    => $error_code,
			'error_message' => $error_message,
		);
		return rest_ensure_response( $response, 200 );

	}

	/**
	 * Callback for activating a product
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response
	 */
	public static function deactivate_product( $request ) {
		$product_slug = $request->get_param( 'product' );
		$product      = Products::get_product( $product_slug );
		if ( ! isset( $product['class'] ) ) {
			return new \WP_REST_Response(
				array(
					'error_message' => 'not_implemented',
				),
				400
			);
		}

		$success  = call_user_func( array( $product['class'], 'deactivate' ) );
		$response = array(
			'success'  => $success,
			'products' => array( Products::get_product( $product_slug ) ),
		);
		return rest_ensure_response( $response, 200 );

	}

	/**
	 * Set site product state.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return array of site products list.
	 */
	public static function set_product_state( $request ) {
		$product_slug = $request->get_param( 'product' );
		$activate     = $request->get_param( 'activate' );

		if ( $activate ) {
			return Products::activate_backup_product( $product_slug );
		}

		return Products::deactivate_backup_product( $product_slug );
	}
}

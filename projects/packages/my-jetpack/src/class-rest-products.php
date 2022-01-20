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
			'/site/products',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_products',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);

		register_rest_route(
			'my-jetpack/v1/',
			'/site/products/(?P<product>[a-z\-]+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_product',
				'permission_callback' => __CLASS__ . '::permissions_callback',
				'args'                => array(
					'product' => array(
						'description'       => __( 'Product slug', 'jetpack-my-jetpack' ),
						'type'              => 'string',
						'enum'              => Products::get_product_names(),
						'required'          => false,
						'validate_callback' => __CLASS__ . '::check_product_argument',
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
		return rest_ensure_response( Products::get_products(), 200 );
	}

	/**
	 * Site single product endpoint.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return array of site products list.
	 */
	public static function get_product( $request ) {
		$product_slug = $request->get_param( 'product' );
		$products     = Products::get_products();
		return rest_ensure_response( $products[ $product_slug ], 200 );
	}
}

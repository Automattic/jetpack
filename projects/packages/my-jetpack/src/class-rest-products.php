<?php
/**
 * Sets up the Products REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

require_once 'class-products.php';

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
						'description' => __( 'Product slug', 'jetpack-my-jetpack' ),
						'required'    => false,
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
	 * Site products endpoint.
	 *
	 * @return array of site products list.
	 */
	public static function get_products() {
		$products = Products::get_products();
		return rest_ensure_response( $products, 200 );
	}

	/**
	 * Site products endpoint.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return array of site products list.
	 */
	public static function get_product( $request ) {
		$params = $request->get_params();

		if ( ! isset( $params['product'] ) ) {
			return new \WP_Error(
				'my_jetpack_missing_product',
				__( 'Missing product param', 'jetpack-my-jetpack' ),
				array( 'status' => 404 )
			);
		}

		$products     = Products::get_products();
		$product_slug = $params['product'];
		if ( ! array_key_exists( $product_slug, $products ) ) {
			return new \WP_Error(
				'my_jetpack_product_not_found',
				__( 'Product not found', 'jetpack-my-jetpack' ),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response( $products[ $product_slug ], 200 );
	}
}

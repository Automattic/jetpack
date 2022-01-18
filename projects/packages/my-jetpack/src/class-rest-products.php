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
				'permission_callback' => __CLASS__ . '::product_permissions_callback',
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
	 * Check Product data.
	 *
	 * @access public
	 * @static
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return true|WP_Error
	 */
	public static function product_permissions_callback( $request ) {
		if ( ! self::permissions_callback() ) {
			return false;
		}

		$product_slug = $request->get_param( 'product' );
		if ( ! isset( $product_slug ) ) {
			return new \WP_Error(
				'my_jetpack_missing_product',
				__( 'Missing product param', 'jetpack-my-jetpack' ),
				array( 'status' => 404 )
			);
		}

		$products = Products::get_products();
		if ( ! array_key_exists( $product_slug, $products ) ) {
			return new \WP_Error(
				'my_jetpack_product_not_found',
				__( 'Product not found', 'jetpack-my-jetpack' ),
				array( 'status' => 404 )
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
}

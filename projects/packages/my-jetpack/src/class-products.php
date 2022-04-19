<?php
/**
 * Class for manipulating products
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * A class for everything related to product handling in My Jetpack
 */
class Products {

	/**
	 * Get the list of Products classes
	 *
	 * Here's where all the existing Products are registered
	 *
	 * @return array List of class names
	 */
	public static function get_products_classes() {
		return array(
			Products\Anti_Spam::class,
			Products\Backup::class,
			Products\Boost::class,
			Products\Crm::class,
			Products\Extras::class,
			Products\Scan::class,
			Products\Search::class,
			Products\Videopress::class,
			Products\Security::class,
		);
	}

	/**
	 * Product data
	 *
	 * @return array Jetpack products on the site and their availability.
	 */
	public static function get_products() {
		$products = array();
		foreach ( self::get_products_classes() as $class ) {
			$product_slug              = $class::$slug;
			$products[ $product_slug ] = $class::get_info();
		}
		return $products;
	}

	/**
	 * Get one product data by its slug
	 *
	 * @param string $product_slug The product slug.
	 *
	 * @return ?array
	 */
	public static function get_product( $product_slug ) {
		foreach ( self::get_products_classes() as $class ) {
			$p_slug = $class::$slug;
			if ( $p_slug === $product_slug ) {
				return $class::get_info();
			}
		}
		return null;
	}

	/**
	 * Return product slugs list.
	 *
	 * @return array Product slugs array.
	 */
	public static function get_products_slugs() {
		$slugs = array();
		foreach ( self::get_products_classes() as $class ) {
			$slugs[] = $class::$slug;
		}
		return $slugs;
	}

	/**
	 * Gets the json schema for the product data
	 *
	 * @return array
	 */
	public static function get_product_data_schema() {
		return array(
			'title'      => 'The requested product data',
			'type'       => 'object',
			'properties' => array(
				'product'     => array(
					'description'       => __( 'Product slug', 'jetpack-my-jetpack' ),
					'type'              => 'string',
					'enum'              => __CLASS__ . '::get_product_slugs',
					'required'          => false,
					'validate_callback' => __CLASS__ . '::check_product_argument',
				),
				'action'      => array(
					'description'       => __( 'Production action to execute', 'jetpack-my-jetpack' ),
					'type'              => 'string',
					'enum'              => array( 'activate', 'deactivate' ),
					'required'          => false,
					'validate_callback' => __CLASS__ . '::check_product_argument',
				),
				'slug'        => array(
					'title' => 'The product slug',
					'type'  => 'string',
				),
				'name'        => array(
					'title' => 'The product name',
					'type'  => 'string',
				),
				'description' => array(
					'title' => 'The product description',
					'type'  => 'string',
				),
				'status'      => array(
					'title' => 'The product status',
					'type'  => 'string',
					'enum'  => array( 'active', 'inactive', 'plugin_absent', 'needs_purchase', 'error' ),
				),
				'class'       => array(
					'title' => 'The product class handler',
					'type'  => 'string',
				),
			),
		);
	}

	/**
	 * Extend actions links for plugins
	 * tied to the Products.
	 */
	public static function extend_plugins_action_links() {
		Products\Backup::extend_plugin_action_links();
		Products\Boost::extend_plugin_action_links();
		Products\Crm::extend_plugin_action_links();

		// Extend Jetpack plugin using Videopress instance.
		Products\Videopress::extend_plugin_action_links();
	}

}

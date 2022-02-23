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
	 * Product data
	 *
	 * @return array Jetpack products on the site and their availability.
	 */
	public static function get_products() {
		$names    = self::get_product_names();
		$products = array();
		foreach ( $names as $name ) {
			$method_name       = 'get_' . str_replace( '-', '_', $name ) . '_data';
			$products[ $name ] = call_user_func( array( __CLASS__, $method_name ) );
		}

		return $products;
	}

	/**
	 * Get one product data by its slug
	 *
	 * @param string $slug The product slug.
	 *
	 * @return ?array
	 */
	public static function get_product( $slug ) {
		$products = self::get_products();
		if ( array_key_exists( $slug, $products ) ) {
			return $products[ $slug ];
		}
		return null;
	}

	/**
	 * Return product names list.
	 *
	 * @return array Product names array.
	 */
	public static function get_product_names() {
		return array(
			'anti-spam',
			'backup',
			'boost',
			'scan',
			'search',
			'security',
			'videopress',
			'crm',
			'extras',
		);
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
					'enum'              => __CLASS__ . '::get_product_names',
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
					'enum'  => array( 'active', 'inactive', 'plugin_absent' ),
				),
				'class'       => array(
					'title' => 'The product class handler',
					'type'  => 'string',
				),
			),
		);
	}

	/**
	 * Returns information about the Anti-spam product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_anti_spam_data() {
		return Products\Anti_Spam::get_info();
	}

	/**
	 * Returns information about the Backup product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_backup_data() {
		return Products\Backup::get_info();
	}

	/**
	 * Returns information about the Boost product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_boost_data() {
		return Products\Boost::get_info();
	}

	/**
	 * Returns information about the CRM product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_crm_data() {
		return Products\Crm::get_info();
	}

	/**
	 * Returns information about  Extras
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_extras_data() {
		return Products\Extras::get_info();
	}

	/**
	 * Returns information about the Scan product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_scan_data() {
		return Products\Scan::get_info();
	}

	/**
	 * Returns information about the Search product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_search_data() {
		return Products\Search::get_info();
	}

	/**
	 * Returns information about the Security product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_security_data() {
		return Products\Security::get_info();
	}

	/**
	 * Returns information about the VideoPress product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_videopress_data() {
		return Products\Videopress::get_info();
	}
}

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
		return array(
			'anti-spam'  => self::get_anti_spam_data(),
			'backup'     => self::get_backup_data(),
			'boost'      => self::get_boost_data(),
			'scan'       => self::get_scan_data(),
			'search'     => self::get_search_data(),
			'videopress' => self::get_videopress_data(),
			'crm'        => self::get_crm_data(),
			'extras'     => self::get_extras_data(),
		);
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
		return array_keys( self::get_products() );
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
		return array(
			'slug'        => 'anti-spam',
			'description' => __( 'Stop comment and form spam', 'jetpack-my-jetpack' ),
			'name'        => __( 'Anti-spam', 'jetpack-my-jetpack' ),
			'status'      => 'inactive',
		);
	}

	/**
	 * Activate Backup product
	 */
	public static function activate_backup_product() {
		/*
		 * @todo: implement
		 * suggestion: when it enables, return an success array:
		 * array( 'status' => 'activated' );
		 * Otherwise, an WP_Error instance will be nice.
		 */
		return array(
			'status' => 'active',
		);
	}

	/**
	 * Deactivate Backup product
	 */
	public static function deactivate_backup_product() {
		/*
		 * @todo: implement
		 */
		return array(
			'status' => 'inactive',
		);
	}

	/**
	 * Returns information about the Backup product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_backup_data() {
		return array(
			'slug'        => 'backup',
			'description' => __( 'Save every change', 'jetpack-my-jetpack' ),
			'name'        => __( 'Backup', 'jetpack-my-jetpack' ),
			'status'      => 'active',
		);
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
		return array(
			'slug'        => 'crm',
			'description' => __( 'Connect with your people', 'jetpack-my-jetpack' ),
			'name'        => __( 'CRM', 'jetpack-my-jetpack' ),
			'status'      => 'plugin_absent',
		);
	}

	/**
	 * Returns information about  Extras
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_extras_data() {
		return array(
			'slug'        => 'extras',
			'description' => __( 'Basic tools for a successful site', 'jetpack-my-jetpack' ),
			'name'        => __( 'Extras', 'jetpack-my-jetpack' ),
			'status'      => 'active',
		);
	}

	/**
	 * Returns information about the Scan product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_scan_data() {
		return array(
			'slug'        => 'scan',
			'description' => __( 'Stay one step ahead of threats', 'jetpack-my-jetpack' ),
			'name'        => __( 'Scan', 'jetpack-my-jetpack' ),
			'status'      => 'plugin_absent',
		);
	}

	/**
	 * Returns information about the Search product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_search_data() {
		return array(
			'slug'        => 'search',
			'description' => __( 'Help them find what they need', 'jetpack-my-jetpack' ),
			'name'        => __( 'Search', 'jetpack-my-jetpack' ),
			'status'      => 'plugin_absent',
		);
	}

	/**
	 * Returns information about the VideoPress product
	 *
	 * @return array Object with infromation about the product.
	 */
	public static function get_videopress_data() {
		return array(
			'slug'        => 'videopress',
			'description' => __( 'High quality, ad-free video', 'jetpack-my-jetpack' ),
			'name'        => __( 'VideoPress', 'jetpack-my-jetpack' ),
			'status'      => 'active',
		);
	}
}

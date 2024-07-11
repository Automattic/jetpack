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
	 * Constants for the status of a product on a site
	 *
	 * @var string
	 */
	const STATUS_SITE_CONNECTION_ERROR       = 'site_connection_error';
	const STATUS_USER_CONNECTION_ERROR       = 'user_connection_error';
	const STATUS_ACTIVE                      = 'active';
	const STATUS_CAN_UPGRADE                 = 'can_upgrade';
	const STATUS_INACTIVE                    = 'inactive';
	const STATUS_MODULE_DISABLED             = 'module_disabled';
	const STATUS_PLUGIN_ABSENT               = 'plugin_absent';
	const STATUS_PLUGIN_ABSENT_WITH_PLAN     = 'plugin_absent_with_plan';
	const STATUS_NEEDS_PURCHASE              = 'needs_purchase';
	const STATUS_NEEDS_PURCHASE_OR_FREE      = 'needs_purchase_or_free';
	const STATUS_NEEDS_FIRST_SITE_CONNECTION = 'needs_first_site_connection';

	/**
	 * List of statuses that display the module as disabled
	 * This is defined as the statuses in which the user willingly has the module disabled whether it be by
	 * default, uninstalling the plugin, disabling the module, or not renewing their plan.
	 *
	 * @var array
	 */
	public static $disabled_module_statuses = array(
		self::STATUS_INACTIVE,
		self::STATUS_MODULE_DISABLED,
		self::STATUS_PLUGIN_ABSENT,
		self::STATUS_PLUGIN_ABSENT_WITH_PLAN,
		self::STATUS_NEEDS_PURCHASE,
		self::STATUS_NEEDS_PURCHASE_OR_FREE,
		self::STATUS_NEEDS_FIRST_SITE_CONNECTION,
	);

	/**
	 * List of statuses that display the module as broken
	 *
	 * @var array
	 */
	public static $broken_module_statuses = array(
		self::STATUS_SITE_CONNECTION_ERROR,
		self::STATUS_USER_CONNECTION_ERROR,
	);

	/**
	 * List of statuses that display the module as active
	 *
	 * @var array
	 */
	public static $active_module_statuses = array(
		self::STATUS_ACTIVE,
		self::STATUS_CAN_UPGRADE,
	);

	/**
	 * List of all statuses that a product can have
	 *
	 * @var array
	 */
	public static $all_statuses = array(
		self::STATUS_SITE_CONNECTION_ERROR,
		self::STATUS_USER_CONNECTION_ERROR,
		self::STATUS_ACTIVE,
		self::STATUS_CAN_UPGRADE,
		self::STATUS_INACTIVE,
		self::STATUS_MODULE_DISABLED,
		self::STATUS_PLUGIN_ABSENT,
		self::STATUS_PLUGIN_ABSENT_WITH_PLAN,
		self::STATUS_NEEDS_PURCHASE,
		self::STATUS_NEEDS_PURCHASE_OR_FREE,
		self::STATUS_NEEDS_FIRST_SITE_CONNECTION,
	);

	/**
	 * Get the list of Products classes
	 *
	 * Here's where all the existing Products are registered
	 *
	 * @throws \Exception If the result of a filter has invalid classes.
	 * @return array List of class names
	 */
	public static function get_products_classes() {
		$classes = array(
			'anti-spam'  => Products\Anti_Spam::class,
			'backup'     => Products\Backup::class,
			'boost'      => Products\Boost::class,
			'crm'        => Products\Crm::class,
			'creator'    => Products\Creator::class,
			'extras'     => Products\Extras::class,
			'jetpack-ai' => Products\Jetpack_Ai::class,
			'scan'       => Products\Scan::class,
			'search'     => Products\Search::class,
			'social'     => Products\Social::class,
			'security'   => Products\Security::class,
			'protect'    => Products\Protect::class,
			'videopress' => Products\Videopress::class,
			'stats'      => Products\Stats::class,
			'ai'         => Products\Jetpack_Ai::class,
		);

		/**
		 * This filter allows plugin to override the Product class of a given product. The new class must be a child class of the default one declared in My Jetpack
		 *
		 * For example, a stand-alone plugin could overwrite its product class to control specific behavior of the product in the My Jetpack page after it is active without having to commit changes to the My Jetpack package:
		 *
		 * add_filter( 'my_jetpack_products_classes', function( $classes ) {
		 *  $classes['my_plugin'] = 'My_Plugin'; // a class that extends the original one declared in the My Jetpack package.
		 *  return $classes
		 * } );
		 *
		 * @param array $classes An array where the keys are the product slugs and the values are the class names.
		 */
		$final_classes = apply_filters( 'my_jetpack_products_classes', $classes );

		// Check that the classes are still child of the same original classes.
		foreach ( (array) $final_classes as $slug => $final_class ) {
			if ( $final_class === $classes[ $slug ] ) {
				continue;
			}
			if ( ! class_exists( $final_class ) || ! is_subclass_of( $final_class, $classes[ $slug ] ) ) {
				throw new \Exception( 'You can only overwrite a Product class with a child of the original class.' );
			}
		}

		return $final_classes;
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
	 * Get all plugin filenames associated with the products.
	 *
	 * @return array
	 */
	public static function get_all_plugin_filenames() {
		$filenames = array();
		foreach ( self::get_products_classes() as $class ) {
			if ( ! isset( $class::$plugin_filename ) ) {
				continue;
			}

			if ( is_array( $class::$plugin_filename ) ) {
				$filenames = array_merge( $filenames, $class::$plugin_filename );
			} else {
				$filenames[] = $class::$plugin_filename;
			}
		}
		return $filenames;
	}

	/**
	 * Get one product data by its slug
	 *
	 * @param string $product_slug The product slug.
	 *
	 * @return ?array
	 */
	public static function get_product( $product_slug ) {
		$classes = self::get_products_classes();
		if ( isset( $classes[ $product_slug ] ) ) {
			return $classes[ $product_slug ]::get_info();
		}
	}

	/**
	 * Get one product Class name
	 *
	 * @param string $product_slug The product slug.
	 *
	 * @return ?string
	 */
	public static function get_product_class( $product_slug ) {
		$classes = self::get_products_classes();
		if ( isset( $classes[ $product_slug ] ) ) {
			return $classes[ $product_slug ];
		}
	}

	/**
	 * Return product slugs list.
	 *
	 * @return array Product slugs array.
	 */
	public static function get_products_slugs() {
		return array_keys( self::get_products_classes() );
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
					'enum'  => self::$all_statuses,
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
		$products = array(
			'backup',
			'boost',
			'crm',
			'videopress',
			'social',
			'protect',
			'crm',
			'search',
			'ai',
		);

		// Add plugin action links for the core Jetpack plugin.
		Product::extend_core_plugin_action_links();

		// Add plugin action links to standalone products.
		foreach ( $products as $product ) {
			$class_name = self::get_product_class( $product );
			$class_name::extend_plugin_action_links();
		}
	}
}

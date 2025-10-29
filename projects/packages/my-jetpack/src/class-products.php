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
	public const STATUS_SITE_CONNECTION_ERROR       = 'site_connection_error';
	public const STATUS_USER_CONNECTION_ERROR       = 'user_connection_error';
	public const STATUS_ACTIVE                      = 'active';
	public const STATUS_CAN_UPGRADE                 = 'can_upgrade';
	public const STATUS_EXPIRING_SOON               = 'expiring';
	public const STATUS_EXPIRED                     = 'expired';
	public const STATUS_INACTIVE                    = 'inactive';
	public const STATUS_MODULE_DISABLED             = 'module_disabled';
	public const STATUS_PLUGIN_ABSENT               = 'plugin_absent';
	public const STATUS_PLUGIN_ABSENT_WITH_PLAN     = 'plugin_absent_with_plan';
	public const STATUS_NEEDS_PLAN                  = 'needs_plan';
	public const STATUS_NEEDS_ACTIVATION            = 'needs_activation';
	public const STATUS_NEEDS_FIRST_SITE_CONNECTION = 'needs_first_site_connection';
	public const STATUS_NEEDS_ATTENTION__WARNING    = 'needs_attention_warning';
	public const STATUS_NEEDS_ATTENTION__ERROR      = 'needs_attention_error';

	public const INTERSTITIALS_OPTION_NAME = 'my_jetpack_products_interstitials_state';

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
		self::STATUS_NEEDS_ACTIVATION,
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
	 * List of statuses that display the module as needing attention with a warning
	 *
	 * @var array
	 */
	public static $warning_module_statuses = array(
		self::STATUS_SITE_CONNECTION_ERROR,
		self::STATUS_USER_CONNECTION_ERROR,
		self::STATUS_PLUGIN_ABSENT_WITH_PLAN,
		self::STATUS_NEEDS_PLAN,
		self::STATUS_NEEDS_ATTENTION__ERROR,
		self::STATUS_NEEDS_ATTENTION__WARNING,
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
	 * List of statuses that display the module as active
	 *
	 * @var array
	 */
	public static $expiring_or_expired_module_statuses = array(
		self::STATUS_EXPIRING_SOON,
		self::STATUS_EXPIRED,
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
		self::STATUS_EXPIRING_SOON,
		self::STATUS_EXPIRED,
		self::STATUS_INACTIVE,
		self::STATUS_MODULE_DISABLED,
		self::STATUS_PLUGIN_ABSENT,
		self::STATUS_PLUGIN_ABSENT_WITH_PLAN,
		self::STATUS_NEEDS_PLAN,
		self::STATUS_NEEDS_ACTIVATION,
		self::STATUS_NEEDS_FIRST_SITE_CONNECTION,
		self::STATUS_NEEDS_ATTENTION__WARNING,
		self::STATUS_NEEDS_ATTENTION__ERROR,
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
			'anti-spam'        => Products\Anti_Spam::class,
			'backup'           => Products\Backup::class,
			'boost'            => Products\Boost::class,
			'crm'              => Products\Crm::class,
			'creator'          => Products\Creator::class,
			'extras'           => Products\Extras::class,
			'jetpack-ai'       => Products\Jetpack_Ai::class,
			// TODO: Remove this duplicate class ('ai')? See: https://github.com/Automattic/jetpack/pull/35910#pullrequestreview-2456462227.
			'ai'               => Products\Jetpack_Ai::class,
			'scan'             => Products\Scan::class,
			'search'           => Products\Search::class,
			'social'           => Products\Social::class,
			'security'         => Products\Security::class,
			'protect'          => Products\Protect::class,
			'videopress'       => Products\Videopress::class,
			'stats'            => Products\Stats::class,
			'growth'           => Products\Growth::class,
			'complete'         => Products\Complete::class,
			// Features.
			'newsletter'       => Products\Newsletter::class,
			'site-accelerator' => Products\Site_Accelerator::class,
			'related-posts'    => Products\Related_Posts::class,
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
	 * Register endpoints related to product classes
	 *
	 * @return void
	 */
	public static function register_product_endpoints() {
		$classes = self::get_products_classes();

		foreach ( $classes as $class ) {
			$class::register_endpoints();
		}
	}

	/**
	 * List of product slugs that are displayed on the main My Jetpack page
	 *
	 * @var array
	 */
	public static $shown_products = array(
		'anti-spam',
		'backup',
		'boost',
		'crm',
		'jetpack-ai',
		'search',
		'social',
		'protect',
		'videopress',
		'stats',
	);

	/**
	 * Gets the list of product slugs that are Not displayed on the main My Jetpack page
	 *
	 * @return array
	 */
	public static function get_not_shown_products() {
		return array_diff( array_keys( static::get_products_classes() ), self::$shown_products );
	}

	/**
	 * Product data
	 *
	 * @param array $product_slugs (optional) An array of specified product slugs.
	 * @return array Jetpack products on the site and their availability.
	 */
	public static function get_products( $product_slugs = array() ) {
		$all_classes = self::get_products_classes();
		$products    = array();
		// If an array of $product_slugs are passed, return only the products specified in $product_slugs array.
		if ( $product_slugs ) {
			foreach ( $product_slugs as $product_slug ) {
				if ( isset( $all_classes[ $product_slug ] ) ) {
					$class                     = $all_classes[ $product_slug ];
					$products[ $product_slug ] = $class::get_info();
				}
			}

			return $products;
		}
		// Otherwise return All products.
		foreach ( $all_classes as $slug => $class ) {
			$products[ $slug ] = $class::get_info();
		}

		return $products;
	}

	/**
	 * Get products data related to the wpcom api
	 *
	 * @param array $product_slugs - (optional) An array of specified product slugs.
	 * @return array
	 */
	public static function get_products_api_data( $product_slugs = array() ) {
		$all_classes = self::get_products_classes();
		$products    = array();
		// If an array of $product_slugs are passed, return only the products specified in $product_slugs array.
		if ( $product_slugs ) {
			foreach ( $product_slugs as $product_slug ) {
				if ( isset( $all_classes[ $product_slug ] ) ) {
					$class                     = $all_classes[ $product_slug ];
					$products[ $product_slug ] = $class::get_wpcom_info();
				}
			}

			return $products;
		}
		// Otherwise return All products.
		foreach ( $all_classes as $slug => $class ) {
			$products[ $slug ] = $class::get_wpcom_info();
		}

		return $products;
	}

	/**
	 * Get a list of products sorted by whether or not the user owns them
	 * An owned product is defined as a product that is any of the following
	 * - Active
	 * - Has historically been active
	 * - The user has a plan that includes the product
	 * - The user has the standalone plugin for the product installed
	 *
	 * @param string $type The type of ownership to return ('owned' or 'unowned').
	 *
	 * @return array
	 */
	public static function get_products_by_ownership( $type ) {
		$owned_active_products   = array();
		$owned_warning_products  = array();
		$owned_inactive_products = array();
		$unowned_products        = array();

		foreach ( self::get_products_classes() as $class ) {
			$product_slug = $class::$slug;
			$status       = $class::get_status();

			if ( $class::is_owned() ) {
				// This sorts the the products in the order of active -> warning -> inactive.
				// This enables the frontend to display them in that order.
				// This is not needed for unowned products as those will always have a status of 'inactive'.
				if ( in_array( $status, self::$active_module_statuses, true ) ) {
					array_push( $owned_active_products, $product_slug );
				} elseif ( in_array( $status, self::$warning_module_statuses, true ) ) {
					array_push( $owned_warning_products, $product_slug );
				} else {
					array_push( $owned_inactive_products, $product_slug );
				}
				continue;
			}

			array_push( $unowned_products, $product_slug );
		}

		$data = array(
			'owned'   => array_values(
				array_unique(
					array_merge(
						$owned_active_products,
						$owned_warning_products,
						$owned_inactive_products
					)
				)
			),
			'unowned' => array_values(
				array_unique( $unowned_products )
			),
		);

		return $data[ $type ];
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
			'jetpack-ai',
		);

		// Add plugin action links for the core Jetpack plugin.
		Product::extend_core_plugin_action_links();

		// Add plugin action links to standalone products.
		foreach ( $products as $product ) {
			$class_name = self::get_product_class( $product );
			$class_name::extend_plugin_action_links();
		}
	}

	/**
	 * Get interstitials state for the products
	 *
	 * @return array A key-value array of product slugs and their interstitial states. True means the interstitial was seen by the user for that product.
	 */
	public static function get_interstitials_state() {
		return get_option( self::INTERSTITIALS_OPTION_NAME, array() );
	}

	/**
	 * Update interstitials state for the products
	 *
	 * @param array $new_state A key-value array of product slugs and their interstitial states.
	 *
	 * @return bool True if the option was updated successfully, false otherwise.
	 */
	public static function update_interstitials_state( $new_state ) {

		// Merge the existing interstitials state with the new state.
		$interstitials_state = array_merge( self::get_interstitials_state(), $new_state );

		return update_option( self::INTERSTITIALS_OPTION_NAME, $interstitials_state );
	}
}

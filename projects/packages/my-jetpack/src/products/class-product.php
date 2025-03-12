<?php
/**
 * Base product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Status;
use Jetpack_Options;
use WP_Error;

/**
 * Class responsible for handling the products
 */
abstract class Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = null;

	/**
	 * The Jetpack module name, if any.
	 *
	 * @var ?string
	 */
	public static $module_name = null;

	/**
	 * The filename (id) of the plugin associated with this product. Can be a string with a single value or a list of possible values
	 *
	 * @var string|string[]
	 */
	public static $plugin_filename = null;

	/**
	 * The slug of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_slug = null;

	/**
	 * The category of the product in the Jetpack ecosystem. The options are performance, growth, security, management, and create
	 *
	 * @var string
	 */
	public static $category = null;

	/**
	 * The Jetpack plugin slug
	 *
	 * @var string
	 */
	const JETPACK_PLUGIN_SLUG = 'jetpack';

	/**
	 * The Jetpack plugin filename
	 *
	 * @var array
	 */
	const JETPACK_PLUGIN_FILENAME = array(
		'jetpack/jetpack.php',
		'jetpack-dev/jetpack.php',
	);

	/**
	 * The duration of time after the plan expiration date that we stop showing the plan status as "expired".
	 *
	 * @var string
	 */
	const EXPIRATION_CUTOFF_TIME = '+2 months';

	/**
	 * Transient key for storing site features
	 *
	 * @var string;
	 */
	const MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY = 'my-jetpack-site-features';

	/**
	 * Whether this module is a Jetpack feature
	 *
	 * @var boolean
	 */
	public static $is_feature = false;

	/**
	 * Whether this product requires a site connection
	 *
	 * @var string
	 */
	public static $requires_site_connection = true;

	/**
	 * Whether this product requires a user connection
	 *
	 * @var string
	 */
	public static $requires_user_connection = true;

	/**
	 * Whether this product has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = false;

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = false;

	/**
	 * Whether the product requires a plan to run
	 * The plan could be paid or free
	 *
	 * @var bool
	 */
	public static $requires_plan = false;

	/**
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = '';

	/**
	 * Get the plugin slug
	 *
	 * @return ?string
	 */
	public static function get_plugin_slug() {
		return static::$plugin_slug;
	}

	/**
	 * Get the plugin filename
	 *
	 * @return ?string
	 */
	public static function get_plugin_filename() {
		return static::$plugin_filename;
	}

	/**
	 * This method will be called in the class initializer to perform any necessary initialization
	 *
	 * @return void
	 */
	public static function initialize() {
		// This method should be implemented in the child class.
	}

	/**
	 * This method will be called in the class initializer to register the product's endpoints
	 *
	 * @return void
	 */
	public static function register_endpoints(): void {
		// This method should be implemented in the child class.
	}

	/**
	 * Get the installed plugin filename, considering all possible filenames a plugin might have
	 *
	 * @param string $plugin Which plugin to check. jetpack for the jetpack plugin or product for the product specific plugin.
	 *
	 * @return ?string
	 */
	public static function get_installed_plugin_filename( $plugin = 'product' ) {
		$all_plugins = Plugins_Installer::get_plugins();
		$filename    = 'jetpack' === $plugin ? self::JETPACK_PLUGIN_FILENAME : static::get_plugin_filename();
		if ( ! is_array( $filename ) ) {
			$filename = array( $filename );
		}
		foreach ( $filename as $name ) {
			$installed = array_key_exists( $name, $all_plugins );
			if ( $installed ) {
				return $name;
			}
		}
	}

	/**
	 * Get the Static Product Info
	 *
	 * @throws \Exception If required attribute is not declared in the child class.
	 * @return array
	 */
	public static function get_info() {
		if ( static::$slug === null ) {
			throw new \Exception( 'Product classes must declare the $slug attribute.' );
		}
		return array(
			'slug'                            => static::$slug,
			'plugin_slug'                     => static::get_plugin_slug(),
			'name'                            => static::get_name(),
			'title'                           => static::get_title(),
			'category'                        => static::$category,
			'description'                     => static::get_description(),
			'long_description'                => static::get_long_description(),
			'tiers'                           => static::get_tiers(),
			'features'                        => static::get_features(),
			'features_by_tier'                => static::get_features_by_tier(),
			'disclaimers'                     => static::get_disclaimers(),
			'is_bundle'                       => static::is_bundle_product(),
			'is_plugin_active'                => static::is_plugin_active(),
			'is_upgradable_by_bundle'         => static::is_upgradable_by_bundle(),
			'is_feature'                      => static::$is_feature,
			'supported_products'              => static::get_supported_products(),
			'wpcom_product_slug'              => static::get_wpcom_product_slug(),
			'requires_user_connection'        => static::$requires_user_connection,
			'feature_identifying_paid_plan'   => static::$feature_identifying_paid_plan,
			'has_free_offering'               => static::$has_free_offering,
			'manage_url'                      => static::get_manage_url(),
			'post_activation_url'             => static::get_post_activation_url(),
			'post_activation_urls_by_feature' => static::get_manage_urls_by_feature(),
			'standalone_plugin_info'          => static::get_standalone_info(),
			'class'                           => static::class,
			'post_checkout_url'               => static::get_post_checkout_url(),
			'post_checkout_urls_by_feature'   => static::get_post_checkout_urls_by_feature(),
		);
	}

	/**
	 * Get the Product Info that requires http requests to get
	 *
	 * @throws \Exception If required attribute is not declared in the child class.
	 * @return array
	 */
	public static function get_wpcom_info() {
		if ( static::$slug === null ) {
			throw new \Exception( 'Product classes must declare the $slug attribute.' );
		}

		return array(
			'status'                        => static::get_status(),
			'pricing_for_ui'                => static::get_pricing_for_ui(),
			'is_upgradable'                 => static::is_upgradable(),
			'has_any_plan_for_product'      => static::has_any_plan_for_product(),
			'has_free_plan_for_product'     => static::has_free_plan_for_product(),
			'has_paid_plan_for_product'     => static::has_paid_plan_for_product(),
			'purchase_url'                  => static::get_purchase_url(),
			'manage_paid_plan_purchase_url' => static::get_manage_paid_plan_purchase_url(),
			'renew_paid_plan_purchase_url'  => static::get_renew_paid_plan_purchase_url(),
			'does_module_need_attention'    => static::does_module_need_attention(),
		);
	}

	/**
	 * Collect the site's active features
	 *
	 * @return WP_Error|array
	 */
	public static function get_site_features_from_wpcom() {
		static $features = null;

		if ( $features !== null ) {
			return $features;
		}

		// Check for a cached value before doing lookup
		$stored_features = get_transient( self::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY );
		if ( $stored_features !== false ) {
			return $stored_features;
		}

		$site_id  = Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/features', $site_id ), '1.1' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$features = new WP_Error( 'site_features_fetch_failed' );
			return $features;
		}

		$body           = wp_remote_retrieve_body( $response );
		$feature_return = json_decode( $body );

		$features = array(
			'active'    => $feature_return->active,
			'available' => $feature_return->available,
		);
		// set a short transient to help with multiple lookups on the same page load.
		set_transient( self::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY, $features, 15 );

		return $features;
	}

	/**
	 * Check to see if the site has a feature
	 * This will check the features provided by the site plans and products (including free ones)
	 *
	 * @param string $feature - the feature to check for.
	 * @return bool
	 */
	public static function does_site_have_feature( $feature ) {
		if ( ! $feature ) {
			return false;
		}

		$features = self::get_site_features_from_wpcom();
		if ( is_wp_error( $features ) ) {
			return false;
		}

		return in_array( $feature, $features['active'], true );
	}

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	abstract public static function get_name();

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	abstract public static function get_title();

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	abstract public static function get_description();

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	abstract public static function get_long_description();

	/**
	 * Get the tiers for the product
	 *
	 * @return boolean|string[] The slugs of the tiers (i.e. [ "free", "basic", "advanced" ]), or False if the product has no tiers.
	 */
	public static function get_tiers() {
		return array();
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array
	 */
	abstract public static function get_features();

	/**
	 * Get the internationalized comparison of features grouped by each tier
	 *
	 * @return array
	 */
	public static function get_features_by_tier() {
		return array();
	}

	/**
	 * Get the product pricing
	 *
	 * @return array
	 */
	abstract public static function get_pricing_for_ui();

	/**
	 * Get the URL where the user can purchase the product iff it doesn't have an interstitial page in My Jetpack.
	 *
	 * @return ?string
	 */
	public static function get_purchase_url() {
		// Declare as concrete method as most Jetpack products use an interstitial page within My Jetpack.
		return null;
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	abstract public static function get_manage_url();

	/**
	 * Get the URL where the user manages the product for each product feature
	 *
	 * @return ?array
	 */
	public static function get_manage_urls_by_feature() {
		return null;
	}

	/**
	 * Get the URL the user is taken after activating the product
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		return static::get_manage_url();
	}

	/**
	 * Get the URL the user is taken after purchasing the product through the checkout
	 *
	 * @return ?string
	 */
	public static function get_post_checkout_url() {
		return null;
	}

	/**
	 * Get the URL the user is taken after purchasing the product through the checkout for each product feature
	 *
	 * @return ?array
	 */
	public static function get_post_checkout_urls_by_feature() {
		return null;
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return null;
	}

	/**
	 * Get the disclaimers corresponding to a feature
	 *
	 * @return ?array
	 */
	public static function get_disclaimers() {
		return array();
	}

	/**
	 * Get the standalone plugin related info
	 *
	 * @return array
	 */
	public static function get_standalone_info() {
		$is_standalone_installed = static::$has_standalone_plugin && self::is_plugin_installed();
		$is_standalone_active    = static::$has_standalone_plugin && self::is_plugin_active();

		return array(
			'has_standalone_plugin'   => static::$has_standalone_plugin,
			'is_standalone_installed' => $is_standalone_installed,
			'is_standalone_active'    => $is_standalone_active,
		);
	}

	/**
	 * Checks whether the site has a paid plan for the product.
	 *
	 * This function relies on the product's `$feature_identifying_paid_plan` and `get_paid_plan_product_slugs()` function.
	 * If the product does not define a `$feature_identifying_paid_plan`, be sure the product includes functions for both
	 * `get_paid_plan_product_slugs()` and `get_paid_bundles_that_include_product()` which return all the product slugs and
	 * bundle slugs that include the product, respectively.
	 *
	 * @return boolean
	 */
	public static function has_paid_plan_for_product() {
		// First check site features (if there's a feature that identifies the paid plan)
		if ( static::$feature_identifying_paid_plan ) {
			if ( static::does_site_have_feature( static::$feature_identifying_paid_plan ) ) {
				return true;
			}
		}
		// Otherwise check site purchases
		$plans_with_product = array_merge(
			static::get_paid_bundles_that_include_product(),
			static::get_paid_plan_product_slugs()
		);

		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				foreach ( $plans_with_product as $plan ) {
					if ( strpos( $purchase->product_slug, $plan ) !== false ) {
						return true;
					}
				}
			}
		}

		return false;
	}

	/**
	 * Checks whether the site has a free plan for the product
	 * Note, this should not return true if a product does not have a WPCOM plan (ex: search free, Akismet Free, stats free)
	 *
	 * @return false
	 */
	public static function has_free_plan_for_product() {
		return false;
	}

	/**
	 * Checks whether the site has any WPCOM plan for a product (paid or free)
	 *
	 * @return bool
	 */
	public static function has_any_plan_for_product() {
		return static::has_paid_plan_for_product() || static::has_free_plan_for_product();
	}

	/**
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array();
	}

	/**
	 * Get the product-slugs of the paid bundles/plans that this product/module is included in.
	 *
	 * This function relies on the product's `$feature_identifying_paid_plan`
	 * If the product does not define a `$feature_identifying_paid_plan`, be sure to include this
	 * function in the product's class and have it return all the paid bundle slugs that include
	 * the product.
	 *
	 * @return array
	 */
	public static function get_paid_bundles_that_include_product() {
		if ( static::is_bundle_product() ) {
			return array();
		}
		$features = static::get_site_features_from_wpcom();
		if ( is_wp_error( $features ) ) {
			return array();
		}
		$idendifying_feature = static::$feature_identifying_paid_plan;
		if ( empty( $features['available'] ) ) {
			return array();
		}
		$paid_bundles   = $features['available']->$idendifying_feature ?? array();
		$current_bundle = Wpcom_Products::get_site_current_plan( true );

		if ( in_array( static::$feature_identifying_paid_plan, $current_bundle['features']['active'], true ) ) {
			$paid_bundles[] = $current_bundle['product_slug'];
		}

		return $paid_bundles;
	}

	/**
	 * Gets the paid plan's purchase/subsciption info, or null if no paid plan purchases.
	 *
	 * @return object|null
	 */
	public static function get_paid_plan_purchase_for_product() {
		$paid_plans = array_merge(
			static::get_paid_plan_product_slugs(),
			static::get_paid_bundles_that_include_product()
		);

		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return null;
		}

		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				foreach ( $paid_plans as $plan ) {
					if ( strpos( $purchase->product_slug, $plan ) !== false ) {
						return $purchase;
					}
				}
			}
		}

		return null;
	}

	/**
	 * Gets the paid plan's expiry date.
	 *
	 * @return string
	 */
	public static function get_paid_plan_expiration_date() {
		$purchase = static::get_paid_plan_purchase_for_product();
		if ( ! $purchase ) {
			return 'paid-plan-does-not-exist';
		}

		return $purchase->expiry_date;
	}

	/**
	 * Gets the paid plan's expiry status.
	 *
	 * @return string
	 */
	public static function get_paid_plan_expiration_status() {
		$purchase = static::get_paid_plan_purchase_for_product();
		if ( ! $purchase ) {
			return 'paid-plan-does-not-exist';
		}

		return $purchase->expiry_status;
	}

	/**
	 * Checks if the paid plan is expired or not.
	 *
	 * @param bool $not_expired_after_cutoff - whether to not return the plan as expired if the plan has been expired for some duration of time.
	 * @return bool
	 */
	public static function is_paid_plan_expired( $not_expired_after_cutoff = false ) {
		$expiry_status = static::get_paid_plan_expiration_status();
		$expiry_date   = static::get_paid_plan_expiration_date();
		$expiry_cutoff = strtotime( $expiry_date . ' ' . self::EXPIRATION_CUTOFF_TIME );

		return $not_expired_after_cutoff
			? $expiry_status === Products::STATUS_EXPIRED && strtotime( 'now' ) < $expiry_cutoff
			: $expiry_status === Products::STATUS_EXPIRED;
	}

	/**
	 * Checks if the paid plan is expiring soon or not.
	 *
	 * @return bool
	 */
	public static function is_paid_plan_expiring() {
		$expiry_status = static::get_paid_plan_expiration_status();

		return $expiry_status === Products::STATUS_EXPIRING_SOON;
	}

	/**
	 * Gets the url to manage the paid plan's purchased subscription (for plan renewal, canceling, removal, etc).
	 *
	 * @return string|null The url to the purchase management page.
	 */
	public static function get_manage_paid_plan_purchase_url() {
		$purchase    = static::get_paid_plan_purchase_for_product();
		$site_suffix = ( new Status() )->get_site_suffix();

		if ( $purchase && $site_suffix ) {
			return 'https://wordpress.com/me/purchases/' . $site_suffix . '/' . $purchase->ID;
		}

		return null;
	}

	/**
	 * Gets the url to renew the paid plan's purchased subscription.
	 *
	 * @return string|null The url to the checkout renewal page.
	 */
	public static function get_renew_paid_plan_purchase_url() {
		$purchase    = static::get_paid_plan_purchase_for_product();
		$site_suffix = ( new Status() )->get_site_suffix();

		if ( $purchase && $site_suffix ) {
			return 'https://wordpress.com/checkout/' . $purchase->product_slug . '/renew/' . $purchase->ID . '/' . $site_suffix;
		}

		return null;
	}

	/**
	 * Checks whether the product supports trial or not
	 *
	 * Returns true if it supports. Return false otherwise.
	 *
	 * Free products will always return false.
	 *
	 * @return boolean
	 */
	public static function has_trial_support() {
		return false;
	}

	/**
	 * Checks whether the product can be upgraded to a different product.
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		return ! static::has_paid_plan_for_product() && ! static::is_bundle_product();
	}

	/**
	 * Checks whether product is a bundle.
	 *
	 * @return boolean True if product is a bundle. Otherwise, False.
	 */
	public static function is_bundle_product() {
		return false;
	}

	/**
	 * Check whether the product is upgradable
	 * by a product bundle.
	 *
	 * @return boolean|array Bundles list or False if not upgradable by a bundle.
	 */
	public static function is_upgradable_by_bundle() {
		return false;
	}

	/**
	 * In case it's a bundle product,
	 * return all the products it contains.
	 * Empty array by default.
	 *
	 * @return array Product slugs
	 */
	public static function get_supported_products() {
		return array();
	}

	/**
	 * Determine if the product is owned or not
	 * An owned product is defined as a product that is any of the following
	 * - Active
	 * - Has historically been active
	 * - The user has a plan that includes the product
	 * - The user has the standalone plugin for the product installed
	 *
	 * @return boolean
	 */
	public static function is_owned() {
		$historically_active_modules = Jetpack_Options::get_option( 'historically_active_modules', array() );
		$standalone_info             = static::get_standalone_info();
		if ( ( static::is_active() && Jetpack_Options::get_option( 'id' ) ) ||
			$standalone_info['is_standalone_installed'] ||
			in_array( static::$slug, $historically_active_modules, true ) ||
			static::has_any_plan_for_product()
		) {
			return true;
		}

		return false;
	}

	/**
	 * Undocumented function
	 *
	 * @return string
	 */
	public static function get_status() {
		if ( ! static::is_plugin_installed() ) {
			$status = Products::STATUS_PLUGIN_ABSENT;
			if ( static::has_paid_plan_for_product() ) {
				$status = Products::STATUS_PLUGIN_ABSENT_WITH_PLAN;
			}
		} elseif ( static::is_active() ) {
			$status = Products::STATUS_ACTIVE;
			// We only consider missing site & user connection an error when the Product is active.
			if ( static::$requires_site_connection && ! ( new Connection_Manager() )->is_connected() ) {
				// Site has never been connected before
				if ( ! Jetpack_Options::get_option( 'id' ) && ! static::is_owned() ) {
					$status = Products::STATUS_NEEDS_FIRST_SITE_CONNECTION;
				} else {
					$status = Products::STATUS_SITE_CONNECTION_ERROR;
				}
			} elseif ( static::$requires_user_connection && ! ( new Connection_Manager() )->has_connected_owner() ) {
				$status = Products::STATUS_USER_CONNECTION_ERROR;
			} elseif ( static::has_paid_plan_for_product() ) {
				$needs_attention = static::does_module_need_attention();
				if ( ! empty( $needs_attention ) && is_array( $needs_attention ) ) {
					$status = Products::STATUS_NEEDS_ATTENTION__WARNING;
					if ( isset( $needs_attention['type'] ) && 'error' === $needs_attention['type'] ) {
						$status = Products::STATUS_NEEDS_ATTENTION__ERROR;
					}
				}
				if ( static::is_paid_plan_expired() ) {
					$status = Products::STATUS_EXPIRED;
				} elseif ( static::is_paid_plan_expiring() ) {
					$status = Products::STATUS_EXPIRING_SOON;
				}
			} elseif ( static::is_upgradable() ) {
				$status = Products::STATUS_CAN_UPGRADE;
			}
			// Check specifically for inactive modules, which will prevent a product from being active
		} elseif ( static::$module_name && ! static::is_module_active() ) {
			$status = Products::STATUS_MODULE_DISABLED;
			// If there is not a plan associated with the disabled module, encourage a plan first
			// Getting a plan set up should help resolve any connection issues
			// However if the standalone plugin for this product is active, then we will defer to showing errors that prevent the module from being active
			// This is because if a standalone plugin is installed, we expect the product to not show as "inactive" on My Jetpack
			if ( static::$requires_plan || ( ! static::has_any_plan_for_product() && static::$has_standalone_plugin && ! self::is_plugin_active() ) ) {
				$status = static::is_owned() && static::$has_free_offering && ! static::$requires_plan ? Products::STATUS_NEEDS_ACTIVATION : Products::STATUS_NEEDS_PLAN;
			} elseif ( static::$requires_site_connection && ! ( new Connection_Manager() )->is_connected() ) {
				// Site has never been connected before and product is not owned
				if ( ! Jetpack_Options::get_option( 'id' ) && ! static::is_owned() ) {
					$status = Products::STATUS_NEEDS_FIRST_SITE_CONNECTION;
				} else {
					$status = Products::STATUS_SITE_CONNECTION_ERROR;
				}
			} elseif ( static::$requires_user_connection && ! ( new Connection_Manager() )->has_connected_owner() ) {
				$status = Products::STATUS_USER_CONNECTION_ERROR;
			}
		} elseif ( ! static::has_any_plan_for_product() ) {
			$status = static::is_owned() && static::$has_free_offering && ! static::$requires_plan ? Products::STATUS_NEEDS_ACTIVATION : Products::STATUS_NEEDS_PLAN;
		} else {
			$status = Products::STATUS_INACTIVE;
		}
		return $status;
	}

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_plugin_active() && ( static::has_any_plan_for_product() || ( ! static::$requires_plan && static::$has_free_offering ) );
	}

	/**
	 * Checks whether the plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_plugin_installed() {
		return (bool) static::get_installed_plugin_filename();
	}

	/**
	 * Checks whether the plugin is active
	 *
	 * @return boolean
	 */
	public static function is_plugin_active() {
		return Plugins_Installer::is_plugin_active( static::get_installed_plugin_filename() );
	}

	/**
	 * Checks whether the Jetpack plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_jetpack_plugin_installed() {
		return (bool) static::get_installed_plugin_filename( 'jetpack' );
	}

	/**
	 * Checks whether the Jetpack plugin is active
	 *
	 * @return boolean
	 */
	public static function is_jetpack_plugin_active() {
		return Plugins_Installer::is_plugin_active( static::get_installed_plugin_filename( 'jetpack' ) );
	}

	/**
	 * Checks whether the Jetpack module is active only if a module_name is defined
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		if ( static::$module_name ) {
			return ( new Modules() )->is_active( static::$module_name );
		}
		return true;
	}

	/**
	 * Activates the plugin
	 *
	 * @return null|WP_Error Null on success, WP_Error on invalid file.
	 */
	public static function activate_plugin() {
		return activate_plugin( static::get_installed_plugin_filename() );
	}

	/**
	 * Perform the top level activation routines, which is installing and activating the required plugin
	 *
	 * @return bool|WP_Error
	 */
	private static function do_activation() {
		if ( static::is_active() ) {
			return true;
		}

		// Default to installing the standalone plugin for the product
		if ( ! self::is_plugin_installed() ) {
			$installed = Plugins_Installer::install_plugin( static::get_plugin_slug() );
			if ( is_wp_error( $installed ) ) {
				return $installed;
			}
		}

		if ( ! current_user_can( 'activate_plugins' ) ) {
			return new WP_Error( 'not_allowed', __( 'You are not allowed to activate plugins on this site.', 'jetpack-my-jetpack' ) );
		}

		$result = static::activate_plugin();
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Activates the product by installing and activating its plugin
	 *
	 * @return boolean|WP_Error
	 */
	final public static function activate() {

		$result = self::do_activation();

		$result = static::do_product_specific_activation( $result );

		$product_slug = static::$slug;

		/**
		 * Fires after My Jetpack activates a product and filters the result
		 * Use this filter to run additional routines for a product activation on stand-alone plugins
		 *
		 * @param bool|WP_Error $result The result of the previous steps of activation.
		 */
		$result = apply_filters( "my_jetpack_{$product_slug}_activation", $result );

		return $result;
	}

	/**
	 * Override this method to perform product specific activation routines.
	 *
	 * @param bool|WP_Error $current_result Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return bool|WP_Error
	 */
	public static function do_product_specific_activation( $current_result ) {
		return $current_result;
	}

	/**
	 * Deactivate the product
	 *
	 * @return boolean
	 */
	public static function deactivate() {
		deactivate_plugins( static::get_installed_plugin_filename() );
		return true;
	}

	/**
	 * Returns filtered Jetpack plugin actions links.
	 *
	 * @param array $actions - Jetpack plugin action links.
	 * @return array           Filtered Jetpack plugin actions links.
	 */
	public static function get_plugin_actions_links( $actions ) {
		// My Jetpack action link.
		$my_jetpack_home_link = array(
			'jetpack-home' => sprintf(
				'<a href="%1$s" title="%3$s">%2$s</a>',
				admin_url( 'admin.php?page=my-jetpack' ),
				__( 'My Jetpack', 'jetpack-my-jetpack' ),
				__( 'My Jetpack dashboard', 'jetpack-my-jetpack' )
			),
		);

		// Otherwise, add it to the beginning of the array.
		return array_merge( $my_jetpack_home_link, $actions );
	}

	/**
	 * Filter the action links for the plugins specified.
	 *
	 * @param string|string[] $filenames The plugin filename(s) to filter the action links for.
	 */
	private static function filter_action_links( $filenames ) {
		foreach ( $filenames as $filename ) {
			$hook     = 'plugin_action_links_' . $filename;
			$callback = array( static::class, 'get_plugin_actions_links' );
			if ( ! has_filter( $hook, $callback ) ) {
				add_filter( $hook, $callback, 20, 2 );
			}
		}
	}

	/**
	 * Extend the plugin action links.
	 */
	public static function extend_plugin_action_links() {
		$filenames = static::get_plugin_filename();
		if ( ! is_array( $filenames ) ) {
			$filenames = array( $filenames );
		}

		self::filter_action_links( $filenames );
	}

	/**
	 * Extend the Jetpack plugin action links.
	 */
	public static function extend_core_plugin_action_links() {
		$filenames = self::JETPACK_PLUGIN_FILENAME;

		self::filter_action_links( $filenames );
	}

	/**
	 * Install and activate the standalone plugin in the case it's missing.
	 *
	 * @return boolean|WP_Error
	 */
	public static function install_and_activate_standalone() {
		/**
		 * Check for the presence of the standalone plugin, ignoring Jetpack presence.
		 *
		 * If the standalone plugin is not installed and the user can install plugins, proceed with the installation.
		 */
		if ( ! static::is_plugin_installed() ) {
			/**
			 * Check for permissions
			 */
			if ( ! current_user_can( 'install_plugins' ) ) {
				return new WP_Error( 'not_allowed', __( 'You are not allowed to install plugins on this site.', 'jetpack-my-jetpack' ) );
			}

			/**
			 * Install the plugin
			 */
			$installed = Plugins_Installer::install_plugin( static::get_plugin_slug() );
			if ( is_wp_error( $installed ) ) {
				return $installed;
			}
		}

		/**
		 * Activate the installed plugin
		 */
		$result = static::activate_plugin();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Determines whether the module/plugin/product needs the users attention.
	 * Typically due to some sort of error where user troubleshooting is needed.
	 *
	 * @return boolean
	 */
	public static function does_module_need_attention() {
		return false;
	}
}

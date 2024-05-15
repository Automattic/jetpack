<?php
/**
 * Base product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Plugins_Installer;
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
	 * The filename (id) of the plugin associated with this product. Can be a string with a single value or a list of possible values
	 *
	 * @var string|string[]
	 */
	protected static $plugin_filename = null;

	/**
	 * The slug of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_slug = null;

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
	 * Get the Product info for the API
	 *
	 * @throws \Exception If required attribute is not declared in the child class.
	 * @return array
	 */
	public static function get_info() {
		if ( static::$slug === null ) {
			throw new \Exception( 'Product classes must declare the $slug attribute.' );
		}
		return array(
			'slug'                      => static::$slug,
			'plugin_slug'               => static::$plugin_slug,
			'name'                      => static::get_name(),
			'title'                     => static::get_title(),
			'description'               => static::get_description(),
			'long_description'          => static::get_long_description(),
			'tiers'                     => static::get_tiers(),
			'features'                  => static::get_features(),
			'features_by_tier'          => static::get_features_by_tier(),
			'disclaimers'               => static::get_disclaimers(),
			'status'                    => static::get_status(),
			'pricing_for_ui'            => static::get_pricing_for_ui(),
			'is_bundle'                 => static::is_bundle_product(),
			'is_plugin_active'          => static::is_plugin_active(),
			'is_upgradable'             => static::is_upgradable(),
			'is_upgradable_by_bundle'   => static::is_upgradable_by_bundle(),
			'supported_products'        => static::get_supported_products(),
			'wpcom_product_slug'        => static::get_wpcom_product_slug(),
			'requires_user_connection'  => static::$requires_user_connection,
			'has_required_plan'         => static::has_required_plan(),
			'has_paid_plan_for_product' => static::has_paid_plan_for_product(),
			'has_free_offering'         => static::$has_free_offering,
			'has_required_tier'         => static::has_required_tier(),
			'manage_url'                => static::get_manage_url(),
			'purchase_url'              => static::get_purchase_url(),
			'post_activation_url'       => static::get_post_activation_url(),
			'standalone_plugin_info'    => static::get_standalone_info(),
			'class'                     => static::class,
			'post_checkout_url'         => static::get_post_checkout_url(),
		);
	}

	/**
	 * Collect the site's active features
	 *
	 * @return WP_Error|array
	 */
	private static function get_site_features_from_wpcom() {
		static $features = null;

		if ( $features !== null ) {
			return $features;
		}

		$site_id  = Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/features', $site_id ), '1.1' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'site_features_fetch_failed' );
		}

		$body           = wp_remote_retrieve_body( $response );
		$feature_return = json_decode( $body );
		$features       = $feature_return->active;

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

		return in_array( $feature, $features, true );
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
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * Returns true if it supports. Return false if a purchase is still required.
	 *
	 * Free products will always return true.
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		return true;
	}

	/**
	 * Checks whether the site has a paid plan for the product
	 * This ignores free products, it only checks if there is a purchase that supports the product
	 *
	 * @return boolean
	 */
	public static function has_paid_plan_for_product() {
		// TODO: this is not always the same.
		// There should be checks on each individual product class for paid plans if the product has a free offering
		// For products with no free offering, checking has_required_plan works fine
		return static::has_required_plan();
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the tiers
	 *
	 * @return array Key/value pairs of tier slugs and whether they are supported or not.
	 */
	public static function has_required_tier() {
		return array();
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
		return false;
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
	 * @return Array Product slugs
	 */
	public static function get_supported_products() {
		return array();
	}

	/**
	 * Undocumented function
	 *
	 * @return string
	 */
	public static function get_status() {
		if ( ! static::is_plugin_installed() ) {
			$status = 'plugin_absent';
			if ( static::has_paid_plan_for_product() ) {
				$status = 'plugin_absent_with_plan';
			}
		} elseif ( static::is_active() ) {
			$status = 'active';
			// We only consider missing site & user connection an error when the Product is active.
			if ( static::$requires_site_connection && ! ( new Connection_Manager() )->is_connected() ) {
				$status = 'error';
			} elseif ( static::$requires_user_connection && ! ( new Connection_Manager() )->has_connected_owner() ) {
				$status = 'error';
			} elseif ( static::is_upgradable() ) {
				// Upgradable plans should ignore whether or not they have the required plan.
				$status = 'can_upgrade';
			} elseif ( ! static::has_required_plan() ) { // We need needs_purchase here as well because some products we consider active without the required plan.
				if ( static::has_trial_support() ) {
					$status = 'needs_purchase_or_free';
				} else {
					$status = 'needs_purchase';
				}
			}
		} elseif ( ! static::has_required_plan() ) {
			if ( static::has_trial_support() ) {
				$status = 'needs_purchase_or_free';
			} else {
				$status = 'needs_purchase';
			}
		} else {
			$status = 'inactive';
		}
		return $status;
	}

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_plugin_active() && static::has_required_plan();
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
}

<?php
/**
 * Feature: Activity Log
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class responsible for handling the Activity Log module.
 */
class Activity_Log extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'activity-log';

	/**
	 * The slug of the plugin associated with this product.
	 * Activity Log is a feature available as part of the Jetpack plugin.
	 *
	 * @var string
	 */
	public static $plugin_slug = self::JETPACK_PLUGIN_SLUG;

	/**
	 * The Plugin file associated with Activity Log
	 *
	 * @var string|null
	 */
	public static $plugin_filename = self::JETPACK_PLUGIN_FILENAME;

	/**
	 * The Jetpack module name associated with this product
	 *
	 * @var string|null
	 */
	public static $module_name = 'activity-log';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'security';

	/**
	 * Whether this module is a Jetpack feature
	 *
	 * @var boolean
	 */
	public static $is_feature = true;

	/**
	 * Whether this product requires a user connection
	 *
	 * @var boolean
	 */
	public static $requires_user_connection = true;

	/**
	 * Whether this product has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = false;

	/**
	 * Whether this product has a free offering.
	 * The free tier shows recent events; a paid plan unlocks the full history.
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * Whether the product requires a plan to run
	 * The plan could be paid or free
	 *
	 * @var bool
	 */
	public static $requires_plan = false;

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Activity Log';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Activity Log';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'See what happened on your site and when', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'A record of every event on your site, so you can see what happened and roll back when something goes wrong', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized feature list
	 *
	 * @return array Activity Log features list
	 */
	public static function get_features() {
		return array();
	}

	/**
	 * Get the product pricing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array(
			'available' => true,
			'is_free'   => true,
		);
	}

	/**
	 * Checks whether the Activity Log module is switched on.
	 *
	 * Overrides the parent, which reads the module state through the Jetpack
	 * plugin and so reports every standalone install inactive. `Modules` reads
	 * the same `jetpack_active_modules` option with or without that plugin, and
	 * is the check `Jetpack_Activity_Log::initialize()` gates on.
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		return ( new Modules() )->is_active( static::$module_name );
	}

	/**
	 * Checks whether the Product is active.
	 *
	 * The module state is the whole answer here: a site that serves the
	 * Activity Log page from a standalone plugin has no Jetpack plugin for the
	 * parent's `is_jetpack_plugin_active()` to find.
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_module_active();
	}

	/**
	 * Checks whether the site has switched the product on.
	 *
	 * @return boolean
	 */
	public static function is_activated() {
		return static::is_module_active();
	}

	/**
	 * Activates the module.
	 *
	 * @param bool|WP_Error $plugin_activation Result of the top level activation actions.
	 * @return boolean|WP_Error
	 */
	public static function do_product_specific_activation( $plugin_activation ) {
		if ( is_wp_error( $plugin_activation ) ) {
			return $plugin_activation;
		}

		if ( ! ( new Modules() )->activate( static::$module_name, false, false ) ) {
			return new WP_Error( 'module_activation_failed', __( 'Error activating Jetpack module', 'jetpack-my-jetpack' ) );
		}

		return true;
	}

	/**
	 * Deactivates the module.
	 *
	 * @return boolean
	 */
	public static function deactivate() {
		return ( new Modules() )->deactivate( static::$module_name );
	}

	/**
	 * Checks whether the plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_plugin_installed() {
		return static::is_jetpack_plugin_installed();
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-activity-log' );
	}

	/**
	 * Activates the Jetpack plugin
	 *
	 * @return null|WP_Error Null on success, WP_Error on invalid file.
	 */
	public static function activate_plugin(): ?WP_Error {
		$plugin_filename = static::get_installed_plugin_filename( self::JETPACK_PLUGIN_SLUG );

		if ( $plugin_filename ) {
			return activate_plugin( $plugin_filename );
		}
	}
}

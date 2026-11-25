<?php
/**
 * Feature: Site Accelerator
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use Jetpack;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class responsible for handling the Site Accelerator module.
 */
class Site_Accelerator extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'site-accelerator';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'performance';

	/**
	 * The slug of the plugin associated with this product.
	 * Site Accelerator is a feature available as part of the Jetpack plugin.
	 *
	 * @var string
	 */
	public static $plugin_slug = self::JETPACK_PLUGIN_SLUG;

	/**
	 * The Plugin file associated with stats
	 *
	 * @var string|null
	 */
	public static $plugin_filename = self::JETPACK_PLUGIN_FILENAME;

	/**
	 * The Jetpack module name associated with this product: the Image CDN.
	 *
	 * @var string|null
	 */
	public static $module_name = 'photon';

	/**
	 * The Asset CDN module, which Site Accelerator switches together with the Image CDN.
	 *
	 * @var string
	 */
	const ASSET_CDN_MODULE = 'photon-cdn';

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
	public static $requires_user_connection = false;

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
		return 'Site Accelerator';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Site Accelerator';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( "Speed up your site with Jetpack's global CDN", 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( "Speed up your site by serving its images and static files, like CSS and JavaScript, from Jetpack's global CDN", 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized feature list
	 *
	 * @return array Site Accelerattor features list
	 */
	public static function get_features() {
		return array();
	}

	/**
	 * Get the product princing details
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
	 * Checks whether the Product is active.
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_jetpack_plugin_active();
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
		if ( Initializer::is_settings_consolidation_on_for_site() ) {
			return admin_url( 'admin.php?page=my-jetpack#/features?search=cdn' );
		}

		return admin_url( 'admin.php?page=jetpack#/settings?term=site%20accelerator' );
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

	/**
	 * Checks whether either CDN module is on, as the Jetpack Settings toggle shows it.
	 *
	 * @since 6.19.0
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		return parent::is_module_active() || ( class_exists( 'Jetpack' ) && Jetpack::is_module_active( self::ASSET_CDN_MODULE ) );
	}

	/**
	 * Turns on the Image CDN, then the Asset CDN on a best-effort basis, like the Jetpack Settings toggle.
	 *
	 * @since 6.19.0
	 *
	 * @param bool|WP_Error $plugin_activation Is the result of the top level activation actions.
	 * @return bool|WP_Error
	 */
	public static function do_product_specific_activation( $plugin_activation ) {
		$result = parent::do_product_specific_activation( $plugin_activation );

		if ( ! is_wp_error( $result ) ) {
			Jetpack::activate_module( self::ASSET_CDN_MODULE, false, false );
		}

		return $result;
	}

	/**
	 * Turns off both CDN modules.
	 *
	 * @since 6.19.0
	 *
	 * @return bool|WP_Error WP_Error when a host keeps a module on.
	 */
	public static function deactivate() {
		// Do not reorder: the parent checks is_module_active(), which still sees the Asset CDN if it is on.
		$asset_cdn_result = class_exists( 'Jetpack' ) && Jetpack::deactivate_module( self::ASSET_CDN_MODULE );
		$result           = parent::deactivate();

		// Turning off an Image CDN that was already off returns false, so count the Asset CDN change.
		return is_wp_error( $result ) ? $result : ( $result || $asset_cdn_result );
	}
}

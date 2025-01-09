<?php
/**
 * Feature: Related Posts
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;
use WP_Error;

/**
 * Class responsible for handling the Related Posts module.
 */
class Related_Posts extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'related-posts';

	/**
	 * The slug of the plugin associated with this product.
	 * Related Posts is a feature available as part of the Jetpack plugin.
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
	 * The Jetpack module name associated with this product
	 *
	 * @var string|null
	 */
	public static $module_name = 'related-posts';

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
		return 'Related Posts';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Related Posts';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Draw your readers from one post to another', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Draw your readers from one post to another, increasing overall traffic on your site', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized feature list
	 *
	 * @return array Newsletter features list
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
		return admin_url( 'admin.php?page=jetpack#/traffic?term=related%20posts' );
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

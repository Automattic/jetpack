<?php
/**
 * Podcast product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class responsible for handling the Podcast module.
 */
class Podcast extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'podcast';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'growth';

	/**
	 * The slug of the plugin associated with this product.
	 * Podcast is a feature available as part of the Jetpack plugin.
	 *
	 * @var string
	 */
	public static $plugin_slug = self::JETPACK_PLUGIN_SLUG;

	/**
	 * The Plugin file associated with the product.
	 *
	 * @var string|null
	 */
	public static $plugin_filename = self::JETPACK_PLUGIN_FILENAME;

	/**
	 * The Jetpack module name associated with this product
	 *
	 * @var string|null
	 */
	public static $module_name = 'podcast';

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
		return 'Podcast';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Podcast';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Publish and grow your podcast from your site.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Publish, manage, and grow your podcast right from your WordPress site, with episodes, distribution, and stats built in.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized feature list
	 *
	 * @return array Podcast features list
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
	 * Get the URL where the user manages the product
	 *
	 * Podcast has no dedicated admin destination yet, so there is nothing to
	 * link to from My Jetpack beyond activating/deactivating the module.
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return null;
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

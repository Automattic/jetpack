<?php
/**
 * Forms product
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
 * Class responsible for handling the Jetpack Forms product.
 *
 * Forms is a feature available as part of the Jetpack plugin, backed by the
 * `contact-form` module.
 */
class Jetpack_Forms extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'jetpack-forms';

	/**
	 * The slug of the plugin associated with this product.
	 * Forms is a feature available as part of the Jetpack plugin.
	 *
	 * @var string
	 */
	public static $plugin_slug = self::JETPACK_PLUGIN_SLUG;

	/**
	 * The Plugin file associated with Forms.
	 *
	 * @var string|null
	 */
	public static $plugin_filename = self::JETPACK_PLUGIN_FILENAME;

	/**
	 * The Jetpack module name associated with this product.
	 *
	 * @var string|null
	 */
	public static $module_name = 'contact-form';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'growth';

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
	 * Whether the product requires a plan to run.
	 * The plan could be paid or free.
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
		return 'Forms';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Forms';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Build and share forms to collect leads, feedback, and payments.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Create contact forms, surveys, and registration forms in minutes — then manage every response right from your dashboard, no third-party tools required.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized feature list
	 *
	 * @return array Forms features list
	 */
	public static function get_features() {
		return array(
			__( 'Spam protection with Akismet', 'jetpack-my-jetpack' ),
			__( 'Export your data anytime', 'jetpack-my-jetpack' ),
			__( 'Manage all your responses in one place', 'jetpack-my-jetpack' ),
		);
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
		// Defer to the Forms package for the canonical admin URL when it's available
		// (it accounts for the responses dashboard variant and the admin URL filter).
		$dashboard = 'Automattic\Jetpack\Forms\Dashboard\Dashboard';
		if ( method_exists( $dashboard, 'get_forms_admin_url' ) ) {
			return $dashboard::get_forms_admin_url();
		}

		return admin_url( 'admin.php?page=jetpack-forms-admin' );
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

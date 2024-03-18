<?php
/**
 * Base product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Plugins_Installer;
use WP_Error;

/**
 * Class responsible for handling the hybrid products
 *
 * Hybrid products are those that may work both as a stand-alone plugin or with the Jetpack plugin.
 */
abstract class Hybrid_Product extends Product {

	/**
	 * All hybrid products have a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * For Hybrid products, we can use either the standalone or Jetpack plugin
	 *
	 * @return bool
	 */
	public static function is_plugin_installed() {
		return parent::is_plugin_installed() || parent::is_jetpack_plugin_installed();
	}

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_plugin_active() {
		return parent::is_plugin_active() || parent::is_jetpack_plugin_active();
	}

	/**
	 * Checks whether the standalone plugin for this product is active
	 *
	 * @return boolean
	 */
	public static function is_standalone_plugin_active() {
		return parent::is_plugin_active();
	}

	/**
	 * Checks whether the Jetpack module is active only if a module_name is defined
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		if ( ! empty( static::$module_name ) ) {
			return ( new Modules() )->is_active( static::$module_name );
		}
		return true;
	}

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return parent::is_active() && static::is_module_active();
	}

	/**
	 * Activates the plugin
	 *
	 * @return null|WP_Error Null on success, WP_Error on invalid file.
	 */
	public static function activate_plugin() {
		/*
		 * Activate self-installed plugin if it's installed.
		 */
		if ( parent::is_plugin_installed() ) {
			return activate_plugin( static::get_installed_plugin_filename() );
		}

		/*
		 * Otherwise, activate Jetpack plugin.
		 */
		if ( static::is_jetpack_plugin_installed() ) {
			return activate_plugin( static::get_installed_plugin_filename( 'jetpack' ) );
		}

		return new WP_Error( 'plugin_not_found', __( 'Activation failed. Plugin is not installed', 'jetpack-my-jetpack' ) );
	}

	/**
	 * Activates the product. If the Hybrid product has declared a jetpack module name, let's try to activate it if Jetpack plugin is active
	 *
	 * @param bool|WP_Error $product_activation Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return bool|WP_Error
	 */
	public static function do_product_specific_activation( $product_activation ) {

		if ( is_wp_error( $product_activation ) ) {
			// If we failed to install the stand-alone plugin because the package was not found, let's try and install Jetpack plugin instead.
			// This might happen, for example, while the stand-alone plugin was not released to the WP.org repository yet.
			if ( 'no_package' === $product_activation->get_error_code() ) {
				$product_activation = Plugins_Installer::install_plugin( self::JETPACK_PLUGIN_SLUG );
				if ( ! is_wp_error( $product_activation ) ) {
					$product_activation = static::activate_plugin();
				}
			}
			if ( is_wp_error( $product_activation ) ) {
				return $product_activation;
			}
		}

		// Only activate the module if the plan supports it
		// We don't want to throw an error for a missing plan here since we try activation before purchase
		if ( static::has_required_plan() && ! empty( static::$module_name ) ) {
			$module_activation = ( new Modules() )->activate( static::$module_name, false, false );

			if ( ! $module_activation ) {
				return new WP_Error( 'module_activation_failed', __( 'Error activating Jetpack module', 'jetpack-my-jetpack' ) );
			}

			return $module_activation;
		}

		return true;
	}

	/**
	 * Install and activate the standalone plugin in the case it's missing.
	 *
	 * @return boolean|WP_Error
	 */
	public static function install_and_activate_standalone() {
		$result = parent::install_and_activate_standalone();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		/**
		 * Activate the module as well, if the user has a plan
		 * or the product does not require a plan to work
		 */
		if ( static::has_required_plan() && isset( static::$module_name ) ) {
			$module_activation = ( new Modules() )->activate( static::$module_name, false, false );

			if ( ! $module_activation ) {
				return new WP_Error( 'module_activation_failed', __( 'Error activating Jetpack module', 'jetpack-my-jetpack' ) );
			}
		}

		return true;
	}
}

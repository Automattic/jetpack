<?php
/**
 * Base product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WP_Error;

/**
 * Class responsible for handling the hybrid products
 *
 * Hybrid products are those that may work both as a stand-alone plugin or with the Jetpack plugin.
 *
 * In case Jetpack plugin is active, it will not attempt to install its stand-alone plugin.
 *
 * But if Jetpack plugin is not active, then it will prompt to install and activate its stand-alone plugin.
 */
abstract class Hybrid_Product extends Product {

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_plugin_active() {
		return parent::is_plugin_active() || parent::is_jetpack_plugin_active();
	}

	/**
	 * Checks whether the plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_plugin_installed() {
		return parent::is_plugin_installed() || static::is_jetpack_plugin_installed();
	}

	/**
	 * Activates the plugin
	 *
	 * @return null|WP_Error Null on success, WP_Error on invalid file.
	 */
	public static function activate_plugin() {
		/*
		 * Activate self-installed plugin if it's installed.
		 * Silent mode True to avoid redirects in Backup.
		 * @TODO When new Hybrid products are added, we might not want to go silent with all of them.
		 */
		if ( parent::is_plugin_installed() ) {
			return activate_plugin( static::get_installed_plugin_filename(), '', false, true );
		}

		/*
		 * Otherwise, activate Jetpack plugin.
		 * Silent mode True to avoid redirects.
		 */
		if ( static::is_jetpack_plugin_installed() ) {
			return activate_plugin( static::get_installed_plugin_filename( 'jetpack' ) );
		}

		return new WP_Error( 'plugin_not_found', __( 'Activation failed. Plugin is not installed', 'jetpack-my-jetpack' ) );
	}

	/**
	 * Activates the product. If the Hybrid product has declared a jetpack module name, let's try to activate it if Jetpack plugin is active
	 *
	 * @return boolean|\WP_Error
	 */
	public static function activate() {

		$product_activation = parent::activate();

		if ( is_wp_error( $product_activation ) ) {
			return $product_activation;
		}

		if ( ! empty( static::$module_name ) && class_exists( 'Jetpack' ) ) {
			$module_activation = Jetpack::activate_module( static::$module_name, false, false );
			if ( ! $module_activation ) {
				return new WP_Error( 'module_activation_failed', __( 'Error activating Jetpack module', 'jetpack-my-jetpack' ) );
			}

			return $module_activation;
		}

		return true;

	}

}

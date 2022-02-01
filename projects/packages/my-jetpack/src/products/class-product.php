<?php
/**
 * Base product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Plugins_Installer;

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
	 * The filename (id) of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_filename = null;

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
	 * @var string
	 */
	const JETPACK_PLUGIN_FILENAME = 'jetpack/jetpack.php';

	/**
	 * Get the Product info for the API
	 *
	 * @throws \Exception If required attribute is not declared in the child class.
	 * @return array
	 */
	public static function get_info() {
		if ( is_null( static::$slug ) ) {
			throw new \Exception( 'Product classes must declare the $slug attribute.' );
		}
		return array(
			'slug'        => static::$slug,
			'name'        => static::get_name(),
			'description' => static::get_description(),
			'status'      => static::get_status(),
			'class'       => get_called_class(),
		);
	}

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	abstract public static function get_name();

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	abstract public static function get_description();

	/**
	 * Undocumented function
	 *
	 * @return string
	 */
	public static function get_status() {
		if ( static::is_active() ) {
			$status = 'active';
		} elseif ( ! self::is_plugin_installed() ) {
			$status = 'plugin_absent';
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
		return static::is_plugin_active();
	}

	/**
	 * Checks whether the plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_plugin_installed() {
		$all_plugins = Plugins_Installer::get_plugins();
		return array_key_exists( static::$plugin_filename, $all_plugins );
	}

	/**
	 * Checks whether the plugin is active
	 *
	 * @return boolean
	 */
	public static function is_plugin_active() {
		return Plugins_Installer::is_plugin_active( static::$plugin_filename );
	}

	/**
	 * Checks whether the Jetpack plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_jetpack_plugin_installed() {
		$all_plugins = Plugins_Installer::get_plugins();
		return array_key_exists( self::JETPACK_PLUGIN_FILENAME, $all_plugins );
	}

	/**
	 * Checks whether the Jetpack plugin is active
	 *
	 * @return boolean
	 */
	public static function is_jetpack_plugin_active() {
		return Plugins_Installer::is_plugin_active( self::JETPACK_PLUGIN_FILENAME );
	}

	/**
	 * Activates the product by installing and activating its plugin
	 *
	 * @return boolean|\WP_Error
	 */
	public static function activate() {
		if ( static::is_active() ) {
			return true;
		}

		if ( ! static::is_plugin_installed() ) {
			$installed = Plugins_Installer::install_plugin( static::$plugin_slug );
			if ( is_wp_error( $installed ) ) {
				return $installed;
			}
		}

		if ( ! current_user_can( 'activate_plugins' ) ) {
			return new WP_Error( 'not_allowed', __( 'You are not allowed to activate plugins on this site.', 'jetpack-my-jetpack' ) );
		}

		$result = activate_plugin( static::$plugin_filename );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return is_null( $result );
	}

	/**
	 * Deactivate the plugin
	 *
	 * @return boolean
	 */
	public static function deactivate() {
		deactivate_plugins( static::$plugin_filename );
		return true;
	}
}

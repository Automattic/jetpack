<?php
/**
 * Base Module product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use Jetpack;
use Jetpack_Options;
use WP_Error;

/**
 * Class responsible for handling the Module products
 *
 * Module products are those that are a Jetpack module behind the scenes.
 *
 * They require Jetpack plugin and will then activate/deactivate a module.
 */
abstract class Module_Product extends Product {

	/**
	 * The Jetpack module name associated with this product
	 *
	 * @var string|null
	 */
	public static $module_name = null;

	/**
	 * Get the plugin slug - ovewrite it ans return Jetpack's
	 *
	 * @return ?string
	 */
	public static function get_plugin_slug() {
		return self::JETPACK_PLUGIN_SLUG;
	}

	/**
	 * Get the plugin filename - ovewrite it ans return Jetpack's
	 *
	 * @return ?string
	 */
	public static function get_plugin_filename() {
		return self::JETPACK_PLUGIN_FILENAME;
	}

	/**
	 * Ensure that child classes define $module_name attribute
	 *
	 * @throws \Exception If required attribute is not declared in the child class.
	 * @return void
	 */
	private static function check_for_module_name() {
		if ( empty( static::$module_name ) ) {
			throw new \Exception( 'Module Product classes must declare the $module_name attribute.' );
		}
	}

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_jetpack_plugin_active() && static::is_module_active();
	}

	/**
	 * Checks whether the Jetpack module is active
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		self::check_for_module_name();
		if ( ! class_exists( 'Jetpack' ) ) {
			return false;
		}

		return Jetpack::is_module_active( static::$module_name );
	}

	/**
	 * Gets the current status of the product
	 *
	 * @return string
	 */
	public static function get_status() {
		$status = parent::get_status();
		if ( 'active' === $status && ! static::is_module_active() ) {
			$status = 'module_disabled';
		}
		return $status;
	}

	/**
	 * Activates the product by installing and activating its plugin
	 *
	 * @param bool|WP_Error $plugin_activation Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return boolean|\WP_Error
	 */
	public static function do_product_specific_activation( $plugin_activation ) {
		self::check_for_module_name();

		if ( is_wp_error( $plugin_activation ) ) {
			return $plugin_activation;
		}

		if ( ! class_exists( 'Jetpack' ) ) {
			return new WP_Error( 'plugin_activation_failed', __( 'Error activating Jetpack plugin', 'jetpack-my-jetpack' ) );
		}

		$module_activation = Jetpack::activate_module( static::$module_name, false, false );

		if ( ! $module_activation ) {
			return new WP_Error( 'module_activation_failed', __( 'Error activating Jetpack module', 'jetpack-my-jetpack' ) );
		}

		return $module_activation;
	}

	/**
	 * Deactivate the module
	 *
	 * @return boolean
	 */
	public static function deactivate() {
		self::check_for_module_name();
		if ( ! class_exists( 'Jetpack' ) ) {
			return true;
		}
		return Jetpack::deactivate_module( static::$module_name );
	}

	/**
	 * Get Products that support this product
	 *
	 * @return array
	 */
	public static function get_supporting_products() {
		return array();
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$purchases_data = static::get_state_from_wpcom();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				if ( in_array( $purchase->product_slug, static::get_supporting_products(), true ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Hits the wpcom api to check purchase status.
	 *
	 * @todo Maybe add caching.
	 *
	 * @return Object|WP_Error
	 */
	protected static function get_state_from_wpcom() {
		static $status = null;

		if ( $status !== null ) {
			return $status;
		}

		$site_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/purchases', $site_id ),
			'1.1',
			array(
				'method' => 'GET',
			)
		);
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'purchases_state_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = json_decode( $body );
		return $status;
	}
}

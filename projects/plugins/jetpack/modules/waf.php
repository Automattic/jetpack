<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Firewall
 * Module Description: Protect your site with Jetpack's Web Application Firewall
 * Sort Order: 5
 * First Introduced: 10.9
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Firewall, WAF
 * Feature: Security
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Waf\Waf_Runner;
use Automattic\Jetpack\Waf\Waf_Standalone_Bootstrap;

/**
 * Jetpack waf module class.
 */
class Jetpack_Waf_Module {

	/**
	 * Instance of the class.
	 *
	 * @var Jetpack_Waf_Module()
	 */
	private static $instance = null;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$instance, 'Jetpack_Waf_Module' ) ) {
			self::$instance = new Jetpack_Waf_Module();
		}

		return self::$instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'jetpack_activate_module_waf', array( $this, 'on_activation' ) );
		add_action( 'jetpack_deactivate_module_waf', array( $this, 'on_deactivation' ) );
	}

	/**
	 * On module activation set up waf mode
	 */
	public function on_activation() {
		update_option( Waf_Runner::MODE_OPTION_NAME, 'normal' );
		( new Waf_Standalone_Bootstrap() )->generate();
	}

	/**
	 * On module deactivation, unset waf mode
	 */
	public function on_deactivation() {
		delete_option( Waf_Runner::MODE_OPTION_NAME );
	}
}

Jetpack_Waf_Module::instance();

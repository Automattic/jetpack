<?php
/**
 * Primary class file for the Jetpack Send plugin.
 *
 * @package automattic/jetpack-send-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Paths;
use Automattic\Jetpack\Send\Admin_Page;
use Automattic\Jetpack\Send\Dns_Watch;
use Automattic\Jetpack\Send\Send;

/**
 * Thin wrapper that initializes the send package.
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_Send {

	/**
	 * Constructor.
	 */
	public function __construct() {
		Send::init();
		add_action( 'activated_plugin', array( $this, 'redirect_after_activation' ), 10, 2 );
	}

	/**
	 * Open Send's screen after the plugin is activated on its own from the Plugins screen.
	 * Bulk and network activations, WP-CLI, AJAX and REST requests stay where they are.
	 *
	 * @param string $plugin       Path to the activated plugin's main file, relative to the plugins directory.
	 * @param bool   $network_wide Whether it was activated for the whole network.
	 * @return void
	 */
	public function redirect_after_activation( $plugin, $network_wide = false ) {
		if (
			$network_wide
			|| is_network_admin()
			|| plugin_basename( JETPACK_SEND_ROOT_FILE ) !== $plugin
			|| ! current_user_can( 'manage_options' )
			|| ! ( new Paths() )->is_current_request_activating_plugin_from_plugins_screen( $plugin )
		) {
			return;
		}

		wp_safe_redirect( Admin_Page::dashboard_url() );
		exit( 0 );
	}

	/**
	 * Deactivation hook: pause the background check; it picks up again after reactivation.
	 *
	 * @return void
	 */
	public static function deactivate() {
		Dns_Watch::unschedule();
	}

	/**
	 * Uninstall hook: remove Send's options and log table.
	 *
	 * @return void
	 */
	public static function uninstall() {
		Send::uninstall();
	}
}

<?php
/**
 * This class hooks the main sync actions.
 *
 * @package jetpack-sync
 */

/**
 * Jetpack Sync main class.
 */
class Jetpack_Sync_Main {
	/**
	 * Initialize the main sync actions.
	 */
	public static function init() {
		// Check for WooCommerce support.
		add_action( 'plugins_loaded', array( 'Jetpack_Sync_Actions', 'initialize_woocommerce' ), 5 );

		// Check for WP Super Cache.
		add_action( 'plugins_loaded', array( 'Jetpack_Sync_Actions', 'initialize_wp_super_cache' ), 5 );

		/*
		 * Init after plugins loaded and before the `init` action. This helps with issues where plugins init
		 * with a high priority or sites that use alternate cron.
		 */
		add_action( 'plugins_loaded', array( 'Jetpack_Sync_Actions', 'init' ), 90 );

		// We need to define this here so that it's hooked before `updating_jetpack_version` is called.
		add_action( 'updating_jetpack_version', array( 'Jetpack_Sync_Actions', 'cleanup_on_upgrade' ), 10, 2 );
		add_action( 'jetpack_user_authorized', array( 'Jetpack_Sync_Actions', 'do_initial_sync' ), 10, 0 );
	}
}

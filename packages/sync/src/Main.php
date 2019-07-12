<?php
/**
 * This class hooks the main sync actions.
 *
 * @package jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Jetpack Sync main class.
 */
class Main {
	static $is_initialized;

	/**
	 * Initialize the main sync actions.
	 */
	public static function init() {
		if ( self::$is_initialized ) {
			return;
		}

		// Check for WooCommerce support.
		add_action( 'plugins_loaded', array( 'Automattic\\Jetpack\\Sync\\Actions', 'initialize_woocommerce' ), 5 );

		// Check for WP Super Cache.
		add_action( 'plugins_loaded', array( 'Automattic\\Jetpack\\Sync\\Actions', 'initialize_wp_super_cache' ), 5 );

		/*
		 * Init after plugins loaded and before the `init` action. This helps with issues where plugins init
		 * with a high priority or sites that use alternate cron.
		 */
		add_action( 'plugins_loaded', array( 'Automattic\\Jetpack\\Sync\\Actions', 'init' ), 90 );

		// We need to define this here so that it's hooked before `updating_jetpack_version` is called.
		add_action( 'updating_jetpack_version', array( 'Automattic\\Jetpack\\Sync\\Actions', 'cleanup_on_upgrade' ), 10, 2 );
		add_action( 'jetpack_user_authorized', array( 'Automattic\\Jetpack\\Sync\\Actions', 'do_initial_sync' ), 10, 0 );

		self::$is_initialized = true;
	}
}

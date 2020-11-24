<?php
/**
 * This class hooks the main sync actions.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Actions as Sync_Actions;

/**
 * Jetpack Sync main class.
 */
class Main {

	/**
	 * Sets up event handlers for the Sync package. Is used from the Config package.
	 *
	 * @action plugins_loaded
	 */
	public static function configure() {
		if ( Actions::sync_allowed() ) {
			add_action( 'plugins_loaded', array( __CLASS__, 'on_plugins_loaded_early' ), 5 );
			add_action( 'plugins_loaded', array( __CLASS__, 'on_plugins_loaded_late' ), 90 );
		}
		// Any hooks below are special cases that need to be declared even if Sync is not allowed.
		add_action( 'jetpack_user_authorized', array( 'Automattic\\Jetpack\\Sync\\Actions', 'do_initial_sync' ), 10, 0 );
	}

	/**
	 * Initialize the main sync actions.
	 *
	 * @action plugins_loaded
	 */
	public static function on_plugins_loaded_early() {
		/**
		 * Additional Sync modules can be carried out into their own packages and they
		 * will get their own config settings.
		 *
		 * For now additional modules are enabled based on whether the third party plugin
		 * class exists or not.
		 */
		Sync_Actions::initialize_woocommerce();
		Sync_Actions::initialize_wp_super_cache();

		// We need to define this here so that it's hooked before `updating_jetpack_version` is called.
		add_action( 'updating_jetpack_version', array( 'Automattic\\Jetpack\\Sync\\Actions', 'cleanup_on_upgrade' ), 10, 2 );
	}

	/**
	 * Runs after most of plugins_loaded hook functions have been run.
	 *
	 * @action plugins_loaded
	 */
	public static function on_plugins_loaded_late() {
		/*
		 * Init after plugins loaded and before the `init` action. This helps with issues where plugins init
		 * with a high priority or sites that use alternate cron.
		 */
		Sync_Actions::init();

		// Enable non-blocking Jetpack Sync flow.
		$non_block_enabled = (bool) get_option( 'jetpack_sync_non_blocking', false );

		/**
		 * Filters the option to enable non-blocking sync.
		 *
		 * Default value is false, filter to true to enable non-blocking mode which will have
		 * WP.com return early and use the sync/close endpoint to check-in processed items.
		 *
		 * @since 8.6.0
		 *
		 * @param bool $enabled Should non-blocking flow be enabled.
		 */
		$filtered = (bool) apply_filters( 'jetpack_sync_non_blocking', $non_block_enabled );

		if ( $non_block_enabled !== $filtered ) {
			update_option( 'jetpack_sync_non_blocking', $filtered, false );
		}

		// Initialize health-related hooks after plugins have loaded.
		Health::init();
	}

}

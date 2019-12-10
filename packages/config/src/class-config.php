<?php
/**
 * The base Jetpack configuration class file.
 *
 * @package automattic/jetpack-config
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Sync\Actions as Sync_Actions;
use Automattic\Jetpack\Sync\Main as Sync_Main;
use Automattic\Jetpack\Plugin\Tracking as Plugin_Tracking;
use Automattic\Jetpack\Terms_Of_Service;

/**
 * The configuration class.
 */
class Config {

	/**
	 * The Jetpack class instance.
	 *
	 * @var Jetpack
	 */
	protected $jetpack;

	/**
	 * Creates the configuration class instance, initalized with the Jetpack object.
	 *
	 * @param \Jetpack $jetpack the main object to initalize everything with.
	 */
	public function __construct( \Jetpack $jetpack ) {
		$this->jetpack = $jetpack;

		add_action( 'plugins_loaded', array( $this, 'on_plugins_loaded_early' ), 5 );
		add_action( 'plugins_loaded', array( $this, 'on_plugins_loaded' ) );
		add_action( 'plugins_loaded', array( $this, 'on_plugins_loaded_late' ) );
	}

	/**
	 * Runs early on plugins_loaded hook execution.
	 *
	 * @action plugins_loaded
	 */
	public function on_plugins_loaded_early() {
		Sync_Main::init();

		// Check for WooCommerce support.
		Sync_Actions::initialize_woocommerce();

		// Check for WP Super Cache.
		Sync_Actions::initialize_wp_super_cache();
	}

	/**
	 * Runs on default plugins_loaded hook priority.
	 *
	 * @action plugins_loaded
	 */
	public function on_plugins_loaded() {
		$terms_of_service = new Terms_Of_Service();
		$tracking         = new Plugin_Tracking();
		if ( $terms_of_service->has_agreed() ) {
			add_action( 'init', array( $tracking, 'init' ) );
		} else {
			/**
			 * Initialize tracking right after the user agrees to the terms of service.
			 */
			add_action( 'jetpack_agreed_to_terms_of_service', array( $tracking, 'init' ) );
		}
	}

	/**
	 * Runs after most of plugins_loaded hook functions have been run.
	 *
	 * @action plugins_loaded
	 */
	public function on_plugins_loaded_late() {
		/*
		 * Init after plugins loaded and before the `init` action. This helps with issues where plugins init
		 * with a high priority or sites that use alternate cron.
		 */
		Sync_Actions::init();
	}
}

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
	 * The initial setting values.
	 *
	 * @var Array
	 */
	protected $config = array(
		'sync'                => false,
		'sync_woocommerce'    => false,
		'sync_wp_super_cache' => false,
		'tracking'            => false,
		'tos'                 => false,
	);

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

		/**
		 * Filters the settings for the Jetpack Config package, allowing package consumers to set
		 * initialization options.
		 *
		 * @since 8.1.0
		 *
		 * @param Array An array of options that configure Jetpack package initialization details.
		 */
		$this->config = wp_parse_args(
			apply_filters( 'jetpack_config', $this->config ),
			$this->config
		);

		if ( $this->config['sync'] ) {
			Sync_Main::init();

			// Check for WooCommerce support.
			$this->config['sync_woocommerce'] ? Sync_Actions::initialize_woocommerce() : null;

			// Check for WP Super Cache.
			$this->config['sync_wp_super_cache'] ? Sync_Actions::initialize_wp_super_cache() : null;
		}
	}

	/**
	 * Runs on default plugins_loaded hook priority.
	 *
	 * @action plugins_loaded
	 */
	public function on_plugins_loaded() {
		if ( $this->config['tos'] && $this->config['tracking'] ) {
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

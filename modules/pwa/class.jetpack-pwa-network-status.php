<?php

class Jetpack_PWA_Network_Status {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Network_Status' ) ) {
			self::$__instance = new Jetpack_PWA_Network_Status();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	public function register_assets() {
		wp_register_script( 'jetpack-show-network-status', plugins_url( 'assets/js/show-network-status.js', __FILE__ ), false, '1.5' );
		wp_register_style( 'jetpack-show-network-status', plugins_url( 'assets/css/show-network-status.css', __FILE__ ) );
	}

	public function enqueue_assets() {
		wp_enqueue_script( 'jetpack-show-network-status' );
		wp_enqueue_style( 'jetpack-show-network-status' );
	}
}

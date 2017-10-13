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
		Jetpack_PWA_Optimize_Assets::instance()->register_inline_script( 'jetpack-show-network-status', 'assets/js/show-network-status.js', __FILE__, false, '1.5' );
		Jetpack_PWA_Optimize_Assets::instance()->register_inline_style( 'jetpack-show-network-status', 'assets/css/show-network-status.css', __FILE__ );
	}

	public function enqueue_assets() {
		wp_enqueue_script( 'jetpack-show-network-status' );
		wp_enqueue_style( 'jetpack-show-network-status' );
	}
}

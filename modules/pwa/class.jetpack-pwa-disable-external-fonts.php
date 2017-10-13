<?php

class Jetpack_PWA_Disable_External_Fonts {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA_Disable_External_Fonts' ) ) {
			self::$__instance = new Jetpack_PWA_Disable_External_Fonts();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'wp_print_styles', 'deregister_externals_fonts' );
	}

	public function deregister_externals_fonts() {

	}
}

<?php

class Jetpack_Upgrade {

	static public $previous_version;

	static function run() {
		if ( Jetpack::is_active() ) {
			$version_option = Jetpack_Options::get_option( 'version' );
			list( self::$previous_version ) = explode( ':', $version_option );
			if ( JETPACK__VERSION != self::$previous_version ) {
				Jetpack_Options::update_options(
					array(
						'version'     => JETPACK__VERSION . ':' . time(),
						'old_version' => self::$previous_version,
					)
				);
				add_action( 'init', array( 'Jetpack_Upgrade', 'init' ) );
			}
		}
	}

	static function init() {
		do_action( 'updating_jetpack_version', self::$previous_version );
		self::modules_cleanup();
	}

	static function modules_cleanup() {
		if ( ! self::$previous_version ) { // For new sites
			self::activate_module( 'manage', false, false );
		}
		// Check which active modules actually exist and remove others from active_modules list
		Jetpack_Options::update_option( 'active_modules', array_intersect( Jetpack::get_active_modules(), Jetpack::get_available_modules() ) );
		Jetpack::activate_new_modules();
	}
}

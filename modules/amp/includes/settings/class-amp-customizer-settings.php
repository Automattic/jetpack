<?php

class AMP_Customizer_Settings {
	private static function get_stored_options() {
		return get_option( 'amp_customizer', array() );
	}

	public static function get_settings() {
		$settings = self::get_stored_options();

		return apply_filters( 'amp_customizer_get_settings', $settings );
	}
}

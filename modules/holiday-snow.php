<?php

/**
 * Holiday Snow
 * Adds falling snow to a blog starting December 1 and ending January 3.
 * Not a module that is activated/deactivated
 * First Introduced: 2.0.3 ??
 */

class Jetpack_Holiday_Snow_Settings {
	function __construct() {
		add_filter( 'admin_init' , array( &$this , 'register_fields' ) );
	}

	public function register_fields() {
		register_setting( 'general', jetpack_holiday_snow_option_name(), 'esc_attr' );
		add_settings_field( jetpack_holiday_snow_option_name(), '<label for="' . esc_attr( jetpack_holiday_snow_option_name() ) . '">' . __( 'Snow' ) . '</label>' , array( &$this, 'blog_field_html' ) , 'general' );
		add_action( 'update_option_' . jetpack_holiday_snow_option_name(), array( &$this, 'holiday_snow_option_updated' ) );
	}

	public function blog_field_html() {
		echo '<input type="checkbox" name="' . esc_attr( jetpack_holiday_snow_option_name() ) . '" value="letitsnow"';
		if ( get_option( jetpack_holiday_snow_option_name() ) )
			echo ' checked="checked"';
		echo ' /> ' . __( 'Show falling snow on my blog until January 4<sup>th</sup>.' );
	}

	public function holiday_snow_option_updated() {
		do_action( 'jetpack_holiday_snow_option_updated' );
	}
}

function jetpack_holiday_snow_script() {
	if ( ! apply_filters( 'jetpack_holiday_chance_of_snow', true ) )
		return;

	do_action( 'jetpack_holiday_snowing' );

	$snowstorm_url = apply_filters( 'jetpack_holiday_snow_js_url', plugins_url( 'holiday-snow/snowstorm.js', __FILE__ ) );
	wp_enqueue_script( 'snowstorm', $snowstorm_url, array(), '1.43.20111201' );
}

function jetpack_maybe_holiday_snow() {
	if ( ! jetpack_is_holiday_snow_season() )
		return;

	if ( is_admin() ) {
		global $jetpack_holiday_snow;
		$jetpack_holiday_snow = new Jetpack_Holiday_Snow_Settings();
	} elseif ( get_option( jetpack_holiday_snow_option_name() ) ) {
		add_action( 'init', 'jetpack_holiday_snow_script' );
	}
}

function jetpack_holiday_snow_option_name() {
	return apply_filters( 'jetpack_holiday_snow_option_name', 'jetpack_holiday_snow_enabled' );
}

function jetpack_is_holiday_snow_season() {
	$today          = time();
	$first_snow_day = mktime( 0, 0, 0, 12, 1 );
	$last_snow_day  = mktime( 0, 0, 0, 1, 4 );

	if ( $today >= $first_snow_day || $today < $last_snow_day )
		return true;
	else
		return false;
}

jetpack_maybe_holiday_snow();

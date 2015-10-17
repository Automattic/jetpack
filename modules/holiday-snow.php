<?php

/**
 * Holiday Snow
 * Adds falling snow to a blog starting December 1 and ending January 3.
 * Not a module that is activated/deactivated
 * First Introduced: 2.0.3 ??
 * Requires Connection: No
 * Auto Activate: Yes
 */

class Jetpack_Holiday_Snow_Settings {
	function __construct() {
		add_filter( 'admin_init' , array( &$this , 'register_fields' ) );
	}

	public function register_fields() {
		register_setting( 'general', jetpack_holiday_snow_option_name(), 'esc_attr' );
		add_settings_field( jetpack_holiday_snow_option_name(), '<label for="' . esc_attr( jetpack_holiday_snow_option_name() ) . '">' . __( 'Snow' , 'jetpack') . '</label>' , array( &$this, 'blog_field_html' ) , 'general' );
		add_action( 'update_option_' . jetpack_holiday_snow_option_name(), array( &$this, 'holiday_snow_option_updated' ) );
	}

	public function blog_field_html() {
		$id = esc_attr( jetpack_holiday_snow_option_name() );
		?>
			<label for="<?php echo $id; ?>">
				<input type="checkbox" name="<?php echo $id; ?>" id="<?php echo $id; ?>" value="letitsnow"<?php checked( get_option( jetpack_holiday_snow_option_name() ), 'letitsnow' ); ?> />
				<span><?php _e( 'Show falling snow on my blog until January 4<sup>th</sup>.' , 'jetpack'); ?></span>
			</label>
		<?php
	}

	public function holiday_snow_option_updated() {

		/**
		 * Fires when the holiday snow option is updated.
		 *
		 * @module theme-tools
		 *
		 * @since 2.0.3
		 */
		do_action( 'jetpack_holiday_snow_option_updated' );
	}
}

function jetpack_holiday_snow_script() {

	/**
	 * Allow holiday snow.
	 *
	 * Note: there's no actual randomness involved in whether it snows
	 * or not, despite the filter mentioning a "chance of snow."
	 *
	 * @module theme-tools
	 *
	 * @since 2.0.3
	 *
	 * @param bool True to allow snow, false to disable it.
	 */
	if ( ! apply_filters( 'jetpack_holiday_chance_of_snow', true ) )
		return;

	/**
	 * Fires when it's snowing.
	 *
	 * @module theme-tools
	 *
	 * @since 2.0.3
	 */
	do_action( 'jetpack_holiday_snowing' );

	/**
	 * Filter the holiday snow JavaScript URL.
	 *
	 * @module theme-tools
	 *
	 * @since 2.0.3
	 *
	 * @param str URL to the holiday snow JavaScript file.
	 */
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

	/**
	 * Filter the holiday snow option name.
	 *
	 * @module theme-tools
	 *
	 * @since 2.0.3
	 *
	 * @param str The holiday snow option name.
	 */
	return apply_filters( 'jetpack_holiday_snow_option_name', 'jetpack_holiday_snow_enabled' );
}

function jetpack_is_holiday_snow_season() {
	$today          = time();
	$first_snow_day = mktime( 0, 0, 0, 12, 1 );
	$last_snow_day  = mktime( 0, 0, 0, 1, 4 );

	$snow = ( $today >= $first_snow_day || $today < $last_snow_day );

	/**
	 * Filter whether it's winter or not.
	 *
	 * You can use this filter if, for example, you live in the
	 * Southern Hemisphere. In that case, the dates for winter
	 * above are incorrect for your location.
	 *
	 * @module theme-tools
	 *
	 * @since 2.1.0
	 *
	 * @param bool $snow True if it's snow season, false if not.
	 */
	return apply_filters( 'jetpack_is_holiday_snow_season', $snow );
}

jetpack_maybe_holiday_snow();

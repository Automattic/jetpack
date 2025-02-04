<?php
/**
 * Holiday Snow
 * Adds falling snow to a blog starting December 1 and ending January 3.
 *
 * @since 6.1.0
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Holiday Snow (admin and frontend).
 */
class Holiday_Snow {
	/**
	 * Option to decide if Holiday snow is enabled on the site.
	 */
	private const HOLIDAY_SNOW_OPTION_NAME = 'jetpack_holiday_snow_enabled';

	/**
	 * Check if it is the holiday snow season.
	 * The season starts on December 1 and ends on January 4 by default.
	 *
	 * @return bool
	 */
	public static function is_snow_season() {
		$is_snow_season = false;
		$today          = time();
		$first_snow_day = mktime( 0, 0, 0, 12, 1 );
		$last_snow_day  = mktime( 0, 0, 0, 1, 4 );

		if ( $today >= $first_snow_day || $today < $last_snow_day ) {
			$is_snow_season = true;
		}

		/**
		 * Filter to check if it is the snow season.
		 * It allows to change the start and end dates of the season,
		 * for regions where the holiday season may be different.
		 *
		 * @since 6.1.0
		 *
		 * @param bool $is_holiday_snow_season Is it the  snow season?
		 */
		return apply_filters( 'jetpack_is_holiday_snow_season', $is_snow_season );
	}

	/**
	 * Check if the site uses p2.
	 * p2 is currently not compatible with Holiday Snow.
	 * This covers both P2 and P2020 themes.
	 *
	 * @deprecated 6.1.0
	 *
	 * @return bool
	 */
	private static function is_p2() {
		return str_contains( get_stylesheet(), 'pub/p2' )
			|| function_exists( '\WPForTeams\is_wpforteams_site' ) && is_wpforteams_site( get_current_blog_id() );
	}

	/**
	 * Check if the snow is enabled.
	 *
	 * @return bool
	 */
	public static function is_snow_enabled() {
		return (bool) get_option( self::HOLIDAY_SNOW_OPTION_NAME );
	}

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::is_snow_season() ) {
			return;
		}

		add_filter( 'site_settings_endpoint_get', array( __CLASS__, 'add_option_api' ) );
		add_filter( 'rest_api_update_site_settings', array( __CLASS__, 'update_option_api' ), 10, 2 );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'update_option_' . self::HOLIDAY_SNOW_OPTION_NAME, array( __CLASS__, 'holiday_snow_option_updated' ) );

		if ( self::is_snow_enabled() ) {
			add_action( 'wp_footer', array( __CLASS__, 'holiday_snow_markup' ) );
			add_action( 'wp_enqueue_scripts', array( __CLASS__, 'holiday_snow_script' ) );
		}
	}

	/**
	 * Add the snowstorm markup to the footer.
	 *
	 * @return void
	 * @since 6.1.0
	 */
	public static function holiday_snow_markup() {
		echo '<div id="jetpack-holiday-snow"></div>';
	}

	/**
	 * Enqueue the snowstorm CSS on the frontend.
	 *
	 * @return void
	 */
	public static function holiday_snow_script() {
		if (
			/**
			 * Allow short-circuiting the snow, even when enabled on the site in settings.
			 *
			 * @since 6.1.0
			 *
			 * @param bool true Whether to show the snow.
			 */
			! apply_filters( 'jetpack_holiday_chance_of_snow', true )
		) {
			return;
		}

		/**
		 * Fires when the snow is falling.
		 *
		 * @since 6.1.0
		 */
		do_action( 'jetpack_stats_extra', 'holiday_snow', 'snowing' );

		/**
		 * Filter the URL of the snowstorm script.
		 *
		 * @since 6.1.0
		 * @deprecated 6.1.0 We've switched to a CSS-only snow effect.
		 *
		 * @param string $snowstorm_url URL of the snowstorm script.
		 */
		$snowstorm_url = apply_filters_deprecated( // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			'jetpack_holiday_snow_js_url',
			array( plugins_url( 'snowstorm.js', __FILE__ ) ),
			'6.1.1',
			'',
			'This filter is no longer useful. We use a CSS-only snow effect instead.'
		);

		wp_enqueue_style(
			'holiday-snow',
			plugins_url( 'build/holiday-snow/holiday-snow.css', \Automattic\Jetpack\Jetpack_Mu_Wpcom::BASE_FILE ),
			array(),
			\Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION
		);
	}

	/**
	 * Add the option to the v1 API site settings endpoint.
	 *
	 * @param array $settings A single site's settings.
	 * @return array
	 */
	public static function add_option_api( $settings ) {
		$settings[ self::HOLIDAY_SNOW_OPTION_NAME ] = self::is_snow_enabled();

		return $settings;
	}

	/**
	 * Update settings via public-api.wordpress.com.
	 *
	 * @param array $input             Associative array of site settings to be updated.
	 *                                 Cast and filtered based on documentation.
	 * @param array $unfiltered_input  Associative array of site settings to be updated.
	 *                                 Neither cast nor filtered. Contains raw input.
	 * @return array
	 */
	public static function update_option_api( $input, $unfiltered_input ) {
		if ( isset( $unfiltered_input[ self::HOLIDAY_SNOW_OPTION_NAME ] ) ) {
			$input[ self::HOLIDAY_SNOW_OPTION_NAME ] = (bool) $unfiltered_input[ self::HOLIDAY_SNOW_OPTION_NAME ];
		}

		return $input;
	}

	/**
	 * Registers the settings section and fields.
	 *
	 * @return void
	 */
	public static function register_settings() {
		register_setting(
			'general',
			self::HOLIDAY_SNOW_OPTION_NAME,
			array(
				'type'              => 'boolean',
				'description'       => esc_attr__( 'Show falling snow on my site', 'jetpack-mu-wpcom' ),
				'show_in_rest'      => true,
				'default'           => false,
				'sanitize_callback' => function ( $value ) {
					return (bool) $value;
				},
			)
		);

		add_settings_field(
			self::HOLIDAY_SNOW_OPTION_NAME,
			esc_attr__( 'Snow', 'jetpack-mu-wpcom' ),
			array( __CLASS__, 'option_field_display' ),
			'general',
			'default',
			array(
				'label_for' => self::HOLIDAY_SNOW_OPTION_NAME,
			)
		);
	}

	/**
	 * Renders the Snow settings markup.
	 *
	 * @return void
	 */
	public static function option_field_display() {
		printf(
			'<input type="checkbox" name="%1$s" id="%1$s" %2$s/><label for="%1$s">%3$s</label>',
			esc_attr( self::HOLIDAY_SNOW_OPTION_NAME ),
			checked( self::is_snow_enabled(), true, false ),
			wp_kses(
				__( 'Show falling snow on my site until January 4<sup>th</sup>.', 'jetpack-mu-wpcom' ),
				array(
					'sup' => array(),
				)
			)
		);
	}

	/**
	 * Fires whenever the holiday snow option is updated.
	 * Used to gather stats about modified options.
	 *
	 * @return void
	 */
	public static function holiday_snow_option_updated() {
		/** This action is already documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'holiday_snow', 'toggle' );
	}
}

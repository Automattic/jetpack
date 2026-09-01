<?php
/**
 * Holiday Snow
 * Adds falling snow to a blog for a season.
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
	 * Option names.
	 */
	private const OPTION_ENABLED    = 'jetpack_holiday_snow_enabled';
	private const OPTION_GRID_WIDTH = 'jetpack_holiday_snow_grid_width';
	private const OPTION_DENSITY    = 'jetpack_holiday_snow_density';
	private const OPTION_SPEED      = 'jetpack_holiday_snow_speed';

	/**
	 * Settings config; defined in init().
	 *
	 * @var array<string, array>
	 */
	private static $holiday_snow_config = array();

	/**
	 * Cached value for snow enabled option.
	 *
	 * @var bool|null
	 */
	private static $is_snow_enabled_cache = null;

	/**
	 * Get a config array safely, ensuring config is initialized.
	 *
	 * @since 6.9.0
	 *
	 * @param string $option_name The option name.
	 * @return array|null The config array or null if not initialized.
	 */
	private static function get_config( $option_name ) {
		// Ensure config is initialized.
		if ( empty( self::$holiday_snow_config ) ) {
			return null;
		}

		if ( ! isset( self::$holiday_snow_config[ $option_name ] ) ) {
			return null;
		}

		return self::$holiday_snow_config[ $option_name ];
	}

	/**
	 * Get the hemisphere setting, automatically detected from timezone.
	 * Attempts to detect hemisphere from the site's timezone location data.
	 * Falls back to Northern hemisphere if detection is not possible
	 * e.g., UTC or offset-based timezones).
	 *
	 * @since 6.9.0
	 *
	 * @return string 'south' or 'north'.
	 */
	private static function get_hemisphere_setting() {
		$hemisphere = 'north';
		$timezone   = wp_timezone();

		/*
		 * Get location data from the timezone object.
		 * This only works for named timezones (e.g., "Europe/Budapest"), not offsets.
		 */
		$location = $timezone->getLocation();

		if ( $location && isset( $location['latitude'] ) ) {
			$latitude = (float) $location['latitude'];

			/*
			 * Latitude > 0 = Northern hemisphere, < 0 = Southern hemisphere.
			 */
			if ( $latitude < 0 ) {
				$hemisphere = 'south';
			}
		}

		/**
		 * Filter the detected hemisphere setting.
		 * Allows overriding the automatic hemisphere detection from timezone.
		 *
		 * @since 6.9.0
		 *
		 * @param string $hemisphere The detected hemisphere. Either 'north' or 'south'.
		 */
		$hemisphere = apply_filters( 'jetpack_holiday_snow_hemisphere', $hemisphere );

		if ( ! in_array( $hemisphere, array( 'north', 'south' ), true ) ) {
			$hemisphere = 'north';
		}

		return $hemisphere;
	}

	/**
	 * Check if it is the holiday snow season, based on hemisphere and date.
	 *
	 * The hemisphere is automatically detected from the site's timezone.
	 * If detection is not possible, fallback to Northern hemisphere.
	 * Northern hemisphere: shows from 1 December through 6 January.
	 * Southern hemisphere: shows from 1 June through 6 July.
	 *
	 * @return bool
	 */
	public static function is_snow_season() {
		$is_snow_season = false;
		$today          = time();

		$hemisphere = self::get_hemisphere_setting();
		if ( 'south' === $hemisphere ) {
			$first_snow_day = mktime( 0, 0, 0, 6, 1 );
			$last_snow_day  = mktime( 0, 0, 0, 7, 7 );
			// Southern hemisphere: June 1 - July 7 (doesn't span year boundary, use AND)
			if ( $today >= $first_snow_day && $today < $last_snow_day ) {
				$is_snow_season = true;
			}
		} else {
			$first_snow_day = mktime( 0, 0, 0, 12, 1 );
			$last_snow_day  = mktime( 0, 0, 0, 1, 7 );
			// Northern hemisphere: Dec 1 - Jan 7 (spans year boundary, use OR)
			if ( $today >= $first_snow_day || $today < $last_snow_day ) {
				$is_snow_season = true;
			}
		}

		/**
		 * Filter to check if it is the snow season.
		 * It allows to change the start and end dates of the season,
		 * for regions where the holiday season may be different.
		 *
		 * @since 6.1.0
		 *
		 * @param bool $is_holiday_snow_season Is it the snow season?
		 */
		return apply_filters( 'jetpack_is_holiday_snow_season', $is_snow_season );
	}

	/**
	 * Check if the snow is enabled.
	 *
	 * @return bool
	 */
	public static function is_snow_enabled() {
		if ( null === self::$is_snow_enabled_cache ) {
			self::$is_snow_enabled_cache = (bool) get_option( self::OPTION_ENABLED );
		}
		return self::$is_snow_enabled_cache;
	}

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		self::$holiday_snow_config = array(
			self::OPTION_ENABLED    => array(
				'default'     => false,
				'type'        => 'boolean',
				'description' => __( 'Show falling snow on my site.', 'jetpack-mu-wpcom' ),
				'label'       => __( 'Enable Holiday Snow', 'jetpack-mu-wpcom' ),
			),
			self::OPTION_GRID_WIDTH => array(
				'default'     => 600,
				'min'         => 100,
				'max'         => 1000,
				'step'        => 10,
				'type'        => 'integer',
				'description' => __( 'How wide a grid of snow is.', 'jetpack-mu-wpcom' ),
				'label'       => __( 'Snow Grid Width', 'jetpack-mu-wpcom' ),
				'hidden'      => true, // Disabled for now, as it's used in a SCSS for loop
			),
			self::OPTION_DENSITY    => array(
				'default'     => 10,
				'min'         => 1,
				'max'         => 30,
				'step'        => 1,
				'type'        => 'integer',
				'description' => __( 'How many snowflakes appear on the screen at a given time.', 'jetpack-mu-wpcom' ),
				'label'       => __( 'Snow Density', 'jetpack-mu-wpcom' ),
				'hidden'      => true, // Disabled for now, as it's used in a SCSS for loop
			),
			self::OPTION_SPEED      => array(
				'default'     => 9,
				'min'         => 1,
				'max'         => 20,
				'step'        => 1,
				'type'        => 'integer',
				'description' => __( 'How long it takes for a snowflake to get to the bottom of the screen. The lower the number, the faster it goes.', 'jetpack-mu-wpcom' ),
				'label'       => __( 'Snow Speed', 'jetpack-mu-wpcom' ),
			),
		);

		// Only show settings if it's snow season.
		if ( ! self::is_snow_season() ) {
			return;
		}

		add_filter( 'site_settings_endpoint_get', array( __CLASS__, 'add_option_api' ) );
		add_filter( 'rest_api_update_site_settings', array( __CLASS__, 'update_option_api' ), 10, 2 );
		add_action( 'update_option_' . self::OPTION_ENABLED, array( __CLASS__, 'holiday_snow_option_updated' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );

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
		// Get the snow speed option, fallback to default if not set.
		// Use hardcoded default (9) if config is not initialized yet.
		$speed_config  = self::get_config( self::OPTION_SPEED );
		$default_speed = $speed_config ? $speed_config['default'] : 9;
		$snow_speed    = get_option( self::OPTION_SPEED, $default_speed );

		// Sanitize the value, using config if available, otherwise use hardcoded defaults.
		if ( $speed_config ) {
			$snow_speed = self::sanitize_option( $snow_speed, $speed_config );
		} else {
			// Fallback sanitization if config not initialized: ensure it's between 1-20, default to 9.
			$snow_speed = (int) $snow_speed;
			if ( $snow_speed < 1 || $snow_speed > 20 ) {
				$snow_speed = 9;
			}
		}

		echo '<div id="jetpack-holiday-snow" style="--jetpack-holiday-snow-speed: ' . (int) $snow_speed . 's;" ></div>';
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
		foreach ( self::$holiday_snow_config as $option_name => $option_config ) {
			$value                    = get_option( $option_name, $option_config['default'] );
			$settings[ $option_name ] = self::sanitize_option( $value, $option_config );
		}
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
		foreach ( self::$holiday_snow_config as $option_name => $option_config ) {
			if ( isset( $unfiltered_input[ $option_name ] ) ) {
				$input[ $option_name ] = self::sanitize_option( $unfiltered_input[ $option_name ], $option_config );
			}
		}
		return $input;
	}

	/**
	 * Registers the settings section and fields.
	 *
	 * @return void
	 */
	public static function register_settings() {
		foreach ( self::$holiday_snow_config as $option_name => $option_config ) {
			if ( 'boolean' === $option_config['type'] ) {
				$sanitize_callback = 'boolval';
			} elseif ( 'integer' === $option_config['type'] ) {
				$sanitize_callback = function ( $value ) use ( $option_config ) {
					return self::sanitize_option_within_int_range( $value, $option_config );
				};
			} else {
				// This shouldn't ever happen, but let's be careful anyway.
				continue;
			}
			register_setting(
				'general',
				$option_name,
				array(
					'type'              => $option_config['type'],
					'description'       => esc_attr( $option_config['description'] ),
					'show_in_rest'      => true,
					'default'           => $option_config['default'],
					'sanitize_callback' => $sanitize_callback,
				)
			);

			// Hide settings as desired.
			if ( ! empty( $option_config['hidden'] ) ) {
				continue;
			}

			add_settings_field(
				$option_name,
				esc_attr( $option_config['label'] ),
				function () use ( $option_name, $option_config ) {
					$value = get_option( $option_name, $option_config['default'] );
					if ( 'boolean' === $option_config['type'] ) {
						printf(
							'<input type="checkbox" name="%1$s" id="%1$s" value="1" %2$s /><label for="%1$s">%3$s</label>',
							esc_attr( $option_name ),
							checked( $value, true, false ),
							esc_html( $option_config['description'] )
						);
					} elseif ( 'integer' === $option_config['type'] ) {
						printf(
							'<input type="number" name="%1$s" id="%1$s" value="%2$d" min="%3$d" max="%4$d" step="%5$d" />',
							esc_attr( $option_name ),
							(int) $value,
							(int) $option_config['min'],
							(int) $option_config['max'],
							(int) $option_config['step']
						);
						printf(
							'<p>%s</p>',
							esc_html( $option_config['description'] )
						);
						printf(
							'<p>%s</p>',
							// translators: %s is the default snow speed value.
							esc_html( sprintf( __( 'Default: %s', 'jetpack-mu-wpcom' ), $option_config['default'] ) )
						);
					}
				},
				'general',
				'default',
				array(
					'label_for' => $option_name,
				)
			);
		}
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

	/**
	 * Sanitize a single option value using config.
	 *
	 * @param mixed $value   The option value to sanitize.
	 * @param array $config  Option config array.
	 * @return bool|int|null Sanitized value, or null if an unknown type.
	 */
	public static function sanitize_option( $value, $config ) {
		if ( 'boolean' === $config['type'] ) {
			return (bool) $value;
		} elseif ( 'integer' === $config['type'] ) {
			return self::sanitize_option_within_int_range( $value, $config );
		}
		// this shouldn't ever happen, but just in case...
		return null;
	}

	/**
	 * Sanitize a value to be within a given min/max range, falling back to default as needed.
	 * Assumes 'min', 'max', and 'default' always exist in $config.
	 *
	 * @param mixed $value  The value to sanitize.
	 * @param array $config Option config array.
	 * @return int          The sanitized value, or default if out of range.
	 */
	public static function sanitize_option_within_int_range( $value, $config ) {
		$value = (int) $value;
		if ( $value < $config['min'] || $value > $config['max'] ) {
			return $config['default'];
		}
		return $value;
	}
}

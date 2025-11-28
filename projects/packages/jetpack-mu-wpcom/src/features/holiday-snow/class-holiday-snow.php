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
	 * Slug where one can find the Holiday Snow settings.
	 *
	 * @var string
	 */
	private const SETTINGS_PAGE_SLUG = 'jetpack-holiday-snow';

	/**
	 * Option names.
	 */
	private const OPTION_ENABLED    = 'jetpack_holiday_snow_enabled';
	private const OPTION_GRID_WIDTH = 'jetpack_holiday_snow_grid_width';
	private const OPTION_DENSITY    = 'jetpack_holiday_snow_density';
	private const OPTION_SPEED      = 'jetpack_holiday_snow_speed';
	private const OPTION_SOUTH      = 'jetpack_holiday_snow_south';

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
	 * Whether to show the holiday snow settings.
	 * Shows from 1 December through 6 January and from 1 June through 6 July.
	 *
	 * @var bool
	 */
	public static function show_settings() {
		$today = time();
		return (
			// southern hemisphere
			$today >= mktime( 0, 0, 0, 6, 1 ) && $today < mktime( 0, 0, 0, 7, 7 )
			||
			// northern hemisphere
			$today >= mktime( 0, 0, 0, 12, 1 ) || $today < mktime( 0, 0, 0, 1, 7 )
		);
	}

	/**
	 * Check if it is the holiday snow season.
	 * If set to northern hemisphere (default), it shows from 1 December through 6 January.
	 * Otherwise it shows from 1 June through 6 July.
	 *
	 * @return bool
	 */
	public static function is_snow_season() {
		$is_snow_season = false;
		$today          = time();

		$do_southern_hemisphere = get_option( self::OPTION_SOUTH, self::$holiday_snow_config[ self::OPTION_SOUTH ]['default'] );
		if ( $do_southern_hemisphere ) {
			$first_snow_day = mktime( 0, 0, 0, 6, 1 );
			$last_snow_day  = mktime( 0, 0, 0, 7, 7 );
		} else {
			$first_snow_day = mktime( 0, 0, 0, 12, 1 );
			$last_snow_day  = mktime( 0, 0, 0, 1, 7 );
		}

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
		 * @param bool $is_holiday_snow_season Is it the snow season?
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
			self::OPTION_SOUTH      => array(
				'default'     => false,
				'type'        => 'boolean',
				'description' => __( 'If snow is enabled and this is ticked, it will show from 1 June through 6 July. Otherwise it will fall from 1 December through 6 January.', 'jetpack-mu-wpcom' ),
				'label'       => __( 'Southern Hemisphere', 'jetpack-mu-wpcom' ),
			),
		);

		/**
		 * We should show settings if:
		 * 1. It's in one of the seasons.
		 * 2. It's snow season, which can be configured with a filter.
		 */
		if ( ! self::show_settings() && ! self::is_snow_season() ) {
			return;
		}

		add_filter( 'site_settings_endpoint_get', array( __CLASS__, 'add_option_api' ) );
		add_filter( 'rest_api_update_site_settings', array( __CLASS__, 'update_option_api' ), 10, 2 );
		add_action( 'update_option_' . self::OPTION_ENABLED, array( __CLASS__, 'holiday_snow_option_updated' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_menu', array( __CLASS__, 'add_settings_page' ) );

		// If we're in the wrong hemisphere, we'll see the settings but not the snow.
		if ( ! self::is_snow_season() ) {
			return;
		}

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
		$snow_speed = get_option( self::OPTION_SPEED, self::$holiday_snow_config[ self::OPTION_SPEED ]['default'] );
		$snow_speed = self::sanitize_option( $snow_speed, self::$holiday_snow_config[ self::OPTION_SPEED ] );
		echo '<div id="jetpack-holiday-snow" style="--jetpack-holiday-snow-speed: ' . esc_attr( $snow_speed ) . 's;" ></div>';
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
			if ( $option_config['type'] === 'boolean' ) {
				$sanitize_callback = 'boolval';
			} elseif ( $option_config['type'] === 'integer' ) {
				$sanitize_callback = function ( $value ) use ( $option_config ) {
					return self::sanitize_option_within_int_range( $value, $option_config );
				};
			} else {
				// This shouldn't ever happen, but let's be careful anyway.
				continue;
			}
			register_setting(
				self::SETTINGS_PAGE_SLUG,
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
					if ( $option_config['type'] === 'boolean' ) {
						printf(
							'<input type="checkbox" name="%1$s" id="%1$s" value="1" %2$s /><label for="%1$s">%3$s</label>',
							esc_attr( $option_name ),
							checked( $value, true, false ),
							esc_html( $option_config['description'] )
						);
					} elseif ( $option_config['type'] === 'integer' ) {
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
				self::SETTINGS_PAGE_SLUG,
				self::SETTINGS_PAGE_SLUG,
				array(
					'label_for' => $option_name,
				)
			);
		}
	}

	/**
	 * Add a new settings page for Holiday Snow.
	 */
	public static function add_settings_page() {
		add_options_page(
			esc_attr__( 'Holiday Snow Settings', 'jetpack-mu-wpcom' ),
			esc_attr__( 'Holiday Snow', 'jetpack-mu-wpcom' ),
			'manage_options',
			self::SETTINGS_PAGE_SLUG,
			array( __CLASS__, 'render_settings_page' )
		);
	}

	/**
	 * Render the Holiday Snow settings page.
	 */
	public static function render_settings_page() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Holiday Snow Settings', 'jetpack-mu-wpcom' ); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields( self::SETTINGS_PAGE_SLUG ); ?>
				<table class="form-table">
					<tbody>
						<?php do_settings_fields( self::SETTINGS_PAGE_SLUG, self::SETTINGS_PAGE_SLUG ); ?>
					</tbody>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
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
		if ( $config['type'] === 'boolean' ) {
			return (bool) $value;
		} elseif ( $config['type'] === 'integer' ) {
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

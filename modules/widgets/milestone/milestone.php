<?php
/*
Plugin Name: Milestone
Description: Countdown to a specific date.
Version: 1.0
Author: Automattic Inc.
Author URI: http://automattic.com/
License: GPLv2 or later
*/

function jetpack_register_widget_milestone() {
	register_widget( 'Milestone_Widget' );
}
add_action( 'widgets_init', 'jetpack_register_widget_milestone' );

class Milestone_Widget extends WP_Widget {
	private static $dir       = null;
	private static $url       = null;
	private static $defaults  = null;
	private static $config_js = null;

	/**
	 * Available time units sorted in descending order.
	 * @var Array
	 */
	protected $available_units = array(
		'years',
		'months',
		'days',
		'hours',
		'minutes',
		'seconds'
	);

	function __construct() {
		$widget = array(
			'classname'   => 'milestone-widget',
			'description' => __( 'Display a countdown to a certain date.', 'jetpack' ),
		);

		parent::__construct(
			'Milestone_Widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Milestone', 'jetpack' ) ),
			$widget
		);

		self::$dir = trailingslashit( dirname( __FILE__ ) );
		self::$url = plugin_dir_url( __FILE__ );

		add_action( 'wp_enqueue_scripts', array( __class__, 'enqueue_template' ) );
		add_action( 'admin_enqueue_scripts', array( __class__, 'enqueue_admin' ) );
		add_action( 'wp_footer', array( $this, 'localize_script' ) );

		if ( is_active_widget( false, false, $this->id_base, true ) || is_active_widget( false, false, 'monster', true ) || is_customize_preview() ) {
			add_action( 'wp_head', array( __class__, 'styles_template' ) );
		}
	}

	public static function enqueue_admin( $hook_suffix ) {
		if ( 'widgets.php' == $hook_suffix ) {
			wp_enqueue_style( 'milestone-admin', self::$url . 'style-admin.css', array(), '20161215' );
			wp_enqueue_script(
				'milestone-admin-js',
				Jetpack::get_file_url_for_environment(
					'_inc/build/widgets/milestone/admin.min.js',
					'modules/widgets/milestone/admin.js'
				),
				array( 'jquery' ),
				'20170915',
				true
			);
		}
	}

	public static function enqueue_template() {
		wp_enqueue_script(
			'milestone',
			Jetpack::get_file_url_for_environment(
				'_inc/build/widgets/milestone/milestone.min.js',
				'modules/widgets/milestone/milestone.js'
			),
			array( 'jquery' ),
			'20160520',
			true
		);
	}

	public static function styles_template() {
		global $themecolors;
		$colors = wp_parse_args( $themecolors, array(
			'bg'     => 'ffffff',
			'border' => 'cccccc',
			'text'   => '333333',
		) );
?>
<style>
.milestone-widget {
	margin-bottom: 1em;
}
.milestone-content {
	line-height: 2;
	margin-top: 5px;
	max-width: 100%;
	padding: 0;
	text-align: center;
}
.milestone-header {
	background-color: <?php echo self::sanitize_color_hex( $colors['text'] ); ?>;
	color: <?php echo self::sanitize_color_hex( $colors['bg'] ); ?>;
	line-height: 1.3;
	margin: 0;
	padding: .8em;
}
.milestone-header .event,
.milestone-header .date {
	display: block;
}
.milestone-header .event {
	font-size: 120%;
}
.milestone-countdown .difference {
	display: block;
	font-size: 500%;
	font-weight: bold;
	line-height: 1.2;
}
.milestone-countdown,
.milestone-message {
	background-color: <?php echo self::sanitize_color_hex( $colors['bg'] ); ?>;
	border: 1px solid <?php echo self::sanitize_color_hex( $colors['border'] ); ?>;
	border-top: 0;
	color: <?php echo self::sanitize_color_hex( $colors['text'] ); ?>;
	padding-bottom: 1em;
}
.milestone-message {
	padding-top: 1em
}
</style>
<?php
	}

	/**
	 * Ensure that a string representing a color in hexadecimal
	 * notation is safe for use in css and database saves.
	 *
	 * @param string Color in hexadecimal notation. "#" may or may not be prepended to the string.
	 * @return string Color in hexadecimal notation on success - the string "transparent" otherwise.
	 */
	public static function sanitize_color_hex( $hex, $prefix = '#' ) {
		$hex = trim( $hex );

		/* Strip recognized prefixes. */
		if ( 0 === strpos( $hex, '#' ) ) {
			$hex = substr( $hex, 1 );
		} elseif ( 0 === strpos( $hex, '%23' ) ) {
			$hex = substr( $hex, 3 );
		}

		if ( 0 !== preg_match( '/^[0-9a-fA-F]{6}$/', $hex ) ) {
			return $prefix . $hex;
		}

		return 'transparent';
	}

	/**
	 * Localize Front-end Script.
	 *
	 * Print the javascript configuration array only if the
	 * current template has an instance of the widget that
	 * is still counting down. In all other cases, this
	 * function will dequeue milestone.js.
	 *
	 * Hooks into the "wp_footer" action.
	 */
	function localize_script() {
		if ( empty( self::$config_js['instances'] ) ) {
			wp_dequeue_script( 'milestone' );
			return;
		}
		self::$config_js['api_root'] = esc_url_raw( rest_url() );
		wp_localize_script( 'milestone', 'MilestoneConfig', self::$config_js );
	}

	/**
	 * Widget
	 */
	function widget( $args, $instance ) {
		echo $args['before_widget'];

		/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
		$title = apply_filters( 'widget_title', $instance['title'] );
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		$data = $this->get_widget_data( $instance );

		self::$config_js['instances'][] = array(
			'id'      => $args['widget_id'],
			'message' => $data['message'],
			'refresh' => $data['refresh']
		);

		echo '<div class="milestone-content">';

		echo '<div class="milestone-header">';
		echo '<strong class="event">' . esc_html( $instance['event'] ) . '</strong>';
		echo '<span class="date">' . esc_html( date_i18n( get_option( 'date_format' ), $data['milestone'] ) ) . '</span>';
		echo '</div>';

		echo $data['message'];

		echo '</div><!--milestone-content-->';

		echo $args['after_widget'];

		/** This action is documented in modules/widgets/gravatar-profile.php */
		do_action( 'jetpack_stats_extra', 'widget_view', 'milestone' );
	}

	function get_widget_data( $instance ) {
		$data = array();

		$instance = $this->sanitize_instance( $instance );

		$milestone = mktime( $instance['hour'], $instance['min'], 0, $instance['month'], $instance['day'], $instance['year'] );
		$now  = (int) current_time( 'timestamp' );
		$type = $instance['type'];

		if ( 'since' === $type ) {
			$diff = (int) floor( $now - $milestone );
		} else {
			$diff = (int) floor( $milestone - $now );
		}

		$data['diff'] = $diff;
		$data['unit'] = $this->get_unit( $diff, $instance['unit'] );

		// Setting the refresh counter to equal the number of seconds it takes to flip a unit
		$refresh_intervals = array(
			0, // should be YEAR_IN_SECONDS, but doing setTimeout for a year doesn't seem to be logical
			0, // same goes for MONTH_IN_SECONDS,
			DAY_IN_SECONDS,
			HOUR_IN_SECONDS,
			MINUTE_IN_SECONDS,
			1
		);

		$data['refresh'] = $refresh_intervals[ array_search( $data['unit'], $this->available_units ) ];
		$data['milestone'] = $milestone;

		if ( ( 1 > $diff ) && ( 'until' === $type ) ) {
			$data['message'] = '<div class="milestone-message">' . $instance['message'] . '</div>';
			$data['refresh'] = 0; // No need to refresh, the milestone has been reached
		} else {
			$interval_text = $this->get_interval_in_units( $diff, $data['unit'] );
			$interval = intval( $interval_text );

			if ( 'since' === $type ) {

				switch ( $data['unit'] ) {
					case 'years':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">year ago.</span>',
								'<span class="difference">%s</span> <span class="label">years ago.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'months':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">month ago.</span>',
								'<span class="difference">%s</span> <span class="label">months ago.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'days':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">day ago.</span>',
								'<span class="difference">%s</span> <span class="label">days ago.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'hours':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">hour ago.</span>',
								'<span class="difference">%s</span> <span class="label">hours ago.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'minutes':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">minute ago.</span>',
								'<span class="difference">%s</span> <span class="label">minutes ago.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'seconds':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">second ago.</span>',
								'<span class="difference">%s</span> <span class="label">seconds ago.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
				}
			} else {
				switch ( $this->get_unit( $diff, $instance['unit'] ) ) {
					case 'years':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">year to go.</span>',
								'<span class="difference">%s</span> <span class="label">years to go.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'months':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">month to go.</span>',
								'<span class="difference">%s</span> <span class="label">months to go.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'days':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">day to go.</span>',
								'<span class="difference">%s</span> <span class="label">days to go.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'hours':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">hour to go.</span>',
								'<span class="difference">%s</span> <span class="label">hours to go.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'minutes':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">minute to go.</span>',
								'<span class="difference">%s</span> <span class="label">minutes to go.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
					case 'seconds':
						$data['message'] = sprintf(
							_n(
								'<span class="difference">%s</span> <span class="label">second to go.</span>',
								'<span class="difference">%s</span> <span class="label">seconds to go.</span>',
								$interval,
								'jetpack'
							),
							$interval_text
						);
					break;
				}
			}
			$data['message'] = '<div class="milestone-countdown">' . $data['message'] . '</div>';
		}

		return $data;
	}

	/**
	 * Return the largest possible time unit that the difference will be displayed in.
	 *
	 * @param Integer $seconds the interval in seconds
	 * @param String $maximum_unit the maximum unit that will be used. Optional.
	 * @return String $calculated_unit
	 */
	protected function get_unit( $seconds, $maximum_unit = 'automatic' ) {
		$unit = '';

		if ( $seconds >= YEAR_IN_SECONDS * 2 ) {
			// more than 2 years - show in years, one decimal point
			$unit = 'years';

		} else if ( $seconds >= YEAR_IN_SECONDS ) {
			if ( 'years' === $maximum_unit ) {
				$unit = 'years';
			} else {
				// automatic mode - showing months even if it's between one and two years
				$unit = 'months';
			}

		} else if ( $seconds >= MONTH_IN_SECONDS * 3 ) {
			// fewer than 2 years - show in months
			$unit = 'months';

		} else if ( $seconds >= MONTH_IN_SECONDS ) {
			if ( 'months' === $maximum_unit ) {
				$unit = 'months';
			} else {
				// automatic mode - showing days even if it's between one and three months
				$unit = 'days';
			}

		} else if ( $seconds >= DAY_IN_SECONDS - 1 ) {
			// fewer than a month - show in days
			$unit = 'days';

		} else if ( $seconds >= HOUR_IN_SECONDS - 1 ) {
			// less than 1 day - show in hours
			$unit = 'hours';

		} else if ( $seconds >= MINUTE_IN_SECONDS - 1 ) {
			// less than 1 hour - show in minutes
			$unit = 'minutes';

		} else {
			// less than 1 minute - show in seconds
			$unit = 'seconds';
		}

		$maximum_unit_index = array_search( $maximum_unit, $this->available_units );
		$unit_index = array_search( $unit, $this->available_units );

		if (
			false === $maximum_unit_index // the maximum unit parameter is automatic
			|| $unit_index > $maximum_unit_index // there is not enough seconds for even one maximum time unit
		) {
			return $unit;
		}
		return $maximum_unit;
	}

	/**
	 * Returns a time difference value in specified units.
	 *
	 * @param Integer $seconds
	 * @param String $units
	 * @return Integer|String $time_in_units
	 */
	protected function get_interval_in_units( $seconds, $units ) {
		switch ( $units ) {
			case 'years':
				$years = $seconds / YEAR_IN_SECONDS;
				$decimals = abs( round( $years, 1 ) - round( $years ) ) > 0 ? 1 : 0;
				return number_format_i18n( $years, $decimals );
			case 'months':
				return (int) ( $seconds / 60 / 60 / 24 / 30 );
			case 'days':
				return (int) ( $seconds / 60 / 60 / 24 + 1 );
			case 'hours':
				return (int) ( $seconds / 60 / 60 );
			case 'minutes':
				return (int) ( $seconds / 60 + 1 );
			default:
				return $seconds;
		}
	}

	/**
	 * Update
	 */
	function update( $new_instance, $old_instance ) {
		return $this->sanitize_instance( $new_instance );
	}

	/*
	 * Make sure that a number is within a certain range.
	 * If the number is too small it will become the possible lowest value.
	 * If the number is too large it will become the possible highest value.
	 *
	 * @param int $n The number to check.
	 * @param int $floor The lowest possible value.
	 * @param int $ceil The highest possible value.
	 */
	function sanitize_range( $n, $floor, $ceil ) {
		$n = (int) $n;
		if ( $n < $floor ) {
			$n = $floor;
		} elseif ( $n > $ceil ) {
			$n = $ceil;
		}
		return $n;
	}

	/*
	 * Sanitize an instance of this widget.
	 *
	 * Date ranges match the documentation for mktime in the php manual.
	 * @see http://php.net/manual/en/function.mktime.php#refsect1-function.mktime-parameters
	 *
	 * @uses Milestone_Widget::sanitize_range().
	 */
	function sanitize_instance( $dirty ) {
		$now = (int) current_time( 'timestamp' );

		$dirty = wp_parse_args( $dirty, array(
			'title'   => '',
			'event'   => __( 'The Big Day', 'jetpack' ),
			'unit'    => 'automatic',
			'type'    => 'until',
			'message' => __( 'The big day is here.', 'jetpack' ),
			'day'     => date( 'd', $now ),
			'month'   => date( 'm', $now ),
			'year'    => date( 'Y', $now ),
			'hour'    => 0,
			'min'     => 0,
		) );

		$allowed_tags = array(
			'a'      => array( 'title' => array(), 'href' => array(), 'target' => array() ),
			'em'     => array( 'title' => array() ),
			'strong' => array( 'title' => array() ),
		);

		$clean = array(
			'title'   => trim( strip_tags( stripslashes( $dirty['title'] ) ) ),
			'event'   => trim( strip_tags( stripslashes( $dirty['event'] ) ) ),
			'unit'    => $dirty['unit'],
			'type'    => $dirty['type'],
			'message' => wp_kses( $dirty['message'], $allowed_tags ),
			'year'    => $this->sanitize_range( $dirty['year'],  1901, 2037 ),
			'month'   => $this->sanitize_range( $dirty['month'], 1, 12 ),
			'hour'    => $this->sanitize_range( $dirty['hour'],  0, 23 ),
			'min'     => zeroise( $this->sanitize_range( $dirty['min'], 0, 59 ), 2 ),
		);

		$clean['day'] = $this->sanitize_range( $dirty['day'], 1, date( 't', mktime( 0, 0, 0, $clean['month'], 1, $clean['year'] ) ) );

		return $clean;
	}

	/**
	 * Form
	 */
	function form( $instance ) {
		$instance = $this->sanitize_instance( $instance );

		$units = array(
			'automatic' => _x( 'Automatic', 'Milestone widget: mode in which the date unit is determined automatically', 'jetpack' ),
			'years' => _x( 'Years', 'Milestone widget: mode in which the date unit is set to years', 'jetpack' ),
			'months' => _x( 'Months', 'Milestone widget: mode in which the date unit is set to months', 'jetpack' ),
			'days' => _x( 'Days', 'Milestone widget: mode in which the date unit is set to days', 'jetpack' ),
			'hours' => _x( 'Hours', 'Milestone widget: mode in which the date unit is set to hours', 'jetpack' ),
		);
		?>

	<div class="milestone-widget">
        <p>
        	<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title', 'jetpack' ); ?></label>
        	<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
        </p>

        <p>
        	<label for="<?php echo $this->get_field_id( 'event' ); ?>"><?php _e( 'Description', 'jetpack' ); ?></label>
        	<input class="widefat" id="<?php echo $this->get_field_id( 'event' ); ?>" name="<?php echo $this->get_field_name( 'event' ); ?>" type="text" value="<?php echo esc_attr( $instance['event'] ); ?>" />
        </p>

		<fieldset class="jp-ms-data-time">
			<legend><?php esc_html_e( 'Date', 'jetpack' ); ?></legend>

			<label for="<?php echo $this->get_field_id( 'month' ); ?>" class="assistive-text"><?php _e( 'Month', 'jetpack' ); ?></label>
			<select id="<?php echo $this->get_field_id( 'month' ); ?>" class="month" name="<?php echo $this->get_field_name( 'month' ); ?>"><?php
				global $wp_locale;
				for ( $i = 1; $i < 13; $i++ ) {
					$monthnum = zeroise( $i, 2 );
					echo '<option value="' . esc_attr( $monthnum ) . '"' . selected( $i, $instance['month'], false ) . '>' . $monthnum . '-' . $wp_locale->get_month_abbrev( $wp_locale->get_month( $i ) ) . '</option>';
				}
			?></select>

			<label for="<?php echo $this->get_field_id( 'day' ); ?>" class="assistive-text"><?php _e( 'Day', 'jetpack' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'day' ); ?>" class="day" name="<?php echo $this->get_field_name( 'day' ); ?>" type="text" value="<?php echo esc_attr( $instance['day'] ); ?>">,

			<label for="<?php echo $this->get_field_id( 'year' ); ?>" class="assistive-text"><?php _e( 'Year', 'jetpack' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'year' ); ?>" class="year" name="<?php echo $this->get_field_name( 'year' ); ?>" type="text" value="<?php echo esc_attr( $instance['year'] ); ?>">
		</fieldset>

		<fieldset class="jp-ms-data-time">
			<legend><?php esc_html_e( 'Time', 'jetpack' ); ?></legend>

			<label for="<?php echo $this->get_field_id( 'hour' ); ?>" class="assistive-text"><?php _e( 'Hour', 'jetpack' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'hour' ); ?>" class="hour" name="<?php echo $this->get_field_name( 'hour' ); ?>" type="text" value="<?php echo esc_attr( $instance['hour'] ); ?>">

			<label for="<?php echo $this->get_field_id( 'min' ); ?>" class="assistive-text"><?php _e( 'Minutes', 'jetpack' ); ?></label>

			<span class="time-separator">:</span>

			<input id="<?php echo $this->get_field_id( 'min' ); ?>" class="minutes" name="<?php echo $this->get_field_name( 'min' ); ?>" type="text" value="<?php echo esc_attr( $instance['min'] ); ?>">
		</fieldset>

		<fieldset class="jp-ms-data-unit">
			<legend><?php esc_html_e( 'Time Unit', 'jetpack' ); ?></legend>

			<label for="<?php echo $this->get_field_id( 'unit' ); ?>" class="assistive-text">
				<?php _e( 'Time Unit', 'jetpack' ); ?>
			</label>
			<select id="<?php echo $this->get_field_id( 'unit' ); ?>" class="unit" name="<?php echo $this->get_field_name( 'unit' ); ?>">
			<?php
				foreach ( $units as $key => $unit ) {
					echo '<option value="' . esc_attr( $key ) . '"' . selected( $key, $instance['unit'], false ) . '>' . $unit . '</option>';
				}
			?></select>
		</fieldset>

		<ul class="milestone-type">
			<li>
				<label>
					<input
						<?php checked( $instance['type'], 'until' ); ?>
						name="<?php echo esc_attr( $this->get_field_name( 'type' ) ); ?>"
						type="radio"
						value="until"
					/>
					<?php esc_html_e( 'Until your milestone', 'jetpack' ); ?>
				</label>
			</li>

			<li>
				<label>
					<input
						<?php checked( $instance['type'], 'since' ); ?>
						name="<?php echo esc_attr( $this->get_field_name( 'type' ) ); ?>"
						type="radio"
						value="since"
					/>
					<?php esc_html_e( 'Since your milestone', 'jetpack' ); ?>
				</label>
			</li>
		</ul>

		<p class="milestone-message-wrapper">
			<label for="<?php echo $this->get_field_id( 'message' ); ?>"><?php _e( 'Milestone Reached Message', 'jetpack' ); ?></label>
			<textarea id="<?php echo $this->get_field_id( 'message' ); ?>" name="<?php echo $this->get_field_name( 'message' ); ?>" class="widefat" rows="3"><?php echo esc_textarea( $instance['message'] ); ?></textarea>
		</p>
	</div>

		<?php
    }
}

<?php
/*
Plugin Name: Milestone
Description: Countdown to a specific date.
Version: 1.0
Author: Automattic
Author URI: http://automattic.com/
License: GPLv2 or later
*/

class Milestone_Widget extends WP_Widget {
	private static $dir       = null;
	private static $defaults  = null;
	private static $config_js = null;

	function __construct() {
		$widget = array(
			'classname'   => 'milestone-widget',
			'description' => __( 'Display a countdown to a certain date.' )
		);

		$control = array(
			'width' => 251, // Chrome needs a little extra room for the date fields.
		);

		parent::__construct( 'Milestone_Widget', __( 'Milestone' ), $widget, $control );

		self::$dir = trailingslashit( __DIR__ );

		add_action( 'wp_enqueue_scripts', array( __class__, 'enqueue_template' ) );
		add_action( 'admin_enqueue_scripts', array( __class__, 'enqueue_admin' ) );
		add_action( 'wp_footer', array( __class__, 'localize_script' ) );

		if ( is_active_widget( false, false, $this->id_base, true ) || is_active_widget( false, false, 'monster', true ) )
			add_action( 'wp_head', array( __class__, 'styles_template' ) );
	}

	public static function enqueue_admin( $hook_suffix ) {
		if ( 'widgets.php' == $hook_suffix ) {
			wp_enqueue_style( 'milestone-admin', plugins_url( 'style-admin.css', __FILE__ ), array(), '20111212' );
		}
	}

	public static function enqueue_template() {
		wp_enqueue_script( 'milestone', plugins_url( 'milestone.js', __FILE__ ), array( 'jquery' ), '20160520', true );
	}

	public static function styles_template() {
		global $themecolors;
		$colors = wp_parse_args( $themecolors, array(
			'bg'     => 'fff',
			'border' => 'ccc',
			'text'   => '333',
		) );
?>
<style>
.milestone-widget {
	margin-bottom: 1em;
}
.milestone-content {
	line-height: 2;
	margin-top: 5px;
	max-width: 17em;
	padding: 0;
	text-align: center;
}
.milestone-header {
	background-color: #<?php echo sanitize_hex_color_no_hash( $colors['text'] ); ?>;
	color: #<?php echo sanitize_hex_color_no_hash( $colors['bg'] ); ?>;
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
	background-color: #<?php echo sanitize_hex_color_no_hash( $colors['bg'] ); ?>;
	border: 1px solid #<?php echo sanitize_hex_color_no_hash( $colors['border'] ); ?>;
	border-top: 0;
	color: #<?php echo sanitize_hex_color_no_hash( $colors['text'] ); ?>;
	padding-bottom: 1em;
}
.milestone-message {
	padding-top: 1em
}
</style>
<?php
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

		wp_localize_script( 'milestone', 'MilestoneConfig', array(
			'instances'         => self::$config_js['instances'],
			'labels'            => self::get_interval_labels(),
			'MINUTE_IN_SECONDS' => MINUTE_IN_SECONDS,
			'HOUR_IN_SECONDS'   => HOUR_IN_SECONDS,
			'DAY_IN_SECONDS'    => DAY_IN_SECONDS,
			'WEEK_IN_SECONDS'   => WEEK_IN_SECONDS,
			'MONTH_IN_SECONDS'  => MONTH_IN_SECONDS,
			'YEAR_IN_SECONDS'   => YEAR_IN_SECONDS,
		) );
	}

	/**
	 * Widget
	 */
	function widget( $args, $instance ) {
		$instance = $this->sanitize_instance( $instance );

		$milestone = mktime( $instance['hour'], $instance['min'], 0, $instance['month'], $instance['day'], $instance['year'] );
		$now  = (int) current_time( 'timestamp' );
		$diff = (int) floor( $milestone - $now );

		$number = 0;
		$label  = '';
		$interval_labels = self::get_interval_labels();

		if ( 2 * YEAR_IN_SECONDS <= $diff ) { // more than 2 years - show in years, one decimal point
			$number = round( $diff / YEAR_IN_SECONDS, 1 );
			$label  = $interval_labels['years'];
		} else if ( 3 * MONTH_IN_SECONDS <= $diff ) { // fewer than 2 years - show in months
			$number = floor( $diff / MONTH_IN_SECONDS );
			$label  = ( 1 == $number ) ? $interval_labels['month'] : $interval_labels['months'];
		} else if ( DAY_IN_SECONDS <= $diff ) { // fewer than 3 months - show in days
			$number = floor( $diff / DAY_IN_SECONDS ) + 1;
			$label  = ( 1 == $number ) ? $interval_labels['day'] : $interval_labels['days'];
		} else if ( HOUR_IN_SECONDS <= $diff ) { // less than 1 day - show in hours
			$number = floor( $diff / HOUR_IN_SECONDS );
			$label  = ( 1 == $number ) ? $interval_labels['hour'] : $interval_labels['hours'];
		} else if ( MINUTE_IN_SECONDS <= $diff ) { // less than 1 hour - show in minutes
			$number = floor( $diff / MINUTE_IN_SECONDS ) + 1;
			$label = ( 1 == $number ) ? $interval_labels['minute'] : $interval_labels['minutes'];
		} else { // less than 1 minute - show in seconds
			$number = $diff;
			$label = ( 1 == $number ) ? $interval_labels['second'] : $interval_labels['seconds'] ;
		}

		echo $args['before_widget'];

		$title = apply_filters( 'widget_title', $instance['title'] );
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		echo '<div class="milestone-content">';

		echo '<div class="milestone-header">';
		echo '<strong class="event">' . esc_html( $instance['event'] ) . '</strong>';
		echo '<span class="date">' . esc_html( date_i18n( __( 'F jS, Y' ), $milestone ) ) . '</span>';
		echo '</div>';

		if ( 1 > $diff ) {
			/* Milestone has past. */
			echo '<div class="milestone-message">' . $instance['message'] . '</div>';
		} else {
			/* Countdown to the milestone. */
			echo '<div class="milestone-countdown">' . sprintf( __( '%1$s %2$s to go.' ),
				'<span class="difference">' . esc_html( $number ) . '</span>',
				'<span class="label">' . esc_html( $label ) . '</span>'
			) . '</div>';

			self::$config_js['instances'][] = array(
				'id'      => $args['widget_id'],
				'diff'    => $diff,
				'message' => $instance['message'],
			);
		}

		echo '</div><!--milestone-content-->';

		echo $args['after_widget'];
		if ( method_exists( 'stats_extra' ) ) {
			stats_extra( 'widget_view', 'milestone' );
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
			'event'   => __( 'The Big Day' ),
			'message' => __( 'The big day is here.' ),
			'day'     => date( 'd', $now ),
			'month'   => date( 'm', $now ),
			'year'    => date( 'Y', $now ),
			'hour'    => 0,
			'min'     => 0,
		) );

		$allowed_tags = array(
			'a'      => array( 'title' => array(), 'href' => array() ),
			'em'     => array( 'title' => array() ),
			'strong' => array( 'title' => array() ),
		);

		$clean = array(
			'title'   => trim( strip_tags( stripslashes( $dirty['title'] ) ) ),
			'event'   => trim( strip_tags( stripslashes( $dirty['event'] ) ) ),
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
		?>

	<div class="milestone-widget">
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'event' ); ?>"><?php _e( 'Event' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'event' ); ?>" name="<?php echo $this->get_field_name( 'event' ); ?>" type="text" value="<?php echo esc_attr( $instance['event'] ); ?>" />
		</p>

		<fieldset>
			<legend><?php _e( 'Date and Time' ); ?></legend>

			<label for="<?php echo $this->get_field_id( 'month' ); ?>" class="assistive-text"><?php _e( 'Month' ); ?></label>
			<select id="<?php echo $this->get_field_id( 'month' ); ?>" class="month" name="<?php echo $this->get_field_name( 'month' ); ?>">
				<?php
				global $wp_locale;
				for ( $i = 1; $i <= 12; $i++ ) {
					$monthnum = zeroise( $i, 2 );
					echo '<option value="' . esc_attr( $monthnum ) . '"' . selected( $i, $instance['month'], false ) . '>' . $monthnum . '-' . $wp_locale->get_month_abbrev( $wp_locale->get_month( $i ) ) . '</option>';
				}
				?>
			</select>

			<label for="<?php echo $this->get_field_id( 'day' ); ?>" class="assistive-text"><?php _e( 'Day' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'day' ); ?>" class="day" name="<?php echo $this->get_field_name( 'day' ); ?>" type="text" value="<?php echo esc_attr( $instance['day'] ); ?>">,

			<label for="<?php echo $this->get_field_id( 'year' ); ?>" class="assistive-text"><?php _e( 'Year' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'year' ); ?>" class="year" name="<?php echo $this->get_field_name( 'year' ); ?>" type="text" value="<?php echo esc_attr( $instance['year'] ); ?>">

			@ <label for="<?php echo $this->get_field_id( 'hour' ); ?>" class="assistive-text"><?php _e( 'Hour' ); ?></label>
			<input id="<?php echo $this->get_field_id( 'hour' ); ?>" class="hour" name="<?php echo $this->get_field_name( 'hour' ); ?>" type="text" value="<?php echo esc_attr( $instance['hour'] ); ?>">

			<label for="<?php echo $this->get_field_id( 'min' ); ?>" class="assistive-text"><?php _e( 'Minutes' ); ?></label>
			: <input id="<?php echo $this->get_field_id( 'min' ); ?>" class="minutes" name="<?php echo $this->get_field_name( 'min' ); ?>" type="text" value="<?php echo esc_attr( $instance['min'] ); ?>">
		</fieldset>

		<p>
			<label for="<?php echo $this->get_field_id( 'message' ); ?>"><?php _e( 'Message' ); ?></label>
			<textarea id="<?php echo $this->get_field_id( 'message' ); ?>" name="<?php echo $this->get_field_name( 'message' ); ?>" class="widefat"><?php echo esc_textarea( $instance['message'] ); ?></textarea>
		</p>
	</div>

		<?php
	}

	/**
	 * Cache the translations, but do it on-demand so it's
	 * not run every page load whether used or not.
	 *
	 * @return array
	 */
	public static function get_interval_labels() {
		static $labels = null;

		// Static variables can't be initialized to arrays on declaration, so we do it here:
		if ( is_null( $labels ) ) {
			$labels = array(
				'year'    => __( 'year' ),
				'years'   => __( 'years' ),
				'month'   => __( 'month' ),
				'months'  => __( 'months' ),
				'day'     => __( 'day' ),
				'days'    => __( 'days' ),
				'hour'    => __( 'hour' ),
				'hours'   => __( 'hours' ),
				'minute'  => __( 'minute' ),
				'minutes' => __( 'minutes' ),
				'second'  => __( 'second' ),
				'seconds' => __( 'seconds' ),
			);
		}

		return $labels;
	}
}

add_action( 'widgets_init', 'register_milestone_widget' );
function register_milestone_widget() {
	register_widget( 'Milestone_Widget' );
}

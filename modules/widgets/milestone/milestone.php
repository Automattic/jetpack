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
	private static $labels    = null;
	private static $defaults  = null;
	private static $config_js = null;

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
		self::$labels = array(
			'year'    => __( 'year', 'jetpack' ),
			'years'   => __( 'years', 'jetpack' ),
			'month'   => __( 'month', 'jetpack' ),
			'months'  => __( 'months', 'jetpack' ),
			'day'     => __( 'day', 'jetpack' ),
			'days'    => __( 'days', 'jetpack' ),
			'hour'    => __( 'hour', 'jetpack' ),
			'hours'   => __( 'hours', 'jetpack' ),
			'minute'  => __( 'minute', 'jetpack' ),
			'minutes' => __( 'minutes', 'jetpack' ),
			'second'  => __( 'second', 'jetpack' ),
			'seconds' => __( 'seconds', 'jetpack' ),
		);

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
		}
	}

	public static function enqueue_template() {
		wp_enqueue_script( 'milestone', self::$url . 'milestone.js', array( 'jquery' ), '20160520', true );
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
		self::$config_js['labels'] = self::$labels;
		wp_localize_script( 'milestone', 'MilestoneConfig', self::$config_js );
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

		if ( 63113852 < $diff ) { // more than 2 years - show in years, one decimal point
			$number = round( $diff / 60 / 60 / 24 / 365, 1 );
			$label  = self::$labels['years'];
		} else if ( 7775999 < $diff ) { // fewer than 2 years - show in months
			$number = floor( $diff / 60 / 60 / 24 / 30 );
			$label  = ( 1 == $number ) ? self::$labels['month'] : self::$labels['months'];
		} else if ( 86399 < $diff ) { // fewer than 3 months - show in days
			$number = floor( $diff / 60 / 60 / 24 ) + 1;
			$label  = ( 1 == $number ) ? self::$labels['day'] : self::$labels['days'];
		} else if ( 3599 < $diff ) { // less than 1 day - show in hours
			$number = floor( $diff / 60 / 60 );
			$label  = ( 1 == $number ) ? self::$labels['hour'] : self::$labels['hours'];
		} else if ( 59 < $diff ) { // less than 1 hour - show in minutes
			$number = floor( $diff / 60 ) + 1;
			$label = ( 1 == $number ) ? self::$labels['minute'] : self::$labels['minutes'];
		} else { // less than 1 minute - show in seconds
			$number = $diff;
			$label = ( 1 == $number ) ? self::$labels['second'] : self::$labels['seconds'] ;
		}

		echo $args['before_widget'];

		$title = apply_filters( 'widget_title', $instance['title'] );
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		echo '<div class="milestone-content">';

		echo '<div class="milestone-header">';
		echo '<strong class="event">' . esc_html( $instance['event'] ) . '</strong>';
		echo '<span class="date">' . esc_html( date_i18n( __( 'F jS, Y', 'jetpack' ), $milestone ) ) . '</span>';
		echo '</div>';

		if ( 1 > $diff ) {
			/* Milestone has past. */
			echo '<div class="milestone-message">' . $instance['message'] . '</div>';
		} else {
			/* Countdown to the milestone. */
			echo '<div class="milestone-countdown">' . sprintf( __( '%1$s %2$s to go.', 'jetpack' ),
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

	    /** This action is documented in modules/widgets/gravatar-profile.php */
	    do_action( 'jetpack_stats_extra', 'widget_view', 'milestone' );
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
        	<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title', 'jetpack' ); ?></label>
        	<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
        </p>

        <p>
        	<label for="<?php echo $this->get_field_id( 'event' ); ?>"><?php _e( 'Event', 'jetpack' ); ?></label>
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

		<p>
			<label for="<?php echo $this->get_field_id( 'message' ); ?>"><?php _e( 'Message', 'jetpack' ); ?></label>
			<textarea id="<?php echo $this->get_field_id( 'message' ); ?>" name="<?php echo $this->get_field_name( 'message' ); ?>" class="widefat" rows="3"><?php echo esc_textarea( $instance['message'] ); ?></textarea>
		</p>
	</div>

		<?php
    }
}

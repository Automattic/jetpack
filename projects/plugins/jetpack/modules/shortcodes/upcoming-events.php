<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Display a list of upcoming events from a calendar.
 *
 * @package automattic/jetpack
 */

/**
 * Register a upcomingevents shortcode.
 * Most of the heavy lifting done in iCalendarReader class,
 * where the icalendar_render_events() function controls the display.
 */
class Upcoming_Events_Shortcode {

	/**
	 * Register things.
	 */
	public static function init() {
		add_shortcode( 'upcomingevents', array( __CLASS__, 'shortcode' ) );
	}

	/**
	 * Register the shortcode.
	 *
	 * @param array $atts Shortcode attributes.
	 */
	public static function shortcode( $atts = array() ) {
		jetpack_require_lib( 'icalendar-reader' );
		$atts   = shortcode_atts(
			array(
				'url'    => '',
				'number' => 0,
			),
			$atts,
			'upcomingevents'
		);
		$args   = array(
			'context' => 'shortcode',
			'number'  => absint( $atts['number'] ),
		);
		$events = icalendar_render_events( $atts['url'], $args );

		if ( ! $events ) {
			$events = sprintf( '<p>%s</p>', __( 'No upcoming events', 'jetpack' ) );
		}

		return $events;
	}
}
add_action( 'plugins_loaded', array( 'Upcoming_Events_Shortcode', 'init' ), 101 );

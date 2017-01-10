<?php

/**
 * Most of the heavy lifting done in iCalendarReader class
 */
class Upcoming_Events_Shortcode {

	public static function init() {
		add_shortcode( 'upcomingevents', array( __CLASS__, 'shortcode' ) );
	}

	public static function shortcode( $atts = array() ) {
		jetpack_require_lib( 'icalendar-reader' );
		$atts   = shortcode_atts( array( 'url' => '', 'number' => 0 ), $atts, 'upcomingevents' );
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

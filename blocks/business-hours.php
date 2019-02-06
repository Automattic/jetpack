<?php
/**
 * Business Hours Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'business-hours',
	array( 'render_callback' => 'jetpack_business_hours_render' )
);

/**
 * Business Hours Block dynamic rending of the glock.
 *
 * @param array  $attributes Array containing the business hours block attributes.
 * @param string $content    String containing the business hours block content.
 *
 * @return string
 */
function jetpack_business_hours_render( $attributes, $content ) {
	global $wp_locale;

	if ( empty( $attributes['hours'] ) || ! is_array( $attributes['hours'] ) ) {
		return $content;
	}

	$start_of_week = (int) get_option( 'start_of_week', 0 );
	$time_format   = get_option( 'time_format' );
	$today         = current_time( 'D' );
	$content       = sprintf(
		'<dl class="jetpack-business-hours %s">',
		! empty( $attributes['className'] ) ? esc_attr( $attributes['className'] ) : ''
	);

	$days = array( 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' );

	if ( $start_of_week ) {
		$chunk1              = array_slice( $attributes['hours'], 0, $start_of_week );
		$chunk2              = array_slice( $attributes['hours'], $start_of_week );
		$attributes['hours'] = array_merge( $chunk2, $chunk1 );
	}

	foreach ( $attributes['hours'] as $day => $hours ) {
		$opening = strtotime( $hours['opening'] );
		$closing = strtotime( $hours['closing'] );

		$content .= '<dt class="' . esc_attr( $day ) . '">' .
			ucfirst( $wp_locale->get_weekday( array_search( $day, $days, true ) ) ) .
			'</dt>';
		$content .= '<dd class="' . esc_attr( $day ) . '">';
		if ( $hours['opening'] && $hours['closing'] ) {
			$content .= sprintf(
				/* Translators: Business opening hours info. */
				_x( 'From %1$s to %2$s', 'from business opening hour to closing hour', 'jetpack' ),
				date( $time_format, $opening ),
				date( $time_format, $closing )
			);

			if ( $today === $day ) {
				$now = strtotime( current_time( 'H:i' ) );
				if ( $now < $opening ) {
					$content .= '<br />';
					$content .= esc_html(
						sprintf(
							/* Translators: Amount of time until business opens. */
							_x( 'Opening in %s', 'Amount of time until business opens', 'jetpack' ),
							human_time_diff( $now, $opening )
						)
					);
				} elseif ( $now >= $opening && $now < $closing ) {
					$content .= '<br />';
					$content .= esc_html(
						sprintf(
							/* Translators: Amount of time until business closes. */
							_x( 'Closing in %s', 'Amount of time until business closes', 'jetpack' ),
							human_time_diff( $now, $closing )
						)
					);
				}
			}
		} else {
			$content .= esc_html__( 'CLOSED', 'jetpack' );
		}
		$content .= '</dd>';
	}

	$content .= '</dl>';

	return $content;
}

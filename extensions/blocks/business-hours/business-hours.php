<?php
/**
 * Business Hours Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/business-hours',
	array( 'render_callback' => 'jetpack_business_hours_render' )
);

/**
 * Dynamic rendering of the block.
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
		$content   .= '<dt class="' . esc_attr( $day ) . '">' .
					ucfirst( $wp_locale->get_weekday( array_search( $day, $days, true ) ) ) .
					'</dt>';
		$content   .= '<dd class="' . esc_attr( $day ) . '">';
		$days_hours = '';

		foreach ( $hours as $hour ) {
			if ( empty( $hour['opening'] ) || empty( $hour['closing'] ) ) {
				continue;
			}
			$opening     = strtotime( $hour['opening'] );
			$closing     = strtotime( $hour['closing'] );
			$days_hours .= sprintf(
				/* Translators: Business opening hours info. */
				_x( 'From %1$s to %2$s', 'from business opening hour to closing hour', 'jetpack' ),
				date( $time_format, $opening ),
				date( $time_format, $closing )
			);

			if ( $today === $day ) {
				$now = strtotime( current_time( 'H:i' ) );
				if ( $now < $opening ) {
					$days_hours .= '<br />';
					$days_hours .= esc_html(
						sprintf(
							/* Translators: Amount of time until business opens. */
							_x( 'Opening in %s', 'Amount of time until business opens', 'jetpack' ),
							human_time_diff( $now, $opening )
						)
					);
				} elseif ( $now >= $opening && $now < $closing ) {
					$days_hours .= '<br />';
					$days_hours .= esc_html(
						sprintf(
							/* Translators: Amount of time until business closes. */
							_x( 'Closing in %s', 'Amount of time until business closes', 'jetpack' ),
							human_time_diff( $now, $closing )
						)
					);
				}
			}
			$days_hours .= '<br />';
		}

		if ( empty( $days_hours ) ) {
			$days_hours = esc_html__( 'Closed', 'jetpack' );
		}
		$content .= $days_hours;
		$content .= '</dd>';
	}

	$content .= '</dl>';

	/**
	 * Allows folks to filter the HTML content for the Business Hours block
	 *
	 * @since 7.1.0
	 *
	 * @param string $content The default HTML content set by `jetpack_business_hours_render`
	 * @param array $attributes Attributes generated in the block editor for the Business Hours block
	 */
	return apply_filters( 'jetpack_business_hours_content', $content, $attributes );
}

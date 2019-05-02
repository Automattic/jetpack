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
 * Get's default days / hours to render a business hour block with no data provided.
 *
 * @return array
 */
function jetpack_business_hours_get_default_days() {
	return array(
		array(
			'name'  => 'Sun',
			'hours' => array(),
		),
		array(
			'name'  => 'Mon',
			'hours' => array(
				array(
					'opening' => '09:00',
					'closing' => '17:00',
				),
			),
		),
		array(
			'name'  => 'Tue',
			'hours' => array(
				array(
					'opening' => '09:00',
					'closing' => '17:00',
				),
			),
		),
		array(
			'name'  => 'Wed',
			'hours' => array(
				array(
					'opening' => '09:00',
					'closing' => '17:00',
				),
			),
		),
		array(
			'name'  => 'Thu',
			'hours' => array(
				array(
					'opening' => '09:00',
					'closing' => '17:00',
				),
			),
		),
		array(
			'name'  => 'Fri',
			'hours' => array(
				array(
					'opening' => '09:00',
					'closing' => '17:00',
				),
			),
		),
		array(
			'name'  => 'Sat',
			'hours' => array(),
		),
	);
}

/**
 * Dynamic rendering of the block.
 *
 * @param array $attributes Array containing the business hours block attributes.
 *
 * @return string
 */
function jetpack_business_hours_render( $attributes ) {
	global $wp_locale;

	if ( empty( $attributes['days'] ) || ! is_array( $attributes['days'] ) ) {
		$attributes['days'] = jetpack_business_hours_get_default_days();
	}

	$start_of_week = (int) get_option( 'start_of_week', 0 );
	$time_format   = get_option( 'time_format' );
	$content       = sprintf(
		'<dl class="jetpack-business-hours %s">',
		! empty( $attributes['className'] ) ? esc_attr( $attributes['className'] ) : ''
	);

	$days = array( 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' );

	if ( $start_of_week ) {
		$chunk1             = array_slice( $attributes['days'], 0, $start_of_week );
		$chunk2             = array_slice( $attributes['days'], $start_of_week );
		$attributes['days'] = array_merge( $chunk2, $chunk1 );
	}

	foreach ( $attributes['days'] as $day ) {
		$content   .= '<dt class="' . esc_attr( $day['name'] ) . '">' .
					ucfirst( $wp_locale->get_weekday( array_search( $day['name'], $days, true ) ) ) .
					'</dt>';
		$content   .= '<dd class="' . esc_attr( $day['name'] ) . '">';
		$days_hours = '';

		foreach ( $day['hours'] as $hour ) {
			$opening = strtotime( $hour['opening'] );
			$closing = strtotime( $hour['closing'] );
			if ( ! $opening || ! $closing ) {
				continue;
			}
			$days_hours .= sprintf(
				/* Translators: Business opening hours info. */
				_x( 'From %1$s to %2$s', 'from business opening hour to closing hour', 'jetpack' ),
				date( $time_format, $opening ),
				date( $time_format, $closing )
			);
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

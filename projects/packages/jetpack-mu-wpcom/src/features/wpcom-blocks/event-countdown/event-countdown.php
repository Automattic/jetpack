<?php
/**
 * Event Countdown Block
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\EventCountdown;

require_once __DIR__ . '/../../../utils.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	register_block_type(
		'jetpack/event-countdown',
		array(
			'render_callback'       => __NAMESPACE__ . '\load_assets',
			'render_email_callback' => __NAMESPACE__ . '\render_email',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Load assets on frontend.
 *
 * @param array  $attr    Array containing the EventCountdown block attributes.
 * @param string $content String containing the EventCountdown block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	// A block's view assets will not be required in wp-admin.
	if ( ! is_admin() ) {
		\jetpack_mu_wpcom_enqueue_assets( 'wpcom-blocks-event-countdown-view', array( 'js', 'css' ) );
	}

	return $content;
}

/**
 * Load assets on the editor.
 */
function enqueue_block_editor_assets() {
	\jetpack_mu_wpcom_enqueue_assets( 'wpcom-blocks-event-countdown-editor', array( 'js', 'css' ) );
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_editor_assets' );

/**
 * WooCommerce Email Editor render callback. Email can't run the countdown
 * script, so render the time left at send time plus the event date.
 *
 * @param string $block_content     The saved block markup.
 * @param array  $parsed_block      The parsed block.
 * @param object $rendering_context The email rendering context.
 * @return string
 */
function render_email( $block_content, array $parsed_block, $rendering_context ) {
	if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
		return '';
	}

	$timestamp = get_email_event_timestamp( $parsed_block['attrs'] ?? array(), (string) $block_content );
	if ( null === $timestamp ) {
		return '';
	}

	$title = '';
	if ( preg_match( '/class="event-countdown__event-title"[^>]*>\s*<p>(.*?)<\/p>/s', (string) $block_content, $m ) ) {
		$title = trim( wp_strip_all_tags( $m[1] ) );
	}

	// Outlook does not inherit color into nested tables, so paint it on every cell like the engine's Text renderer.
	$email_attrs  = $parsed_block['email_attrs'] ?? array();
	$theme_styles = is_object( $rendering_context ) && method_exists( $rendering_context, 'get_theme_styles' ) ? (array) $rendering_context->get_theme_styles() : array();
	$color        = $email_attrs['color'] ?? $theme_styles['color']['text'] ?? '#000000';

	// Each line is a stacked table with cell padding for the gaps: Outlook ignores margins on <p> and tables.
	$lines     = array();
	$remaining = $timestamp - time();
	if ( $remaining > 0 ) {
		if ( $remaining >= DAY_IN_SECONDS ) {
			$count = (int) floor( $remaining / DAY_IN_SECONDS );
			$label = _nx( 'day until', 'days until', $count, 'Countdown days remaining', 'jetpack-mu-wpcom' );
		} elseif ( $remaining >= HOUR_IN_SECONDS ) {
			$count = (int) floor( $remaining / HOUR_IN_SECONDS );
			$label = _nx( 'hour until', 'hours until', $count, 'Countdown hours remaining', 'jetpack-mu-wpcom' );
		} else {
			$count = max( 1, (int) floor( $remaining / MINUTE_IN_SECONDS ) );
			$label = _nx( 'minute until', 'minutes until', $count, 'Countdown minutes remaining', 'jetpack-mu-wpcom' );
		}

		$lines[] = array( number_format_i18n( $count ), 'font-size: 56px; line-height: 56px; font-weight: 700; padding: 0 0 4px;' );
		$lines[] = array( $label, 'font-size: 14px; line-height: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 0 0 16px;' );
	}
	if ( '' !== $title ) {
		$lines[] = array( $title, 'font-size: 28px; line-height: 34px; font-weight: 700; padding: 0 0 8px;' );
	}
	$lines[] = array(
		sprintf(
			/* translators: 1: event date, 2: event time. */
			__( '%1$s at %2$s', 'jetpack-mu-wpcom' ),
			wp_date( get_option( 'date_format' ), $timestamp ),
			wp_date( get_option( 'time_format' ), $timestamp )
		),
		'font-size: 14px; line-height: 20px; padding: 0;',
	);

	$body = '';
	foreach ( $lines as $line ) {
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
		$body .= \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
			esc_html( $line[0] ),
			array(
				'width' => '100%',
				'style' => 'border-collapse: separate;',
			),
			array(
				'align' => 'center',
				'style' => 'text-align: center; mso-line-height-rule: exactly; color: ' . $color . '; ' . $line[1],
			)
		);
	}

	// The engine sets margin-top on every block after the first; core renderers add no other margin.
	$margin_style = (string) \WP_Style_Engine::compile_css( array_intersect_key( $email_attrs, array_flip( array( 'margin-top' ) ) ), '' );

	// @phan-suppress-next-line PhanUndeclaredClassMethod -- Optional WooCommerce dependency, checked with class_exists() above.
	return \Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper::render_table_wrapper(
		$body,
		array(
			'class' => 'wp-block-jetpack-event-countdown',
			'width' => '100%',
			'style' => trim( $margin_style . ' min-width: 100%; border-collapse: separate;' ),
		),
		array(
			'align' => 'center',
			'style' => 'text-align: center; word-break: break-word; color: ' . $color . '; padding: 16px 0;',
		)
	);
}

/**
 * Resolve the event time as a unix timestamp. Newer posts store `eventTimestamp`;
 * older ones only have the `eventDate` string in the saved markup.
 *
 * @param array  $attrs         Block attributes.
 * @param string $block_content The saved block markup.
 * @return int|null
 */
function get_email_event_timestamp( array $attrs, $block_content ) {
	if ( ! empty( $attrs['eventTimestamp'] ) && is_numeric( $attrs['eventTimestamp'] ) ) {
		return (int) $attrs['eventTimestamp'];
	}

	if ( ! preg_match( '/class="event-countdown__date"[^>]*>(.*?)<\/div>/s', $block_content, $m ) ) {
		return null;
	}

	$date = trim( wp_strip_all_tags( $m[1] ) );
	if ( '' === $date ) {
		return null;
	}
	if ( preg_match( '/^\d+$/', $date ) ) {
		return (int) $date;
	}

	$datetime = date_create_immutable( $date, wp_timezone() );
	return $datetime ? $datetime->getTimestamp() : null;
}

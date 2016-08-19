<?php
add_shortcode( 'twitter-timeline', 'twitter_timeline_shortcode' );

function twitter_timeline_shortcode( $atts ) {
	$default_atts = array(
		'username' => '',
		'id'       => '',
		'width'    => '450',
		'height'   => '282',
	);

	$atts = shortcode_atts( $default_atts, $atts, 'twitter-timeline' );

	$atts['username'] = preg_replace( '/[^A-Za-z0-9_]+/', '', $atts['username'] );

	if ( empty( $atts['username'] ) && ! is_numeric( $atts['id'] ) ) {
		return '<!-- ' . __( 'Must specify Twitter Timeline id or username.', 'jetpack' ) . ' -->';
	}

	$output = '<a class="twitter-timeline"';

	if ( is_numeric( $atts['width'] ) ) {
		$output .= ' data-width="' . esc_attr( $atts['width'] ) . '"';
	}
	if ( is_numeric( $atts['height'] ) ) {
		$output .= ' data-height="' . esc_attr( $atts['height'] ) . '"';
	}
	if ( is_numeric( $atts['id'] ) ) {
		$output .= ' data-widget-id="' . esc_attr( $atts['id'] ) . '"';
	}
	if ( ! empty( $atts['username'] ) ) {
		$output .= ' href="' . esc_url( 'https://twitter.com/' . $atts['username'] ) . '"';
	}

	$output .= '>';

	$output .= sprintf( __( 'Tweets by @%s', 'jetpack' ), $atts['username'] );

	$output .= '</a>';

	wp_enqueue_script( 'jetpack-twitter-timeline' );

	return $output;
}

function twitter_timeline_js() {
	if ( is_customize_preview() ) {
		wp_enqueue_script( 'jetpack-twitter-timeline' );
	}
}
add_action( 'wp_enqueue_scripts', 'twitter_timeline_js' );

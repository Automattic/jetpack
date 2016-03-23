<?php
add_shortcode( 'twitter-timeline', 'twitter_timeline_shortcode' );

function twitter_timeline_shortcode( $attr ) {

	$default_atts = array(
		'username' => '',
		'id'       => '',
		'height'   => '282',
		'width'    => '450',
	);

	$attr = shortcode_atts( $default_atts, $attr, 'twitter-timeline' );

	$attr['username'] = preg_replace( '/[^A-Za-z0-9_]+/', '', $attr['username'] );

	if ( empty( $attr['username'] ) ) {
		return '<!-- ' . __( 'Invalid Twitter Timeline username', 'jetpack' ) . ' -->';
	}

	if ( ! is_numeric( $attr['id'] ) ) {
		return '<!-- ' . __( 'Invalid Twitter Timeline id', 'jetpack' ) . ' -->';
	}

	$tweets_by = sprintf( __( 'Tweets by @%s', 'jetpack' ), $attr['username'] );
	$output    = '<a class="twitter-timeline" width="' . esc_attr( $attr['width'] ) . '" height="' . esc_attr( $attr['height'] ) . '" href="' . esc_url( 'https://twitter.com/' . $attr['username'] ) . '/" data-widget-id="' . esc_attr( $attr['id'] ) . '">' . esc_html( $tweets_by ) . '</a>';

	wp_enqueue_script( 'jetpack-twitter-timeline' );

	return $output;
}

function twitter_timeline_js() {
	if ( is_customize_preview() ) {
		wp_enqueue_script( 'jetpack-twitter-timeline' );
	}
}
add_action( 'wp_enqueue_scripts', 'twitter_timeline_js' );

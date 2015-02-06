<?php
add_shortcode( 'twitter-timeline', 'twitter_timeline_shortcode' );

function twitter_timeline_shortcode( $attr ) {

	$default_atts = array(
		'username'         => '',
		'id'               => '',
		'height'           => 282,
		'width'            => 450,

	);

	$attr = shortcode_atts( $default_atts, $attr, 'twitter-timeline' );

	if ( $attr['username'] != preg_replace( '/[^A-Za-z0-9_]+/', '', $attr['username'] ) )
		return '<!--' . __( 'Invalid username', 'jetpack' ) . '-->';

	if ( ! is_numeric( $attr['id'] ) )
		return '<!--' . __( 'Invalid id', 'jetpack' ) . '-->';

	$tweets_by = sprintf( __( 'Tweets by @%s', 'jetpack' ), $attr['username'] );
	$output = '<a class="twitter-timeline" width="' . (int)$attr['width'] . '" height="' . (int)$attr['height'] . '" href="' . esc_url( 'https://twitter.com/'. $attr['username'] ) . '" data-widget-id="' . esc_attr( $attr['id'] ) . '">' . esc_html( $tweets_by ) . '</a>';
	add_action( 'wp_footer', 'twitter_timeline_js' );

	return $output;
}

function twitter_timeline_js() {
	echo '<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>';
}

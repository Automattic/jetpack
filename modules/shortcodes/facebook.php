<?php

/**
 * Facebook embeds
 */

define( 'JETPACK_FACEBOOK_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/posts/([^/]+)?#' );
define( 'JETPACK_FACEBOOK_PHOTO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/photo.php\?([^\s]+)#' );

// Example URL: https://www.facebook.com/VenusWilliams/posts/10151647007373076 
wp_embed_register_handler( 'facebook', JETPACK_FACEBOOK_EMBED_REGEX, 'jetpack_facebook_embed_handler' );
// Photos are handled on a different endpoint; e.g. https://www.facebook.com/photo.php?fbid=10151609960150073&set=a.398410140072.163165.106666030072&type=1 
wp_embed_register_handler( 'facebook-photo', JETPACK_FACEBOOK_PHOTO_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

function jetpack_facebook_embed_handler( $matches, $attr, $url ) {
	static $did_script;

	if ( ! $did_script ) {
		$did_script = true;
		add_action( 'wp_footer', 'jetpack_facebook_add_script' ); 
	}

	return sprintf( '<fb:post href="%s"></fb:post>', esc_url( $url ) );
}

function jetpack_facebook_add_script() {
	?>
	<div id="fb-root"></div> <script>(function(d, s, id) { var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/en_US/all.js#xfbml=1"; fjs.parentNode.insertBefore(js, fjs); }(document, "script", "facebook-jssdk"));</script>
	<?php
}

add_shortcode( 'facebook', 'jetpack_facebook_shortcode_handler' );

function jetpack_facebook_shortcode_handler( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) )
		return;

	if ( ! preg_match( JETPACK_FACEBOOK_EMBED_REGEX, $atts['url'] ) && ! preg_match( JETPACK_FACEBOOK_PHOTO_EMBED_REGEX, $atts['url'] ) )
		return;

	return $wp_embed->shortcode( $atts, $atts['url'] );
}

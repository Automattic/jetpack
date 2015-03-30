<?php
/**
 * Facebook embeds
 */

define( 'JETPACK_FACEBOOK_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/(posts|photos)/([^/]+)?#' );
define( 'JETPACK_FACEBOOK_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/permalink.php\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_PHOTO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/photo.php\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_PHOTO_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/photos/([^/]+)?#' );

define( 'JETPACK_FACEBOOK_VIDEO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/video.php\?([^\s]+)#' );

// Example URL: https://www.facebook.com/VenusWilliams/posts/10151647007373076
wp_embed_register_handler( 'facebook', JETPACK_FACEBOOK_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

// Example URL: https://www.facebook.com/permalink.php?id=222622504529111&story_fbid=559431180743788
wp_embed_register_handler( 'facebook-alternate', JETPACK_FACEBOOK_ALTERNATE_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

// Photos are handled on a different endpoint; e.g. https://www.facebook.com/photo.php?fbid=10151609960150073&set=a.398410140072.163165.106666030072&type=1
wp_embed_register_handler( 'facebook-photo', JETPACK_FACEBOOK_PHOTO_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

// Photos (from pages for example) can be at
wp_embed_register_handler( 'facebook-alternate-photo', JETPACK_FACEBOOK_PHOTO_ALTERNATE_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

// Videos e.g. https://www.facebook.com/video.php?v=772471122790796
wp_embed_register_handler( 'facebook-video', JETPACK_FACEBOOK_VIDEO_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

function jetpack_facebook_embed_handler( $matches, $attr, $url ) {
	static $did_script;

	if ( ! $did_script ) {
		$did_script = true;
		add_action( 'wp_footer', 'jetpack_facebook_add_script' );
	}

	if ( false !== strpos( $url, 'video.php' ) ) {
		$embed = sprintf( '<div class="fb-video" data-allowfullscreen="true" data-href="%s"></div>', esc_url( $url ) );
	} else {
		$embed = sprintf( '<fb:post href="%s"></fb:post>', esc_url( $url ) );
	}

	// since Facebook is a faux embed, we need to load the JS SDK in the wpview embed iframe
	if ( defined( 'DOING_AJAX' ) && DOING_AJAX && ! empty( $_POST['action'] ) && 'parse-embed' == $_POST['action'] ) {
		return $embed . '<script src="//connect.facebook.net/en_US/all.js#xfbml=1"></script>';
	} else {
		return $embed;
	}
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

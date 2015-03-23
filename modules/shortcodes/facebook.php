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
wp_embed_register_handler( 'facebook-video', JETPACK_FACEBOOK_VIDEO_EMBED_REGEX, 'jetpack_facebook_video_embed_handler' );

// Note: We do not want this synced to Jetpack
function jetpack_facebook_video_embed_handler( $matches, $attr, $url ) {
	$new_embed = false;

	if ( in_array( get_current_blog_id(), array( 17722165, 16525939 ) ) ) { // binarysmash.wordpress.com, justinshrevetest.wordpress.com
		$new_embed = true;
	}

	// During F8, we want the embeds to automatically enable
	// Time stamp is for March 25 2015 at 11 PST (per Facebook's directions)
	if ( time() > 1427306400 ) {
		$new_embed = true;
	}

	// enable for a couple facebook employees so that they can see the embeds on their sites
	if ( in_array( get_current_user_id(), array( 80451174, 72167382 ) ) ) { // varunbha, mrdjenovich
		$new_embed = true;
	}

	if ( ! $new_embed ) {
		return jetpack_facebook_embed_handler( $matches, $attr, $url );
	}

	static $did_new_video_script;

	if ( ! $did_new_video_script ) {
		$did_new_video_script = true;
		add_action( 'wp_footer', 'jetpack_facebook_add_new_script' );
	}

	return sprintf(
		'<div class="fb-video" data-allowfullscreen="true" data-href="%s"></div>',
		esc_url( $url )
	);
}

function jetpack_facebook_add_new_script() {
	?>
	<div id="fb-root"></div>
	<script>(function(d, s, id) { var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/en_US/sdk/xfbml.video.js#xfbml=1&version=v2.0"; fjs.parentNode.insertBefore(js, fjs); }(document, 'script', 'facebook-jssdk'));</script>
	<?php
}

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

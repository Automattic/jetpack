<?php
/**
 * Facebook embeds
 */

define( 'JETPACK_FACEBOOK_POST_EMBED_REGEX', '#^https?://(www.)?facebook\.com/((permalink|photo).php\?([^\s]+)|([^/]+)/(posts|photos)/([^/]+)?)#' );
define( 'JETPACK_FACEBOOK_VIDEO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/(video.php\?([^\s]+)|([^/]+)/videos/([^/]+)?)#' );

/* posts and photos - /post/ oEmbed endpoint */

// Example post URL: https://www.facebook.com/VenusWilliams/posts/10151647007373076
// Example photo URL: https://www.facebook.com/AutomatticInc/photos/t.117809/149916381845320/?type=3&theater
// Example photo.php URL: https://www.facebook.com/photo.php?fbid=10151609960150073&set=a.398410140072.163165.106666030072&type=1
// Example permalink.php URL: https://www.facebook.com/permalink.php?id=222622504529111&story_fbid=559431180743788
wp_oembed_add_provider( JETPACK_FACEBOOK_POST_EMBED_REGEX, 'https://www.facebook.com/plugins/post/oembed.json', true );

/* videos - /video/ oEmbed endpoint */

// Example /videos/ URLs: https://www.facebook.com/majorlazer/videos/vb.53783138931/10152973063033932
//                        https://www.facebook.com/WhiteHouse/videos/10153398464269238/
// Example video.php URL: https://www.facebook.com/video.php?v=772471122790796
wp_oembed_add_provider( JETPACK_FACEBOOK_VIDEO_EMBED_REGEX, 'https://www.facebook.com/plugins/video/oembed.json', true );


add_shortcode( 'facebook', 'jetpack_facebook_shortcode_handler' );

function jetpack_facebook_shortcode_handler( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) )
		return;

	if ( ! preg_match( JETPACK_FACEBOOK_POST_EMBED_REGEX, $atts['url'] )
	&& ! preg_match( JETPACK_FACEBOOK_VIDEO_EMBED_REGEX, $atts['url'] ) ) {
		return;
	}

	return $wp_embed->shortcode( $atts, $atts['url'] );
}

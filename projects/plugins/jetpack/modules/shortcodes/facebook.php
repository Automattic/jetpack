<?php
/**
 * Facebook embeds
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'JETPACK_FACEBOOK_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/(posts|photos)/([^/]+)?#' );
define( 'JETPACK_FACEBOOK_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/permalink.php\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_PHOTO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/photo.php\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_PHOTO_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/photos/([^/]+)?#' );
define( 'JETPACK_FACEBOOK_VIDEO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/(?:video.php|watch\/?)\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_VIDEO_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/videos/([^/]+)?#' );

/*
 * Example URL: https://www.facebook.com/VenusWilliams/posts/10151647007373076
 */
wp_embed_register_handler( 'facebook', JETPACK_FACEBOOK_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

/*
 * Example URL: https://www.facebook.com/permalink.php?id=222622504529111&story_fbid=559431180743788
 */
wp_embed_register_handler( 'facebook-alternate', JETPACK_FACEBOOK_ALTERNATE_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

/*
 * Photos are handled on a different endpoint; e.g. https://www.facebook.com/photo.php?fbid=10151609960150073&set=a.398410140072.163165.106666030072&type=1
 */
wp_embed_register_handler( 'facebook-photo', JETPACK_FACEBOOK_PHOTO_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

/*
 * Photos (from pages for example) can be at
 */
wp_embed_register_handler( 'facebook-alternate-photo', JETPACK_FACEBOOK_PHOTO_ALTERNATE_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

/*
 * Videos
 *
 * Formats:
 * https://www.facebook.com/video.php?v=2836814009877992
 * https://www.facebook.com/watch/?v=2836814009877992
 */
wp_embed_register_handler( 'facebook-video', JETPACK_FACEBOOK_VIDEO_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

/*
 * Videos  https://www.facebook.com/WhiteHouse/videos/10153398464269238/
 */
wp_embed_register_handler( 'facebook-alternate-video', JETPACK_FACEBOOK_VIDEO_ALTERNATE_EMBED_REGEX, 'jetpack_facebook_embed_handler' );

/**
 * Callback to modify output of embedded Facebook posts.
 *
 * @param array  $matches Regex partial matches against the URL passed.
 * @param array  $attr    Attributes received in embed response.
 * @param string $url     Requested URL to be embedded.
 * @return string Facebook embed markup.
 */
function jetpack_facebook_embed_handler( $matches, $attr, $url ) {
	// This is a stop-gap solution until Facebook hopefully resolves this ticket
	// https://developers.facebook.com/community/threads/1675075423353415/?post_id=1675075426686748
	$extra_styles = 'style="background-color: #fff; display: inline-block;"';

	if (
		str_contains( $url, 'video.php' )
		|| str_contains( $url, '/videos/' )
		|| str_contains( $url, '/watch' )
	) {
		$embed = sprintf(
			'<div class="fb-video" data-allowfullscreen="true" data-href="%1$s" %2$s></div>',
			esc_url( $url ),
			$extra_styles
		);
	} else {
		$width = 552; // As of 01/2017, the default width of Facebook embeds when no width attribute provided.

		global $content_width;
		if ( is_numeric( $content_width ) && $content_width > 0 ) {
			$width = min( $width, $content_width );
		}

		$embed = sprintf(
			'<div class="fb-post" data-href="%1$s" data-width="%2$s" %3$s></div>',
			esc_url( $url ),
			esc_attr( $width ),
			$extra_styles
		);
	}

	// Skip rendering scripts in an AMP context.
	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return $embed;
	}

	// since Facebook is a faux embed, we need to load the JS SDK in the wpview embed iframe.
	if (
		defined( 'DOING_AJAX' )
		&& DOING_AJAX
		// No need to check for a nonce here, that's already handled by Core further up.
		&& ! empty( $_POST['action'] ) // phpcs:ignore WordPress.Security.NonceVerification.Missing
		&& 'parse-embed' === $_POST['action'] // phpcs:ignore WordPress.Security.NonceVerification.Missing
	) {
		ob_start();
		wp_scripts()->do_items( array( 'jetpack-facebook-embed' ) );
		$scripts = ob_get_clean();
		return $embed . $scripts;
	} else {
		wp_enqueue_script( 'jetpack-facebook-embed' );
		return $embed;
	}
}

/**
 * Shortcode handler.
 *
 * @param array $atts Shortcode attributes.
 */
function jetpack_facebook_shortcode_handler( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) ) {
		return;
	}

	if ( ! preg_match( JETPACK_FACEBOOK_EMBED_REGEX, $atts['url'] )
	&& ! preg_match( JETPACK_FACEBOOK_PHOTO_EMBED_REGEX, $atts['url'] )
	&& ! preg_match( JETPACK_FACEBOOK_VIDEO_EMBED_REGEX, $atts['url'] )
	&& ! preg_match( JETPACK_FACEBOOK_VIDEO_ALTERNATE_EMBED_REGEX, $atts['url'] ) ) {
		return;
	}

	return $wp_embed->shortcode( $atts, $atts['url'] );
}
add_shortcode( 'facebook', 'jetpack_facebook_shortcode_handler' );

/**
 * Embed Reversal for Facebook
 *
 * Hooked to pre_kses, converts an embed code from www.facebook.com to an oEmbeddable URL.
 *
 * @param string $content Post content.
 *
 * @return string The filtered or the original content.
 **/
function jetpack_facebook_embed_reversal( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'https://www.facebook.com/plugins/post.php' ) ) {
		return $content;
	}

	/*
	 * Sample embed code:
	 * <iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Ftechcrunch%2Fposts%2Fpfbid0997g1PXQKfyFNHNTiCgaCFevt3PRFMaUBBB9eEFPR5NsXCv8EXxBw3p9bBYezWkHl&show_text=true&width=500" width="500" height="504" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
	 */

	$regexes   = array();
	$regexes[] = '#<iframe[^>]+?src="((?:https?:)?//(?:www\.)?facebook\.com/plugins/post\.php\?[^"]+)"[^>]*?>\s*?</iframe>#i';
	$regexes[] = '#&lt;iframe[^&]+?src="((?:https?:)?//(?:www\.)?facebook\.com/plugins/post\.php\?[^"]+)"[^&]*?&gt;\s*?&lt;/iframe&gt;#i';

	foreach ( $regexes as $regex ) {
		if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			if ( ! preg_match( '#(https?:)?//(?:www\.)?facebook\.com/plugins/post.php([^/]*)#i', $match[1], $url_matches ) ) {
				continue;
			}

			$src_url    = $url_matches[0];
			$parsed_url = wp_parse_url( $src_url );
			if ( empty( $parsed_url['query'] ) ) {
				continue;
			}

			$query_args = array();
			wp_parse_str( $parsed_url['query'], $query_args );
			if ( empty( $query_args['href'] ) ) {
				continue;
			}

			// Since we support Facebook via oEmbed, we simply leave a link on a line by itself.
			$replace_regex = sprintf( '#\s*%s\s*#', preg_quote( $match[0], '#' ) );
			$url           = esc_url( $query_args['href'] );

			$content = preg_replace( $replace_regex, sprintf( "\n\n%s\n\n", $url ), $content );
			/** This action is documented in modules/shortcodes/youtube.php */
			do_action( 'jetpack_embed_to_shortcode', 'facebook', $url );
		}
	}

	return $content;
}

/**
 * Embed reversal: Convert an embed code from Facebook.com to an oEmbeddable URL.
 */
if ( jetpack_shortcodes_should_hook_pre_kses() ) {
	add_filter( 'pre_kses', 'jetpack_facebook_embed_reversal' );
}

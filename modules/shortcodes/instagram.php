<?php


/**
 * Embed Reversal for Instagram
 *
 * Hooked to pre_kses, converts an embed code from Instagram.com to an oEmbeddable URL.
 * @return (string) the filtered or the original content
 **/
function jetpack_instagram_embed_reversal( $content ) {
	if ( false === stripos( $content, 'instagram.com' ) )
		return $content;

	/* Sample embed code:
		<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-version="2" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"><div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding-bottom:55%; padding-top:45%; text-align:center; width:100%;"><div style="position:relative;"><div style=" -webkit-animation:dkaXkpbBxI 1s ease-out infinite; animation:dkaXkpbBxI 1s ease-out infinite; background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-44px; width:44px;"></div><span style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:12px; font-style:normal; font-weight:bold; position:relative; top:15px;">Loading</span></div></div><p style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin:8px 0 0 0; padding:0 4px; word-wrap:break-word;"> Balloons</p><p style=" line-height:32px; margin-bottom:0; margin-top:8px; padding:0; text-align:center;"> <a href="https://instagram.com/p/r9vfPrmjeB/" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; text-decoration:none;" target="_top"> View on Instagram</a></p></div><style>@-webkit-keyframes"dkaXkpbBxI"{ 0%{opacity:0.5;} 50%{opacity:1;} 100%{opacity:0.5;} } @keyframes"dkaXkpbBxI"{ 0%{opacity:0.5;} 50%{opacity:1;} 100%{opacity:0.5;} }</style></blockquote>
		<script async defer src="https://platform.instagram.com/en_US/embeds.js"></script>
	*/

	$regexes = array();

	// new style js
	$regexes[] = '#<blockquote[^>]+?class="instagram-media"[^>](.+?)>(.+?)</blockquote><script[^>]+?src="(https?:)?//platform\.instagram\.com/(.+?)/embeds\.js"></script>#ix';

	// Let's play nice with the visual editor too.
	$regexes[] = '#&lt;blockquote(?:[^&]|&(?!gt;))+?class="instagram-media"(?:[^&]|&(?!gt;))(.+?)&gt;(.+?)&lt;/blockquote&gt;&lt;script(?:[^&]|&(?!gt;))+?src="(https?:)?//platform\.instagram\.com/(.+?)/embeds\.js"(?:[^&]|&(?!gt;))*+&gt;&lt;/script&gt;#ix';

	// old style iframe
	$regexes[] = '#<iframe[^>]+?src="(?:https?:)?//instagram\.com/p/([^"\'/]++)[^"\']*?"[^>]*+>\s*?</iframe>#i';

	// Let's play nice with the visual editor too.
	$regexes[] = '#&lt;iframe(?:[^&]|&(?!gt;))+?src="(?:https?:)?//instagram\.com/p/([^"\'/]++)[^"\']*?"(?:[^&]|&(?!gt;))*+&gt;\s*?&lt;/iframe&gt;#i';

	foreach ( $regexes as $regex ) {
		if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) )
	 		continue;

		foreach ( $matches as $match ) {
			if ( ! preg_match( '#(https?:)?//instagr(\.am|am\.com)/p/([^/]*)#i', $match[2], $url_matches ) )
				continue;

			// Since we support Instagram via oEmbed, we simply leave a link on a line by itself.
			$replace_regex = sprintf( '#\s*%s\s*#', preg_quote( $match[0], '#' ) );
			$url = esc_url( $url_matches[0] );

			$content = preg_replace( $replace_regex, sprintf( "\n\n%s\n\n", $url ), $content );
			/** This action is documented in modules/shortcodes/youtube.php */
			do_action( 'jetpack_embed_to_shortcode', 'instagram', $url );
		}
	}

	return $content;
}
add_filter( 'pre_kses', 'jetpack_instagram_embed_reversal' );


/**
 * Instagram
 */
wp_oembed_remove_provider( '#http://instagr(\.am|am\.com)/p/.*#i' ); // remove core's oEmbed support so we can override
wp_embed_register_handler( 'jetpack_instagram', '#http(s?)://instagr(\.am|am\.com)/p/([^/]*)#i', 'jetpack_instagram_handler' );

function jetpack_instagram_handler( $matches, $atts, $url ) {
	global $content_width;

	// keep a copy of the passed-in URL since it's modified below
	$passed_url = $url;

	$max_width = 698;
	$min_width = 320;

	if ( is_feed() ) {
		$media_url = sprintf( 'http://instagr.am/p/%s/media/?size=l', $matches[3] );
		return sprintf( '<a href="%s" title="%s"><img src="%s" alt="Instagram Photo" /></a>', esc_url( $url ), esc_attr__( 'View on Instagram', 'jetpack' ), esc_url( $media_url ) );
	}

	$atts = shortcode_atts( array(
		'width' => isset( $content_width ) ? $content_width : $max_width,
		'hidecaption' => false,
	), $atts );

	$atts['width'] = absint( $atts['width'] );
	if ( $atts['width'] > $max_width || $min_width > $atts['width'] )
		$atts['width'] = $max_width;


	// remove the modal param from the URL
	$url = remove_query_arg( 'modal', $url );

	// force .com instead of .am for https support
	$url = str_replace( 'instagr.am', 'instagram.com', $url );

	// The oembed endpoint expects HTTP, but HTTP requests 301 to HTTPS
	$instagram_http_url = str_replace( 'https://', 'http://', $url );
	$instagram_https_url = str_replace( 'http://', 'https://', $url );

	$url_args = array(
		'url' => $instagram_http_url,
		'maxwidth' => $atts['width'],
	);

	if ( $atts['hidecaption'] ) {
		$url_args['hidecaption'] = 'true';
	}

	$url = esc_url_raw( add_query_arg( $url_args, 'https://api.instagram.com/oembed/' ) );

	/**
	 * Filter Object Caching for response from Instagram.
	 *
	 * Allow enabling of object caching for the response sent by Instagram when querying for Instagram image HTML.
	 *
	 * @module shortcodes
	 *
	 * @since 3.3.0
	 *
	 * @param bool false Object caching is off by default.
	 * @param array $matches Array of Instagram URLs found in the post.
	 * @param array $atts Instagram Shortcode attributes.
	 * @param string $passed_url Instagram API URL.
	 */
	$response_body_use_cache = apply_filters( 'instagram_cache_oembed_api_response_body', false, $matches, $atts, $passed_url );
	$response_body = false;
	if ( $response_body_use_cache ) {
		$cache_key = 'oembed_response_body_' . md5( $url );
		$response_body = wp_cache_get( $cache_key, 'instagram_embeds' );
	}

	if ( ! $response_body ) {
		// Not using cache (default case) or cache miss
		$instagram_response = wp_remote_get( $url, array( 'redirection' => 0 ) );
		if ( is_wp_error( $instagram_response ) || 200 != $instagram_response['response']['code'] || empty( $instagram_response['body'] ) ) {
			return "<!-- instagram error: invalid instagram resource -->";
		}

		$response_body = json_decode( $instagram_response['body'] );
		if ( $response_body_use_cache ) {
			// if caching it is short-lived since this is a "Cache-Control: no-cache" resource
			wp_cache_set( $cache_key, $response_body, 'instagram_embeds', HOUR_IN_SECONDS + mt_rand( 0, HOUR_IN_SECONDS ) );
		}
	}

	if ( ! empty( $response_body->html ) ) {
		wp_enqueue_script( 'jetpack-instagram-embed', plugins_url( 'js/instagram.js', __FILE__ ), array( 'jquery' ), false, true );
		// there's a script in the response, which we strip on purpose since it's added by this ^ script
		$ig_embed = preg_replace( '@<(script)[^>]*?>.*?</\\1>@si', '', $response_body->html );
		return $ig_embed;
	}

	return '<!-- instagram error: no embed found -->';
}


// filters instagram's username format to the expected format that matches the embed handler
wp_embed_register_handler( 'jetpack_instagram_alternate_format', '#http(s?)://instagr(\.am|am\.com)/([^/]*)/p/([^/]*)#i', 'jetpack_instagram_alternate_format_handler' );
function jetpack_instagram_alternate_format_handler( $matches, $atts, $url ) {
	$url = esc_url_raw( 'https://instagram.com/p/' . $matches[4] );
	$matches[0] = $url;
	$matches[3] = $matches[4];
	unset( $matches[4] );
	return jetpack_instagram_handler( $matches, $atts, $url );
}


// [instagram url="http://instagram.com/p/PSbF9sEIGP/"]
// [instagram url="http://instagram.com/p/PSbF9sEIGP/" width="300"]
add_shortcode( 'instagram', 'jetpack_shortcode_instagram' );
function jetpack_shortcode_instagram( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) ) {
		return '';
	}

	return $wp_embed->shortcode( $atts, $atts['url'] );
}

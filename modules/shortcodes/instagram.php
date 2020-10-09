<?php
/**
 * Instagram Embeds.
 *
 * Full links: https://www.instagram.com/p/BnMOk_FFsxg/
 * https://www.instagram.com/tv/BkQjCfsBIzi/
 * [instagram url=https://www.instagram.com/p/BnMOk_FFsxg/]
 * [instagram url=https://www.instagram.com/p/BZoonmAHvHf/ width=320]
 * Embeds can be converted to a shortcode when the author does not have unfiltered_html caps:
 * <blockquote class="instagram-media" data-instgrm-captioned data-instgrm-version="2" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"><div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding-bottom:55%; padding-top:45%; text-align:center; width:100%;"><div style="position:relative;"><div style=" -webkit-animation:dkaXkpbBxI 1s ease-out infinite; animation:dkaXkpbBxI 1s ease-out infinite; background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-44px; width:44px;"></div><span style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:12px; font-style:normal; font-weight:bold; position:relative; top:15px;">Loading</span></div></div><p style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin:8px 0 0 0; padding:0 4px; word-wrap:break-word;"> Balloons</p><p style=" line-height:32px; margin-bottom:0; margin-top:8px; padding:0; text-align:center;"> <a href="https://instagram.com/p/r9vfPrmjeB/" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; text-decoration:none;" target="_top"> View on Instagram</a></p></div><style>@-webkit-keyframes"dkaXkpbBxI"{ 0%{opacity:0.5;} 50%{opacity:1;} 100%{opacity:0.5;} } @keyframes"dkaXkpbBxI"{ 0%{opacity:0.5;} 50%{opacity:1;} 100%{opacity:0.5;} }</style></blockquote>
 * <script async defer src="https://platform.instagram.com/en_US/embeds.js"></script>
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;

/**
 * Embed Reversal for Instagram
 *
 * Hooked to pre_kses, converts an embed code from Instagram.com to an oEmbeddable URL.
 *
 * @param string $content Post content.
 *
 * @return string The filtered or the original content.
 **/
function jetpack_instagram_embed_reversal( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'instagram.com' ) ) {
		return $content;
	}

	/*
	 * Sample embed code:
	 * <blockquote class="instagram-media" data-instgrm-captioned data-instgrm-version="2" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"><div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding-bottom:55%; padding-top:45%; text-align:center; width:100%;"><div style="position:relative;"><div style=" -webkit-animation:dkaXkpbBxI 1s ease-out infinite; animation:dkaXkpbBxI 1s ease-out infinite; background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-44px; width:44px;"></div><span style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:12px; font-style:normal; font-weight:bold; position:relative; top:15px;">Loading</span></div></div><p style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin:8px 0 0 0; padding:0 4px; word-wrap:break-word;"> Balloons</p><p style=" line-height:32px; margin-bottom:0; margin-top:8px; padding:0; text-align:center;"> <a href="https://instagram.com/p/r9vfPrmjeB/" style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; text-decoration:none;" target="_top"> View on Instagram</a></p></div><style>@-webkit-keyframes"dkaXkpbBxI"{ 0%{opacity:0.5;} 50%{opacity:1;} 100%{opacity:0.5;} } @keyframes"dkaXkpbBxI"{ 0%{opacity:0.5;} 50%{opacity:1;} 100%{opacity:0.5;} }</style></blockquote>
	 * <script async defer src="https://platform.instagram.com/en_US/embeds.js"></script>
	*/

	$regexes = array();

	// new style js.
	$regexes[] = '#<blockquote[^>]+?class="instagram-media"[^>].+?>(.+?)</blockquote><script[^>]+?src="(https?:)?//platform\.instagram\.com/(.+?)/embeds\.js"></script>#ix';

	// Let's play nice with the visual editor too.
	$regexes[] = '#&lt;blockquote(?:[^&]|&(?!gt;))+?class="instagram-media"(?:[^&]|&(?!gt;)).+?&gt;(.+?)&lt;/blockquote&gt;&lt;script(?:[^&]|&(?!gt;))+?src="(https?:)?//platform\.instagram\.com/(.+?)/embeds\.js"(?:[^&]|&(?!gt;))*+&gt;&lt;/script&gt;#ix';

	// old style iframe.
	$regexes[] = '#<iframe[^>]+?src="((?:https?:)?//(?:www\.)?instagram\.com/p/([^"\'/]++)[^"\']*?)"[^>]*+>\s*?</iframe>#i';

	// Let's play nice with the visual editor too.
	$regexes[] = '#&lt;iframe(?:[^&]|&(?!gt;))+?src="((?:https?:)?//(?:www\.)instagram\.com/p/([^"\'/]++)[^"\']*?)"(?:[^&]|&(?!gt;))*+&gt;\s*?&lt;/iframe&gt;#i';

	foreach ( $regexes as $regex ) {
		if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) ) {
			continue;
		}

		foreach ( $matches as $match ) {
			if ( ! preg_match( '#(https?:)?//(?:www\.)?instagr(\.am|am\.com)/p/([^/]*)#i', $match[1], $url_matches ) ) {
				continue;
			}

			// Since we support Instagram via oEmbed, we simply leave a link on a line by itself.
			$replace_regex = sprintf( '#\s*%s\s*#', preg_quote( $match[0], '#' ) );
			$url           = esc_url( $url_matches[0] );

			$content = preg_replace( $replace_regex, sprintf( "\n\n%s\n\n", $url ), $content );
			/** This action is documented in modules/shortcodes/youtube.php */
			do_action( 'jetpack_embed_to_shortcode', 'instagram', $url );
		}
	}

	return $content;
}

add_filter( 'pre_kses', 'jetpack_instagram_embed_reversal' );

/**
 * Instagram's custom Embed provider.
 * We first remove 2 different embed providers, both registered by Core.
 * - The first is the original provider,that only supports images.
 * - The second is tne new provider that replaced the first one in Core when Core added support for videos. https://core.trac.wordpress.org/changeset/44486
 *
 * Once the core embed provider is removed (one or the other, depending on your version of Core), we declare our own.
 */
wp_oembed_remove_provider( '#https?://(www\.)?instagr(\.am|am\.com)/p/.*#i' );
wp_oembed_remove_provider( '#https?://(www\.)?instagr(\.am|am\.com)/(p|tv)/.*#i' );
wp_embed_register_handler(
	'jetpack_instagram',
	'#http(s?)://(www\.)?instagr(\.am|am\.com)/(p|tv)/([^\/]*)#i',
	'jetpack_instagram_handler'
);

/**
 * Handle Instagram embeds (build embed from regex).
 *
 * @param array  $matches Array of matches from the regex.
 * @param array  $atts    The original unmodified attributes.
 * @param string $url     The original URL that was matched by the regex.
 */
function jetpack_instagram_handler( $matches, $atts, $url ) {
	global $content_width;

	$max_width = 698;
	$min_width = 320;

	if ( is_feed() ) {
		// Instagram offers direct links to images, but not to videos.
		if ( 'p' === $matches[1] ) {
			$media_url = sprintf( 'https://instagr.am/p/%1$s/media/?size=l', $matches[2] );
			return sprintf(
				'<a href="%1$s" title="%2$s" target="_blank"><img src="%3$s" alt="%4$s" /></a>',
				esc_url( $url ),
				esc_attr__( 'View on Instagram', 'jetpack' ),
				esc_url( $media_url ),
				esc_html__( 'Instagram Photo', 'jetpack' )
			);
		} elseif ( 'tv' === $matches[1] ) {
			return sprintf(
				'<a href="%1$s" title="%2$s" target="_blank">%3$s</a>',
				esc_url( $url ),
				esc_attr__( 'View on Instagram', 'jetpack' ),
				esc_html__( 'Instagram Video', 'jetpack' )
			);
		}
	}

	$atts = shortcode_atts(
		array(
			'width'       => isset( $content_width ) ? $content_width : $max_width,
			'hidecaption' => false,
		),
		$atts
	);

	$atts['width'] = absint( $atts['width'] );
	if ( $atts['width'] > $max_width ) {
		$atts['width'] = $max_width;
	} elseif ( $atts['width'] < $min_width ) {
		$atts['width'] = $min_width;
	}

	$url_args = array(
		'url'        => $url,
		'maxwidth'   => $atts['width'],
		'omitscript' => 1,
	);

	if ( $atts['hidecaption'] ) {
		$url_args['hidecaption'] = 'true';
	}

	$use_cache     = jetpack_instagram_use_cache( $matches, $atts, $url );
	$cache_key     = 'oembed_response_body_' . md5( add_query_arg( $url_args, 'https://api.instagram.com/oembed/' ) );
	$response_body = $use_cache
		? wp_cache_get( $cache_key, 'instagram_embeds' )
		: false;

	if ( ! $response_body ) {
		$response_body = jetpack_instagram_fetch_embed( $url_args );
	}

	if ( is_wp_error( $response_body ) || empty( $response_body->html ) ) {
		return jetpack_instagram_output_errored_embed( $url );
	}

	if ( $use_cache ) {
		wp_cache_set(
			$cache_key,
			$response_body,
			'instagram_embeds',
			HOUR_IN_SECONDS + wp_rand( 0, HOUR_IN_SECONDS )
		);
	}

	wp_enqueue_script(
		'jetpack-instagram-embed',
		Assets::get_file_url_for_environment( '_inc/build/shortcodes/js/instagram.min.js', 'modules/shortcodes/js/instagram.js' ),
		array( 'jquery' ),
		JETPACK__VERSION,
		true
	);

	return $response_body->html;
}

/**
 * Fetches a Facebook API access token used for query for Instagram embed information, if one is set.
 *
 * @return string The access token or ''
 */
function jetpack_instagram_get_access_token() {
	/**
	 * Filters the Instagram embed token that is used for querying the Facebook API.
	 *
	 * When this token is set, requests are not proxied through the WordPress.com API. Instead, a request is made directly to the
	 * Facebook API to query for information about the embed which should provide a performance benefit.
	 *
	 * @module shortcodes
	 *
	 * @since  9.0.0
	 *
	 * @param string string The access token set via the JETPACK_INSTAGRAM_EMBED_TOKEN constant.
	 */
	return (string) apply_filters( 'jetpack_instagram_embed_token', (string) Constants::get_constant( 'JETPACK_INSTAGRAM_EMBED_TOKEN' ) );
}

/**
 * Given a URL, will output an HTML comment and the linked URL.
 *
 * @param string $url The URL that was attempted to embed.
 *
 * @return string The linked URL to the Instagram item.
 */
function jetpack_instagram_output_errored_embed( $url ) {
	return sprintf(
		'<a href="%s">%s</a>',
		esc_url( $url ),
		esc_url_raw( $url )
	);
}

/**
 * Should the request to fetch embed information be cached?
 *
 * @param array  $matches    Array of matches from the regex.
 * @param array  $atts       The original unmodified attributes.
 * @param string $passed_url The original URL that was matched by the regex.
 *
 * @return bool
 */
function jetpack_instagram_use_cache( $matches, $atts, $passed_url ) {
	/**
	 * Filter Object Caching for response from Instagram.
	 *
	 * Allow enabling of object caching for the response sent by Instagram when querying for Instagram image HTML.
	 *
	 * @module shortcodes
	 *
	 * @since  3.3.0
	 *
	 * @param        bool        false Object caching is off by default.
	 * @param array  $matches    Array of Instagram URLs found in the post.
	 * @param array  $atts       Instagram Shortcode attributes.
	 * @param string $passed_url Instagram API URL.
	 */
	return apply_filters( 'instagram_cache_oembed_api_response_body', false, $matches, $atts, $passed_url );
}

/**
 * Handles the logic for actually fetching information for an Instagram embed, conditionally proxying the
 * request through the WordPress.com API if this is not a WordPress.com site.
 *
 * @param array $args An array of arguments to pass to the embed API.
 *
 * @return mixed An object if successful or a WP_Error object
 */
function jetpack_instagram_fetch_embed( $args ) {
	$access_token = jetpack_instagram_get_access_token();

	// Attempt to clean query params from the URL since Facebook's new API for Instagram
	// embeds does not like query parameters. See p7H4VZ-2DU-p2.
	$parsed_url = wp_parse_url( $args['url'] );
	if ( $parsed_url ) {
		$args['url'] = 'https://www.instagram.com' . $parsed_url['path'];
	}

	// If an access token exists, which will be the case for WPCOM, then we will call the Facebook API directly.
	// Otherwise, proxy the request through the WordPress.com API using the blog token to sign the request.
	if ( ! empty( $access_token ) ) {
		$args['access_token'] = $access_token;
		$url                  = esc_url_raw(
			add_query_arg(
				$args,
				'https://graph.facebook.com/v5.0/instagram_oembed/'
			)
		);
		$response             = wp_remote_get( $url, array( 'redirection' => 0 ) );

		// Unset before calling the action below.
		unset( $args['access_token'] );

		/**
		 * Fires after making a request for an Instagram embed.
		 *
		 * @module shortcodes
		 *
		 * @since  9.1.0
		 *
		 * @param array $response The response from the embed request.
		 * @param array $url      The arguments sent with the request.
		 */
		do_action( 'jetpack_instagram_embed_request', $response, $args );
	} else {
		if ( ! Jetpack::is_active_and_not_offline_mode() ) {
			return new WP_Error(
				'jetpack_not_active',
				esc_html__( 'Jetpack must be active to fetch Instagram embed', 'jetpack' )
			);
		}

		$response = Client::wpcom_json_api_request_as_blog(
			'/oembed-proxy/instagram?' . http_build_query( $args ),
			'2',
			array(),
			null,
			'wpcom'
		);
	}

	$response_body = json_decode( wp_remote_retrieve_body( $response ) );
	if (
		is_wp_error( $response )
		|| 200 !== wp_remote_retrieve_response_code( $response )
		|| empty( $response_body )
	) {
		return new WP_Error(
			'instagram_error',
			esc_html__( 'Invalid Instagram resource', 'jetpack' )
		);
	}

	return $response_body;
}

/**
 * Handle an alternate Instagram URL format, where the username is also part of the URL.
 * We do not actually need that username for the embed.
 */
wp_embed_register_handler(
	'jetpack_instagram_alternate_format',
	'#https?://(?:www\.)?instagr(?:\.am|am\.com)/(?:[^/]*)/(p|tv)/([^\/]*)#i',
	'jetpack_instagram_alternate_format_handler'
);

/**
 * Handle alternate Instagram embeds (build embed from regex).
 *
 * @param array  $matches Array of matches from the regex.
 * @param array  $atts    The original unmodified attributes.
 * @param string $url     The original URL that was matched by the regex.
 */
function jetpack_instagram_alternate_format_handler( $matches, $atts, $url ) {
	// Replace URL saved by original Instagram URL (no username).
	$matches[0] = esc_url_raw(
		sprintf(
			'https://www.instagram.com/%1$s/%2$s',
			$matches[1],
			$matches[2]
		)
	);

	return jetpack_instagram_handler( $matches, $atts, $url );
}

/**
 * Display the Instagram shortcode.
 *
 * @param array $atts Shortcode attributes.
 */
function jetpack_shortcode_instagram( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) ) {
		return '';
	}

	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		$url_pattern = '#http(s?)://(www\.)?instagr(\.am|am\.com)/p/([^/?]+)#i';
		preg_match( $url_pattern, $atts['url'], $matches );
		if ( ! $matches ) {
			return sprintf(
				'<a href="%1$s" class="amp-wp-embed-fallback">%1$s</a>',
				esc_url( $atts['url'] )
			);
		}

		$shortcode_id = end( $matches );
		$width        = ! empty( $atts['width'] ) ? $atts['width'] : 600;
		$height       = ! empty( $atts['height'] ) ? $atts['height'] : 600;
		return sprintf(
			'<amp-instagram data-shortcode="%1$s" layout="responsive" width="%2$d" height="%3$d" data-captioned></amp-instagram>',
			esc_attr( $shortcode_id ),
			absint( $width ),
			absint( $height )
		);
	}

	return $wp_embed->shortcode( $atts, $atts['url'] );
}
add_shortcode( 'instagram', 'jetpack_shortcode_instagram' );

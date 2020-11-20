<?php
/**
 * Facebook embeds
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;

define( 'JETPACK_FACEBOOK_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/(posts|photos)/([^/]+)?#' );
define( 'JETPACK_FACEBOOK_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/permalink.php\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_PHOTO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/photo.php\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_PHOTO_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/photos/([^/]+)?#' );
define( 'JETPACK_FACEBOOK_VIDEO_EMBED_REGEX', '#^https?://(www.)?facebook\.com/(?:video.php|watch\/?)\?([^\s]+)#' );
define( 'JETPACK_FACEBOOK_VIDEO_ALTERNATE_EMBED_REGEX', '#^https?://(www.)?facebook\.com/([^/]+)/videos/([^/]+)?#' );

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_action( 'init', 'jetpack_facebook_enable_embeds' );
} else {
	jetpack_facebook_enable_embeds();
}

/**
 * Register Facebook as oembed provider, and add required filters for the API request.
 * Register [facebook] shortcode.
 *
 * @since 9.2.0
 */
function jetpack_facebook_enable_embeds() {
	$facebook_oembeds = array(
		'#https?://www\.facebook\.com/.*/posts/.*#i'       => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/.*/activity/.*#i'    => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/.*/photos/.*#i'      => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/photo(s/|\.php).*#i' => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/permalink\.php.*#i'  => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/media/.*#i'          => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/questions/.*#i'      => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/notes/.*#i'          => array( 'https://graph.facebook.com/v9.0/oembed_post', true ),
		'#https?://www\.facebook\.com/.*/videos/.*#i'      => array( 'https://graph.facebook.com/v9.0/oembed_video', true ),
		'#https?://www\.facebook\.com/video\.php.*#i'      => array( 'https://graph.facebook.com/v9.0/oembed_video', true ),
	);

	foreach ( $facebook_oembeds as $pattern => $embed_data ) {
		wp_oembed_remove_provider( $pattern ); // Remove Core's oEmbed handler, if present (WP <= 5.5.2).
		wp_oembed_add_provider( $pattern, $embed_data[0], $embed_data[1] );
	}

	/**
	 * Add auth token required by Facebook's oEmbed REST API, or proxy through WP.com.
	 */
	add_filter( 'oembed_fetch_url', 'jetpack_facebook_oembed_fetch_url', 10, 2 );

	/**
	 * Add JP auth headers if we're proxying through WP.com.
	 */
	add_filter( 'oembed_remote_get_args', 'jetpack_facebook_oembed_remote_get_args', 10, 2 );

	/**
	 * Add the shortcode.
	 */
	add_shortcode( 'facebook', 'jetpack_facebook_shortcode_handler' );
}

/**
 * Add auth token required by Facebook's oEmbed REST API, or proxy through WP.com.
 *
 * @since 9.2.0
 *
 * @param string $provider URL of the oEmbed provider.
 * @param string $url      URL of the content to be embedded.
 *
 * @return string
 */
function jetpack_facebook_oembed_fetch_url( $provider, $url ) {
	if ( ! wp_startswith( $provider, 'https://graph.facebook.com/v9.0/oembed_' ) ) {
		return $provider;
	}

	// Get a set of URL and parameters supported by Facebook.
	$clean_parameters = array(); // jetpack_facebook_get_allowed_parameters( $url ); // FIXME!

	// Replace existing URL by our clean version.
	if ( ! empty( $clean_parameters['url'] ) ) {
		$provider = add_query_arg( 'url', rawurlencode( $clean_parameters['url'] ), $provider );
	}

	// Our shortcode supports the width param, but the API expects maxwidth.
	if ( ! empty( $clean_parameters['width'] ) ) {
		$provider = add_query_arg( 'maxwidth', $clean_parameters['width'], $provider );
	}

	if ( ! empty( $clean_parameters['hidecaption'] ) ) {
		$provider = add_query_arg( 'hidecaption', true, $provider );
	}

	$access_token = jetpack_facebook_get_access_token();

	if ( ! empty( $access_token ) ) {
		return add_query_arg( 'access_token', $access_token, $provider );
	}

	// If we don't have an access token, we go through the WP.com proxy instead.
	// To that end, we need to make sure that we're connected to WP.com.
	if ( ! Jetpack::is_active_and_not_offline_mode() ) {
		return $provider;
	}

	$site_id            = \Jetpack_Options::get_option( 'id' );
	$wpcom_oembed_proxy = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ) . "/oembed/1.0/sites/$site_id/proxy";
	return str_replace(
		array(
			'https://graph.facebook.com/v9.0/oembed_page',
			'https://graph.facebook.com/v9.0/oembed_post',
			'https://graph.facebook.com/v9.0/oembed_video',
		),
		$wpcom_oembed_proxy,
		$provider
	);
}

/**
 * Add JP auth headers if we're proxying through WP.com.
 *
 * @since 9.2.0
 *
 * @param array  $args oEmbed remote get arguments.
 * @param string $url  URL to be inspected.
 */
function jetpack_facebook_oembed_remote_get_args( $args, $url ) {
	if ( ! wp_startswith( $url, Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ) . '/oembed/1.0/' ) ) {
		return $args;
	}

	$method         = 'GET';
	$signed_request = Client::build_signed_request(
		compact( 'url', 'method' )
	);

	return $signed_request['request'];
}

/**
 * Fetches a Facebook API access token used for query for Facebook embed information, if one is set.
 *
 * @return string The access token or ''
 */
function jetpack_facebook_get_access_token() {
	/**
	 * Filters the Facebook embed token that is used for querying the Facebook API.
	 *
	 * When this token is set, requests are not proxied through the WordPress.com API. Instead, a request is made directly to the
	 * Facebook API to query for information about the embed which should provide a performance benefit.
	 *
	 * @module shortcodes
	 *
	 * @since  9.2.0
	 *
	 * @param string string The access token set via the JETPACK_FACEBOOK_EMBED_TOKEN constant.
	 */
	return (string) apply_filters( 'jetpack_facebook_embed_token', (string) Constants::get_constant( 'JETPACK_FACEBOOK_EMBED_TOKEN' ) );
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

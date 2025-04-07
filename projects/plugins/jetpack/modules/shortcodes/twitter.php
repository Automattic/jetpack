<?php
/**
 * Twitter/X oEmbed proxy functionality.
 *
 * This file handles proxying Twitter/X oEmbed requests through Automattic's infrastructure
 * to minimize issues with rate limiting with 404 responses from Twitter/X.
 *
 * Unlike tweet.php which handles the [tweet] shortcode, this file provides core oEmbed support
 * and is force-loaded via module-extras.php regardless of module status.
 *
 * @package automattic/jetpack
 * @since 14.5
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status;

/**
 * Update Twitter providers to use Automattic's Twitter/X oEmbed proxy.
 *
 * See paFLeq-3QD-p2.
 *
 * @param string $provider The URL of the oEmbed provider.
 *
 * @return string The modified URL of the oEmbed provider.
 */
function jetpack_proxy_twitter_oembed_provider( $provider ) {
	if ( ! wp_startswith( $provider, 'https://publish.twitter.com/oembed' ) ) {
		return $provider;
	}

	// Allow other plugins to override the proxy URL. This constant should be set on the WordPress.com side
	// to handle proxying after we're authenticated the request with the Jetpack token.
	$oembed_proxy_url = Constants::is_defined( 'JETPACK__TWITTER_OEMBED_PROXY_URL' )
		? Constants::get_constant( 'JETPACK__TWITTER_OEMBED_PROXY_URL' )
		: '';

	// If we don't have a proxy URL, then we'll try to proxy through the WordPress.com.
	// To that end, we need to make sure that we're connected to WP.com and that we're not in offline mode.
	if ( empty( $oembed_proxy_url ) ) {
		if ( ! Jetpack::is_connection_ready() || ( new Status() )->is_offline_mode() ) {
			return $provider;
		}

		$oembed_proxy_url = esc_url_raw(
			sprintf(
				'%s/wpcom/v2/oembed-proxy',
				JETPACK__WPCOM_JSON_API_BASE,
				Jetpack_Options::get_option( 'id' )
			)
		);

		add_filter( 'oembed_remote_get_args', 'jetpack_twitter_oembed_remote_get_args', 10, 2 );
	}

	return str_replace( 'https://publish.twitter.com/oembed', $oembed_proxy_url, $provider );
}
add_filter( 'oembed_fetch_url', 'jetpack_proxy_twitter_oembed_provider', 10 );

/**
 * Add JP auth headers if we're proxying through WP.com.
 *
 * @param array  $args oEmbed remote get arguments.
 * @param string $url  URL to be inspected.
 */
function jetpack_twitter_oembed_remote_get_args( $args, $url ) {
	if ( ! wp_startswith( $url, Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ) ) ) {
		return $args;
	}

	$method         = 'GET';
	$signed_request = Client::build_signed_request(
		compact( 'url', 'method' )
	);

	if ( is_wp_error( $signed_request ) ) {
		return $args;
	}

	return $signed_request['request'];
}

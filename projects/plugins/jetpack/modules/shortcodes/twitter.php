<?php // phpcs:ignore

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status;

/**
 * Update Twitter providers to use Automattic's Twitter/X oEmbed proxy.
 *
 * See https://wp.me/paFLeq-3QD.
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
				'%s/oembed/1.0/sites/%d/proxy',
				JETPACK__WPCOM_JSON_API_BASE,
				Jetpack_Options::get_option( 'id' )
			)
		);
	}

	return $oembed_proxy_url;
}
add_filter( 'oembed_fetch_url', 'jetpack_proxy_twitter_oembed_provider', 10 );

/**
 * Add JP auth headers if we're proxying through WP.com.
 *
 * @param array  $args oEmbed remote get arguments.
 * @param string $url  URL to be inspected.
 */
function jetpack_twitter_oembed_remote_get_args( $args, $url ) {
	// Only add JP auth headers if we're proxying through WP.com for a Twitter oEmbed request.
	if ( ! wp_startswith( $url, Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ) ) || ! wp_startswith( $url, 'https://publish.twitter.com/oembed' ) ) {
		return $args;
	}

	$method         = 'GET';
	$signed_request = Client::build_signed_request(
		compact( 'url', 'method' )
	);

	return $signed_request['request'];
}
add_filter( 'oembed_remote_get_args', 'jetpack_twitter_oembed_remote_get_args', 10, 2 );

<?php
/**
 * Parse.ly self-serve signup URL.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

const PARSELY_SIGNUP_URL = 'https://dash.parsely.com/self-serve';

/**
 * Build the Parse.ly self-serve signup URL with this site filled in.
 *
 * @since $$next-version$$
 *
 * @return string
 */
function parsely_signup_url() {
	$args = array_filter(
		array(
			'utm_source'     => 'jetpack',
			'publisher_name' => trim( wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) ),
			'site_domain'    => wp_parse_url( home_url(), PHP_URL_HOST ),
		),
		static fn( $value ) => is_string( $value ) && '' !== $value
	);

	return PARSELY_SIGNUP_URL . '?' . http_build_query( $args, '', '&', PHP_QUERY_RFC3986 );
}

<?php
/**
 * Where the Upgrade to Parse.ly prompts send a reader to sign up.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * The Parse.ly self-serve signup page.
 *
 * @var string
 */
const PARSELY_SIGNUP_URL = 'https://dash.parsely.com/self-serve';

/**
 * Configures the signup URL script data.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_parsely_signup_url() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_parsely_signup_url_script_data', 20 );
}

/**
 * Injects the signup URL into JetpackScriptData.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_parsely_signup_url_script_data( array $data ): array {
	if ( ! Analytics::renders_dashboard() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['parsely_signup_url'] = parsely_signup_url();

	return $data;
}

/**
 * The signup page with this site filled in: its title as the organization name and its host as
 * the site domain, the two parameters the page reads.
 *
 * @since $$next-version$$
 *
 * @return string
 */
function parsely_signup_url() {
	$args = array_filter(
		array(
			'utm_source'     => 'jetpack',
			'publisher_name' => get_bloginfo( 'name' ),
			'site_domain'    => wp_parse_url( home_url(), PHP_URL_HOST ),
		),
		function ( $value ) {
			return is_string( $value ) && '' !== $value;
		}
	);

	return PARSELY_SIGNUP_URL . '?' . http_build_query( $args, '', '&', PHP_QUERY_RFC3986 );
}

<?php
/**
 * Plugin Name: E2E Premium Analytics helper
 * Description: Fakes a Jetpack connection and answers WordPress.com Stats requests with fixtures.
 * Version: 1.0.0
 * Author: Automattic
 * License: GPLv2 or later
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\PremiumAnalytics\Enablement_Setting;

const E2E_PA_SITE_ID = 1234567;

register_activation_hook( __FILE__, 'e2e_pa_fake_connection' );

/**
 * Writes the options Jetpack reads to treat the site and its admin as connected.
 */
function e2e_pa_fake_connection() {
	Jetpack_Options::update_options(
		array(
			'id'          => E2E_PA_SITE_ID,
			'master_user' => 1,
		)
	);
	Jetpack_Options::update_option( 'blog_token', 'e2eblog.secret' );
	Jetpack_Options::update_option( 'user_tokens', array( 1 => 'e2euser.secret.1' ) );
}

// wp-cli in the container is always offline mode, which never loads connection-only modules like WordAds.
add_filter( 'jetpack_offline_mode', '__return_false', 99 );

add_filter( 'pre_http_request', 'e2e_pa_intercept_wpcom', 10, 3 );
add_filter( 'nonce_life', 'e2e_pa_nonce_life' );
add_filter( 'jetpack_premium_analytics_stats_plan_tier', 'e2e_pa_stats_tier' );
add_action( 'rest_api_init', 'e2e_pa_register_site_state_route' );

/**
 * Forces the Stats plan tier while a spec sets `e2e_pa_stats_tier`, since the mocked plans only reach the self-hosted tiers.
 *
 * @param string $tier Tier from the site's plan.
 * @return string
 */
function e2e_pa_stats_tier( $tier ) {
	$forced = get_option( 'e2e_pa_stats_tier' );
	return $forced ? $forced : $tier;
}

/**
 * Registers the route specs reset the site through: one request instead of a wp-cli process per setting.
 */
function e2e_pa_register_site_state_route() {
	register_rest_route(
		'e2e-premium-analytics/v1',
		'/site-state',
		array(
			'methods'             => 'POST',
			'callback'            => 'e2e_pa_set_site_state',
			'permission_callback' => static function () {
				return current_user_can( 'manage_options' );
			},
			'args'                => array(
				'enabled'           => array(
					'type'     => 'boolean',
					'required' => true,
				),
				'subscriptions'     => array(
					'type'     => 'boolean',
					'required' => true,
				),
				'wordads'           => array(
					'type'     => 'boolean',
					'required' => true,
				),
				'timezone'          => array(
					'type'    => 'string',
					'default' => 'UTC',
				),
				'tier'              => array(
					'type'    => 'string',
					'default' => '',
				),
				'remembered_preset' => array(
					'type'    => 'string',
					'default' => '',
				),
			),
		)
	);
}

/**
 * Puts the site in one dashboard state. The mocked plan must already be set, since WordAds activates only on a plan that includes it.
 *
 * @param WP_REST_Request $request Request with the `enabled`, `subscriptions`, `wordads`, `timezone`, `tier` and `remembered_preset` params.
 * @return WP_REST_Response|WP_Error
 */
function e2e_pa_set_site_state( $request ) {
	update_option( 'timezone_string', $request['timezone'] );
	delete_option( 'e2e_pa_stats_fault' );
	delete_option( 'e2e_pa_nonce_life' );
	if ( $request['tier'] ) {
		update_option( 'e2e_pa_stats_tier', $request['tier'] );
	} else {
		delete_option( 'e2e_pa_stats_tier' );
	}
	update_option( Enablement_Setting::ENABLED_OPTION, $request['enabled'] ? 1 : 0 );
	// The welcome dialog marks everything behind it inert, so specs start with onboarding done.
	// Do not move above the opt-in update: turning the dashboard on resets onboarding.
	$dashboard_preferences = array( Enablement_Setting::ONBOARDING_KEY => '2026-01-01T00:00:00.000Z' );
	if ( $request['remembered_preset'] ) {
		$dashboard_preferences['datePreset'] = $request['remembered_preset'];
	}
	global $wpdb;
	update_user_meta(
		get_current_user_id(),
		$wpdb->get_blog_prefix() . 'persisted_preferences',
		array(
			Enablement_Setting::PREFERENCES_SCOPE => $dashboard_preferences,
			'_modified'                           => '2026-01-01T00:00:00.000Z',
		)
	);
	Automattic\Jetpack\Current_Plan::refresh_from_wpcom();

	$modules         = array(
		'stats'         => true,
		'subscriptions' => $request['subscriptions'],
		'wordads'       => $request['wordads'],
	);
	$jetpack_modules = new Modules();
	foreach ( $modules as $module => $active ) {
		if ( $active ) {
			$jetpack_modules->activate( $module, false, false );
		} else {
			$jetpack_modules->deactivate( $module );
		}
		if ( $jetpack_modules->is_active( $module ) !== $active ) {
			return new WP_Error( 'e2e_pa_module_state', sprintf( 'The %s module did not turn %s.', $module, $active ? 'on' : 'off' ), array( 'status' => 500 ) );
		}
	}

	return rest_ensure_response( array( 'success' => true ) );
}

/**
 * Shortens nonces while a spec sets `e2e_pa_nonce_life`, so the dashboard's expires mid-session.
 *
 * @param int $life Nonce lifetime in seconds.
 * @return int
 */
function e2e_pa_nonce_life( $life ) {
	$seconds = (int) get_option( 'e2e_pa_nonce_life' );
	return $seconds > 0 ? $seconds : $life;
}

/**
 * Answers the WordPress.com requests the Premium Analytics proxy makes and blocks every other one.
 * A spec sets `e2e_pa_stats_fault` to make one Stats route fail with WordPress.com's error envelope.
 *
 * @param false|array|WP_Error $preempt Earlier short-circuit, if any.
 * @param array                $args    Request arguments.
 * @param string               $url     Request URL.
 * @return false|array|WP_Error
 */
function e2e_pa_intercept_wpcom( $preempt, $args, $url ) {
	$host = (string) wp_parse_url( $url, PHP_URL_HOST );
	if ( false !== $preempt || ! preg_match( '/(^|\.)(wordpress|wp)\.com$/', $host ) ) { // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Hostnames are lowercase.
		return $preempt;
	}

	$path  = (string) wp_parse_url( $url, PHP_URL_PATH );
	$fault = get_option( 'e2e_pa_stats_fault' );
	if ( 'public-api.wordpress.com' === $host && is_array( $fault ) && preg_match( '#/stats/' . preg_quote( $fault['route'], '#' ) . '(/|$)#', $path ) ) {
		return e2e_pa_reply(
			(int) $fault['status'],
			array(
				'error'   => $fault['error'],
				'message' => $fault['message'],
			)
		);
	}

	$query = array();
	wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
	$body = 'public-api.wordpress.com' === $host ? e2e_pa_fixture( $path, $query ) : null;

	// The tokens are fake and the site ID may be a real blog's, so nothing reaches WordPress.com.
	if ( null === $body ) {
		return new WP_Error( 'e2e_blocked', 'The E2E helper blocks WordPress.com requests it has no fixture for.' );
	}

	return e2e_pa_reply( 200, $body );
}

/**
 * Builds a WordPress.com JSON reply with the given status.
 *
 * @param int          $code HTTP status.
 * @param array|object $body Reply body.
 * @return array
 */
function e2e_pa_reply( $code, $body ) {
	return array(
		'headers'  => array( 'content-type' => 'application/json' ),
		'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		'response' => array(
			'code'    => $code,
			'message' => get_status_header_desc( $code ),
		),
		'cookies'  => array(),
		'filename' => null,
	);
}

/**
 * Finds the fixture for one WordPress.com API path. A new endpoint is one case here and one builder below.
 *
 * @param string $path  Request path.
 * @param array  $query Query args of the request.
 * @return array|object|null The reply body, or null when the path has no fixture.
 */
function e2e_pa_fixture( $path, $query ) {
	// No trailing slash: Insights also reads the Stats root.
	$stats = '/rest/v1.1/sites/' . E2E_PA_SITE_ID . '/stats';

	switch ( $path ) {
		case $stats:
			return e2e_pa_site_summary();
		case $stats . '/visits':
			return e2e_pa_visits( $query );
		case '/wpcom/v2/sites/' . E2E_PA_SITE_ID . '/jetpack-stats/usage':
			return e2e_pa_plan_usage();
	}

	// Every other Stats report answers empty.
	return 0 === strpos( $path, $stats ) ? new stdClass() : null;
}

/**
 * Builds the usage of a plan with no views limit, so the plan limit notice stays away.
 *
 * @return array
 */
function e2e_pa_plan_usage() {
	return array(
		'current_usage' => array( 'views_count' => 0 ),
		'views_limit'   => null,
	);
}

/**
 * Builds the all-time site summary. It has views, as the visits series does, so the empty Traffic widgets keep the period text.
 *
 * @return array
 */
function e2e_pa_site_summary() {
	return array( 'stats' => array( 'views' => 1000 ) );
}

/**
 * Builds a daily visits series for the requested range.
 *
 * @param array $query Query args of the Stats request.
 * @return array
 */
function e2e_pa_visits( $query ) {
	$end   = strtotime( substr( $query['date'] ?? gmdate( 'Y-m-d' ), 0, 10 ) );
	$start = isset( $query['start_date'] ) ? strtotime( substr( $query['start_date'], 0, 10 ) ) : $end - 29 * DAY_IN_SECONDS;
	$rows  = array();

	// Views equal the day of the month, so a spec can assert a range's total (August 1-7 sums to 28).
	for ( $day = $start; $day <= $end; $day += DAY_IN_SECONDS ) {
		$rows[] = array( gmdate( 'Y-m-d', $day ), gmdate( 'j', $day ), '1', 0, 0 );
	}

	return array(
		'date'   => gmdate( 'Y-m-d', $end ),
		'unit'   => 'day',
		'fields' => array( 'period', 'views', 'visitors', 'likes', 'comments' ),
		'data'   => $rows,
	);
}

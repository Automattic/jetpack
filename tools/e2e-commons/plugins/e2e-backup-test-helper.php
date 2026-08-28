<?php
/**
 * Plugin Name: Jetpack Backup E2E Helper
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Two jobs, both needed before the modernized Backup dashboard can be
 * driven from an e2e test:
 *
 * 1. Turn on the modernization filter. `Jetpack_Backup::is_modernized()`
 *    reads `rsm_jetpack_ui_modernization_backup`, which defaults to false,
 *    so without this the suite would exercise the legacy React admin page
 *    and every assertion in the Backup specs would be meaningless.
 * 2. Answer `/sites/{id}/rewind/capabilities` locally. That endpoint is
 *    the only thing `<Gates>` consults to decide whether the site has a
 *    Backup plan — it does not read the site's Jetpack plan, so
 *    `setMockPlanData()` / `e2e-plan-helper.php` (which intercept
 *    `/sites/{id}` and `/sites/{id}/wordads/status`) cannot fake it.
 *
 * Only activated by the Backup e2e suite; it is inert in every other
 * environment because nothing else turns it on.
 *
 * @package automattic/jetpack
 */

/**
 * Comma-separated rewind capabilities to answer with, e.g. `backup,scan`.
 * Absent or empty means "this site has no rewind capabilities at all",
 * which is a legitimate WPCOM answer and the one that drives the no-plan
 * gate. Interception is therefore unconditional: a spec that forgets to
 * set the option gets a deterministic no-plan answer rather than
 * whatever WordPress.com happens to say about the test site.
 */
const E2E_BACKUP_CAPABILITIES_OPTION = 'e2e_backup_capabilities';

/**
 * Number of `/rewind/capabilities` requests this helper has answered.
 *
 * Read by the specs. Without it the no-plan assertion would pass just as
 * happily against a real WordPress.com reply for a site with no Backup
 * plan — which is exactly what the e2e site is — so a mock that had
 * quietly stopped working would still look like a passing test.
 */
const E2E_BACKUP_INTERCEPT_COUNT_OPTION = 'e2e_backup_capabilities_intercepts';

add_filter( 'rsm_jetpack_ui_modernization_backup', '__return_true' );
add_filter( 'pre_http_request', 'e2e_jetpack_backup_intercept_capabilities', 3, 3 );

/**
 * Intercept the WPCOM rewind capabilities request and answer it locally.
 *
 * @param false|array|WP_Error $return result.
 * @param array                $_parsed_args not used.
 * @param string               $url request URL.
 * @return false|array|WP_Error The canned response, or $return when the URL isn't ours.
 */
function e2e_jetpack_backup_intercept_capabilities( $return, $_parsed_args, $url ) {
	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return $return;
	}

	$site_id = Jetpack_Options::get_option( 'id' );

	if ( empty( $site_id ) ) {
		return $return;
	}

	// Anchored at the end (or at a query string) so this can never also
	// swallow a longer path that starts with the same segments.
	if ( 1 !== preg_match( sprintf( '#/sites/%d/rewind/capabilities($|\?)#', $site_id ), $url ) ) {
		return $return;
	}

	update_option(
		E2E_BACKUP_INTERCEPT_COUNT_OPTION,
		(int) get_option( E2E_BACKUP_INTERCEPT_COUNT_OPTION, 0 ) + 1,
		false
	);

	return array(
		'response' => array( 'code' => 200 ),
		'body'     => wp_json_encode(
			array( 'capabilities' => e2e_jetpack_backup_capabilities() ),
			JSON_UNESCAPED_SLASHES
		),
	);
}

/**
 * The capability list to answer with, parsed out of the option.
 *
 * `array_values()` matters: `Capabilities_Bridge` refuses a body whose
 * `capabilities` key is not a numeric array, so a list with gaps in its
 * keys would reach the dashboard as an unreadable response rather than
 * as the capabilities it names.
 *
 * @return string[] Capability slugs, possibly empty.
 */
function e2e_jetpack_backup_capabilities() {
	$raw = get_option( E2E_BACKUP_CAPABILITIES_OPTION, '' );

	if ( ! is_string( $raw ) ) {
		return array();
	}

	return array_values( array_filter( array_map( 'trim', explode( ',', $raw ) ) ) );
}

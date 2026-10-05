<?php
/**
 * Plugin Name: Jetpack Backup E2E Helper
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Turns on the Backup modernization filter and answers
 * `/sites/{id}/rewind/capabilities` locally. That endpoint is the only thing `<Gates>`
 * reads to decide whether the site has a Backup plan, so `e2e-plan-helper.php` — which
 * intercepts `/sites/{id}` — cannot fake it.
 *
 * @package automattic/jetpack
 */

/**
 * Comma-separated rewind capabilities to answer with, e.g. `backup,scan`. Absent or empty
 * is a legitimate WPCOM answer and the one that drives the no-plan gate, so interception
 * is unconditional.
 */
const E2E_BACKUP_CAPABILITIES_OPTION = 'e2e_backup_capabilities';

/**
 * Number of `/rewind/capabilities` requests this helper has answered. Read by the specs,
 * because the e2e site's real plan also lacks Backup and a dead mock would still pass.
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

	// Anchored so a longer path sharing these segments is not also swallowed.
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
 * `array_values()` matters: `Capabilities_Bridge` refuses a `capabilities` key that is
 * not a numeric array.
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

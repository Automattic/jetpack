<?php
/**
 * File for various functionality which needs to be added to Simple and Atomic
 * sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

require_once __DIR__ . '/wpcom-enqueue-dynamic-script/class-wpcom-enqueue-dynamic-script.php';

/**
 * Returns ISO 639 conforming locale string.
 *
 * @param string $language a language tag to be converted e.g. "en_US".
 * @return string ISO 639 locale string e.g. "en"
 */
function get_iso_639_locale( $language ) {
	$language = strtolower( $language );

	if ( in_array( $language, array( 'pt_br', 'pt-br', 'zh_tw', 'zh-tw', 'zh_cn', 'zh-cn' ), true ) ) {
		$language = str_replace( '_', '-', $language );
	} else {
		$language = preg_replace( '/([-_].*)$/i', '', $language );
	}

	if ( empty( $language ) ) {
		return 'en';
	}

	return $language;
}

/**
 * Returns ISO 639 conforming locale string of the current user.
 *
 * @return string ISO 639 locale string e.g. "en"
 */
function determine_iso_639_locale() {
	$locale = get_user_locale();
	return get_iso_639_locale( $locale );
}

/**
 * Enqueue the tracking scripts for the given script handle.
 *
 * @param string $handle A script handle.
 */
function wpcom_enqueue_tracking_scripts( string $handle ) {
	Connection_Initial_State::render_script( $handle );

	$status            = new Status();
	$connection        = new Connection_Manager();
	$tracking          = new Tracking( 'jetpack-mu-wpcom', $connection );
	$can_use_analytics = $tracking->should_enable_tracking( new Terms_Of_Service(), $status );

	if ( $can_use_analytics ) {
		Tracking::register_tracks_functions_scripts( true );
	}
}

/**
 * Record tracks event.
 *
 * @param mixed $event_name The event.
 * @param mixed $event_properties The event property.
 *
 * @return void
 */
function wpcom_record_tracks_event( $event_name, $event_properties ) {
	if ( function_exists( 'wpcomsh_record_tracks_event' ) ) {
		wpcomsh_record_tracks_event( $event_name, $event_properties );
	} elseif ( function_exists( 'require_lib' ) && function_exists( 'tracks_record_event' ) ) {
		require_lib( 'tracks/client' );
		tracks_record_event( get_current_user_id(), $event_name, $event_properties );
	}
}

/**
 * The Calypso launch-flow URL for this site.
 *
 * @param array $args Query args to add, or to override `siteSlug` and `ref` with.
 * @return string
 */
function wpcom_get_launch_site_url( array $args = array() ): string {
	$args = array_merge(
		array(
			'siteSlug' => (string) wp_parse_url( home_url(), PHP_URL_HOST ),
			'ref'      => 'wp-admin',
		),
		$args
	);

	return add_query_arg( array_map( 'rawurlencode', $args ), 'https://wordpress.com/setup/launch-site' );
}

/**
 * The current request's URL on the site's own host, for the launch flow's `back_to`.
 *
 * Calypso drops a `back_to` unless it is https on the launched site's host, so the request host is not used.
 *
 * @return string
 */
function wpcom_get_launch_site_back_to(): string {
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '/';

	return 'https://' . wp_parse_url( home_url(), PHP_URL_HOST ) . $request_uri;
}

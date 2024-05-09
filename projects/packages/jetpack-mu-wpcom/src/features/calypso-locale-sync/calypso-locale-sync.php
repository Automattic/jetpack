<?php
/**
 * Sync Calypso locale when Admin locale is updated
 * only for wpcom_admin_interface = wp-admin and wpcom_classic_early_release = 1
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_filter(
		'profile_update',
		function ( $user_id, $old_user_data, $userdata ) {
			if ( ! $userdata['locale'] ) {
				// error_log( '>>> No locale means "Site defaults"' );
				// TODO: get the site locale (I think that's the option lang_id)
				return;
			}
			// Tried also with wpcom_json_api_request_as_user
			$response = Client::wpcom_json_api_request_as_blog(
				'/me/settings?meta=locale&force=wpcom',
				'1.1',
				array(
					'method'  => 'POST',
					'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
				),
				// TODO: locale needs to be validated because only mag-16 languages are supported in Calypso
				wp_json_encode( array( 'language' => $userdata['locale'] ) ),
				'rest'
			);
			// The requests returns {"error":"authorization_required","message":"An active access token must be used to query information about the current user."}
			// error_log( print_r( $response, true ) );
		},
		8,
		3
	);
}

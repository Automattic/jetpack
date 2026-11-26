<?php
/**
 * Enable the WebMCP origin trial for Automatticians in the block editors.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Tokens;

/**
 * Check Automattician membership for the editor's current user.
 *
 * @return bool Whether WordPress.com identifies the user as an Automattician.
 */
function webmcp_origin_trial_is_automattician() {
	if ( function_exists( 'is_automattician' ) ) {
		return (bool) is_automattician();
	}

	$user_id = get_current_user_id();
	$token   = $user_id ? ( new Tokens() )->get_access_token( $user_id ) : false;
	if ( ! $token ) {
		return false;
	}

	// A reconnect can link the same local user to a different WordPress.com account.
	$cache_key = 'jetpack_webmcp_staff_' . hash( 'sha256', $token->secret );
	$cached    = get_transient( $cache_key );
	if ( false !== $cached ) {
		return 'yes' === $cached;
	}

	$response = Client::wpcom_json_api_request_as_user( '/read/teams', '1.2', array( 'timeout' => 3 ), null, 'rest' );
	$data     = 200 === wp_remote_retrieve_response_code( $response ) ? json_decode( wp_remote_retrieve_body( $response ), true ) : array();
	$teams    = $data['teams'] ?? null;
	$is_staff = is_array( $teams ) && in_array( 'a8c', array_column( $teams, 'slug' ), true );

	set_transient( $cache_key, $is_staff ? 'yes' : 'no', 5 * MINUTE_IN_SECONDS );
	return $is_staff;
}

add_action(
	'admin_print_scripts',
	static function () {
		$screen = get_current_screen();
		if ( ! $screen || ! in_array( $screen->base, array( 'post', 'site-editor' ), true ) || ! $screen->is_block_editor() ) {
			return;
		}

		if ( ! webmcp_origin_trial_is_automattician() ) {
			return;
		}

		// Chrome validates the third-party token against the origin of this script.
		wp_print_script_tag( array( 'src' => 'https://s0.wp.com/wp-content/js/webmcp-origin-trial.js' ) );
	},
	0
);

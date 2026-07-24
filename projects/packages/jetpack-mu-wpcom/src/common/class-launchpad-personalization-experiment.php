<?php
/**
 * Resolves the wpcom_launchpad_personalization_202607_v1 experiment arm server-side.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

/**
 * Reads the launchpad-personalization arm for the current user.
 *
 * Simple sites use the native non-assigning ExPlat read; Atomic sites fetch the
 * assignment over the connected-user REST endpoint (segmentation-bounded). The result
 * is transient-cached per user for an hour, mirroring Help_Center::is_menu_panel_enabled().
 */
class Launchpad_Personalization_Experiment {

	const EXPERIMENT_NAME = 'wpcom_launchpad_personalization_202607_v1';

	/**
	 * The current user's arm: 'control', 'ai-launchpad', or 'no-guidance'.
	 *
	 * @return string
	 */
	public static function get_arm() {
		/**
		 * Overrides the resolved arm (testing / manual QA). Return one of the arm strings, or null to use ExPlat.
		 *
		 * @param string|null $override The forced arm, or null.
		 */
		$override = apply_filters( 'wpcom_launchpad_personalization_arm', null );
		if ( null !== $override ) {
			return self::normalize( $override );
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return 'control';
		}

		$cache_key = 'launchpad-personalization-arm-' . $user_id;
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return (string) $cached;
		}

		$arm = self::normalize( self::fetch_variation() );
		set_transient( $cache_key, $arm, HOUR_IN_SECONDS );

		return $arm;
	}

	/**
	 * Fetch the raw variation name from ExPlat, or null.
	 *
	 * @return string|null
	 */
	private static function fetch_variation() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			// Non-assigning read: rendering wp-admin must never create an assignment.
			if ( function_exists( '\ExPlat\get_current_user_assignment' ) ) {
				return \ExPlat\get_current_user_assignment( self::EXPERIMENT_NAME );
			}
			return null;
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return null;
		}

		// Atomic: no local ExPlat engine — ask wpcom as the connected user.
		// NOTE: confirm the platform segment ('wpcom') matches how the experiment is registered.
		$request_path = '/experiments/0.1.0/assignments/wpcom';
		$response     = Client::wpcom_json_api_request_as_user(
			add_query_arg( array( 'experiment_name' => self::EXPERIMENT_NAME ), $request_path ),
			'v2'
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( isset( $data['variations'][ self::EXPERIMENT_NAME ] ) ) {
			return $data['variations'][ self::EXPERIMENT_NAME ];
		}

		return null;
	}

	/**
	 * Map any variation onto a known arm; unknown/null becomes 'control'.
	 *
	 * @param string|null $variation The raw variation name.
	 * @return string
	 */
	private static function normalize( $variation ) {
		if ( 'ai-launchpad' === $variation || 'no-guidance' === $variation ) {
			return $variation;
		}
		return 'control';
	}
}

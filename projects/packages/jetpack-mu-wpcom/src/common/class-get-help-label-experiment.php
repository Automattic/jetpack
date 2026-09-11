<?php
/**
 * Resolves the calypso_help_center_get_help_chat_forward experiment variation server-side.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

/**
 * Reads the "Get Help" entry point label variation for the current user.
 *
 * Simple sites assign through the native ExPlat helpers; Atomic sites have no local
 * ExPlat engine and fetch the assignment over the connected-user REST endpoint. The
 * result is transient-cached per user for an hour, mirroring
 * Launchpad_Personalization_Experiment.
 */
class Get_Help_Label_Experiment {

	const EXPERIMENT_NAME = 'calypso_help_center_get_help_chat_forward';

	/**
	 * Whether the current user should see the labelled help entry point.
	 *
	 * @return bool
	 */
	public static function should_show_label() {
		return 'treatment' === self::get_variation();
	}

	/**
	 * The current user's variation: 'control' or 'treatment'.
	 *
	 * @return string
	 */
	public static function get_variation() {
		/**
		 * Overrides the resolved variation (testing / manual QA). Return a variation string, or null to use ExPlat.
		 *
		 * @param string|null $override The forced variation, or null.
		 */
		$override = apply_filters( 'wpcom_get_help_label_variation', null );
		if ( null !== $override ) {
			return self::normalize( $override );
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return 'control';
		}

		$cache_key = 'get-help-label-variation-' . $user_id;
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return (string) $cached;
		}

		$variation = self::normalize( self::fetch_variation() );
		set_transient( $cache_key, $variation, HOUR_IN_SECONDS );

		return $variation;
	}

	/**
	 * Fetch the raw variation name from ExPlat, or null.
	 *
	 * @return string|null
	 */
	private static function fetch_variation() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			// Assigning read: the experiment measures everyone who sees the entry point,
			// so rendering it is the exposure event.
			if ( function_exists( '\ExPlat\assign_current_user' ) ) {
				// The \ExPlat\ helpers live in wpcom, outside this monorepo, so Phan can't see them.
				// @phan-suppress-next-line PhanUndeclaredFunction
				return \ExPlat\assign_current_user( self::EXPERIMENT_NAME );
			}
			return null;
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return null;
		}

		// Atomic: no local ExPlat engine — ask wpcom as the connected user.
		$request_path = '/experiments/0.1.0/assignments/calypso';
		$response     = Client::wpcom_json_api_request_as_user(
			add_query_arg( array( 'experiment_names' => self::EXPERIMENT_NAME ), $request_path ),
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
	 * Map any variation onto a known value; unknown/null becomes 'control'.
	 *
	 * @param string|null $variation The raw variation name.
	 * @return string
	 */
	private static function normalize( $variation ) {
		return 'treatment' === $variation ? 'treatment' : 'control';
	}
}

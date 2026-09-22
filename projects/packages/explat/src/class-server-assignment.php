<?php
/**
 * Server-side ExPlat assignments.
 *
 * @package automattic/jetpack-explat
 */

namespace Automattic\Jetpack\ExPlat;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

/**
 * Reads an experiment's variation for the current user from PHP.
 *
 * Simple sites read from the ExPlat engine that ships with WordPress.com; Atomic sites
 * ask WordPress.com as the connected user. Either way the answer is cached per user, and
 * only once ExPlat has actually given one.
 */
class Server_Assignment {

	/**
	 * ExPlat API version used for the assignments endpoint.
	 *
	 * @var string
	 */
	const API_VERSION = '0.1.0';

	/**
	 * The current user's variation, or null when there is no answer.
	 *
	 * Pass 'assign' => true when the call itself is the exposure, i.e. the visitor is
	 * about to see the thing being tested. Leave it false to read an existing
	 * assignment without creating one.
	 *
	 * @param string $experiment_name The experiment to read.
	 * @param array  $args            'platform' ('wpcom', 'calypso' or 'jetpack'), 'assign' (bool), 'ttl' (seconds),
	 *                                'is_user_connected' (callable), and 'request' (callable).
	 * @return string|null
	 */
	public static function get_variation( $experiment_name, $args = array() ) {
		$args = array_merge(
			array(
				'platform'          => 'wpcom',
				'assign'            => false,
				'ttl'               => HOUR_IN_SECONDS,
				'is_user_connected' => null,
				'request'           => null,
			),
			$args
		);

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		$cache_key = self::get_cache_key( $experiment_name, $user_id, $args['platform'] );
		$cached    = get_transient( $cache_key );
		if ( is_string( $cached ) ) {
			return $cached;
		}

		$variation = static::fetch_variation( $experiment_name, $args );

		// No answer is not an answer: caching it would hold the user out of the
		// experiment for the whole TTL over one failed request.
		if ( null === $variation ) {
			return null;
		}

		set_transient( $cache_key, $variation, $args['ttl'] );

		return $variation;
	}

	/**
	 * Asks ExPlat for the variation, without caching.
	 *
	 * @param string $experiment_name The experiment to read.
	 * @param array  $args            As passed to get_variation().
	 * @return string|null
	 */
	protected static function fetch_variation( $experiment_name, $args ) {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return self::fetch_simple_variation( $experiment_name, (bool) $args['assign'] );
		}

		$is_user_connected = $args['is_user_connected'] ?? array( new Connection_Manager(), 'is_user_connected' );
		if ( ! call_user_func( $is_user_connected ) ) {
			return null;
		}

		$request_path = '/experiments/' . self::API_VERSION . '/assignments/' . $args['platform'];
		$request      = $args['request'] ?? array( Client::class, 'wpcom_json_api_request_as_user' );
		$response     = call_user_func(
			$request,
			add_query_arg( array( 'experiment_names' => $experiment_name ), $request_path ),
			'v2'
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		return $data['variations'][ $experiment_name ] ?? null;
	}

	/**
	 * Reads the variation from the ExPlat engine on a Simple site.
	 *
	 * @param string $experiment_name The experiment to read.
	 * @param bool   $assign          Whether to create an assignment when none exists.
	 * @return string|null
	 */
	private static function fetch_simple_variation( $experiment_name, $assign ) {
		// The \ExPlat\ helpers live in WordPress.com, outside this monorepo.
		if ( $assign ) {
			if ( ! function_exists( '\ExPlat\assign_current_user' ) ) {
				return null;
			}

			return \ExPlat\assign_current_user( $experiment_name );
		}

		if ( ! function_exists( '\ExPlat\get_current_user_assignment' ) ) {
			return null;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Missing from .phan/stubs/wpcom-stubs.php.
		return \ExPlat\get_current_user_assignment( $experiment_name );
	}

	/**
	 * Transient key for one user's assignment.
	 *
	 * @param string $experiment_name The experiment.
	 * @param int    $user_id         The user.
	 * @param string $platform        The ExPlat platform.
	 * @return string
	 */
	private static function get_cache_key( $experiment_name, $user_id, $platform ) {
		// Hashed: experiment names are long enough to overrun the option name column.
		return 'jetpack-explat-' . $platform . '-' . $user_id . '-' . md5( $experiment_name );
	}
}

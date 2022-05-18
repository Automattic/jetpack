<?php
/**
 * Dedicated Sender.
 *
 * The class is responsible for spawning dedicated Sync requests.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use WP_Error;
/**
 * Class to manage Sync spawning.
 * The purpose of this class is to provide the means to unblock Sync
 * from running in the shutdown hook of regular requests by spawning a
 * dedicated Sync request instead which will trigger Sync to run.
 */
class Dedicated_Sender {

	/**
	 * The transient name for storing the response code
	 * after spawning a dedicated sync test request.
	 */
	const DEDICATED_SYNC_CHECK_TRANSIENT = 'jetpack_sync_dedicated_sync_spawn_check';

	/**
	 * Check if this request should trigger Sync to run.
	 *
	 * @access public
	 *
	 * @return boolean True if this is a POST request and
	 * jetpack_dedicated_sync_request is set, false otherwise.
	 */
	public static function is_dedicated_sync_request() {
		$is_dedicated_sync_request = isset( $_SERVER['REQUEST_URI'] ) &&
			strpos( wp_unslash( $_SERVER['REQUEST_URI'] ), 'jetpack/v4/sync/spawn-sync' ) > 0;  // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

		return $is_dedicated_sync_request;
	}

	/**
	 * Send a request to run Sync for a certain sync queue
	 * through HTTP request that doesn't halt page loading.
	 *
	 * @access public
	 *
	 * @param Automattic\Jetpack\Sync\Queue $queue Queue object.
	 *
	 * @return boolean|WP_Error True if spawned, WP_Error otherwise.
	 */
	public static function spawn_sync( $queue ) {
		if ( ! Settings::is_dedicated_sync_enabled() ) {
			return new WP_Error( 'dedicated_sync_disabled', 'Dedicated Sync flow is disabled.' );
		}

		if ( $queue->is_locked() ) {
			return new WP_Error( 'locked_queue_' . $queue->id );
		}

		if ( $queue->size() === 0 ) {
			return new WP_Error( 'empty_queue_' . $queue->id );
		}

		// Return early if we've gotten a retry-after header response that is not expired.
		$retry_time = get_option( Actions::RETRY_AFTER_PREFIX . $queue->id );
		if ( $retry_time && $retry_time >= microtime( true ) ) {
			return new WP_Error( 'retry_after_' . $queue->id );
		}

		// Don't sync if we are throttled.
		$sync_next_time = Sender::get_instance()->get_next_sync_time( $queue->id );
		if ( $sync_next_time > microtime( true ) ) {
			return new WP_Error( 'sync_throttled_' . $queue->id );
		}

		$url  = rest_url( 'jetpack/v4/sync/spawn-sync' );
		$url  = add_query_arg( 'time', time(), $url ); // Enforce Cache busting.
		$args = array(
			'cookies'   => $_COOKIE,
			'blocking'  => false,
			'timeout'   => 0.01,
			/** This filter is documented in wp-includes/class-wp-http-streams.php */
			'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
		);

		$result = wp_remote_get( $url, $args );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Test Sync spawning functionality by making a request to the
	 * Sync spawning endpoint and storing the result (status code) in a transient.
	 *
	 * @since $$next_version$$
	 *
	 * @return bool True if we got a successful response, false otherwise.
	 */
	public static function can_spawn_dedicated_sync_request() {
		$dedicated_sync_check_transient = self::DEDICATED_SYNC_CHECK_TRANSIENT;

		$dedicated_sync_response_body = get_transient( $dedicated_sync_check_transient );

		if ( false === $dedicated_sync_response_body ) {
			$url  = rest_url( 'jetpack/v4/sync/spawn-sync' );
			$url  = add_query_arg( 'time', time(), $url ); // Enforce Cache busting.
			$args = array(
				'cookies'   => $_COOKIE,
				'timeout'   => 30,
				/** This filter is documented in wp-includes/class-wp-http-streams.php */
				'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
			);

			$response                     = wp_remote_get( $url, $args );
			$dedicated_sync_response_code = wp_remote_retrieve_response_code( $response );
			$dedicated_sync_response_body = trim( wp_remote_retrieve_body( $response ) );

			/**
			 * Limit the size of the body that we save in the transient to avoid cases where an error
			 * occurs and a whole generated HTML page is returned. We don't need to store the whole thing.
			 */
			$saved_response_body = $dedicated_sync_response_body === 'OK' ? 'OK' : time();

			set_transient( $dedicated_sync_check_transient, $saved_response_body, HOUR_IN_SECONDS );

			// Send a bit more information to WordPress.com to help debugging issues.
			if ( 'OK' !== $dedicated_sync_response_body ) {
				$data = array(
					'timestamp'      => microtime( true ),
					'response_code'  => $dedicated_sync_response_code,
					'response_body'  => $dedicated_sync_response_body,

					// Send the flow type that was attempted.
					'sync_flow_type' => 'dedicated',
				);

				$sender = Sender::get_instance();

				$sender->send_action( 'jetpack_sync_flow_error_enable', $data );
			}
		}

		return 'OK' === $dedicated_sync_response_body;
	}
}

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
	 * Validation string to check if the endpoint is working correctly.
	 *
	 * This is extracted and not hardcoded, as we might want to change it in the future.
	 */
	const DEDICATED_SYNC_VALIDATION_STRING = 'DEDICATED SYNC OK';

	/**
	 * Filter a URL to check if Dedicated Sync is enabled.
	 * We need to remove slashes and then run it through `urldecode` as sometimes the
	 * URL is in an encoded form, depending on server configuration.
	 *
	 * @param string $url The URL to filter.
	 *
	 * @return string
	 */
	public static function prepare_url_for_dedicated_request_check( $url ) {
		return urldecode( $url );
	}
	/**
	 * Check if this request should trigger Sync to run.
	 *
	 * @access public
	 *
	 * @return boolean True if this is a 'jetpack/v4/sync/spawn-sync', false otherwise.
	 */
	public static function is_dedicated_sync_request() {
		/**
		 * Check $_SERVER['REQUEST_URI'] first, to see if we're in the right context.
		 * This is done to make sure we can hook in very early in the initialization of WordPress to
		 * be able to send sync requests to the backend as fast as possible, without needing to continue
		 * loading things for the request.
		 */
		if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.NonceVerification.Recommended
		$check_url = self::prepare_url_for_dedicated_request_check( wp_unslash( $_SERVER['REQUEST_URI'] ) );
		if ( strpos( $check_url, 'jetpack/v4/sync/spawn-sync' ) !== false ) {
			return true;
		}

		/**
		 * If the above check failed, we might have an issue with detecting calls to the REST endpoint early on.
		 * Sometimes, like when permalinks are disabled, the REST path is sent via the `rest_route` GET parameter.
		 * We want to check it too, to make sure we managed to cover more cases and be more certain we actually
		 * catch calls to the endpoint.
		 */
		if ( ! isset( $_GET['rest_route'] ) ) { //phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.NonceVerification.Recommended
		$check_url = self::prepare_url_for_dedicated_request_check( wp_unslash( $_GET['rest_route'] ) );
		if ( strpos( $check_url, 'jetpack/v4/sync/spawn-sync' ) !== false ) {
			return true;
		}

		return false;
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
			 *
			 * The regexp check is done to make sure we can detect the string even if the body returns some additional
			 * output, like some caching plugins do when they try to pad the request.
			 */
			$regexp = '!' . preg_quote( self::DEDICATED_SYNC_VALIDATION_STRING, '!' ) . '!uis';
			if ( preg_match( $regexp, $dedicated_sync_response_body ) ) {
				$saved_response_body = self::DEDICATED_SYNC_VALIDATION_STRING;
			} else {
				$saved_response_body = time();
			}

			set_transient( $dedicated_sync_check_transient, $saved_response_body, HOUR_IN_SECONDS );

			// Send a bit more information to WordPress.com to help debugging issues.
			if ( $saved_response_body !== self::DEDICATED_SYNC_VALIDATION_STRING ) {
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

		return self::DEDICATED_SYNC_VALIDATION_STRING === $dedicated_sync_response_body;
	}
}

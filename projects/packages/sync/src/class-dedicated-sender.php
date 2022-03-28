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
	 * Check if this request should trigger Sync to run.
	 *
	 * @access public
	 *
	 * @return boolean True if this is a POST request and
	 * jetpack_dedicated_sync_request is set, false otherwise.
	 */
	public static function is_dedicated_sync_request() {

		$is_dedicated_sync_request = isset( $_SERVER['REQUEST_METHOD'] ) &&
			'POST' === $_SERVER['REQUEST_METHOD'] &&
			isset( $_POST['jetpack_dedicated_sync_request'] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

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

		$args = array(
			'cookies'   => $_COOKIE,
			'body'      => array(
				'jetpack_dedicated_sync_request' => 1,
			),
			'blocking'  => false,
			'timeout'   => 0.01,
			/** This filter is documented in wp-includes/class-wp-http-streams.php */
			'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
		);

		$result = wp_remote_post( site_url(), $args );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

}

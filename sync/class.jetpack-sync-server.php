<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';

/**
 * Simple version of a Jetpack Sync Server - just receives arrays of events and
 * issues them locally with the 'jetpack_sync_remote_action' action.
 */
class Jetpack_Sync_Server {
	private $codec;
	const MAX_TIME_PER_REQUEST_IN_SECONDS = 15;
	const BLOG_LOCK_TRANSIENT_PREFIX = 'jetpack_sync_request_lock_';
	const BLOG_LOCK_TRANSIENT_EXPIRY = 60;

	// this is necessary because you can't use "new" when you declare instance properties >:(
	function __construct() {
		$this->codec            = new Jetpack_Sync_Deflate_Codec();
	}

	function set_codec( iJetpack_Sync_Codec $codec ) {
		$this->codec = $codec;
	}

	function attempt_request_lock( $blog_id, $expiry = self::BLOG_LOCK_TRANSIENT_EXPIRY ) {
		$transient_name = $this->get_concurrent_request_transient_name( $blog_id );
		$locked_time = get_transient( $transient_name );
		if ( $locked_time ) {
			return false;
		}
		// for some reason set_transient isn't returning TRUE like it's supposed to...
		set_transient( $transient_name, microtime( true ), $expiry );
		return true;
	}

	private function get_concurrent_request_transient_name( $blog_id ) {
		return self::BLOG_LOCK_TRANSIENT_PREFIX.$blog_id;
	}

	function remove_request_lock( $blog_id ) {
		delete_transient( $this->get_concurrent_request_transient_name( $blog_id ) );
	}

	function receive( $data, $token = null ) {
		$start_time = microtime( true );
		if ( ! is_array( $data ) ) {
			return new WP_Error( 'action_decoder_error', 'Events must be an array' );
		}

		if ( $token && ! $this->attempt_request_lock( $token->blog_id ) ) {
			/**
			 * Fires when the server receives two concurrent requests from the same blog
			 *
			 * @since 4.1
			 *
			 * @param token The token object of the misbehaving site
			 */
			do_action( "jetpack_sync_multi_request_fail", $token );
			return new WP_Error( 'concurrent_request_error', 'There is another request running for the same blog ID' );
		}

		$events = wp_unslash( array_map( array( $this->codec, 'decode' ), $data ) );
		$events_processed = array();

		/**
		 * Fires when an array of actions are received from a remote Jetpack site
		 *
		 * @since 4.1
		 *
		 * @param array Array of actions received from the remote site
		 */
		do_action( "jetpack_sync_remote_actions", $events, $token );

		foreach ( $events as $key => $event ) {
			list( $action_name, $args, $user_id, $timestamp ) = $event;

			/**
			 * Fires when an action is received from a remote Jetpack site
			 *
			 * @since 4.1
			 *
			 * @param string $action_name The name of the action executed on the remote site
			 * @param array $args The arguments passed to the action
			 * @param int $user_id The external_user_id who did the action
			 * @param double $timestamp Timestamp (in seconds) when the action occurred
			 * @param array $token The auth token used to invoke the API
			 */
			do_action( 'jetpack_sync_remote_action', $action_name, $args, $user_id, $timestamp, $token );

			/**
			 * Fires when an action is received from a remote Jetpack site
			 *
			 * @since 4.1
			 *
			 * @param array $args The arguments passed to the action
			 * @param int $user_id The external_user_id who did the action
			 * @param double $timestamp Timestamp (in seconds) when the action occurred
			 * @param array $token The auth token used to invoke the API
			 */
			do_action( 'jetpack_sync_' . $action_name, $args, $user_id, $timestamp, $token );

			$events_processed[] = $key;

			if ( microtime( true ) - $start_time > self::MAX_TIME_PER_REQUEST_IN_SECONDS ) {
				break;
			}
		}

		if ( $token ) {
			$this->remove_request_lock( $token->blog_id );
		}

		return $events_processed;
	}
}
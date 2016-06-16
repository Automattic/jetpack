<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-deflate-codec.php';

/**
 * Simple version of a Jetpack Sync Server - just receives arrays of events and
 * issues them locally with the 'jetpack_sync_remote_action' action.
 */
class Jetpack_Sync_Server {
	private $codec;
	const MAX_TIME_PER_REQUEST_IN_SECONDS = 15;

	// this is necessary because you can't use "new" when you declare instance properties >:(
	function __construct() {
		$this->codec            = new Jetpack_Sync_Deflate_Codec();
		$this->events_processed = array();
	}

	function set_codec( iJetpack_Sync_Codec $codec ) {
		$this->codec = $codec;
	}

	function receive( $data, $token = null ) {
		$start_time = microtime( true );
		if ( ! is_array( $data ) ) {
			return new WP_Error( 'action_decoder_error', 'Events must be an array' );
		}

		$events = wp_unslash( array_map( array( $this->codec, 'decode' ), $data ) );

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

			$this->events_processed[] = $key;

			// TODO this can be improved to be more intelligent
			if ( microtime( true ) - $start_time > self::MAX_TIME_PER_REQUEST_IN_SECONDS ) {
				break;
			}
		}

		return $this->events_processed;
	}
}
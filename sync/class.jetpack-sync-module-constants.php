<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';

class Jetpack_Sync_Module_Constants extends Jetpack_Sync_Module {
	const CONSTANTS_CHECKSUM_OPTION_NAME = 'jetpack_constants_sync_checksum';
	const CONSTANTS_AWAIT_TRANSIENT_NAME = 'jetpack_sync_constants_await';

	public function name() {
		return 'constants';
	}

	public function init_listeners( $callable ) {
		add_action( 'jetpack_sync_constant', $callable, 10, 2 );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_constants', $callable );
	}

	public function init_before_send() {
		add_action( 'jetpack_sync_before_send_queue_sync', array( $this, 'maybe_sync_constants' ) );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_constants', array( $this, 'expand_constants' ) );
	}

	public function reset_data() {
		delete_option( self::CONSTANTS_CHECKSUM_OPTION_NAME );
		delete_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME );
	}

	function set_constants_whitelist( $constants ) {
		$this->constants_whitelist = $constants;
	}

	function get_constants_whitelist() {
		return Jetpack_Sync_Defaults::get_constants_whitelist();
	}

	function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		/**
		 * Tells the client to sync all constants to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand constants (should always be true)
		 */
		do_action( 'jetpack_full_sync_constants', true );

		// The number of actions enqueued, and next module state (true == done)
		return array( 1, true );
	}

	function estimate_full_sync_actions( $config ) {
		return 1;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_constants' );
	}

	function maybe_sync_constants() {
		if ( get_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME ) ) {
			return;
		}

		set_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME, microtime( true ), Jetpack_Sync_Defaults::$default_sync_constants_wait_time );

		$constants = $this->get_all_constants();
		if ( empty( $constants ) ) {
			return;
		}

		$constants_checksums = (array) get_option( self::CONSTANTS_CHECKSUM_OPTION_NAME, array() );

		foreach ( $constants as $name => $value ) {
			$checksum = $this->get_check_sum( $value );
			// explicitly not using Identical comparison as get_option returns a string
			if ( ! $this->still_valid_checksum( $constants_checksums, $name, $checksum ) && ! is_null( $value ) ) {
				/**
				 * Tells the client to sync a constant to the server
				 *
				 * @since 4.2.0
				 *
				 * @param string The name of the constant
				 * @param mixed The value of the constant
				 */
				do_action( 'jetpack_sync_constant', $name, $value );
				$constants_checksums[ $name ] = $checksum;
			} else {
				$constants_checksums[ $name ] = $checksum;
			}
		}
		update_option( self::CONSTANTS_CHECKSUM_OPTION_NAME, $constants_checksums );
	}

	// public so that we don't have to store an option for each constant
	function get_all_constants() {
		$constants_whitelist = $this->get_constants_whitelist();
		return array_combine(
			$constants_whitelist,
			array_map( array( $this, 'get_constant' ), $constants_whitelist )
		);
	}

	private function get_constant( $constant ) {
		return ( defined( $constant ) ) ?
			constant( $constant )
			: null;
	}

	public function expand_constants( $args ) {
		if ( $args[0] ) {
			return $this->get_all_constants();
		}

		return $args;
	}
}

<?php

class Jetpack_Sync_Module_Constants extends Jetpack_Sync_Module {
	const CONSTANTS_CHECKSUM_OPTION_NAME = 'jetpack_constants_sync_checksum';
	const CONSTANTS_AWAIT_TRANSIENT_NAME = 'jetpack_sync_constants_await';

	public function name() {
		return 'constants';
	}

	private $constants_whitelist;

	public function set_defaults() {
		$this->constants_whitelist = Jetpack_Sync_Defaults::$default_constants_whitelist;
	}

	public function init_listeners( $callable ) {
		add_action( 'jetpack_sync_constant', $callable, 10, 2 );

		// full sync
		add_action( 'jetpack_full_sync_constants', $callable );
	}

	public function init_before_send() {
		add_action( 'jetpack_sync_before_send', array( $this, 'maybe_sync_constants' ) );

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
		return $this->constants_whitelist;
	}

	function force_sync_constants() {
		delete_option( self::CONSTANTS_CHECKSUM_OPTION_NAME );
		delete_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME );
		$this->maybe_sync_constants();
	}

	function enqueue_full_sync_actions() {
		/**
		 * Tells the client to sync all constants to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand constants (should always be true)
		 */
		do_action( 'jetpack_full_sync_constants', true );
		remove_action( 'jetpack_sync_before_send', array( $this, 'maybe_sync_constants' ) );
		set_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME, microtime( true ), Jetpack_Sync_Defaults::$default_sync_constants_wait_time );
		return 1;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_constants' );
	}

	function maybe_sync_constants() {
		if ( get_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME ) ) {
			return;
		}

		$constants = $this->get_all_constants();
		if ( empty( $constants ) ) {
			return;
		}


		$constants_checksums = (array) get_option( self::CONSTANTS_CHECKSUM_OPTION_NAME, array() );
		if ( empty( $constants_checksums ) ) {
			$this->enqueue_full_sync_actions();
			return;
		}

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
		set_transient( self::CONSTANTS_AWAIT_TRANSIENT_NAME, microtime( true ), Jetpack_Sync_Defaults::$default_sync_constants_wait_time );
	}

	// public so that we don't have to store an option for each constant
	function get_all_constants() {
		return array_combine(
			$this->constants_whitelist,
			array_map( array( $this, 'get_constant' ), $this->constants_whitelist )
		);
	}

	private function get_constant( $constant ) {
		return ( defined( $constant ) ) ?
			constant( $constant )
			: null;
	}

	public function expand_constants( $args ) {
		if ( $args[0] ) {
				$constants = $this->get_all_constants();

				// Update the callable checksums on full sync.
				$constants_checksums = array();
				foreach ( $constants as $name => $value ) {
					$constants_checksums[ $name ] = $this->get_check_sum( $value );
				}
				update_option( self::CONSTANTS_CHECKSUM_OPTION_NAME, $constants_checksums );
				return $constants;
		}

		return $args;
	}
}

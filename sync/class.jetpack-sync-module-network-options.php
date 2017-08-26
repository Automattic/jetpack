<?php

class Jetpack_Sync_Module_Network_Options extends Jetpack_Sync_Module {

	const OPTIONS_CHECKSUM_OPTION_NAME = 'jetpack_network_options_sync_checksum';
	const OPTIONS_AWAIT_TRANSIENT_NAME = 'jetpack_sync_network_options_await';
	private $network_options_whitelist;

	public function name() {
		return 'network_options';
	}

	public function init_listeners( $callable ) {
		if ( ! is_multisite() ) {
			return;
		}

		// multi site network options
		add_action( 'jetpack_sync_network_option', $callable, 10, 2 );
		add_action( 'add_site_option', $callable, 10, 2 );
		add_action( 'update_site_option', $callable, 10, 3 );
		add_action( 'delete_site_option', $callable, 10, 1 );

		$whitelist_network_option_handler = array( $this, 'whitelist_network_options' );
		add_filter( 'jetpack_sync_before_enqueue_delete_site_option', $whitelist_network_option_handler );
		add_filter( 'jetpack_sync_before_enqueue_add_site_option', $whitelist_network_option_handler );
		add_filter( 'jetpack_sync_before_enqueue_update_site_option', $whitelist_network_option_handler );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_network_options', $callable );
	}

	public function init_before_send() {
		if ( ! is_multisite() ) {
			return;
		}

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_network_options', array(
			$this,
			'expand_network_options',
		) );

		add_action( 'jetpack_sync_before_send_queue_sync', array( $this, 'maybe_sync_network_options' ) );
	}

	function maybe_sync_network_options() {
		if ( get_site_transient( self::OPTIONS_AWAIT_TRANSIENT_NAME ) ) {
			return;
		}
		set_site_transient( self::OPTIONS_AWAIT_TRANSIENT_NAME, microtime( true ), Jetpack_Sync_Defaults::$default_sync_options_wait_time );

		$options = $this->get_all_network_options();
		if ( empty( $options ) ) {
			return;
		}

		$options_checksums = (array) get_site_option( self::OPTIONS_CHECKSUM_OPTION_NAME, array() );

		foreach ( $options as $name => $value ) {
			$checksum = $this->get_check_sum( $value );
			// explicitly not using Identical comparison as get_option returns a string
			if ( ! $this->still_valid_checksum( $options_checksums, $name, $checksum ) && ! is_null( $value ) ) {
				/**
				 * Tells the client to sync an option to the server
				 *
				 * @since 5.3.0
				 *
				 * @param string The name of the constant
				 * @param mixed The value of the constant
				 */
				do_action( 'jetpack_sync_network_option', $name, $value );
				$options_checksums[ $name ] = $checksum;
			} else {
				$options_checksums[ $name ] = $checksum;
			}
		}
		update_site_option( self::OPTIONS_CHECKSUM_OPTION_NAME, $options_checksums );
	}

	public function set_defaults() {
		$this->network_options_whitelist = Jetpack_Sync_Defaults::get_network_options_whitelist();
	}

	function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		if ( ! is_multisite() ) {
			return array( 0, true );
		}

		/**
		 * Tells the client to sync all options to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand options (should always be true)
		 */
		do_action( 'jetpack_full_sync_network_options', true );

		// The number of actions enqueued, and next module state (true == done)
		return array( 1, true );
	}

	function estimate_full_sync_actions( $config ) {
		if ( ! is_multisite() ) {
			return 0;
		}
		
		return 1;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_network_options' );
	}

	function get_all_network_options() {
		$options = array();
		foreach ( $this->network_options_whitelist as $option ) {
			$options[ $option ] = get_site_option( $option );
		}

		return $options;
	}

	function set_network_options_whitelist( $options ) {
		$this->network_options_whitelist = $options;
	}

	function get_network_options_whitelist() {

		return $this->network_options_whitelist;
	}

	// reject non-whitelisted network options
	function whitelist_network_options( $args ) {
		if ( ! $this->is_whitelisted_network_option( $args[0] ) ) {
			return false;
		}

		return $args;
	}

	function is_whitelisted_network_option( $option ) {
		return is_multisite() && in_array( $option, $this->network_options_whitelist );
	}

	public function expand_network_options( $args ) {
		if ( $args[0] ) {
			return $this->get_all_network_options();
		}

		return $args;
	}
}

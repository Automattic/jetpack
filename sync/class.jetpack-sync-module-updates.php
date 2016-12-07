<?php

class Jetpack_Sync_Module_Updates extends Jetpack_Sync_Module {

	const UPDATES_CHECKSUM_OPTION_NAME = 'jetpack_updates_sync_checksum';

	function name() {
		return 'updates';
	}

	public function init_listeners( $callable ) {

		add_action( 'set_site_transient_update_plugins', array( $this, 'validate_update_change' ), 10, 3 );
		add_action( 'set_site_transient_update_themes', array( $this, 'validate_update_change' ), 10, 3 );
		add_action( 'set_site_transient_update_core', array( $this, 'validate_update_change' ), 10, 3 );

		add_action( 'jetpack_update_plugins_change', $callable );
		add_action( 'jetpack_update_themes_change', $callable );
		add_action( 'jetpack_update_core_change', $callable );

		add_filter( 'jetpack_sync_before_enqueue_jetpack_update_plugins_change', array(
			$this,
			'filter_update_keys',
		), 10, 2 );
		add_filter( 'jetpack_sync_before_enqueue_upgrader_process_complete', array(
			$this,
			'filter_upgrader_process_complete',
		), 10, 2 );

		add_action( 'automatic_updates_complete', $callable );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_updates', $callable );
	}

	public function init_before_send() {
		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_updates', array( $this, 'expand_updates' ) );
	}

	public function get_update_checksum( $value ) {
		// Create an new array so we don't modify the object passed in.
		$a_value = (array) $value;

		// ignore `last_checked`
		unset( $a_value['last_checked'] );
		unset( $a_value['checked'] );
		if ( empty( $a_value ) ) {
			return false;
		}
		return $this->get_check_sum( $a_value );
	}

	public function validate_update_change( $value, $expiration, $transient ) {

		$new_checksum = $this->get_update_checksum( $value );
		if ( false === $new_checksum  ) {
			return;
		}

		$checksums = get_option( self::UPDATES_CHECKSUM_OPTION_NAME, array() );

		if ( isset( $checksums[ $transient ] ) && $checksums[ $transient ] === $new_checksum ) {
			return;
		}

		$checksums[ $transient ] = $new_checksum;

		update_option( self::UPDATES_CHECKSUM_OPTION_NAME, $checksums );
		// possible $transient value are update_plugins, update_themes, update_core
		do_action( "jetpack_{$transient}_change", $value );
	}

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		/**
		 * Tells the client to sync all updates to the server
		 *
		 * @since 4.2.0
		 *
		 * @param boolean Whether to expand updates (should always be true)
		 */
		do_action( 'jetpack_full_sync_updates', true );

		// The number of actions enqueued, and next module state (true == done)
		return array( 1, true );
	}

	public function estimate_full_sync_actions( $config ) {
		return 1;
	}

	function get_full_sync_actions() {
		return array( 'jetpack_full_sync_updates' );
	}

	public function get_all_updates() {
		return array(
			'core'    => get_site_transient( 'update_core' ),
			'plugins' => get_site_transient( 'update_plugins' ),
			'themes'  => get_site_transient( 'update_themes' ),
		);
	}

	// removes unnecessary keys from synced updates data
	function filter_update_keys( $args ) {
		$updates = $args[0];

		if ( isset( $updates->no_update ) ) {
			unset( $updates->no_update );
		}

		return $args;
	}

	function filter_upgrader_process_complete( $args ) {
		array_shift( $args );

		return $args;
	}

	public function expand_updates( $args ) {
		if ( $args[0] ) {
			return $this->get_all_updates();
		}

		return $args;
	}
}

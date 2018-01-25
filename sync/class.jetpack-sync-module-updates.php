<?php

class Jetpack_Sync_Module_Updates extends Jetpack_Sync_Module {

	const UPDATES_CHECKSUM_OPTION_NAME = 'jetpack_updates_sync_checksum';

	private $old_wp_version = null;

	function name() {
		return 'updates';
	}

	public function init_listeners( $callable ) {
		global $wp_version;
		$this->old_wp_version = $wp_version;

		$update_types = array( 'plugins', 'themes', 'core' );

		foreach ( $update_types as $type ) {
			add_action( "set_site_transient_update_{$type}", array( $this, 'validate_update_change' ), 10, 3 );
		}

		foreach ( $update_types as $type ) {
			add_action( "jetpack_update_{$type}_change", $callable );
		}

		foreach ( $update_types as $type ) {
			add_action( "jetpack_sync_before_enqueue_jetpack_update_{$type}_change", array( $this, "expand_before_enqueue_{$type}" ) );
		}

		add_filter( 'jetpack_sync_before_enqueue_upgrader_process_complete', array(
			$this,
			'filter_upgrader_process_complete',
		), 10, 2 );

		add_action( 'automatic_updates_complete', $callable );


		if ( is_multisite() ) {
			add_filter( 'pre_update_site_option_wpmu_upgrade_site', array ( $this, 'update_core_network_event' ), 10, 2 );
			add_action( 'jetpack_sync_core_update_network', $callable, 10, 3 );
		}

		// Send data when update completes
		add_action( '_core_updated_successfully', array( $this, 'update_core' ) );
		add_action( 'jetpack_sync_core_reinstalled_successfully', $callable );
		add_action( 'jetpack_sync_core_autoupdated_successfully', $callable, 10, 2 );
		add_action( 'jetpack_sync_core_updated_successfully', $callable, 10, 2 );

	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_updates', $callable );
	}

	public function init_before_send() {
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_updates', array( $this, 'expand_updates' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_update_themes_change', array( $this, 'expand_themes' ) );
	}

	public function update_core_network_event( $wp_db_version, $old_wp_db_version ) {
		global $wp_version;
		/**
		 * Sync event for when core wp network updates to a new db version
		 *
		 * @since 5.0.0
		 *
		 * @param int $wp_db_version the latest wp_db_version
		 * @param int $old_wp_db_version previous wp_db_version
		 * @param string $wp_version the latest wp_version
		 *
		 */
		do_action( 'jetpack_sync_core_update_network', $wp_db_version, $old_wp_db_version, $wp_version );
		return $wp_db_version;
	}

	public function update_core( $new_wp_version ) {
		global $pagenow;

		if ( isset( $_GET[ 'action' ] ) && 'do-core-reinstall' === $_GET[ 'action' ] ) {
			/**
			 * Sync event that fires when core reinstall was successful
			 *
			 * @since 5.0.0
			 *
			 * @param string $new_wp_version the updated WordPress version
			 */
			do_action( 'jetpack_sync_core_reinstalled_successfully', $new_wp_version );
			return;
		}

		// Core was autoudpated
		if ( 'update-core.php' !== $pagenow ) {
			/**
			 * Sync event that fires when core autoupdate was successful
			 *
			 * @since 5.0.0
			 *
			 * @param string $new_wp_version the updated WordPress version
			 * @param string $old_wp_version the previous WordPress version
			 */
			do_action( 'jetpack_sync_core_autoupdated_successfully', $new_wp_version, $this->old_wp_version );
			return;
		}
		/**
		 * Sync event that fires when core update was successful
		 *
		 * @since 5.0.0
		 *
		 * @param string $new_wp_version the updated WordPress version
		 * @param string $old_wp_version the previous WordPress version
		 */
		do_action( 'jetpack_sync_core_updated_successfully', $new_wp_version, $this->old_wp_version );
		return;

	}

	public function get_update_checksum( $value ) {
		// Create an new array so we don't modify the object passed in.
		$a_value = (array) $value;
		// ignore `last_checked`
		unset( $a_value['last_checked'] );
		unset( $a_value['checked'] );
		unset( $a_value['version_checked'] );
		if ( empty( $a_value['updates'] ) ) {
			unset( $a_value['updates'] );
		}

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

		if ( ! did_action( "jetpack_{$transient}_change" ) ) {
			// only send one change notice per request
			do_action( "jetpack_{$transient}_change", $value );
		}
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

	public function expand_themes( $args ) {
		if ( ! isset( $args[0], $args[0]->response ) ) {
			return $args;
		}
		foreach ( $args[0]->response as $stylesheet => &$theme_data ) {
			$theme = wp_get_theme( $stylesheet );
			$theme_data['name'] = $theme->name;
		}
		return $args;
	}

	public function expand_before_enqueue_themes( $args ) {
		return get_site_transient( 'update_themes' );
	}

	public function expand_before_enqueue_plugins( $args ) {
		return $this->filter_update_keys( get_site_transient( 'update_plugins' ) );
	}

	public function expand_before_enqueue_core( $args ) {
		return get_site_transient( 'update_core' );
	}

	public function reset_data() {
		delete_option( self::UPDATES_CHECKSUM_OPTION_NAME );
	}
}

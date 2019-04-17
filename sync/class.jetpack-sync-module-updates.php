<?php

class Jetpack_Sync_Module_Updates extends Jetpack_Sync_Module {

	const UPDATES_CHECKSUM_OPTION_NAME = 'jetpack_updates_sync_checksum';

	private $old_wp_version = null;
	private $updates        = array();

	public function set_defaults() {
		$this->updates = array();
	}

	function name() {
		return 'updates';
	}

	public function init_listeners( $callable ) {
		global $wp_version;
		$this->old_wp_version = $wp_version;
		add_action( 'set_site_transient_update_plugins', array( $this, 'validate_update_change' ), 10, 3 );
		add_action( 'set_site_transient_update_themes', array( $this, 'validate_update_change' ), 10, 3 );
		add_action( 'set_site_transient_update_core', array( $this, 'validate_update_change' ), 10, 3 );

		add_action( 'jetpack_update_plugins_change', $callable );
		add_action( 'jetpack_update_themes_change', $callable );
		add_action( 'jetpack_update_core_change', $callable );

		add_filter(
			'jetpack_sync_before_enqueue_jetpack_update_plugins_change',
			array(
				$this,
				'filter_update_keys',
			),
			10,
			2
		);
		add_filter(
			'jetpack_sync_before_enqueue_upgrader_process_complete',
			array(
				$this,
				'filter_upgrader_process_complete',
			),
			10,
			2
		);

		add_action( 'automatic_updates_complete', $callable );

		if ( is_multisite() ) {
			add_filter( 'pre_update_site_option_wpmu_upgrade_site', array( $this, 'update_core_network_event' ), 10, 2 );
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
		 */
		do_action( 'jetpack_sync_core_update_network', $wp_db_version, $old_wp_db_version, $wp_version );
		return $wp_db_version;
	}

	public function update_core( $new_wp_version ) {
		global $pagenow;

		if ( isset( $_GET['action'] ) && 'do-core-reinstall' === $_GET['action'] ) {
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
		if (
			'update-core.php' !== $pagenow &&
			! Jetpack_Constants::is_true( 'REST_API_REQUEST' ) // wp.com rest api calls should never be marked as a core autoupdate
		) {
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

	public function get_update_checksum( $update, $transient ) {
		$updates    = array();
		$no_updated = array();
		switch ( $transient ) {
			case 'update_plugins':
				if ( ! empty( $update->response ) && is_array( $update->response ) ) {
					foreach ( $update->response as $plugin_slug => $response ) {
						if ( ! empty( $plugin_slug ) && isset( $response->new_version ) ) {
							$updates[] = array( $plugin_slug => $response->new_version );
						}
					}
				}
				if ( ! empty( $update->no_update ) ) {
					$no_updated = array_keys( $update->no_update );
				}

				if ( ! isset( $no_updated['jetpack/jetpack.php'] ) && isset( $updates['jetpack/jetpack.php'] ) ) {
					return false;
				}

				break;
			case 'update_themes':
				if ( ! empty( $update->response ) && is_array( $update->response ) ) {
					foreach ( $update->response as $theme_slug => $response ) {
						if ( ! empty( $theme_slug ) && isset( $response['new_version'] ) ) {
							$updates[] = array( $theme_slug => $response['new_version'] );
						}
					}
				}

				if ( ! empty( $update->checked ) ) {
					$no_updated = $update->checked;
				}

				break;
			case 'update_core':
				if ( ! empty( $update->updates ) && is_array( $update->updates ) ) {
					foreach ( $update->updates as $response ) {
						if ( ! empty( $response->response ) && $response->response === 'latest' ) {
							continue;
						}
						if ( ! empty( $response->response ) && isset( $response->packages->full ) ) {
							$updates[] = array( $response->response => $response->packages->full );
						}
					}
				}

				if ( ! empty( $update->version_checked ) ) {
					$no_updated = $update->version_checked;
				}

				if ( empty( $updates ) ) {
					return false;
				}
				break;

		}
		if ( empty( $updates ) && empty( $no_updated ) ) {
			return false;
		}
		return $this->get_check_sum( array( $no_updated, $updates ) );
	}

	public function validate_update_change( $value, $expiration, $transient ) {
		$new_checksum = $this->get_update_checksum( $value, $transient );

		if ( false === $new_checksum ) {
			return;
		}

		$checksums = get_option( self::UPDATES_CHECKSUM_OPTION_NAME, array() );

		if ( isset( $checksums[ $transient ] ) && $checksums[ $transient ] === $new_checksum ) {
			return;
		}

		$checksums[ $transient ] = $new_checksum;

		update_option( self::UPDATES_CHECKSUM_OPTION_NAME, $checksums );
		if ( 'update_core' === $transient ) {
			/**
			 * jetpack_update_core_change
			 *
			 * @since 5.1.0
			 *
			 * @param array containing info that tells us what needs updating
			 */
			do_action( 'jetpack_update_core_change', $value );
			return;
		}
		if ( empty( $this->updates ) ) {
			// lets add the shutdown method once and only when the updates move from empty to filled with something
			add_action( 'shutdown', array( $this, 'sync_last_event' ), 9 );
		}
		if ( ! isset( $this->updates[ $transient ] ) ) {
			$this->updates[ $transient ] = array();
		}
		$this->updates[ $transient ][] = $value;
	}

	public function sync_last_event() {
		foreach ( $this->updates as $transient => $values ) {
			$value = end( $values ); // only send over the last value
			/**
			 * jetpack_{$transient}_change
			 * jetpack_update_plugins_change
			 * jetpack_update_themes_change
			 *
			 * @since 5.1.0
			 *
			 * @param array containing info that tells us what needs updating
			 */
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
		if ( ! is_array( $args[0]->response ) ) {
			trigger_error( 'Warning: Not an Array as expected but -> ' . wp_json_encode( $args[0]->response ) . ' instead', E_USER_WARNING );
			return $args;
		}
		foreach ( $args[0]->response as $stylesheet => &$theme_data ) {
			$theme              = wp_get_theme( $stylesheet );
			$theme_data['name'] = $theme->name;
		}
		return $args;
	}

	public function reset_data() {
		delete_option( self::UPDATES_CHECKSUM_OPTION_NAME );
	}
}

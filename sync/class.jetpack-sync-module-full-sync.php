<?php

/**
 * This class does a full resync of the database by
 * enqueuing an outbound action for every single object
 * that we care about.
 *
 * This class, and its related class Jetpack_Sync_Module, contain a few non-obvious optimisations that should be explained:
 * - we fire an action called jetpack_full_sync_start so that WPCOM can erase the contents of the cached database
 * - for each object type, we page through the object IDs and enqueue them by firing some monitored actions
 * - we load the full objects for those IDs in chunks of Jetpack_Sync_Module::ARRAY_CHUNK_SIZE (to reduce the number of MySQL calls)
 * - we fire a trigger for the entire array which the Jetpack_Sync_Listener then serializes and queues.
 */

require_once 'class.jetpack-sync-wp-replicastore.php';

class Jetpack_Sync_Module_Full_Sync extends Jetpack_Sync_Module {
	const STATUS_OPTION = 'jetpack_full_sync_status';
	const FULL_SYNC_TIMEOUT = 3600;
	private $send_modules = array();

	public function name() {
		return 'full-sync';
	}

	function init_listeners( $callable ) {
		// synthetic actions for full sync
		add_action( 'jetpack_full_sync_start', $callable );
		add_action( 'jetpack_full_sync_end', $callable );
	}

	function init_before_send() {
		// this is triggered after actions have been processed on the server
		add_action( 'jetpack_sync_processed_actions', array( $this, 'update_sent_progress_action' ) );
	}

	function start( $modules = null ) {
		if ( ! $this->should_start_full_sync() ) {
			return false;
		}

		// ensure listener is loaded so we can guarantee full sync actions are enqueued
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
		Jetpack_Sync_Listener::get_instance();

		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it knows a full sync is coming.
		 *
		 * @since 4.2.0
		 */
		do_action( 'jetpack_full_sync_start' );
		$this->set_status_queuing_started();

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name = $module->name();
			if ( is_array( $modules ) && ! in_array( $module_name, $modules ) ) {
				continue;
			}
			$this->send_modules[] = $module_name;

			$items_enqueued = $module->enqueue_full_sync_actions();
			if ( 0 !== $items_enqueued ) {
				$status = $this->get_status( 'queue', 0, $module_name );
				$status += $items_enqueued;
				$this->update_status( 'queue', $status, $module_name );
			}
		}

		$this->set_status_queuing_finished();

		$store = new Jetpack_Sync_WP_Replicastore();

		/**
		 * Fires when a full sync ends. This action is serialized
		 * and sent to the server with checksums so that we can confirm the
		 * sync was successful.
		 *
		 * @since 4.2.0
		 */
		do_action( 'jetpack_full_sync_end', $store->checksum_all() );

		return true;
	}

	private function should_start_full_sync() {
		$status_started = $this->get_status( 'started', null );
		$status_finished = $this->get_status( 'finished', null );

		// We should try sync if we haven't started it yet or if we have finished it.
		if ( is_null( $status_started ) || is_integer( $status_finished ) ) {
			return true;
		}

		// allow enqueuing if last full sync was started more than FULL_SYNC_TIMEOUT seconds ago
		if ( intval( $status_started ) + self::FULL_SYNC_TIMEOUT < time() ) {
			return true;
		}

		return false;
	}

	function update_sent_progress_action( $actions ) {
		// quick way to map to first items with an array of arrays
		$actions_with_counts = array_count_values( array_map( 'reset', $actions ) );
		$status_started = $this->get_status( 'started', null );
		$status_finished = $this->get_status( 'finished', null );
		if ( is_null( $status_started ) || $status_finished ) {
			return;
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_start'] ) ) {
			$this->update_status( 'sent_started', time() );
		}

		$status_sent = array();

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name    = $module->name();
			$module_actions = $module->get_full_sync_actions();
			foreach ( $module_actions as $module_action ) {
				
				if ( isset( $actions_with_counts[ $module_action ] ) ) {
					if ( ! isset( $status_sent[ $module_name ] ) ) {
						$status_sent[ $module_name ] = $this->get_status( 'sent', 0, $module_name );
					}
					$status_sent[ $module_name ] += $actions_with_counts[ $module_action ];
				}
			}

		}

		foreach( $status_sent as $sent_module_name => $sent_module_value ) {
			$this->update_status( 'sent', $sent_module_value, $sent_module_name );
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_end'] ) ) {
			$this->update_status( 'finished', time() );
		}


	}

	private function set_status_queuing_started() {
		$this->clear_status();
		$this->update_status( 'started', time() );
	}

	private function set_status_queuing_finished() {
		$this->update_status( 'queue_finished', time() );
	}

	private $initial_status = array(
		'started'        => null,
		'queue_finished' => null,
		'sent_started'   => null,
		'finished'       => null,
		'sent'           => array(),
		'queue'          => array(),
	);

	public function get_status( $status_key, $status_default_value, $module_name = null ) {
		if ( $module_name ) {
			return get_option( self::STATUS_OPTION . '_' . $status_key . '_' . $module_name, $status_default_value );
		}
		return get_option( self::STATUS_OPTION . '_' . $status_key, $status_default_value );
	}

	public function update_status( $status_key, $status_value, $module_name = null ) {
		if ( $module_name ) {
			return $this->update_option( self::STATUS_OPTION . '_' . $status_key . '_' . $module_name, $status_value );
		}
		return $this->update_option( self::STATUS_OPTION . '_' . $status_key, $status_value );
	}

	private function update_option( $option_name, $new_value ) {
		global $wp_version;
		if ( version_compare( '4.2.0', $wp_version, '<=' ) ) {
			return update_option( $option_name, $new_value, false );
		}
		if ( get_option( $option_name ) !== false ) {
			return update_option( $option_name, $new_value );
		}
		return add_option( $option_name, $new_value, null, false );
	}

	public function get_full_status() {
		$status = array();
		$module_names = array();
		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_names[] = $module->name();
		}
		
		foreach( $this->initial_status as $status_key => $initial_value ) {
			if ( is_array( $initial_value ) ) {
				$status[ $status_key ] = array();
				foreach( $module_names as $module_name ) {
					$module_status = $this->get_status( $status_key, null, $module_name );
					if ( null !== $module_status ) {
						$status[ $status_key ][ $module_name ] = (int) $module_status;
					}
				}
			} else {
				$status[ $status_key ] = $this->get_status( $status_key, null );
			}
		}
		return $status;
	}


	public function clear_status() {
		$module_names = array();
		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_names[] = $module->name();
		}

		foreach( $this->initial_status as $status_key => $initial_value ) {
			if ( is_array( $initial_value ) ) {
				foreach( $module_names as $module_name ) {
					delete_option( self::STATUS_OPTION . '_' . $status_key . '_' . $module_name );
				}
			} else {
				delete_option( self::STATUS_OPTION . '_' . $status_key );
			}
		}

	}
}

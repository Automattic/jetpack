<?php

/**
 * This class does a full resync of the database by
 * enqueuing an outbound action for every single object
 * that we care about.
 *
 * This class contains a few non-obvious optimisations that should be explained:
 * - we fire an action called jetpack_full_sync_start so that WPCOM can erase the contents of the cached database
 * - for each object type, we obtain a full list of object IDs to sync via a single API call (hoping that since they're ints, they can all fit in RAM)
 * - we load the full objects for those IDs in chunks of Jetpack_Sync_Full::ARRAY_CHUNK_SIZE (to reduce the number of MySQL calls)
 * - we fire a trigger for the entire array which the Jetpack_Sync_Sender then serializes and queues.
 */

require_once 'class.jetpack-sync-wp-replicastore.php';

class Jetpack_Sync_Module_Full_Sync extends Jetpack_Sync_Module {
	const STATUS_OPTION = 'jetpack_full_sync_status';
	const FULL_SYNC_TIMEOUT = 3600;

	private $sender;

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

	function start() {
		if( ! $this->should_start_full_sync() ) {
			return false;
		}

		// ensure listener is loaded so we can guarantee full sync actions are enqueued
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
		Jetpack_Sync_Listener::getInstance();

		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it knows a full sync is coming.
		 *
		 * @since 4.2.0
		 */
		do_action( 'jetpack_full_sync_start' );
		$this->set_status_queuing_started();

		foreach( Jetpack_Sync_Modules::get_modules() as $module ) {
			$items_enqueued = $module->enqueue_full_sync_actions();
			$module_name = $module->name();
			if ( $items_enqueued !== 0 ) {
				$status = $this->get_status();

				if ( ! isset( $status['queue'][ $module_name ] ) ) {
					$status['queue'][ $module_name ] = 0;	
				}

				$status['queue'][ $module_name ] += $items_enqueued;
			}
			$this->update_status( $status );
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
		$status = $this->get_status();
		
		// We should try sync if we haven't started it yet or if we have finished it.
		if( is_null( $status['started'] ) || is_integer( $status['finished'] ) ) {
			return true;
		}

		// allow enqueing if last full sync was started more than FULL_SYNC_TIMEOUT seconds ago
		if ( intval( $status['started'] ) + self::FULL_SYNC_TIMEOUT < time() ) {
			return true;
		}

		return false;
	}

	function update_sent_progress_action( $actions ) {
		// quick way to map to first items with an array of arrays
		$actions_with_counts = array_count_values( array_map( 'reset', $actions ) );

		$status = $this->get_status();
		if ( is_null( $status['started'] ) || $status['finished'] ) {
			return;
		}

		if ( isset( $actions_with_counts[ 'jetpack_full_sync_start' ] ) ) {
			$status['sent_started'] = time();
		}

		foreach( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name = $module->name();
			$module_actions = $module->get_full_sync_actions();
			foreach( $module_actions as $module_action ) {
				if ( isset( $actions_with_counts[ $module_action ] ) ) {
					if ( ! isset( $status[ 'sent' ][ $module_name ] ) ) {
						$status['sent'][ $module_name ] = 0;	
					}
					$status['sent'][ $module_name ] += $actions_with_counts[ $module_action ];	
				}
			}
		}

		if ( isset( $actions_with_counts[ 'jetpack_full_sync_end' ] ) ) {
			$status['finished'] = time();
		}

		$this->update_status( $status );
	}

	private function set_status_queuing_started() {
		$status = $this->initial_status;
		$status[ 'started' ] = time();
		$this->update_status( $status );
	}

	private function set_status_queuing_finished() {
		$this->update_status( array( 'queue_finished' => time() ) );
	}

	private $initial_status = array(
		'started' => null,
		'queue_finished' => null,
		'sent_started' => null,
		'finished' => null,
		'sent' => array(),
		'queue' => array(),
	);

	public function get_status() {
		return get_option( self::STATUS_OPTION, $this->initial_status );
	}

	public function update_status( $status ) {
		return update_option(
			self::STATUS_OPTION,
			array_merge( $this->get_status(), $status )
		);
	}

	public function clear_status() {
		delete_option( self::STATUS_OPTION );
	}
}

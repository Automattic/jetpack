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
	const STATUS_OPTION_PREFIX = 'jetpack_sync_full_';
	const FULL_SYNC_TIMEOUT = 3600;

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

		$prefix = self::STATUS_OPTION_PREFIX;

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name = $module->name();
			if ( is_array( $modules ) && ! in_array( $module_name, $modules ) ) {
				continue;
			}

			$items_enqueued = $module->enqueue_full_sync_actions();
			if ( ! is_null( $items_enqueued ) && $items_enqueued > 0 ) {
				// TODO: only update this once every N items, then at end - why cause all that DB churn?
				update_option( "{$prefix}_{$module->name()}_queued", $items_enqueued );
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

		// We should try sync if we haven't started it yet or if we have finished it.
		if ( ! $this->is_started() || $this->is_finished() ) {
			return true;
		}

		// allow enqueuing if last full sync was started more than FULL_SYNC_TIMEOUT seconds ago
		$prefix = self::STATUS_OPTION_PREFIX;
		$started_at = get_option( "{$prefix}_started", 0 );
		if ( intval( $started_at ) + self::FULL_SYNC_TIMEOUT < time() ) {
			return true;
		}

		return false;
	}

	function update_sent_progress_action( $actions ) {
		$prefix = self::STATUS_OPTION_PREFIX;

		// quick way to map to first items with an array of arrays
		$actions_with_counts = array_count_values( array_map( 'reset', $actions ) );

		$status = $this->get_status();
		if ( ! $this->is_started() || $this->is_finished() ) {
			return;
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_start'] ) ) {
			update_option( "{$prefix}_sent_started", time() );
		}

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name    = $module->name();
			$module_actions = $module->get_full_sync_actions();
			$items_sent     = 0;
			foreach ( $module_actions as $module_action ) {
				if ( isset( $actions_with_counts[ $module_action ] ) ) {
					$items_sent += $actions_with_counts[ $module_action ];
				}
			}

			if ( $items_sent > 0 ) {
				update_option( "{$prefix}_{$module->name()}_sent", $items_sent );
			}	
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_end'] ) ) {
			update_option( "{$prefix}_finished", time() );
		}
	}

	private function set_status_queuing_started() {
		$this->clear_status();
		$prefix = self::STATUS_OPTION_PREFIX;
		update_option( "{$prefix}_started", time() );
	}

	private function set_status_queuing_finished() {
		$prefix = self::STATUS_OPTION_PREFIX;
		update_option( "{$prefix}_queue_finished", time() );
	}

	private function is_started() {
		$prefix = self::STATUS_OPTION_PREFIX;
		return ! is_null( get_option( "{$prefix}_started", null ) );
	}

	private function is_finished() {
		$prefix = self::STATUS_OPTION_PREFIX;
		return !! get_option( "{$prefix}_finished", null );
	}

	public function get_status() {
		$prefix = self::STATUS_OPTION_PREFIX;
		$status = array(
			'started'        => get_option( "{$prefix}_started", null ),
			'queue_finished' => get_option( "{$prefix}_queue_finished", null ),
			'sent_started'   => get_option( "{$prefix}_sent_started", null ),
			'finished'       => get_option( "{$prefix}_finished", null ),
			'sent'           => array(),
			'queue'          => array(),
		);

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$queued = get_option( "{$prefix}_{$module->name()}_queued", null );
			$sent = get_option( "{$prefix}_{$module->name()}_sent", null );

			if ( ! is_null( $queued ) ) {
				$status[ 'queue' ][ $module->name() ] = $queued;
			}
			
			if ( ! is_null( $sent ) ) {
				$status[ 'sent' ][ $module->name() ] = $sent;
			}
		}

		return $status;
	}

	public function clear_status() {
		$prefix = self::STATUS_OPTION_PREFIX;
		delete_option( "{$prefix}_started" );
		delete_option( "{$prefix}_queue_finished" );
		delete_option( "{$prefix}_sent_started" );
		delete_option( "{$prefix}_finished" );

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			delete_option( "{$prefix}_{$module->name()}_queued" );
			delete_option( "{$prefix}_{$module->name()}_sent" );
		}
	}
}

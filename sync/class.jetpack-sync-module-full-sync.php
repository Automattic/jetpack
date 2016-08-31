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

	private $items_added_since_last_pause;
	private $last_pause_time;
	private $queue_rate_limit;

	public function name() {
		return 'full-sync';
	}

	function init_full_sync_listeners( $callable ) {
		// synthetic actions for full sync
		add_action( 'jetpack_full_sync_start', $callable );
		add_action( 'jetpack_full_sync_end', $callable );
		add_action( 'jetpack_full_sync_cancelled', $callable );
	}

	function init_before_send() {
		// this is triggered after actions have been processed on the server
		add_action( 'jetpack_sync_processed_actions', array( $this, 'update_sent_progress_action' ) );
	}

	function start( $modules = null ) {
		$was_already_running = $this->is_started() && ! $this->is_finished();

		// remove all evidence of previous full sync items and status
		$this->reset_data();

		$this->enable_queue_rate_limit();

		if ( $was_already_running ) {
			/**
			 * Fires when a full sync is cancelled.
			 *
			 * @since 4.2.0
			 */
			do_action( 'jetpack_full_sync_cancelled' );
		}

		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it knows a full sync is coming.
		 *
		 * @since 4.2.0
		 */
		do_action( 'jetpack_full_sync_start', $modules );
		$this->update_status_option( 'started', time() );

		// configure modules
		if ( ! is_array( $modules ) ) {
			$modules = array();
		}

		if ( isset( $modules['users'] ) && 'initial' === $modules['users'] ) {
			$user_module = Jetpack_Sync_Modules::get_module( 'users' );
			$modules['users'] = $user_module->get_initial_sync_user_config();
		}

		// by default, all modules are fully enabled
		if ( count( $modules ) === 0 ) {
			$default_module_config = true;
		} else {
			$default_module_config = false;
		}

		// set default configuration, calculate totals, and save configuration if totals > 0
		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name = $module->name();
			if ( ! isset( $modules[ $module_name ] ) ) {
				$modules[ $module_name ] = $default_module_config;
			}

			// check if this module is enabled
			if ( ! ( $module_config = $modules[ $module_name ] ) ) {
				continue;
			}

			$total_items = $module->estimate_full_sync_actions( $module_config );

			if ( ! is_null( $total_items ) && $total_items > 0 ) {
				$this->update_status_option( "{$module_name}_total", $total_items );
				$this->update_status_option( "{$module_name}_config", $module_config );
			}
		}

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_name   = $module->name();
			$module_config = $modules[ $module_name ];

			// check if this module is enabled
			if ( ! $module_config ) {
				continue;
			}

			$items_enqueued = $module->enqueue_full_sync_actions( $module_config );

			if ( ! is_null( $items_enqueued ) && $items_enqueued > 0 ) {
				$this->update_status_option( "{$module_name}_queued", $items_enqueued );
			}
		}

		$this->update_status_option( 'queue_finished', time() );

		$store = new Jetpack_Sync_WP_Replicastore();

		/**
		 * Fires when a full sync ends. This action is serialized
		 * and sent to the server with checksums so that we can confirm the
		 * sync was successful.
		 *
		 * @since 4.2.0
		 */
		do_action( 'jetpack_full_sync_end', $store->checksum_all() );

		$this->disable_queue_rate_limit();

		return true;
	}

	function update_sent_progress_action( $actions ) {

		// quick way to map to first items with an array of arrays
		$actions_with_counts = array_count_values( array_map( 'reset', $actions ) );

		if ( ! $this->is_started() || $this->is_finished() ) {
			return;
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_start'] ) ) {
			$this->update_status_option( 'sent_started', time() );
		}

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module_actions     = $module->get_full_sync_actions();
			$status_option_name = "{$module->name()}_sent";
			$items_sent         = $this->get_status_option( $status_option_name, 0 );

			foreach ( $module_actions as $module_action ) {
				if ( isset( $actions_with_counts[ $module_action ] ) ) {
					$items_sent += $actions_with_counts[ $module_action ];
				}
			}

			if ( $items_sent > 0 ) {
				$this->update_status_option( $status_option_name, $items_sent );
			}	
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_end'] ) ) {
			$this->update_status_option( 'finished', time() );
		}
	}

	public function is_started() {
		return !! $this->get_status_option( 'started' );
	}

	public function is_finished() {
		return !! $this->get_status_option( 'finished' );
	}

	public function get_status() {
		$status = array(
			'started'        => $this->get_status_option( 'started' ),
			'queue_finished' => $this->get_status_option( 'queue_finished' ),
			'sent_started'   => $this->get_status_option( 'sent_started' ),
			'finished'       => $this->get_status_option( 'finished' ),
			'sent'           => array(),
			'queue'          => array(),
			'config'         => array(),
			'total'          => array(),
		);

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$name = $module->name();

			if ( $total = $this->get_status_option( "{$name}_total" ) ) {
				$status[ 'total' ][ $name ] = $total;
			}

			if ( $queued = $this->get_status_option( "{$name}_queued" ) ) {
				$status[ 'queue' ][ $name ] = $queued;
			}
			
			if ( $sent = $this->get_status_option( "{$name}_sent" ) ) {
				$status[ 'sent' ][ $name ] = $sent;
			}

			if ( $config = $this->get_status_option( "{$name}_config" ) ) {
				$status[ 'config' ][ $name ] = $config;
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
			delete_option( "{$prefix}_{$module->name()}_total" );
			delete_option( "{$prefix}_{$module->name()}_queued" );
			delete_option( "{$prefix}_{$module->name()}_sent" );
			delete_option( "{$prefix}_{$module->name()}_config" );
		}
	}

	public function reset_data() {
		$this->clear_status();
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
		$listener = Jetpack_Sync_Listener::get_instance();
		$listener->get_full_sync_queue()->reset();
	}

	private function get_status_option( $option, $default = null ) {
		$prefix = self::STATUS_OPTION_PREFIX;

		$value = get_option( "{$prefix}_{$option}", $default );
		
		if ( ! $value ) {
			// don't cast to int if we didn't find a value - we want to preserve null or false as sentinals
			return $default;
		}

		return is_numeric( $value ) ? intval( $value ) : $value;
	}

	private function update_status_option( $name, $value ) {
		$prefix = self::STATUS_OPTION_PREFIX;
		update_option( "{$prefix}_{$name}", $value, false );
	}

	private function enable_queue_rate_limit() {
		$this->queue_rate_limit = Jetpack_Sync_Settings::get_setting( 'queue_max_writes_sec' );
		$this->items_added_since_last_pause = 0;
		$this->last_pause_time = microtime( true );

		add_action( 'jpsq_item_added', array( $this, 'queue_item_added' ) );
		add_action( 'jpsq_items_added', array( $this, 'queue_items_added' ) );
	}

	private function disable_queue_rate_limit() {
		remove_action( 'jpsq_item_added', array( $this, 'queue_item_added' ) );
		remove_action( 'jpsq_items_added', array( $this, 'queue_items_added' ) );
	}

	public function queue_item_added() {
		$this->queue_items_added( 1 );
	}

	public function queue_items_added( $item_count ) {
		// jpsq_item_added and jpsq_items_added both exec 1 db query, 
		// so we ignore $item_count and treat it as always 1
		$this->items_added_since_last_pause += 1; 

		if ( $this->items_added_since_last_pause > $this->queue_rate_limit ) {
			// sleep for the rest of the second
			$sleep_til = $this->last_pause_time + 1.0;
			$sleep_duration = $sleep_til - microtime( true );
			if ( $sleep_duration > 0.0 ) {
				usleep( $sleep_duration * 1000000 );
				$this->last_pause_time = microtime( true );
			}
			$this->items_added_since_last_pause = 0;
		}
	}
}

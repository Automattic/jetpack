<?php
/**
 * Full sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Listener;
use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Queue;
use Automattic\Jetpack\Sync\Settings;

/**
 * This class does a full resync of the database by
 * enqueuing an outbound action for every single object
 * that we care about.
 *
 * This class, and its related class Jetpack_Sync_Module, contain a few non-obvious optimisations that should be explained:
 * - we fire an action called jetpack_full_sync_start so that WPCOM can erase the contents of the cached database
 * - for each object type, we page through the object IDs and enqueue them by firing some monitored actions
 * - we load the full objects for those IDs in chunks of Jetpack_Sync_Module::ARRAY_CHUNK_SIZE (to reduce the number of MySQL calls)
 * - we fire a trigger for the entire array which the Automattic\Jetpack\Sync\Listener then serializes and queues.
 */
class Full_Sync extends Module {
	/**
	 * Prefix of the full sync status option name.
	 *
	 * @var string
	 */
	const STATUS_OPTION_PREFIX = 'jetpack_sync_full_';

	/**
	 * Timeout between the previous and the next allowed full sync.
	 *
	 * @todo Remove this as it's no longer used since https://github.com/Automattic/jetpack/pull/4561
	 *
	 * @var int
	 */
	const FULL_SYNC_TIMEOUT = 3600;

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'full-sync';
	}

	/**
	 * Initialize action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		// Synthetic actions for full sync.
		add_action( 'jetpack_full_sync_start', $callable, 10, 3 );
		add_action( 'jetpack_full_sync_end', $callable, 10, 2 );
		add_action( 'jetpack_full_sync_cancelled', $callable );
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// This is triggered after actions have been processed on the server.
		add_action( 'jetpack_sync_processed_actions', array( $this, 'update_sent_progress_action' ) );
	}

	/**
	 * Start a full sync.
	 *
	 * @access public
	 *
	 * @param array $module_configs Full sync configuration for all sync modules.
	 * @return bool Always returns true at success.
	 */
	public function start( $module_configs = null ) {
		$was_already_running = $this->is_started() && ! $this->is_finished();

		// Remove all evidence of previous full sync items and status.
		$this->reset_data();

		if ( $was_already_running ) {
			/**
			 * Fires when a full sync is cancelled.
			 *
			 * @since 4.2.0
			 */
			do_action( 'jetpack_full_sync_cancelled' );
		}

		$this->update_status_option( 'started', time() );
		$this->update_status_option( 'params', $module_configs );

		$enqueue_status   = array();
		$full_sync_config = array();
		$include_empty    = false;
		$empty            = array();

		// Default value is full sync.
		if ( ! is_array( $module_configs ) ) {
			$module_configs = array();
			$include_empty  = true;
			foreach ( Modules::get_modules() as $module ) {
				$module_configs[ $module->name() ] = true;
			}
		}

		// Set default configuration, calculate totals, and save configuration if totals > 0.
		foreach ( Modules::get_modules() as $module ) {
			$module_name   = $module->name();
			$module_config = isset( $module_configs[ $module_name ] ) ? $module_configs[ $module_name ] : false;

			if ( ! $module_config ) {
				continue;
			}

			if ( 'users' === $module_name && 'initial' === $module_config ) {
				$module_config = $module->get_initial_sync_user_config();
			}

			$enqueue_status[ $module_name ] = false;

			$total_items = $module->estimate_full_sync_actions( $module_config );

			// If there's information to process, configure this module.
			if ( ! is_null( $total_items ) && $total_items > 0 ) {
				$full_sync_config[ $module_name ] = $module_config;
				$enqueue_status[ $module_name ]   = array(
					$total_items,   // Total.
					0,              // Queued.
					false,          // Current state.
				);
			} elseif ( $include_empty && 0 === $total_items ) {
				$empty[ $module_name ] = true;
			}
		}

		$this->set_config( $full_sync_config );
		$this->set_enqueue_status( $enqueue_status );

		$range = $this->get_content_range( $full_sync_config );
		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it knows a full sync is coming.
		 *
		 * @since 4.2.0
		 * @since 7.3.0 Added $range arg.
		 * @since 7.4.0 Added $empty arg.
		 *
		 * @param array $full_sync_config Sync configuration for all sync modules.
		 * @param array $range            Range of the sync items, containing min and max IDs for some item types.
		 * @param array $empty            The modules with no items to sync during a full sync.
		 */
		do_action( 'jetpack_full_sync_start', $full_sync_config, $range, $empty );

		$this->continue_enqueuing( $full_sync_config, $enqueue_status );

		return true;
	}

	/**
	 * Enqueue the next items to sync.
	 *
	 * @access public
	 *
	 * @param array $configs Full sync configuration for all sync modules.
	 * @param array $enqueue_status Current status of the queue, indexed by sync modules.
	 */
	public function continue_enqueuing( $configs = null, $enqueue_status = null ) {
		if ( ! $this->is_started() || $this->get_status_option( 'queue_finished' ) ) {
			return;
		}

		// If full sync queue is full, don't enqueue more items.
		$max_queue_size_full_sync = Settings::get_setting( 'max_queue_size_full_sync' );
		$full_sync_queue          = new Queue( 'full_sync' );

		$available_queue_slots = $max_queue_size_full_sync - $full_sync_queue->size();

		if ( $available_queue_slots <= 0 ) {
			return;
		} else {
			$remaining_items_to_enqueue = min( Settings::get_setting( 'max_enqueue_full_sync' ), $available_queue_slots );
		}

		if ( ! $configs ) {
			$configs = $this->get_config();
		}

		if ( ! $enqueue_status ) {
			$enqueue_status = $this->get_enqueue_status();
		}

		$modules           = Modules::get_modules();
		$modules_processed = 0;
		foreach ( $modules as $module ) {
			$module_name = $module->name();

			// Skip module if not configured for this sync or module is done.
			if ( ! isset( $configs[ $module_name ] )
				|| // No module config.
					! $configs[ $module_name ]
				|| // No enqueue status.
					! $enqueue_status[ $module_name ]
				|| // Finished enqueuing this module.
					true === $enqueue_status[ $module_name ][2] ) {
				$modules_processed ++;
				continue;
			}

			list( $items_enqueued, $next_enqueue_state ) = $module->enqueue_full_sync_actions( $configs[ $module_name ], $remaining_items_to_enqueue, $enqueue_status[ $module_name ][2] );

			$enqueue_status[ $module_name ][2] = $next_enqueue_state;

			// If items were processed, subtract them from the limit.
			if ( ! is_null( $items_enqueued ) && $items_enqueued > 0 ) {
				$enqueue_status[ $module_name ][1] += $items_enqueued;
				$remaining_items_to_enqueue        -= $items_enqueued;
			}

			if ( true === $next_enqueue_state ) {
				$modules_processed ++;
			}
			// Stop processing if we've reached our limit of items to enqueue.
			if ( 0 >= $remaining_items_to_enqueue ) {
				break;
			}
		}

		$this->set_enqueue_status( $enqueue_status );

		if ( count( $modules ) > $modules_processed ) {
			return;
		}

		// Setting autoload to true means that it's faster to check whether we should continue enqueuing.
		$this->update_status_option( 'queue_finished', time(), true );

		$range = $this->get_content_range( $configs );

		/**
		 * Fires when a full sync ends. This action is serialized
		 * and sent to the server.
		 *
		 * @since 4.2.0
		 * @since 7.3.0 Added $range arg.
		 *
		 * @param string $checksum Deprecated since 7.3.0 - @see https://github.com/Automattic/jetpack/pull/11945/
		 * @param array  $range    Range of the sync items, containing min and max IDs for some item types.
		 */
		do_action( 'jetpack_full_sync_end', '', $range );
	}

	/**
	 * Get the range (min ID, max ID and total items) of items to sync.
	 *
	 * @access public
	 *
	 * @param string $type Type of sync item to get the range for.
	 * @return array Array of min ID, max ID and total items in the range.
	 */
	public function get_range( $type ) {
		global $wpdb;
		if ( ! in_array( $type, array( 'comments', 'posts' ), true ) ) {
			return array();
		}

		switch ( $type ) {
			case 'posts':
				$table     = $wpdb->posts;
				$id        = 'ID';
				$where_sql = Settings::get_blacklisted_post_types_sql();

				break;
			case 'comments':
				$table     = $wpdb->comments;
				$id        = 'comment_ID';
				$where_sql = Settings::get_comments_filter_sql();
				break;
		}

		// TODO: Call $wpdb->prepare on the following query.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results( "SELECT MAX({$id}) as max, MIN({$id}) as min, COUNT({$id}) as count FROM {$table} WHERE {$where_sql}" );
		if ( isset( $results[0] ) ) {
			return $results[0];
		}

		return array();
	}

	/**
	 * Get the range for content (posts and comments) to sync.
	 *
	 * @access private
	 *
	 * @param array $config Full sync configuration for this all sync modules.
	 * @return array Array of range (min ID, max ID, total items) for all content types.
	 */
	private function get_content_range( $config ) {
		$range = array();
		// Only when we are sending the whole range do we want to send also the range.
		if ( true === isset( $config['posts'] ) && $config['posts'] ) {
			$range['posts'] = $this->get_range( 'posts' );
		}

		if ( true === isset( $config['comments'] ) && $config['comments'] ) {
			$range['comments'] = $this->get_range( 'comments' );
		}
		return $range;
	}

	/**
	 * Update the progress after sync modules actions have been processed on the server.
	 *
	 * @access public
	 *
	 * @param array $actions Actions that have been processed on the server.
	 */
	public function update_sent_progress_action( $actions ) {
		// Quick way to map to first items with an array of arrays.
		$actions_with_counts = array_count_values( array_filter( array_map( array( $this, 'get_action_name' ), $actions ) ) );

		// Total item counts for each action.
		$actions_with_total_counts = $this->get_actions_totals( $actions );

		if ( ! $this->is_started() || $this->is_finished() ) {
			return;
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_start'] ) ) {
			$this->update_status_option( 'send_started', time() );
		}

		foreach ( Modules::get_modules() as $module ) {
			$module_actions     = $module->get_full_sync_actions();
			$status_option_name = "{$module->name()}_sent";
			$total_option_name  = "{$status_option_name}_total";
			$items_sent         = $this->get_status_option( $status_option_name, 0 );
			$items_sent_total   = $this->get_status_option( $total_option_name, 0 );

			foreach ( $module_actions as $module_action ) {
				if ( isset( $actions_with_counts[ $module_action ] ) ) {
					$items_sent += $actions_with_counts[ $module_action ];
				}

				if ( ! empty( $actions_with_total_counts[ $module_action ] ) ) {
					$items_sent_total += $actions_with_total_counts[ $module_action ];
				}
			}

			if ( $items_sent > 0 ) {
				$this->update_status_option( $status_option_name, $items_sent );
			}

			if ( 0 !== $items_sent_total ) {
				$this->update_status_option( $total_option_name, $items_sent_total );
			}
		}

		if ( isset( $actions_with_counts['jetpack_full_sync_end'] ) ) {
			$this->update_status_option( 'finished', time() );
		}
	}

	/**
	 * Get the name of the action for an item in the sync queue.
	 *
	 * @access public
	 *
	 * @param array $queue_item Item of the sync queue.
	 * @return string|boolean Name of the action, false if queue item is invalid.
	 */
	public function get_action_name( $queue_item ) {
		if ( is_array( $queue_item ) && isset( $queue_item[0] ) ) {
			return $queue_item[0];
		}
		return false;
	}

	/**
	 * Retrieve the total number of items we're syncing in a particular queue item (action).
	 * `$queue_item[1]` is expected to contain chunks of items, and `$queue_item[1][0]`
	 * represents the first (and only) chunk of items to sync in that action.
	 *
	 * @access public
	 *
	 * @param array $queue_item Item of the sync queue that corresponds to a particular action.
	 * @return int Total number of items in the action.
	 */
	public function get_action_totals( $queue_item ) {
		if ( is_array( $queue_item ) && isset( $queue_item[1][0] ) ) {
			if ( is_array( $queue_item[1][0] ) ) {
				// Let's count the items we sync in this action.
				return count( $queue_item[1][0] );
			}
			// -1 indicates that this action syncs all items by design.
			return -1;
		}
		return 0;
	}

	/**
	 * Retrieve the total number of items for a set of actions, grouped by action name.
	 *
	 * @access public
	 *
	 * @param array $actions An array of actions.
	 * @return array An array, representing the total number of items, grouped per action.
	 */
	public function get_actions_totals( $actions ) {
		$totals = array();

		foreach ( $actions as $action ) {
			$name          = $this->get_action_name( $action );
			$action_totals = $this->get_action_totals( $action );
			if ( ! isset( $totals[ $name ] ) ) {
				$totals[ $name ] = 0;
			}
			$totals[ $name ] += $action_totals;
		}

		return $totals;
	}

	/**
	 * Whether full sync has started.
	 *
	 * @access public
	 *
	 * @return boolean
	 */
	public function is_started() {
		return ! ! $this->get_status_option( 'started' );
	}

	/**
	 * Whether full sync has finished.
	 *
	 * @access public
	 *
	 * @return boolean
	 */
	public function is_finished() {
		return ! ! $this->get_status_option( 'finished' );
	}

	/**
	 * Retrieve the status of the current full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync status.
	 */
	public function get_status() {
		$status = array(
			'started'        => $this->get_status_option( 'started' ),
			'queue_finished' => $this->get_status_option( 'queue_finished' ),
			'send_started'   => $this->get_status_option( 'send_started' ),
			'finished'       => $this->get_status_option( 'finished' ),
			'sent'           => array(),
			'sent_total'     => array(),
			'queue'          => array(),
			'config'         => $this->get_status_option( 'params' ),
			'total'          => array(),
		);

		$enqueue_status = $this->get_enqueue_status();

		foreach ( Modules::get_modules() as $module ) {
			$name = $module->name();

			if ( ! isset( $enqueue_status[ $name ] ) ) {
				continue;
			}

			list( $total, $queued ) = $enqueue_status[ $name ];

			if ( $total ) {
				$status['total'][ $name ] = $total;
			}

			if ( $queued ) {
				$status['queue'][ $name ] = $queued;
			}

			$sent = $this->get_status_option( "{$name}_sent" );
			if ( $sent ) {
				$status['sent'][ $name ] = $sent;
			}

			$sent_total = $this->get_status_option( "{$name}_sent_total" );
			if ( $sent_total ) {
				$status['sent_total'][ $name ] = $sent_total;
			}
		}

		return $status;
	}

	/**
	 * Clear all the full sync status options.
	 *
	 * @access public
	 */
	public function clear_status() {
		$prefix = self::STATUS_OPTION_PREFIX;
		\Jetpack_Options::delete_raw_option( "{$prefix}_started" );
		\Jetpack_Options::delete_raw_option( "{$prefix}_params" );
		\Jetpack_Options::delete_raw_option( "{$prefix}_queue_finished" );
		\Jetpack_Options::delete_raw_option( "{$prefix}_send_started" );
		\Jetpack_Options::delete_raw_option( "{$prefix}_finished" );

		$this->delete_enqueue_status();

		foreach ( Modules::get_modules() as $module ) {
			\Jetpack_Options::delete_raw_option( "{$prefix}_{$module->name()}_sent" );
			\Jetpack_Options::delete_raw_option( "{$prefix}_{$module->name()}_sent_total" );
		}
	}

	/**
	 * Clear all the full sync data.
	 *
	 * @access public
	 */
	public function reset_data() {
		$this->clear_status();
		$this->delete_config();

		$listener = Listener::get_instance();
		$listener->get_full_sync_queue()->reset();
	}

	/**
	 * Get the value of a full sync status option.
	 *
	 * @access private
	 *
	 * @param string $name    Name of the option.
	 * @param mixed  $default Default value of the option.
	 * @return mixed Option value.
	 */
	private function get_status_option( $name, $default = null ) {
		$value = \Jetpack_Options::get_raw_option( self::STATUS_OPTION_PREFIX . "_$name", $default );

		return is_numeric( $value ) ? intval( $value ) : $value;
	}

	/**
	 * Update the value of a full sync status option.
	 *
	 * @access private
	 *
	 * @param string  $name     Name of the option.
	 * @param mixed   $value    Value of the option.
	 * @param boolean $autoload Whether the option should be autoloaded at the beginning of the request.
	 */
	private function update_status_option( $name, $value, $autoload = false ) {
		\Jetpack_Options::update_raw_option( self::STATUS_OPTION_PREFIX . "_$name", $value, $autoload );
	}

	/**
	 * Set the full sync enqueue status.
	 *
	 * @access private
	 *
	 * @param array $new_status The new full sync enqueue status.
	 */
	private function set_enqueue_status( $new_status ) {
		\Jetpack_Options::update_raw_option( 'jetpack_sync_full_enqueue_status', $new_status );
	}

	/**
	 * Delete full sync enqueue status.
	 *
	 * @access private
	 *
	 * @return boolean Whether the status was deleted.
	 */
	private function delete_enqueue_status() {
		return \Jetpack_Options::delete_raw_option( 'jetpack_sync_full_enqueue_status' );
	}

	/**
	 * Retrieve the current full sync enqueue status.
	 *
	 * @access private
	 *
	 * @return array Full sync enqueue status.
	 */
	public function get_enqueue_status() {
		return \Jetpack_Options::get_raw_option( 'jetpack_sync_full_enqueue_status' );
	}

	/**
	 * Set the full sync enqueue configuration.
	 *
	 * @access private
	 *
	 * @param array $config The new full sync enqueue configuration.
	 */
	private function set_config( $config ) {
		\Jetpack_Options::update_raw_option( 'jetpack_sync_full_config', $config );
	}

	/**
	 * Delete full sync configuration.
	 *
	 * @access private
	 *
	 * @return boolean Whether the configuration was deleted.
	 */
	private function delete_config() {
		return \Jetpack_Options::delete_raw_option( 'jetpack_sync_full_config' );
	}

	/**
	 * Retrieve the current full sync enqueue config.
	 *
	 * @access private
	 *
	 * @return array Full sync enqueue config.
	 */
	private function get_config() {
		return \Jetpack_Options::get_raw_option( 'jetpack_sync_full_config' );
	}

	/**
	 * Update an option manually to bypass filters and caching.
	 *
	 * @access private
	 *
	 * @param string $name  Option name.
	 * @param mixed  $value Option value.
	 * @return int The number of updated rows in the database.
	 */
	private function write_option( $name, $value ) {
		// We write our own option updating code to bypass filters/caching/etc on set_option/get_option.
		global $wpdb;
		$serialized_value = maybe_serialize( $value );

		/**
		 * Try updating, if no update then insert
		 * TODO: try to deal with the fact that unchanged values can return updated_num = 0
		 * below we used "insert ignore" to at least suppress the resulting error.
		 */
		$updated_num = $wpdb->query(
			$wpdb->prepare(
				"UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s",
				$serialized_value,
				$name
			)
		);

		if ( ! $updated_num ) {
			$updated_num = $wpdb->query(
				$wpdb->prepare(
					"INSERT IGNORE INTO $wpdb->options ( option_name, option_value, autoload ) VALUES ( %s, %s, 'no' )",
					$name,
					$serialized_value
				)
			);
		}
		return $updated_num;
	}

	/**
	 * Update an option manually to bypass filters and caching.
	 *
	 * @access private
	 *
	 * @param string $name    Option name.
	 * @param mixed  $default Default option value.
	 * @return mixed Option value.
	 */
	private function read_option( $name, $default = null ) {
		global $wpdb;
		$value = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1",
				$name
			)
		);
		$value = maybe_unserialize( $value );

		if ( null === $value && null !== $default ) {
			return $default;
		}

		return $value;
	}
}

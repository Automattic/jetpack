<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-json-deflate-array-codec.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-modules.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';

/**
 * This class grabs pending actions from the queue and sends them
 */
class Jetpack_Sync_Sender {

	const NEXT_SYNC_TIME_OPTION_NAME = 'jetpack_next_sync_time';
	const WPCOM_ERROR_SYNC_DELAY = 60;
	const QUEUE_LOCKED_SYNC_DELAY = 10;

	private $dequeue_max_bytes;
	private $upload_max_bytes;
	private $upload_max_rows;
	private $max_dequeue_time;
	private $sync_wait_time;
	private $sync_wait_threshold;
	private $enqueue_wait_time;
	private $sync_queue;
	private $full_sync_queue;
	private $codec;

	// singleton functions
	private static $instance;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	// this is necessary because you can't use "new" when you declare instance properties >:(
	protected function __construct() {
		$this->set_defaults();
		$this->init();
	}

	private function init() {
		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->init_before_send();
		}
	}

	public function get_next_sync_time( $queue_name ) {
		return (double) get_option( self::NEXT_SYNC_TIME_OPTION_NAME . '_' . $queue_name, 0 );
	}

	public function set_next_sync_time( $time, $queue_name ) {
		return update_option( self::NEXT_SYNC_TIME_OPTION_NAME . '_' . $queue_name, $time, true );
	}

	public function do_full_sync() {
		$this->continue_full_sync_enqueue();
		return $this->do_sync_and_set_delays( $this->full_sync_queue );
	}

	private function continue_full_sync_enqueue() {
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			return false;
		}

		if ( $this->get_next_sync_time( 'full-sync-enqueue' ) > microtime( true ) ) {
			return false;
		}

		Jetpack_Sync_Modules::get_module( 'full-sync' )->continue_enqueuing();

		$this->set_next_sync_time( time() + $this->get_enqueue_wait_time(), 'full-sync-enqueue' );
	}

	public function do_sync() {
		return $this->do_sync_and_set_delays( $this->sync_queue );
	}

	public function do_sync_and_set_delays( $queue ) {
		// don't sync if importing
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			return false;
		}

		// don't sync if we are throttled
		if ( $this->get_next_sync_time( $queue->id ) > microtime( true ) ) {
			return false;
		}

		$start_time = microtime( true );

		Jetpack_Sync_Settings::set_is_syncing( true );

		$sync_result = $this->do_sync_for_queue( $queue );

		Jetpack_Sync_Settings::set_is_syncing( false );

		$exceeded_sync_wait_threshold = ( microtime( true ) - $start_time ) > (double) $this->get_sync_wait_threshold();
		
		if ( is_wp_error( $sync_result ) ) {
			if ( 'unclosed_buffer' === $sync_result->get_error_code() ) {
				$this->set_next_sync_time( time() + self::QUEUE_LOCKED_SYNC_DELAY, $queue->id );
			} else {
				$this->set_next_sync_time( time() + self::WPCOM_ERROR_SYNC_DELAY, $queue->id );
			}
			$sync_result = false;
		} elseif ( $exceeded_sync_wait_threshold ) {
			// if we actually sent data and it took a while, wait before sending again
			$this->set_next_sync_time( time() + $this->get_sync_wait_time(), $queue->id );
		}

		return $sync_result;
	}

	public function get_items_to_send( $buffer, $encode = true ) {
		// track how long we've been processing so we can avoid request timeouts
		$start_time = microtime( true );
		$upload_size   = 0;
		$items_to_send = array();
		$items         = $buffer->get_items();
		// set up current screen to avoid errors rendering content
		require_once( ABSPATH . 'wp-admin/includes/class-wp-screen.php' );
		require_once( ABSPATH . 'wp-admin/includes/screen.php' );
		set_current_screen( 'sync' );
		$skipped_items_ids = array();
		// we estimate the total encoded size as we go by encoding each item individually
		// this is expensive, but the only way to really know :/
		foreach ( $items as $key => $item ) {
			// Suspending cache addition help prevent overloading in memory cache of large sites.
			wp_suspend_cache_addition( true );
			/**
			 * Modify the data within an action before it is serialized and sent to the server
			 * For example, during full sync this expands Post ID's into full Post objects,
			 * so that we don't have to serialize the whole object into the queue.
			 *
			 * @since 4.2.0
			 *
			 * @param array The action parameters
			 * @param int The ID of the user who triggered the action
			 */
			$item[1] = apply_filters( 'jetpack_sync_before_send_' . $item[0], $item[1], $item[2] );
			wp_suspend_cache_addition( false );
			if ( $item[1] === false ) {
				$skipped_items_ids[] = $key;
				continue;
			}
			$encoded_item = $encode ? $this->codec->encode( $item ) : $item;
			$upload_size += strlen( $encoded_item );
			if ( $upload_size > $this->upload_max_bytes && count( $items_to_send ) > 0 ) {
				break;
			}
			$items_to_send[ $key ] = $encoded_item;
			if ( microtime(true) - $start_time > $this->max_dequeue_time ) {
				break;
			}
		}

		return array( $items_to_send, $skipped_items_ids, $items, microtime( true ) - $start_time );
	}

	public function do_sync_for_queue( $queue ) {

		do_action( 'jetpack_sync_before_send_queue_' . $queue->id );
		if ( $queue->size() === 0 ) {
			return false;
		}
		// now that we're sure we are about to sync, try to
		// ignore user abort so we can avoid getting into a
		// bad state
		if ( function_exists( 'ignore_user_abort' ) ) {
			ignore_user_abort( true );
		}

		$checkout_start_time = microtime( true );

		$buffer = $queue->checkout_with_memory_limit( $this->dequeue_max_bytes, $this->upload_max_rows );

		if ( ! $buffer ) {
			// buffer has no items
			return false;
		}

		if ( is_wp_error( $buffer ) ) {
			return $buffer;
		}

		$checkout_duration = microtime( true ) - $checkout_start_time;

		list( $items_to_send, $skipped_items_ids, $items, $preprocess_duration ) = $this->get_items_to_send( $buffer, true );

		/**
		 * Fires when data is ready to send to the server.
		 * Return false or WP_Error to abort the sync (e.g. if there's an error)
		 * The items will be automatically re-sent later
		 *
		 * @since 4.2.0
		 *
		 * @param array $data The action buffer
		 * @param string $codec The codec name used to encode the data
		 * @param double $time The current time
		 * @param string $queue The queue used to send ('sync' or 'full_sync')
		 */
		Jetpack_Sync_Settings::set_is_sending( true );
		$processed_item_ids = apply_filters( 'jetpack_sync_send_data', $items_to_send, $this->codec->name(), microtime( true ), $queue->id, $checkout_duration, $preprocess_duration );
		Jetpack_Sync_Settings::set_is_sending( false );
		
		if ( ! $processed_item_ids || is_wp_error( $processed_item_ids ) ) {
			$checked_in_item_ids = $queue->checkin( $buffer );
			if ( is_wp_error( $checked_in_item_ids ) ) {
				error_log( 'Error checking in buffer: ' . $checked_in_item_ids->get_error_message() );
				$queue->force_checkin();
			}
			if ( is_wp_error( $processed_item_ids ) ) {
				return $processed_item_ids;
			}
			// returning a WP_Error is a sign to the caller that we should wait a while
			// before syncing again
			return new WP_Error( 'server_error' );
		} else {
			// detect if the last item ID was an error
			$had_wp_error = is_wp_error( end( $processed_item_ids ) );
			if ( $had_wp_error ) {
				$wp_error = array_pop( $processed_item_ids );
			}
			// also checkin any items that were skipped
			if ( count( $skipped_items_ids ) > 0 ) {
				$processed_item_ids = array_merge( $processed_item_ids, $skipped_items_ids );
			}
			$processed_items = array_intersect_key( $items, array_flip( $processed_item_ids ) );
			/**
			 * Allows us to keep track of all the actions that have been sent.
			 * Allows us to calculate the progress of specific actions.
			 *
			 * @since 4.2.0
			 *
			 * @param array $processed_actions The actions that we send successfully.
			 */
			do_action( 'jetpack_sync_processed_actions', $processed_items );
			$queue->close( $buffer, $processed_item_ids );
			// returning a WP_Error is a sign to the caller that we should wait a while
			// before syncing again
			if ( $had_wp_error ) {
				return $wp_error;
			}
		}
		return true;
	}

	function get_sync_queue() {
		return $this->sync_queue;
	}

	function get_full_sync_queue() {
		return $this->full_sync_queue;
	}

	function get_codec() {
		return $this->codec;
	}

	function send_checksum() {
		require_once 'class.jetpack-sync-wp-replicastore.php';
		$store = new Jetpack_Sync_WP_Replicastore();
		do_action( 'jetpack_sync_checksum', $store->checksum_all() );
	}

	function reset_sync_queue() {
		$this->sync_queue->reset();
	}

	function reset_full_sync_queue() {
		$this->full_sync_queue->reset();
	}

	function set_dequeue_max_bytes( $size ) {
		$this->dequeue_max_bytes = $size;
	}

	// in bytes
	function set_upload_max_bytes( $max_bytes ) {
		$this->upload_max_bytes = $max_bytes;
	}

	// in rows
	function set_upload_max_rows( $max_rows ) {
		$this->upload_max_rows = $max_rows;
	}

	// in seconds
	function set_sync_wait_time( $seconds ) {
		$this->sync_wait_time = $seconds;
	}

	function get_sync_wait_time() {
		return $this->sync_wait_time;
	}

	function set_enqueue_wait_time( $seconds ) {
		$this->enqueue_wait_time = $seconds;
	}

	function get_enqueue_wait_time() {
		return $this->enqueue_wait_time;
	}

	// in seconds
	function set_sync_wait_threshold( $seconds ) {
		$this->sync_wait_threshold = $seconds;
	}

	function get_sync_wait_threshold() {
		return $this->sync_wait_threshold;
	}

	// in seconds
	function set_max_dequeue_time( $seconds ) {
		$this->max_dequeue_time = $seconds;
	}

	function set_defaults() {
		$this->sync_queue      = new Jetpack_Sync_Queue( 'sync' );
		$this->full_sync_queue = new Jetpack_Sync_Queue( 'full_sync' );
		$this->codec           = new Jetpack_Sync_JSON_Deflate_Array_Codec();

		// saved settings
		Jetpack_Sync_Settings::set_importing( null );
		$settings = Jetpack_Sync_Settings::get_settings();
		$this->set_dequeue_max_bytes( $settings['dequeue_max_bytes'] );
		$this->set_upload_max_bytes( $settings['upload_max_bytes'] );
		$this->set_upload_max_rows( $settings['upload_max_rows'] );
		$this->set_sync_wait_time( $settings['sync_wait_time'] );
		$this->set_enqueue_wait_time( $settings['enqueue_wait_time'] );
		$this->set_sync_wait_threshold( $settings['sync_wait_threshold'] );
		$this->set_max_dequeue_time( Jetpack_Sync_Defaults::get_max_sync_execution_time() );
	}

	function reset_data() {
		$this->reset_sync_queue();
		$this->reset_full_sync_queue();

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->reset_data();
		}
		
		foreach ( array( 'sync', 'full_sync' ) as $queue_name ) {
			delete_option( self::NEXT_SYNC_TIME_OPTION_NAME . '_' . $queue_name );
		}

		Jetpack_Sync_Settings::reset_data();
	}

	function uninstall() {
		// Lets delete all the other fun stuff like transient and option and the sync queue
		$this->reset_data();

		// delete the full sync status
		delete_option( 'jetpack_full_sync_status' );

		// clear the sync cron.
		wp_clear_scheduled_hook( 'jetpack_sync_cron' );
		wp_clear_scheduled_hook( 'jetpack_sync_full_cron' );
	}
}

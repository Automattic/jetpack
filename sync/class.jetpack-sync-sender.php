<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-json-deflate-codec.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-modules.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';

/**
 * This class grabs pending actions from the queue and sends them
 */
class Jetpack_Sync_Sender {

	const SYNC_THROTTLE_OPTION_NAME = 'jetpack_sync_min_wait';
	const NEXT_SYNC_TIME_OPTION_NAME = 'jetpack_next_sync_time';
	const WPCOM_ERROR_SYNC_DELAY = 60;

	private $dequeue_max_bytes;
	private $upload_max_bytes;
	private $upload_max_rows;
	private $sync_wait_time;
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

	public function get_next_sync_time() {
		return (double) get_option( self::NEXT_SYNC_TIME_OPTION_NAME, 0 );
	}

	public function set_next_sync_time( $time ) {
		return update_option( self::NEXT_SYNC_TIME_OPTION_NAME, $time, true );
	}

	public function do_sync() {
		// don't sync if importing
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			return false;
		}

		// don't sync if we are throttled
		if ( $this->get_next_sync_time() > microtime( true ) ) {
			return false;
		}
		
		$full_sync_result = $this->do_sync_for_queue( $this->full_sync_queue );
		$sync_result      = $this->do_sync_for_queue( $this->sync_queue );

		if ( is_wp_error( $full_sync_result ) || is_wp_error( $sync_result ) ) {
			$this->set_next_sync_time( time() + self::WPCOM_ERROR_SYNC_DELAY );
			$full_sync_result = false;
			$sync_result      = false;
		} else {
			$this->set_next_sync_time( time() + $this->get_sync_wait_time() );
		}

		// we use OR here because if either one returns true then the caller should
		// be allowed to call do_sync again, as there may be more items
		return $full_sync_result || $sync_result;
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

		$buffer = $queue->checkout_with_memory_limit( $this->dequeue_max_bytes, $this->upload_max_rows );

		if ( ! $buffer ) {
			// buffer has no items
			return false;
		}

		if ( is_wp_error( $buffer ) ) {
			// another buffer is currently sending
			return false;
		}

		$upload_size   = 0;
		$items_to_send = array();
		$items         = $buffer->get_items();

		// set up current screen to avoid errors rendering content
		require_once(ABSPATH . 'wp-admin/includes/class-wp-screen.php');
		require_once(ABSPATH . 'wp-admin/includes/screen.php');
		set_current_screen( 'sync' );

		// we estimate the total encoded size as we go by encoding each item individually
		// this is expensive, but the only way to really know :/
		foreach ( $items as $key => $item ) {
			/**
			 * Modify the data within an action before it is serialized and sent to the server
			 * For example, during full sync this expands Post ID's into full Post objects,
			 * so that we don't have to serialize the whole object into the queue.
			 *
			 * @since 4.2.0
			 *
			 * @param array The action parameters
			 */
			$item[1] = apply_filters( 'jetpack_sync_before_send_' . $item[0], $item[1], $item[2] );

			$encoded_item = $this->codec->encode( $item );

			$upload_size += strlen( $encoded_item );

			if ( $upload_size > $this->upload_max_bytes && count( $items_to_send ) > 0 ) {
				break;
			}

			$items_to_send[ $key ] = $encoded_item;
		}

		/**
		 * Fires when data is ready to send to the server.
		 * Return false or WP_Error to abort the sync (e.g. if there's an error)
		 * The items will be automatically re-sent later
		 *
		 * @since 4.2.0
		 *
		 * @param array $data The action buffer
		 */
		$processed_item_ids = apply_filters( 'jetpack_sync_send_data', $items_to_send, $this->codec->name(), microtime( true ) );

		if ( ! $processed_item_ids || is_wp_error( $processed_item_ids ) ) {
			$checked_in_item_ids = $queue->checkin( $buffer );

			if ( is_wp_error( $checked_in_item_ids ) ) {
				error_log( 'Error checking in buffer: ' . $checked_in_item_ids->get_error_message() );
				$queue->force_checkin();
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
		Jetpack_Sync_Modules::get_module( 'full-sync' )->clear_status();
		$this->sync_queue->reset();
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

	function set_defaults() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync' );
		$this->full_sync_queue = new Jetpack_Sync_Queue( 'full_sync' );
		$this->codec      = new Jetpack_Sync_JSON_Deflate_Codec();

		// saved settings
		$settings = Jetpack_Sync_Settings::get_settings();
		$this->set_dequeue_max_bytes( $settings['dequeue_max_bytes'] );
		$this->set_upload_max_bytes( $settings['upload_max_bytes'] );
		$this->set_upload_max_rows( $settings['upload_max_rows'] );
		$this->set_sync_wait_time( $settings['sync_wait_time'] );
	}

	function reset_data() {
		$this->reset_sync_queue();

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->reset_data();
		}

		delete_option( self::SYNC_THROTTLE_OPTION_NAME );
		delete_option( self::NEXT_SYNC_TIME_OPTION_NAME );

		Jetpack_Sync_Settings::reset_data();
	}

	function uninstall() {
		// Lets delete all the other fun stuff like transient and option and the sync queue
		$this->reset_data();

		// delete the full sync status
		delete_option( 'jetpack_full_sync_status' );

		// clear the sync cron.
		wp_clear_scheduled_hook( 'jetpack_sync_cron' );

		// clear the checksum cron
		wp_clear_scheduled_hook( 'jetpack_send_db_checksum' );
	}
}

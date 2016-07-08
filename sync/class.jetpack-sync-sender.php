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
	const LAST_SYNC_TIME_OPTION_NAME = 'jetpack_last_sync_time';

	private $dequeue_max_bytes;
	private $upload_max_bytes;
	private $upload_max_rows;
	private $sync_wait_time;
	private $sync_queue;
	private $full_sync_client;
	private $codec;

	// singleton functions
	private static $instance;

	public static function getInstance() {
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

		foreach( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->init_before_send();
		}

		/**
		 * Sync all pending actions with server
		 */
		add_action( 'jetpack_sync_actions', array( $this, 'do_sync' ) );
	}

	public function do_sync() {
		// don't sync if importing
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			$this->schedule_sync( "+1 minute" );

			return false;
		}

		// don't sync if we are throttled
		$sync_wait = $this->get_sync_wait_time();
		$last_sync = $this->get_last_sync_time();

		if ( $last_sync && $sync_wait && $last_sync + $sync_wait > microtime( true ) ) {
			return false;
		}

		$this->set_last_sync_time();

		do_action( 'jetpack_sync_before_send' );

		if ( $this->sync_queue->size() === 0 ) {
			return false;
		}

		// now that we're sure we are about to sync, try to
		// ignore user abort so we can avoid getting into a
		// bad state
		if ( function_exists( 'ignore_user_abort' ) ) {
			ignore_user_abort( true );
		}

		$buffer = $this->sync_queue->checkout_with_memory_limit( $this->dequeue_max_bytes, $this->upload_max_rows );

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
		$items = $buffer->get_items();

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
			$item[1] = apply_filters( "jetpack_sync_before_send_" . $item[0], $item[1], $item[2] );

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
			$processed_item_ids = $this->sync_queue->checkin( $buffer );

			if ( is_wp_error( $processed_item_ids ) ) {
				error_log( "Error checking in buffer: " . $processed_item_ids->get_error_message() );
				$this->sync_queue->force_checkin();
			}
			// try again in 1 minute
			$this->schedule_sync( "+1 minute" );
		} else {
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

			$this->sync_queue->close( $buffer, $processed_item_ids );
			// check if there are any more events in the buffer
			// if so, schedule a cron job to happen soon
			if ( $this->sync_queue->has_any_items() ) {
				$this->schedule_sync( "+1 minute" );
			}
		}
	}

	private function schedule_sync( $when ) {
		wp_schedule_single_event( strtotime( $when ), 'jetpack_sync_actions' );
	}

	function get_sync_queue() {
		return $this->sync_queue;
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

	private function get_last_sync_time() {
		return (double) get_option( self::LAST_SYNC_TIME_OPTION_NAME );
	}

	private function set_last_sync_time() {
		return update_option( self::LAST_SYNC_TIME_OPTION_NAME, microtime( true ), true );
	}

	function set_defaults() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync' );
		$this->codec = new Jetpack_Sync_JSON_Deflate_Codec();

		// saved settings
		$settings = Jetpack_Sync_Settings::get_settings();
		$this->set_dequeue_max_bytes( $settings['dequeue_max_bytes'] );
		$this->set_upload_max_bytes( $settings['upload_max_bytes'] );
		$this->set_upload_max_rows( $settings['upload_max_rows'] );
		$this->set_sync_wait_time( $settings['sync_wait_time'] );
	}

	function reset_data() {
		$this->reset_sync_queue();

		foreach( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->reset_data();
		}

		delete_option( self::SYNC_THROTTLE_OPTION_NAME );
		delete_option( self::LAST_SYNC_TIME_OPTION_NAME );

		Jetpack_Sync_Settings::reset_data();
	}

	function uninstall() {
		// Lets delete all the other fun stuff like transient and option and the sync queue
		$this->reset_data();

		// delete the full sync status
		delete_option( 'jetpack_full_sync_status' );

		// clear the sync cron.
		wp_clear_scheduled_hook( 'jetpack_sync_actions' );

		// clear the checksum cron
		wp_clear_scheduled_hook( 'jetpack_send_db_checksum' );
	}
}

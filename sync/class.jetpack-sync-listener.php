<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-modules.php';

/**
 * This class monitors actions and logs them to the queue to be sent
 */
class Jetpack_Sync_Listener {
	const QUEUE_SIZE_CHECK_TRANSIENT = "jetpack_sync_last_checked_queue_size";
	const QUEUE_SIZE_CHECK_TIMEOUT = 300; // 5 minutes

	private $sync_queue;
	private $sync_queue_limit;

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

		$handler = array( $this, 'action_handler' );

		foreach( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->init_listeners( $handler );
		}

		// Module Activation
		add_action( 'jetpack_activate_module', $handler );
		add_action( 'jetpack_deactivate_module', $handler );

		// Send periodic checksum
		add_action( 'jetpack_sync_checksum', $handler );
	}

	function get_sync_queue() {
		return $this->sync_queue;
	}

	function set_queue_limit( $limit ) {
		$this->sync_queue_limit = $limit;
	}

	function get_queue_limit() {
		return $this->sync_queue_limit;
	}

	function force_recheck_queue_limit() {
		delete_transient( self::QUEUE_SIZE_CHECK_TRANSIENT );
	}

	function is_over_queue_limit() {
		$queue_size = get_transient( self::QUEUE_SIZE_CHECK_TRANSIENT );

		if ( $queue_size === false ) {
			$queue_size = $this->sync_queue->size();
			set_transient( self::QUEUE_SIZE_CHECK_TRANSIENT, $queue_size, self::QUEUE_SIZE_CHECK_TIMEOUT );
		}

		return ( $queue_size + 1 ) > $this->sync_queue_limit;
	}

	function action_handler() {
		$current_filter = current_filter();
		$args           = func_get_args();

		if ( $current_filter === 'upgrader_process_complete' ) {
			array_shift( $args );
		}

		/**
		 * Modify or reject the data within an action before it is enqueued locally.
		 *
		 * @since 4.2.0
		 *
		 * @param array The action parameters
		 */
		$args = apply_filters( "jetpack_sync_before_enqueue_$current_filter", $args );

		// allow listeners to abort
		if ( $args === false ) {
			return;
		}

		// periodically check the size of the queue, and disable adding to it if
		// it exceeds some limit
		if ( $this->is_over_queue_limit() ) {
			return;
		}

		// if we add any items to the queue, we should
		// try to ensure that our script can't be killed before
		// they are sent
		if ( function_exists( 'ignore_user_abort' ) ) {
			ignore_user_abort( true );
		}

		$this->sync_queue->add( array(
			$current_filter,
			$args,
			get_current_user_id(),
			microtime( true )
		) );
	}

	function set_defaults() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync' );
		$this->set_queue_limit( Jetpack_Sync_Settings::get_setting( 'max_queue_size' ) );
	}
}

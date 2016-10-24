<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-modules.php';

/**
 * This class monitors actions and logs them to the queue to be sent
 */
class Jetpack_Sync_Listener {
	const QUEUE_STATE_CHECK_TRANSIENT = 'jetpack_sync_last_checked_queue_state';
	const QUEUE_STATE_CHECK_TIMEOUT = 300; // 5 minutes

	private $sync_queue;
	private $full_sync_queue;
	private $sync_queue_size_limit;
	private $sync_queue_lag_limit;

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

		$handler = array( $this, 'action_handler' );
		$full_sync_handler = array( $this, 'full_sync_action_handler' );

		foreach ( Jetpack_Sync_Modules::get_modules() as $module ) {
			$module->init_listeners( $handler );
			$module->init_full_sync_listeners( $full_sync_handler );
		}

		// Module Activation
		add_action( 'jetpack_activate_module', $handler );
		add_action( 'jetpack_deactivate_module', $handler );

		// Jetpack Upgrade
		add_action( 'updating_jetpack_version', $handler, 10, 2 );

		// Send periodic checksum
		add_action( 'jetpack_sync_checksum', $handler );
	}

	function get_sync_queue() {
		return $this->sync_queue;
	}

	function get_full_sync_queue() {
		return $this->full_sync_queue;
	}

	function set_queue_size_limit( $limit ) {
		$this->sync_queue_size_limit = $limit;
	}

	function get_queue_size_limit() {
		return $this->sync_queue_size_limit;
	}

	function set_queue_lag_limit( $age ) {
		$this->sync_queue_lag_limit = $age;
	}

	function get_queue_lag_limit() {
		return $this->sync_queue_lag_limit;
	}

	function force_recheck_queue_limit() {
		delete_transient( self::QUEUE_STATE_CHECK_TRANSIENT . '_' . $this->sync_queue->id );
		delete_transient( self::QUEUE_STATE_CHECK_TRANSIENT . '_' . $this->full_sync_queue->id );
	}

	// prevent adding items to the queue if it hasn't sent an item for 15 mins
	// AND the queue is over 1000 items long (by default)
	function can_add_to_queue( $queue ) {
		if ( Jetpack_Sync_Settings::get_setting( 'disable' ) ) {
			return false;
		}

		$state_transient_name = self::QUEUE_STATE_CHECK_TRANSIENT . '_' . $queue->id;

		$queue_state = get_transient( $state_transient_name );

		if ( false === $queue_state ) {
			$queue_state = array( $queue->size(), $queue->lag() );
			set_transient( $state_transient_name, $queue_state, self::QUEUE_STATE_CHECK_TIMEOUT );
		}

		list( $queue_size, $queue_age ) = $queue_state;

		return ( $queue_age < $this->sync_queue_lag_limit )
		       ||
		       ( ( $queue_size + 1 ) < $this->sync_queue_size_limit );
	}

	function full_sync_action_handler() {
		$args = func_get_args();
		$this->enqueue_action( current_filter(), $args, $this->full_sync_queue );
	}

	function action_handler() {
		$args = func_get_args();
		$this->enqueue_action( current_filter(), $args, $this->sync_queue );
	}

	// add many actions to the queue directly, without invoking them
	function bulk_enqueue_full_sync_actions( $action_name, $args_array ) {
		$queue = $this->get_full_sync_queue();

		// periodically check the size of the queue, and disable adding to it if
		// it exceeds some limit AND the oldest item exceeds the age limit (i.e. sending has stopped)
		if ( ! $this->can_add_to_queue( $queue ) ) {
			return;
		}

		// if we add any items to the queue, we should try to ensure that our script 
		// can't be killed before they are sent
		if ( function_exists( 'ignore_user_abort' ) ) {
			ignore_user_abort( true );
		}

		$data_to_enqueue = array();
		$user_id         = get_current_user_id();
		$currtime        = microtime( true );
		$is_importing    = Jetpack_Sync_Settings::is_importing();

		foreach( $args_array as $args ) {

			/**
			 * Modify or reject the data within an action before it is enqueued locally.
			 *
			 * @since 4.2.0
			 *
			 * @param array The action parameters
			 */
			$args = apply_filters( "jetpack_sync_before_enqueue_$action_name", $args );

			// allow listeners to abort
			if ( $args === false ) {
				continue;
			}

			$data_to_enqueue[] = array(
				$action_name,
				array( $args ),
				$user_id,
				$currtime,
				$is_importing,
			);
		}

		$queue->add_all( $data_to_enqueue );
	}

	function enqueue_action( $current_filter, $args, $queue ) {
		// don't enqueue an action during the outbound http request - this prevents recursion
		if ( Jetpack_Sync_Settings::is_sending() ) {
			return;
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
		// it exceeds some limit AND the oldest item exceeds the age limit (i.e. sending has stopped)
		if ( ! $this->can_add_to_queue( $queue ) ) {
			return;
		}

		// if we add any items to the queue, we should try to ensure that our script 
		// can't be killed before they are sent
		if ( function_exists( 'ignore_user_abort' ) ) {
			ignore_user_abort( true );
		}

		$queue->add( array(
			$current_filter,
			$args,
			get_current_user_id(),
			microtime( true ),
			Jetpack_Sync_Settings::is_importing()
		) );
	}

	function set_defaults() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync' );
		$this->full_sync_queue = new Jetpack_Sync_Queue( 'full_sync' );
		$this->set_queue_size_limit( Jetpack_Sync_Settings::get_setting( 'max_queue_size' ) );
		$this->set_queue_lag_limit( Jetpack_Sync_Settings::get_setting( 'max_queue_lag' ) );
	}
}

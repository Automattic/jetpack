<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-queue.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-functions.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-full.php';
require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';

require_once dirname( __FILE__ ) . '/class.jetpack-sync-modules.php';

/** 
 * This class monitors actions and logs them to the queue to be sent
 */
class Jetpack_Sync_Listener {
	
	private static $valid_settings = array( 'dequeue_max_bytes' => true, 'upload_max_bytes' => true, 'upload_max_rows' => true, 'sync_wait_time' => true );

	private $sync_queue;
	private $full_sync_client;
	private $taxonomy_whitelist;
	private $is_multisite;

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

		/**
		 * Most of the following hooks are sent to the same $handler
		 * for immediate serialization and queuing be sent to the server.
		 * The only exceptions are actions which need additional processing.
		 */

		// terms
		add_action( 'created_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'edited_term', array( $this, 'save_term_handler' ), 10, 3 );
		add_action( 'jetpack_sync_save_term', $handler, 10, 4 );
		add_action( 'delete_term', $handler, 10, 4 );
		add_action( 'set_object_terms', $handler, 10, 6 );
		add_action( 'deleted_term_relationships', $handler, 10, 2 );

		add_action( 'deleted_plugin', $handler, 10, 2 );
		add_action( 'activated_plugin', $handler, 10, 2 );
		add_action( 'deactivated_plugin', $handler, 10, 2 );


		// synthetic actions for full sync
		add_action( 'jetpack_full_sync_start', $handler );
		add_action( 'jetpack_full_sync_end', $handler );
		add_action( 'jetpack_full_sync_terms', $handler, 10, 2 );
		
		// Module Activation
		add_action( 'jetpack_activate_module', $handler );
		add_action( 'jetpack_deactivate_module', $handler );

		// Send periodic checksum
		add_action( 'jetpack_sync_checksum', $handler );
	}

	function set_taxonomy_whitelist( $taxonomies ) {
		$this->taxonomy_whitelist = $taxonomies;
	}

	function set_full_sync_client( $full_sync_client ) {
		if ( $this->full_sync_client ) {
			remove_action( 'jetpack_sync_full', array( $this->full_sync_client, 'start' ) );
		}

		$this->full_sync_client = $full_sync_client;

		/**
		 * Sync all objects in the database with the server
		 */
		add_action( 'jetpack_sync_full', array( $this->full_sync_client, 'start' ) );
	}

	function get_full_sync_client() {
		return $this->full_sync_client;
	}

	function action_handler() {
		$current_filter = current_filter();
		$args           = func_get_args();

		if ( $current_filter == 'upgrader_process_complete' ) {
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

	function save_term_handler( $term_id, $tt_id, $taxonomy ) {
		if ( class_exists( 'WP_Term' ) ) {
			$term_object = WP_Term::get_instance( $term_id, $taxonomy );
		} else {
			$term_object = get_term_by( 'id', $term_id, $taxonomy );
		}

		/**
		 * Fires when the client needs to sync a new term
		 *
		 * @since 4.2.0
		 *
		 * @param object the Term object
		 */
		do_action( 'jetpack_sync_save_term', $term_object );
	}

	function set_defaults() {
		$this->sync_queue = new Jetpack_Sync_Queue( 'sync' );

		$this->set_full_sync_client( Jetpack_Sync_Full::getInstance() );
		$this->taxonomy_whitelist        = Jetpack_Sync_Defaults::$default_taxonomy_whitelist;
		$this->is_multisite              = is_multisite();
	}
}

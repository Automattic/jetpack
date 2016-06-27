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
 * - we fire a trigger for the entire array which the Jetpack_Sync_Client then serializes and queues.
 */

require_once 'class.jetpack-sync-wp-replicastore.php';

class Jetpack_Sync_Full {
	const ARRAY_CHUNK_SIZE = 10;
	static $status_option = 'jetpack_full_sync_status';
	static $transient_timeout = 3600; // an hour
	static $modules = array(
		'wp_version',
		'constants',
		'functions',
		'options',
		'posts',
		'comments',
		'themes',
		'updates',
		'users',
		'terms',
		'network_options',
	);

	// singleton functions
	private static $instance;
	private $client;

	public static function getInstance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	protected function __construct() {
		$this->init();
	}

	function init() {
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_posts', array( $this, 'expand_post_ids' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_comments', array( $this, 'expand_comment_ids' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_options', array( $this, 'expand_options' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_constants', array( $this, 'expand_constants' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_callables', array( $this, 'expand_callables' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_users', array( $this, 'expand_users' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_updates', array( $this, 'expand_updates' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_network_options', array(
			$this,
			'expand_network_options'
		) );

		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_terms', array( $this, 'expand_term_ids' ) );

		add_action( 'jetpack_sync_processed_actions', array( $this, 'update_sent_progress_action' ) );
	}

	function start() {
		if( ! $this->should_start_full_sync() ) {
			return;
		}
		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it can clear the replica storage,
		 * and/or reset other data.
		 *
		 * @since 4.1
		 */
		do_action( 'jetpack_full_sync_start' );
		$this->set_status_queuing_started();

		$this->enqueue_all_constants();
		$this->enqueue_all_functions();
		$this->enqueue_all_options();

		if ( is_multisite() ) {
			$this->enqueue_all_network_options();
		}

		$this->enqueue_all_terms();
		$this->enqueue_all_theme_info();
		$this->enqueue_all_users();
		$this->enqueue_all_posts();
		$this->enqueue_all_comments();
		$this->enqueue_all_updates();

		$this->set_status_queuing_finished();

		$store = new Jetpack_Sync_WP_Replicastore();
		do_action( 'jetpack_full_sync_end', $store->checksum_all() );
	}

	private function should_start_full_sync() {
		$status = $this->get_status();
		// We should try sync if we haven't started it yet or if we have finished it.
		if( is_null( $status['started'] ) || is_integer( $status['finished'] ) ) {
			return true;
		}
		return false;
	}

	private function get_client() {
		if ( ! $this->client ) {
			$this->client = Jetpack_Sync_Client::getInstance();
		}

		return $this->client;
	}

	private function enqueue_all_constants() {
		$total = $this->get_client()->full_sync_constants();
		$this->update_queue_progress( 'constants', $total );
	}

	private function enqueue_all_functions() {
		$total = $this->get_client()->full_sync_callables();
		$this->update_queue_progress( 'functions', $total );
	}

	private function enqueue_all_options() {
		$total = $this->get_client()->force_sync_options();
		$this->update_queue_progress( 'options', $total );
	}

	private function enqueue_all_network_options() {
		$total = $this->get_client()->force_sync_network_options();
		$this->update_queue_progress( 'network_options', $total );
	}

	private function enqueue_all_terms() {
		global $wpdb;

		$taxonomies = get_taxonomies();
		$total_chunks_counter = 0;
		foreach ( $taxonomies as $taxonomy ) {
			// I hope this is never bigger than RAM...
			$term_ids = $wpdb->get_col( $wpdb->prepare( "SELECT term_id FROM $wpdb->term_taxonomy WHERE taxonomy = %s", $taxonomy ) ); // Should we set a limit here?
			// Request posts in groups of N for efficiency
			$chunked_term_ids = array_chunk( $term_ids, self::ARRAY_CHUNK_SIZE );

			// Send each chunk as an array of objects
			foreach ( $chunked_term_ids as $chunk ) {
				do_action( 'jetpack_full_sync_terms', $chunk, $taxonomy );
				$total_chunks_counter++;
			}
		}

		$this->update_queue_progress( 'terms', $total_chunks_counter );

	}

	private function enqueue_all_posts() {
		global $wpdb;

		$post_type_sql = Jetpack_Sync_Defaults::get_blacklisted_post_types_sql();
		$total = $this->enqueue_all_ids_as_action( 'jetpack_full_sync_posts', $wpdb->posts, 'ID', $post_type_sql );
		$this->update_queue_progress( 'posts', $total );

	}

	private function enqueue_all_ids_as_action( $action_name, $table_name, $id_field, $where_sql ) {
		global $wpdb;

		if ( ! $where_sql ) {
			$where_sql = "1 = 1";
		}

		$items_per_page = 500;
		$page = 1;
		$offset = ( $page * $items_per_page ) - $items_per_page;
		$chunk_count = 0;
		while( $ids = $wpdb->get_col( "SELECT {$id_field} FROM {$table_name} WHERE {$where_sql} ORDER BY {$id_field} asc LIMIT {$offset}, {$items_per_page}" ) ) {
			// Request posts in groups of N for efficiency
			$chunked_ids = array_chunk( $ids, self::ARRAY_CHUNK_SIZE );

			// Send each chunk as an array of objects
			foreach ( $chunked_ids as $chunk ) {
				/**
			 	 * Fires with a chunk of object IDs during full sync.
			 	 * These are expanded to full objects before upload
			 	 *
			 	 * @since 4.1
			 	 */
				do_action( $action_name, $chunk );
				$chunk_count++;
			}

			$page += 1;
			$offset = ( $page * $items_per_page ) - $items_per_page;
		}
		return $chunk_count;
	}

	public function expand_post_ids( $args ) {
		$post_ids = $args[0];

		$posts = array_map( array( 'WP_Post', 'get_instance' ), $post_ids );
		$posts = array_map( array( $this->get_client(), 'filter_post_content_and_add_links' ), $posts );

		return array(
			$posts,
			$this->get_metadata( $post_ids, 'post' ),
			$this->get_term_relationships( $post_ids )
		);
	}

	private function enqueue_all_comments() {
		global $wpdb;

		$total = $this->enqueue_all_ids_as_action( 'jetpack_full_sync_comments', $wpdb->comments, 'comment_ID', null );
		$this->update_queue_progress( 'comments', $total );
	}

	public function expand_comment_ids( $args ) {
		$comment_ids = $args[0];
		$comments    = get_comments( array(
			'include_unapproved' => true,
			'comment__in'        => $comment_ids,
		) );

		return array(
			$comments,
			$this->get_metadata( $comment_ids, 'comment' ),
		);
	}

	public function expand_term_ids( $args ) {
		global $wp_version;
		$term_ids = $args[0];
		$taxonomy = $args[1];
		// version 4.5 or higher
		if ( version_compare( $wp_version, 4.5, '>=' ) ) {
			$terms = get_terms( array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'include'    => $term_ids
			) );
		} else {
			$terms = get_terms( $taxonomy, array(
				'hide_empty' => false,
				'include'    => $term_ids
			) );
		}

		return $terms;
	}

	public function expand_options( $args ) {
		if ( $args[0] ) {
			return $this->get_client()->get_all_options();
		}

		return $args;
	}

	public function expand_constants( $args ) {
		if ( $args[0] ) {
			return $this->get_client()->get_all_constants();
		}
		return $args;
	}

	public function expand_callables( $args ) {
		if ( $args[0] ) {
			return $this->get_client()->get_all_callables();
		}
		return $args;
	}

	private function enqueue_all_users() {
		global $wpdb;
		$total = $this->enqueue_all_ids_as_action( 'jetpack_full_sync_users', $wpdb->users, 'ID', null );
		$this->update_queue_progress( 'users', $total );
	}

	public function expand_users( $args ) {
		$user_ids = $args[0];
		return array_map( array( $this->get_client(), 'sanitize_user_and_expand' ), get_users( array( 'include' => $user_ids ) ) );
	}

	public function expand_network_options( $args ) {
		if ( $args[0] ) {
			return $this->get_client()->get_all_network_options();
		}

		return $args;
	}

	private function get_metadata( $ids, $meta_type ) {
		global $wpdb;
		$table = _get_meta_table( $meta_type );
		$id    = $meta_type . '_id';
		if ( ! $table ) {
			return array();
		}

		return $wpdb->get_results( "SELECT $id, meta_key, meta_value, meta_id FROM $table WHERE $id IN ( " . implode( ',', wp_parse_id_list( $ids ) ) . " )", OBJECT );
	}

	private function get_term_relationships( $ids ) {
		global $wpdb;

		return $wpdb->get_results( "SELECT object_id, term_taxonomy_id FROM $wpdb->term_relationships WHERE object_id IN ( " . implode( ',', wp_parse_id_list( $ids ) ) . " )", OBJECT );
	}

	// TODO:
	private function enqueue_all_theme_info() {
		$total = $this->get_client()->send_theme_info();
		$this->update_queue_progress( 'themes', $total );
	}

	private function enqueue_all_updates() {

		// check for updates
		$total = $this->get_client()->full_sync_updates();
		$this->update_queue_progress( 'updates', $total );
	}

	public function expand_updates( $args ) {
		if ( $args[0] ) {
			return $this->get_client()->get_all_updates();
		}

		return $args;
	}
	
	function update_sent_progress_action( $actions_sent ) {
		$modules_count = array();
		$status = $this->get_status();
		if ( is_null( $status['started'] ) || $status['finished'] ) {
			return;
		}

		if ( in_array( 'jetpack_full_sync_start', $actions_sent ) ) {
			$this->set_status_sending_started();
			$status['sent_started'] = time();
		}

		foreach( $actions_sent as $action ) {
			$module_key = $this->action_to_modules( $action );
			if ( $module_key ) {
				$modules_count[ $module_key ] = isset( $modules_count[ $module_key ] ) ?  $modules_count[ $module_key ] + 1 : 1;
			}

		}
		foreach( $modules_count as $module => $count ) {
			$status[ 'sent' ][ $module ] = $this->update_sent_progress( $module, $count );
		}

		if ( in_array( 'jetpack_full_sync_end', $actions_sent ) ) {
			$this->set_status_sending_finished();
			$status['finished'] = time();
		}
		
		$this->update_status( $status );
	}

	function action_to_modules( $action ) {
		switch( $action ) {
			case 'jetpack_full_sync_constants':
				return 'constants';
				break;

			case 'jetpack_full_sync_callables':
				return 'functions';
				break;

			case 'jetpack_full_sync_options':
				return 'options';
				break;

			case 'jetpack_full_sync_network_options':
				return 'network_options';
				break;

			case 'jetpack_full_sync_terms':
				return 'terms';
				break;

			case 'jetpack_sync_current_theme_support':
				return 'themes';
				break;

			case 'jetpack_full_sync_users':
				return 'users';
				break;

			case 'jetpack_full_sync_posts':
				return 'posts';
				break;

			case 'jetpack_full_sync_comments':
				return 'comments';
				break;

			case 'jetpack_full_sync_updates':
				return 'updates';
				break;

		}
		return null;
	}

	private function set_status_queuing_started() {
		$status = $this->initial_status;
		$status[ 'started' ] = time();
		$this->update_status( $status );
	}

	private function set_status_queuing_finished() {
		$this->update_status( array( 'queue_finished' => time() ) );
	}

	// these are called by the Sync Client when it sees that the full sync start/end actions have actually been transmitted
	public function set_status_sending_started() {
		/**
		 * Fires when the full_sync_start action is actually transmitted.
		 * This is useful for telling the user the status of full synchronization.
		 *
		 * @since 4.1
		 */

		do_action( 'jetpack_full_sync_start_sent' );

	}

	public function set_status_sending_finished() {
		/**
		 * Fires when the full_sync_end action is actually transmitted.
		 * This is useful for telling the user the status of full synchronization.
		 *
		 * @since 4.1
		 */
		do_action( 'jetpack_full_sync_end_sent' );
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
		return get_option( self::$status_option, $this->initial_status );
	}


	public function update_status( $status ) {
		return update_option(
			self::$status_option,
			array_merge( $this->get_status(), $status )
		);
	}

	private function clear_status() {
		delete_option( self::$status_option );
	}

	public function update_queue_progress( $module, $data ) {
		$status = $this->get_status();
		if ( isset( $status['queue'][ $module ] ) )  {
			$status['queue'][ $module ] = $data + $status['queue'][ $module ];
		} else {
			$status['queue'][ $module ] = $data;
		}

		return $this->update_status( $status );
	}

	public function update_sent_progress( $module, $data ) {
		$status = $this->get_status();
		if ( isset( $status['sent'][ $module ] ) )  {
			return $data + $status['sent'][ $module ];
		} else {
			return $data;
		}
	}
	
}

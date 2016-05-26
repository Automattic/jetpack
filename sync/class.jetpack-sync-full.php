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
	static $status_transient_name = 'jetpack_full_sync_progress';
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
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_users', array( $this, 'expand_users' ) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_network_options', array(
			$this,
			'expand_network_options'
		) );
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_terms', array( $this, 'expand_term_ids' ) );
	}

	function start() {
		/**
		 * Fires when a full sync begins. This action is serialized
		 * and sent to the server so that it can clear the replica storage,
		 * and/or reset other data.
		 *
		 * @since 4.1
		 */
		do_action( 'jetpack_full_sync_start' );

		$this->set_status_queuing_started();

		$this->enqueue_wp_version();
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

	private function get_client() {
		if ( ! $this->client ) {
			$this->client = Jetpack_Sync_Client::getInstance();
		}

		return $this->client;
	}

	private function enqueue_wp_version() {
		$this->set_status( 'wp_version', 0 );
		global $wp_version;
		do_action( 'jetpack_sync_wp_version', $wp_version );
		$this->set_status( 'wp_version', 100 );
	}

	private function enqueue_all_constants() {
		$this->set_status( 'constants', 0 );
		$this->get_client()->force_sync_constants();
		$this->set_status( 'constants', 100 );
	}

	private function enqueue_all_functions() {
		$this->set_status( 'functions', 0 );
		$this->get_client()->force_sync_callables();
		$this->set_status( 'functions', 100 );
	}

	private function enqueue_all_options() {
		$this->set_status( 'options', 0 );
		$this->get_client()->force_sync_options();
		$this->set_status( 'options', 100 );
	}

	private function enqueue_all_network_options() {
		$this->set_status( 'network_options', 0 );
		$this->get_client()->force_sync_network_options();
		$this->set_status( 'network_options', 100 );
	}

	private function enqueue_all_terms() {
		$this->set_status( 'terms', 0 );
		global $wpdb;

		$taxonomies = get_taxonomies();

		$taxonomy_counter = 0;
		$total_count      = count( $taxonomies );

		foreach ( $taxonomies as $taxonomy ) {

			// I hope this is never bigger than RAM...
			$term_ids = $wpdb->get_col( $wpdb->prepare( "SELECT term_id FROM $wpdb->term_taxonomy WHERE taxonomy = %s", $taxonomy ) ); // Should we set a limit here?
			// Request posts in groups of N for efficiency
			$chunked_term_ids = array_chunk( $term_ids, self::ARRAY_CHUNK_SIZE );

			$total_chunks  = count( $chunked_term_ids );
			$chunk_counter = 0;
			// Send each chunk as an array of objects
			foreach ( $chunked_term_ids as $chunk ) {
				$this->set_status( 'terms', ( ( $taxonomy_counter / $total_count ) + ( ( $chunk_counter / $total_chunks ) / $total_count ) ) * 100 );
				do_action( 'jetpack_full_sync_terms', $chunk, $taxonomy );
				$chunk_counter ++;
			}
			$taxonomy_counter ++;
		}
		$this->set_status( 'terms', 100 );
	}

	private function enqueue_all_posts() {
		$this->set_status( 'posts', 0 );
		global $wpdb;

		// I hope this is never bigger than RAM...
		$post_type_sql = Jetpack_Sync_Defaults::get_blacklisted_post_types_sql();
		$post_ids      = $wpdb->get_col( "SELECT id FROM $wpdb->posts WHERE $post_type_sql" ); // Should we set a limit here?

		// Request posts in groups of N for efficiency
		$chunked_post_ids = array_chunk( $post_ids, self::ARRAY_CHUNK_SIZE );

		$counter = 0;
		$total   = count( $chunked_post_ids );

		// Send each chunk as an array of objects
		foreach ( $chunked_post_ids as $chunk ) {
			$this->set_status( 'posts', ( $counter / $total ) * 100 );
			do_action( 'jetpack_full_sync_posts', $chunk );
			$counter += 1;
		}

		$this->set_status( 'posts', 100 );
	}

	public function expand_post_ids( $args ) {
		$post_ids = $args[0];

		$posts = array_map( array( 'WP_Post', 'get_instance' ), $post_ids );
		$posts = array_map( array( $this->get_client(), 'filter_post_content_and_add_links' ), $posts );

		return array(
			'posts'      => $posts,
			'post_metas' => $this->get_metadata( $post_ids, 'post' ),
			'terms'      => $this->get_term_relationships( $post_ids )
		);
	}

	private function enqueue_all_comments() {
		$this->set_status( 'comments', 0 );

		global $wpdb;

		$comment_ids         = $wpdb->get_col( "SELECT comment_id FROM $wpdb->comments" ); // Should we set a limit here?
		$chunked_comment_ids = array_chunk( $comment_ids, self::ARRAY_CHUNK_SIZE );

		$counter = 0;
		$total   = count( $chunked_comment_ids );

		foreach ( $chunked_comment_ids as $chunk ) {
			$this->set_status( 'comments', ( $counter / $total ) * 100 );
			do_action( 'jetpack_full_sync_comments', $chunk );
			$counter += 1;
		}

		$this->set_status( 'comments', 100 );
	}

	public function expand_comment_ids( $args ) {
		$comment_ids = $args[0];
		$comments    = get_comments( array(
			'include_unapproved' => true,
			'comment__in'        => $comment_ids,
		) );

		return array(
			'comments'      => $comments,
			'comment_metas' => $this->get_metadata( $comment_ids, 'comment' ),
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

	private function enqueue_all_users() {
		$this->set_status( 'users', 0 );

		$user_ids          = get_users( array( 'fields' => 'ID' ) );
		$chunked_users_ids = array_chunk( $user_ids, self::ARRAY_CHUNK_SIZE );

		$counter = 0;
		$total   = count( $chunked_users_ids );

		foreach ( $chunked_users_ids as $chunk ) {
			$this->set_status( 'users', ( $counter / $total ) * 100 );
			/**
			 * Fires with a chunk of user IDs during full sync.
			 * These get expanded to full user objects before upload (minus passwords)
			 *
			 * @since 4.1
			 */
			do_action( 'jetpack_full_sync_users', $chunk );
			$counter += 1;
		}

		$this->set_status( 'users', 100 );
	}

	public function expand_users( $args ) {
		$user_ids = $args[0];

		return array_map( array( $this->get_client(), 'sanitize_user' ), get_users( array( 'include' => $user_ids ) ) );
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

		return $wpdb->get_results( "SELECT * FROM $table WHERE $id IN ( " . implode( ',', wp_parse_id_list( $ids ) ) . " )", OBJECT );
	}

	private function get_term_relationships( $ids ) {
		global $wpdb;

		return $wpdb->get_results( "SELECT * FROM $wpdb->term_relationships WHERE object_id IN ( " . implode( ',', wp_parse_id_list( $ids ) ) . " )", OBJECT );
	}

	// TODO:
	private function enqueue_all_theme_info() {
		$this->set_status( 'themes', 0 );
		$this->get_client()->send_theme_info();
		$this->set_status( 'themes', 100 );
	}

	private function enqueue_all_updates() {
		$this->set_status( 'updates', 0 );
		// check for updates
		wp_update_plugins();
		wp_update_themes();
		_maybe_update_core();
		$this->set_status( 'updates', 100 );
	}

	private function set_status( $name, $percent, $count = 1, $total = 1 ) {
		set_transient( self::$status_transient_name . '_' . $name,
			array(
				'progress' => $percent,
				// 'count' => $count, 
				// 'total' => $total 
			),
			self::$transient_timeout
		);
	}

	private function set_status_queuing_started() {
		set_transient( self::$status_transient_name, array( 'phase' => 'queuing started' ), self::$transient_timeout );
	}

	private function set_status_queuing_finished() {
		set_transient( self::$status_transient_name, array( 'phase' => 'queuing finished' ), self::$transient_timeout );
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
		set_transient( self::$status_transient_name, array( 'phase' => 'sending started' ), self::$transient_timeout );
	}

	public function set_status_sending_finished() {
		/**
		 * Fires when the full_sync_end action is actually transmitted.
		 * This is useful for telling the user the status of full synchronization.
		 *
		 * @since 4.1
		 */
		do_action( 'jetpack_full_sync_end_sent' );
		set_transient( self::$status_transient_name, array( 'phase' => 'sending finished' ), self::$transient_timeout );
	}

	public function get_status() {
		$status = get_transient( self::$status_transient_name );
		if ( ! is_array( $status ) ) {
			return array( 'phase' => 'not started' );
		}

		return $status;
	}

	public function get_module_status( $module ) {
		return get_transient( self::$status_transient_name . '_' . $module );
	}

	public function get_complete_status() {
		return array_merge(
			$this->get_status(),
			array_combine(
				Jetpack_Sync_Full::$modules,
				array_map( array( $this, 'get_module_status' ), Jetpack_Sync_Full::$modules )
			)
		);
	}
}

<?php

/**
 * This class does a full resync of the database by 
 * enqueuing an outbound action for every single object
 * that we care about.
 * 
 * This class contains a few non-obvious optimisations that should be explained:
 * - we fire an action called jetpack_full_sync_start so that WPCOM can erase the contents of the cached database
 * - for each object type, we obtain a full list of object IDs to sync via a single API call (hoping that since they're ints, they can all fit in RAM)
 * - we load the full objects for those IDs in chunks of Jetpack_Sync_Full::$array_chunk_size (to reduce the number of MySQL calls)
 * - we fire a trigger for the entire array which the Jetpack_Sync_Client then serializes and queues.
 */

class Jetpack_Sync_Full {
	static $array_chunk_size = 5;
	static $status_transient_name = "jetpack_full_sync_progress";
	static $transient_timeout = 3600; // an hour
	static $modules = array( 'wp_version', 'constants', 'functions', 'options', 'posts', 'comments', 'themes', 'updates' ); 

	// singleton functions
	private static $instance;

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
		add_filter( "jetack_sync_before_send_jetpack_full_sync_posts", array( $this, 'expand_post_ids' ) );
		add_filter( "jetack_sync_before_send_jetpack_full_sync_comments", array( $this, 'expand_comment_ids' ) );
	}

	function start() {
		$this->client = Jetpack_Sync_Client::getInstance();
		do_action( 'jetpack_full_sync_start' );

		$this->set_status_queuing_started();

		$this->enqueue_wp_version();
		$this->enqueue_all_constants();
		$this->enqueue_all_functions();
		$this->enqueue_all_options();
		$this->enqueue_all_theme_info();
		$this->enqueue_all_posts();
		$this->enqueue_all_comments();
		$this->enqueue_all_updates();

		$this->set_status_queuing_finished();

		do_action( 'jetpack_full_sync_end' );
	}

	private function enqueue_wp_version() {
		$this->set_status("wp_version", 0);
		global $wp_version;
		do_action( 'jetpack_sync_wp_version', $wp_version );
		$this->set_status("wp_version", 100);
	}

	private function enqueue_all_constants() {
		$this->set_status("constants", 0);
		$this->client->force_sync_constants();
		$this->set_status("constants", 100);
	}

	private function enqueue_all_functions() {
		$this->set_status("functions", 0);
		$this->client->force_sync_callables();
		$this->set_status("functions", 100);
	}

	private function enqueue_all_options() {
		$this->set_status("options", 0);
		global $wpdb;

		// Unfortunately, since our options whitelist includes regexes,
		// we need to load all option names and match them against the whitelist.
		// This could be pretty awful if we have huge queues, but it's the only way to 
		// be sure we're syncing everything that's whitelisted.

		// As per posts and comments, we do this in ID batches and hope the IDs *AND* names don't exceed RAM

		// In theory, MySQL has regex support. In practice, I wouldn't want to rely on it being compatible
		// with PHP's regexes.

		// Alternatively, rather than option regexes, we could use wildcards in the option and then just
		// use "LIKE" queries here, replacing * with %?

		$option_names = $wpdb->get_col( "SELECT option_name FROM $wpdb->options" );

		// filter by client option whitelist
		$option_names = array_filter( $option_names, array( $this->client, 'is_whitelisted_option' ) );

		$counter = 0;
		$total = count( $option_names );

		foreach ( $option_names as $option_name ) {
			$this->set_status( "options", ( $counter / $total ) * 100 );
			do_action( 'jetpack_full_sync_option', $option_name, get_option( $option_name ) );
			$counter += 1;
		}

		$this->set_status("options", 100);
	}

	private function enqueue_all_posts() {
		$this->set_status("posts", 0);
		global $wpdb;

		// I hope this is never bigger than RAM...
		$post_ids = $wpdb->get_col( "SELECT id FROM $wpdb->posts");

		// Request posts in groups of N for efficiency
		$chunked_post_ids = array_chunk( $post_ids, self::$array_chunk_size );

		$counter = 0;
		$total = count( $chunked_post_ids );

		// Send each chunk as an array of objects
		foreach ( $chunked_post_ids as $chunk ) {
			$this->set_status( "posts", ( $counter / $total ) * 100 );
			do_action( 'jetpack_full_sync_posts', $chunk );
			$counter += 1;
		}

		$this->set_status("posts", 100);
	}

	public function expand_post_ids( $args ) {
		$post_ids = $args[0];
		global $wpdb;

		$posts = get_posts( array(
	 		'include'          => $post_ids,
	 		'post_type'        => 'any',
	 		'post_status'      => 'any',
	 		'suppress_filters' => true ) );

		return array(
			'posts' => $posts,
			'post_metas' => $this->get_metadata( $post_ids, 'post' ),
		);
	}

	private function enqueue_all_comments() {
		$this->set_status("comments", 0);

		global $wpdb;

		$comment_ids = $wpdb->get_col( "SELECT comment_id FROM $wpdb->comments");
		$chunked_comment_ids = array_chunk( $comment_ids, self::$array_chunk_size );

		$counter = 0;
		$total = count( $chunked_comment_ids );

		foreach ( $chunked_comment_ids as $chunk ) {
			$this->set_status( "comments", ( $counter / $total ) * 100 );
			do_action( 'jetpack_full_sync_comments', $chunk);
			$counter += 1;
		}

		$this->set_status("comments", 100);
	}

	public function expand_comment_ids( $args ) {
		$comment_ids = $args[0];
		$comments = get_comments( array(
	 		'include_unapproved' => true,
	 		'comment__in' => $comment_ids,
 		) );

		return array(
			'comments' => $comments,
			'comment_metas' => $this->get_metadata( $comment_ids, 'comment' ),
		);
	}

	private function get_metadata( $ids, $meta_type ) {
		global $wpdb;
		$table = _get_meta_table( $meta_type );
		$id = $meta_type . '_id';
		if ( ! $table ) {
			return array();
		}
		return $wpdb->get_results( "SELECT * FROM $table WHERE $id IN ( " . implode( ',', wp_parse_id_list( $ids ) ) . " )", OBJECT );
	}

	// TODO:
	private function enqueue_all_theme_info() {
		$this->set_status("themes", 0);
		$this->client->send_theme_info();
		$this->set_status("themes", 100);
	}

	private function enqueue_all_updates() {
		$this->set_status("updates", 0);
		// check for updates
		wp_update_plugins();
		wp_update_themes();
		_maybe_update_core();
		$this->set_status("updates", 100);
	}
	
	private function set_status( $name, $percent, $count = 1, $total =1 ) {
		set_transient( self::$status_transient_name.'_'.$name, 
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
		set_transient( self::$status_transient_name, array( 'phase' => 'sending started' ), self::$transient_timeout );
	}

	public function set_status_sending_finished() {
		set_transient( self::$status_transient_name, array( 'phase' => 'sending finished' ), self::$transient_timeout );
	}

	public function get_status() {
		return get_transient( self::$status_transient_name );
	}

	public function get_module_status( $module ) {
		return get_transient( self::$status_transient_name.'_'.$module );
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
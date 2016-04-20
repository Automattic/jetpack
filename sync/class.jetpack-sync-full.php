<?php

/**
 * This class does a full resync of the database by 
 * enqueuing an outbound action for every single object
 * that we care about.
 * 
 * This class contains a few non-obvious optimisations that should be explained:
 * - we fire an action called jp_full_sync_start so that WPCOM can erase the contents of the cached database
 * - for each object type, we obtain a full list of object IDs to sync via a single API call (hoping that since they're ints, they can all fit in RAM)
 * - we load the full objects for those IDs in chunks of Jetpack_Sync_Full::$array_chunk_size (to reduce the number of MySQL calls)
 * - we fire a trigger for the entire array which the Jetpack_Sync_Client then serializes and queues.
 */

class Jetpack_Sync_Full {
	static $array_chunk_size = 5;

	function start() {
		$this->client = Jetpack_Sync_Client::getInstance();
		do_action( 'jp_full_sync_start' );
		$this->enqueue_all_constants();
		$this->enqueue_all_functions();
		$this->enqueue_all_options();
		$this->enqueue_all_posts();
		$this->enqueue_all_comments();
	}

	private function enqueue_all_constants() {
		$this->client->force_sync_constants();
	}

	private function enqueue_all_functions() {
		$this->client->force_sync_callables();
	}

	private function enqueue_all_options() {
		global $wpdb;

		// Unfortunately, since our options whitelist includes regexes,
		// we need to load all option names and match them against the whitelist.
		// This could be pretty awful if we have huge queues, but it's the only way to 
		// be sure we're syncing everything that's whitelisted.

		// As per posts and comments, we do this in ID batches and hope the IDs *AND* names don't exceed RAM

		// In theory, MySQL has regex support. In practice, I wouldn't want to rely on it being compatible
		// with PHP's regexes.

		$option_names = $wpdb->get_col( "SELECT option_name FROM $wpdb->options" );

		// filter by client option whitelist
		$option_names = array_filter( $option_names, array( $this->client, 'is_whitelisted_option' ) );

		foreach ( $option_names as $option_name ) {
			do_action( 'jp_full_sync_option', $option_name, get_option( $option_name ) );
		}
	}

	private function enqueue_all_posts() {
		global $wpdb;

		// I hope this is never bigger than RAM...
		$post_ids = $wpdb->get_col( "SELECT id FROM $wpdb->posts");

		// Request posts in groups of N for efficiency
		$chunked_post_ids = array_chunk( $post_ids, self::$array_chunk_size );

		// Send each chunk as an array of objects
		foreach ( $chunked_post_ids as $chunk ) {
			$posts = get_posts( array( 'post__in' => $chunk, 'post_status' => 'any' ) );
			do_action( 'jp_full_sync_posts', $posts );

			// while we're here, sync post meta
			foreach( $posts as $post ) {
				$postmeta = $wpdb->get_results( 
					$wpdb->prepare( 
						"SELECT meta_id, meta_key, meta_value FROM $wpdb->postmeta WHERE post_id = %s", 
						$post->ID 
					),
					OBJECT
				);
				do_action( 'jp_full_sync_postmeta', $post->ID, $postmeta );
			}
		}
	}

	private function enqueue_all_comments() {
		global $wpdb;

		$comment_ids = $wpdb->get_col( "SELECT comment_id FROM $wpdb->comments");
		$chunked_comment_ids = array_chunk( $comment_ids, self::$array_chunk_size );

		foreach ( $chunked_comment_ids as $chunk ) {
			$comments = get_comments( array( 'comment__in' => $chunk ) );
			do_action( 'jp_full_sync_comments', $comments );
		}
	}
	
}
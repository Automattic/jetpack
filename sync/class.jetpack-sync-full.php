<?php

/**
 * This class does a full resync of the database by 
 * enqueuing an outbound action for every single object
 * that we care about
 */

class Jetpack_Sync_Full {
	static $array_chunk_size = 5;

	function start() {
		// TODO
		$this->enqueue_all_posts();
	}

	private function enqueue_all_posts() {
		global $wpdb;

		// I hope this is never bigger than RAM...
		$post_ids = $wpdb->get_col( "SELECT id FROM $wpdb->posts");

		// Request posts in groups of N for efficiency
		$chunked_post_ids = array_chunk( $post_ids, self::$array_chunk_size );

		foreach ( $chunked_post_ids as $chunk ) {
			$posts = get_posts( array( 'post__in' => $chunk, 'post_status' => 'any' ) );
			foreach ( $posts as $post ) {
				do_action( 'jp_full_sync_post', $post );
			}
		}
	}
	
}
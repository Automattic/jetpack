<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

/**
 * Class Cache_Preload_Queue_Manager
 *
 * Handles the management of the preload queue, including storing and retrieving
 * the list of URLs to preload and managing batch processing functionality.
 *
 * @since $$next-version$$
 * @package Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache
 */
class Cache_Preload_Queue_Manager {

	/**
	 * Get the list of posts that need to be preloaded.
	 *
	 * Retrieves the stored list of post URLs that are scheduled for preloading.
	 *
	 * @since $$next-version$$
	 * @return array Array of post URLs to preload.
	 */
	public function get_posts_to_preload() {
		return get_option( 'jetpack_boost_posts_to_preload', array() );
	}

	/**
	 * Set the list of posts to preload.
	 *
	 * Updates the option storing the list of post URLs that need to be preloaded.
	 * Ensures that all posts in the list are unique.
	 *
	 * @since $$next-version$$
	 * @param array $posts Array of post URLs to preload.
	 * @return void
	 */
	public function set_posts_to_preload( array $posts ) {
		// Ensure the posts are all unique. This should be done earlier, but we'll also do it here; validate early, validate often.
		$posts = array_unique( $posts );
		// The option is not autoloaded as it's only used within the cron job.
		update_option( 'jetpack_boost_posts_to_preload', $posts, false );
	}

	/**
	 * Add posts to the preload queue.
	 *
	 * Adds the specified posts to the preload queue, ensuring all posts in the queue are unique.
	 *
	 * @since $$next-version$$
	 * @param string|array $posts_to_add The post URL or an array of post URLs to add to the queue.
	 * @return array The updated queue of posts to preload.
	 */
	public function add_to_queue( $posts_to_add ) {
		$current_queue = $this->get_posts_to_preload();

		if ( is_array( $posts_to_add ) ) {
			$current_queue = array_merge( $current_queue, $posts_to_add );
		} else {
			$current_queue[] = $posts_to_add;
		}

		// Ensure the posts are all unique.
		$current_queue = array_unique( $current_queue );
		$this->set_posts_to_preload( $current_queue );

		return $current_queue;
	}

	/**
	 * Prepares the next batch of URLs to preload.
	 *
	 * Takes the full list of posts to preload, extracts the first batch,
	 * updates the preload queue, and returns the batch to process.
	 *
	 * @since $$next-version$$
	 * @param array $posts Full list of posts to preload.
	 * @param int   $batch_size Size of batch to process. Default 10.
	 * @return array The batch of posts to process now.
	 */
	public function prepare_next_batch( array $posts, int $batch_size = 10 ) {
		// Process in batches to reduce server load
		$batches       = array_chunk( $posts, $batch_size );
		$current_batch = array_shift( $batches );

		// Calculate remaining posts
		$remaining = $this->flatten_batches( $batches );
		$remaining = array_unique( $remaining );

		// Update the preload queue
		$this->set_posts_to_preload( $remaining );

		return $current_batch;
	}

	/**
	 * Flattens a multi-dimensional array of batches into a single array.
	 *
	 * @since $$next-version$$
	 * @param array $batches Array of batch arrays.
	 * @return array Flattened array of all posts.
	 */
	private function flatten_batches( array $batches ) {
		$flattened = array();
		foreach ( $batches as $batch ) {
			$flattened = array_merge( $flattened, $batch );
		}
		return $flattened;
	}

	/**
	 * Check if the preload queue is empty.
	 *
	 * @since $$next-version$$
	 * @return bool True if the queue is empty, false otherwise.
	 */
	public function is_queue_empty() {
		return empty( $this->get_posts_to_preload() );
	}
}

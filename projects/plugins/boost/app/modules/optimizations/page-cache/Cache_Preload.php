<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;

/**
 * Class Cache_Preload
 *
 * Handles the preloading of cache for pages, currently only for Cornerstone Pages.
 * This module automagically preloads the cache after cache invalidation events, or when
 * Cornerstone Pages are updated, to ensure that important pages always have fresh cache.
 *
 * @since $$next-version$$
 * @package Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache
 */
class Cache_Preload implements Pluggable, Is_Always_On {

	/**
	 * @since $$next-version$$
	 */
	public function setup() {
		add_action( 'update_option_jetpack_boost_ds_cornerstone_pages_list', array( $this, 'schedule_cornerstone_preload' ) );
		add_action( 'jetpack_boost_preload_pages', array( $this, 'preload_pages' ) );

		add_action( 'post_updated', array( $this, 'handle_post_update' ), 10, 1 );
		add_action( 'jetpack_boost_invalidate_cache_success', array( $this, 'handle_cache_invalidation' ), 10, 2 );
	}

	/**
	 * @since $$next-version$$
	 */
	public static function get_slug() {
		return 'cache_preload';
	}

	/**
	 * @since $$next-version$$
	 */
	public static function is_available() {
		if ( defined( 'JETPACK_BOOST_ALPHA_FEATURES' ) ) {
			return \JETPACK_BOOST_ALPHA_FEATURES === true;
		}

		return true;
	}

	/**
	 * Prepares the next batch of URLs to preload.
	 *
	 * Takes the full list of posts to preload, extracts the first batch,
	 * updates the preload queue, and schedules the next run if needed.
	 *
	 * @since $$next-version$$
	 * @param array $posts Full list of posts to preload.
	 * @return array The batch of posts to process now.
	 */
	private function prepare_next_batch( array $posts ) {
		// Process in batches of 10 to reduce server load
		$batches       = array_chunk( $posts, 10 );
		$current_batch = array_shift( $batches );

		// Calculate remaining posts
		$remaining = $this->flatten_batches( $batches );
		$remaining = array_unique( $remaining );

		// Update the preload queue
		$this->set_posts_to_preload( $remaining );

		// Schedule the next batch if needed
		if ( ! empty( $remaining ) ) {
			$this->schedule_preload_cronjob();
		}

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
	 * Processes a batch of URLs for preloading.
	 *
	 * Attempts to preload each URL in the batch, logging any errors.
	 *
	 * @since $$next-version$$
	 * @param array $batch Array of URLs to preload.
	 * @return void
	 */
	private function process_batch( array $batch ) {
		foreach ( $batch as $url ) {
			$this->preload_page( $url );
		}
	}

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
	 * Schedule preload for all Cornerstone Pages.
	 *
	 * This method is triggered when the Cornerstone Pages list is updated,
	 * ensuring all Cornerstone Pages have their cache preloaded.
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public function schedule_cornerstone_preload() {
		$this->schedule_preload( Cornerstone_Utils::get_list() );
	}

	/**
	 * Schedules the preload cronjob, if not already scheduled.
	 *
	 * Sets up a single event to trigger the preload process with a short delay of 2 seconds
	 * to avoid race conditions with cache invalidation processes.
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public function schedule_preload_cronjob() {
		if ( ! wp_next_scheduled( 'jetpack_boost_preload_pages' ) ) {
			// Adding a 2 second delay helps prevent multiple rapid cache rebuilds when
			// multiple events trigger in sequence (e.g., cache invalidation + cornerstone page updates + cloud css generation).
			// If we attempt to schedule the cron job and one was already scheduled within 2 seconds, the cron job will not be scheduled.
			wp_schedule_single_event( time() + 2, 'jetpack_boost_preload_pages' );
		}
	}

	/**
	 * Preloads the pages scheduled for preload.
	 *
	 * This method is called via a cronjob and processes pages in batches
	 * to populate the cache.
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public function preload_pages() {
		$posts = $this->get_posts_to_preload();
		if ( empty( $posts ) ) {
			return;
		}

		// Get the current batch to process and update the queue
		$batch = $this->prepare_next_batch( $posts );

		// Process the current batch
		$this->process_batch( $batch );
	}

	/**
	 * Preload a single page.
	 *
	 * Makes an HTTP request to the specified URL to generate a fresh cache entry.
	 *
	 * @since $$next-version$$
	 * @param string $page The URL of the page to preload.
	 * @return void
	 */
	private function preload_page( string $page ) {
		$url = $page;

		// Add a cache-busting header to ensure our response is fresh.
		$args = array(
			'headers' => array(
				'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
				'Pragma'        => 'no-cache',
				'Expires'       => '0',
			),
		);

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			Logger::debug( 'Error preloading page: ' . $response->get_error_message() );
			return;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( $status_code !== 200 ) {
			Logger::debug( sprintf( 'Error preloading page %s: HTTP status code %d', $url, $status_code ) );
		}
	}

	/**
	 * Schedule preload for a post or an array of posts.
	 *
	 * Adds the specified posts to the preload queue and schedules the preload cronjob.
	 *
	 * @since $$next-version$$
	 * @param string|array $post_to_schedule The post URL or an array of post URLs to schedule.
	 * @return void
	 */
	public function schedule_preload( $post_to_schedule ) {
		$posts = $this->get_posts_to_preload();
		if ( is_array( $post_to_schedule ) ) {
			$posts = array_merge( $posts, $post_to_schedule );
		} else {
			$posts[] = $post_to_schedule;
		}

		// Ensure the posts are all unique. This should be done earlier, but we'll also do it here - validate early, validate often.
		$posts = array_unique( $posts );
		$this->set_posts_to_preload( $posts );
		$this->schedule_preload_cronjob();
	}

	/**
	 * Handle post updates to check if the post is a cornerstone page and schedule preload if needed.
	 *
	 * Triggered when a post is updated. If the post is identified as a cornerstone page,
	 * its cache will be preloaded.
	 *
	 * @since $$next-version$$
	 * @param int $post_id The ID of the post being updated.
	 * @return void
	 */
	public function handle_post_update( int $post_id ) {
		if ( ! Cornerstone_Utils::is_cornerstone_page( $post_id ) ) {
			return;
		}

		$this->schedule_preload( get_permalink( $post_id ) );
	}

	/**
	 * Handle cache invalidation events to schedule preloading for affected pages.
	 *
	 * If cache for Cornerstone Pages is invalidated, this method schedules those pages
	 * for preloading to ensure they have fresh cache.
	 *
	 * @since $$next-version$$
	 * @param string $path The path that was invalidated.
	 * @param string $type The type of invalidation that occurred (e.g., Filesystem_Utils::DELETE_ALL).
	 * @return void
	 */
	public function handle_cache_invalidation( string $path, string $type ) {
		$cornerstone_pages = Cornerstone_Utils::get_list();
		if ( $type === Filesystem_Utils::DELETE_ALL ) {
			// If the cache is invalidated for all files, schedule preload for all Cornerstone Pages.
			$this->schedule_preload( $cornerstone_pages );
			return;
		}

		// Otherwise identify if a Cornerstone Page cache file is being deleted and schedule preload that page if it is.
		$cornerstone_pages = array_map( 'untrailingslashit', $cornerstone_pages );
		// If the $path is in the Cornerstone Page list, add it to the preload list.
		if ( in_array( untrailingslashit( $path ), $cornerstone_pages, true ) ) {
			$this->schedule_preload( $path );
		}
	}
}

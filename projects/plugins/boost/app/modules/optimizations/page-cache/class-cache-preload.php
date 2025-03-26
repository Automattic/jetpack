<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;

/**
 * Class Cache_Preload
 *
 * Handles the rebuilding/preloading of cache for pages, currently only for Cornerstone Pages.
 * This module automagically preloads the cache after cache invalidation events such as rebuilds, or when
 * Cornerstone Pages are updated, to ensure that important pages always have a cache.
 *
 * @since 3.11.0
 * @package Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache
 */
class Cache_Preload implements Pluggable, Has_Activate, Has_Deactivate, Is_Always_On {

	/**
	 * @since 3.11.0
	 */
	public function setup() {
		add_action( 'update_option_jetpack_boost_ds_cornerstone_pages_list', array( $this, 'schedule_cornerstone' ) );
		add_action( 'jetpack_boost_preload_cornerstone', array( $this, 'preload_cornerstone' ) );
		add_action( 'jetpack_boost_preload', array( $this, 'preload' ) );

		add_action( 'post_updated', array( $this, 'handle_post_update' ), 10, 1 );
		add_action( 'jetpack_boost_invalidate_cache_success', array( $this, 'handle_cache_invalidation' ), 10, 2 );
	}

	/**
	 * @since 3.11.0
	 */
	public static function get_slug() {
		return 'cache_preload';
	}

	/**
	 * @since 3.11.0
	 */
	public static function is_available() {
		return true;
	}

	/**
	 * As this is a submodule, this activate is triggered when the parent module is activated,
	 * despite the module having Is_Always_On.
	 *
	 * @since 3.12.0
	 */
	public static function activate() {
		$instance = new self();
		$instance->schedule_cornerstone_cronjob();
	}

	/**
	 *
	 * @since 3.12.0
	 */
	public static function deactivate() {
		wp_unschedule_hook( 'jetpack_boost_preload_cornerstone' );
	}

	/**
	 * Schedule the cronjob to preload the cache for Cornerstone Pages.
	 *
	 * @since 3.12.0
	 * @return void
	 */
	public function schedule_cornerstone_cronjob() {
		if ( ! wp_next_scheduled( 'jetpack_boost_preload_cornerstone' ) ) {
			wp_schedule_event( time(), 'twicehourly', 'jetpack_boost_preload_cornerstone' );
		}
	}

	/**
	 * Schedule Preload for all Cornerstone Pages.
	 *
	 * This method is triggered when the Cornerstone Pages list is updated,
	 * ensuring all Cornerstone Pages have their cache rebuilt.
	 *
	 * @since 3.12.0
	 * @return void
	 */
	public function schedule_cornerstone() {
		wp_schedule_single_event( time(), 'jetpack_boost_preload_cornerstone' );
	}

	/**
	 * Schedule a rebuild for the given URLs.
	 *
	 * @since 3.12.0
	 * @param array $urls The URLs of the Cornerstone Pages to rebuild.
	 * @return void
	 */
	public function schedule( array $urls ) {
		Logger::debug( sprintf( 'Scheduling preload for %d pages', count( $urls ) ) );
		wp_schedule_single_event( time(), 'jetpack_boost_preload', array( $urls ) );
	}

	/**
	 * Rebuild the cache for all Cornerstone Pages.
	 *
	 * @since 3.12.0
	 * @return void
	 */
	public function preload_cornerstone() {
		$urls = Cornerstone_Utils::get_list();
		$this->preload( $urls );
	}

	/**
	 * Rebuild the cache for the given URLs.
	 *
	 * @since 3.12.0
	 * @param array $urls The URLs of the pages to preload.
	 * @return void
	 */
	public function preload( array $urls ) {
		Logger::debug( sprintf( 'Preload started for %d pages', count( $urls ) ) );

		// Pause the hook here to avoid an infinite loop of: invalidation → preload → invalidation.
		remove_action( 'jetpack_boost_invalidate_cache_success', array( $this, 'handle_cache_invalidation' ) );
		$boost_cache = new Boost_Cache();
		foreach ( $urls as $url ) {
			$boost_cache->invalidate_cache_for_url( $url, Filesystem_Utils::REBUILD_FILES );
			$this->request_page( $url );
		}
		add_action( 'jetpack_boost_invalidate_cache_success', array( $this, 'handle_cache_invalidation' ), 10, 2 );

		Logger::debug( sprintf( 'Preload completed for %d pages', count( $urls ) ) );
	}

	/**
	 * Requests the pages scheduled for preload.
	 *
	 * @since 3.11.0
	 * @param array $posts The posts to preload.
	 * @return void
	 */
	public function request_pages( $posts ) {
		if ( empty( $posts ) ) {
			return;
		}

		foreach ( $posts as $url ) {
			$this->request_page( $url );
		}
	}

	/**
	 * Make an HTTP request to the specified URL to generate a fresh cache entry.
	 *
	 * @since 3.11.0
	 * @param string $page The URL of the page to preload.
	 * @return void
	 */
	private function request_page( string $page ) {
		// Add a cache-busting header to ensure our response is fresh.
		$args = array(
			'headers' => array(
				'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
				'Pragma'        => 'no-cache',
				'Expires'       => '0',
			),
		);

		$response = wp_remote_get( $page, $args );

		if ( is_wp_error( $response ) ) {
			Logger::debug( 'Error preloading page: ' . $response->get_error_message() );
			return;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( $status_code !== 200 ) {
			Logger::debug( sprintf( 'Error preloading page %s: HTTP status code %d', $page, $status_code ) );
		}
	}

	/**
	 * Handle post updates to check if the post is a cornerstone page and schedule preload if needed.
	 *
	 * @since 3.11.0
	 * @param int $post_id The ID of the post being updated.
	 * @return void
	 */
	public function handle_post_update( int $post_id ) {
		if ( Cornerstone_Utils::is_cornerstone_page( $post_id ) ) {
			$this->schedule( array( get_permalink( $post_id ) ) );
		}
	}

	/**
	 * Handle cache invalidation events to schedule preloading for affected pages.
	 *
	 * If cache for Cornerstone Pages is invalidated, this method schedules those pages
	 * for preloading to ensure they have fresh cache.
	 *
	 * @since 3.11.0
	 * @param string $path The path that was invalidated.
	 * @param string $type The type of invalidation that occurred (e.g., Filesystem_Utils::DELETE_ALL).
	 * @return void
	 */
	public function handle_cache_invalidation( string $path, string $type ) {
		if ( $type === Filesystem_Utils::DELETE_ALL ) {
			// If the cache is invalidated for all files, schedule preload for all Cornerstone Pages.
			$this->schedule_cornerstone();
			return;
		}

		// Otherwise identify if a Cornerstone Page cache file is being deleted and schedule preload that page if it is.
		$cornerstone_pages = Cornerstone_Utils::get_list();
		$cornerstone_pages = array_map( 'untrailingslashit', $cornerstone_pages );
		// If the $path is in the Cornerstone Page list, add it to the preload list.
		if ( in_array( untrailingslashit( $path ), $cornerstone_pages, true ) ) {
			$this->schedule( array( $path ) );
		}
	}
}

<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\pre_wordpress\Logger;

class Cache_Preload implements Pluggable, Is_Always_On {

	public function setup() {
		add_action( 'update_option_jetpack_boost_ds_cornerstone_pages_list', array( $this, 'schedule_cornerstone_preload' ) );
		add_action( 'jetpack_boost_preload_pages', array( $this, 'preload_pages' ) );

		add_action( 'post_updated', array( $this, 'handle_post_update' ), 10, 1 );
	}

	public static function get_slug() {
		return 'cache_preload';
	}

	public static function is_available() {
		return true;
	}

	public function get_preload_posts() {
		return get_option( 'jetpack_boost_posts_to_preload', array() );
	}

	public function set_preload_posts( array $posts ) {
		// Ensures the posts are all unique.
		$posts = array_unique( $posts );
		// The option is not autoloaded as it's only used within the cron job.
		update_option( 'jetpack_boost_posts_to_preload', $posts, false );
	}

	public function schedule_cornerstone_preload() {
		$this->schedule_preload( Cornerstone_Utils::get_list() );
	}

	public function schedule_preload_cronjob() {
		if ( ! wp_next_scheduled( 'jetpack_boost_preload_pages' ) ) {
			wp_schedule_single_event( time(), 'jetpack_boost_preload_pages' );
		}
	}

	public function preload_cornerstone_pages() {
		$pages = Cornerstone_Utils::get_list();

		foreach ( $pages as $page ) {
			$this->preload_page( $page );
		}
	}

	public function preload_pages() {
		$posts = $this->get_preload_posts();
		if ( empty( $posts ) ) {
			return;
		}

		// Clear the preload posts so they're not preloaded again.
		$this->set_preload_posts( array() );

		foreach ( $posts as $post ) {
			try {
				$this->preload_page( $post );
			} catch ( \Exception $e ) {
				// If the page is not found, or cannot be loaded, log the error.
				Logger::debug( 'Error preloading page: ' . $e->getMessage() );
			}
		}
	}

	private function preload_page( $page ) {
		$url = $page;

		wp_remote_get( $url );
	}

	/**
	 * Schedule preload for a post or an array of posts.
	 *
	 * @param string|array $post_to_schedule The post URL or an array of post URLs to schedule.
	 */
	public function schedule_preload( $post_to_schedule ) {
		$posts = $this->get_preload_posts();
		if ( is_array( $post_to_schedule ) ) {
			$posts = array_merge( $posts, $post_to_schedule );
		} else {
			$posts[] = $post_to_schedule;
		}

		$this->set_preload_posts( $posts );
		$this->schedule_preload_cronjob();
	}

	/**
	 * Handle post updates to check if the post is a cornerstone page and schedule preload if needed.
	 *
	 * @param int $post_id The ID of the post being updated.
	 */
	public function handle_post_update( $post_id ) {
		if ( ! Cornerstone_Utils::is_cornerstone_page( $post_id ) ) {
			return;
		}

		$this->schedule_preload( get_permalink( $post_id ) );
	}
}

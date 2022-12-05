<?php

namespace Automattic\Jetpack_Boost\Lib;

class Site_Urls {

	public static function get( $limit = 1000 ) {
		$instance = new static();

		$core_urls = $instance->get_wp_core_urls();
		$post_urls = $instance->cleanup_post_urls(
			$instance->get_post_urls( $limit ),
			wp_list_pluck(
				$core_urls,
				'url'
			)
		);

		return array_merge(
			$core_urls,
			$post_urls
		);
	}

	private function get_wp_core_urls() {
		$urls = array();

		$front_page = get_option( 'page_on_front' );
		if ( ! empty( $front_page ) ) {
			$urls['front_page'] = array(
				'url'      => get_permalink( $front_page ),
				'modified' => get_post_modified_time( 'Y-m-d H:i:s', false, $front_page ),
			);
		}

		$posts_page = get_option( 'page_for_posts' );
		if ( ! empty( $posts_page ) ) {
			$urls['posts_page'] = array(
				'url'      => get_permalink( $posts_page ),
				'modified' => get_post_modified_time( 'Y-m-d H:i:s', false, $posts_page ),
			);
		} else {
			$urls['posts_page'] = array(
				'url'      => home_url( '/' ),
				'modified' => current_time( 'Y-m-d H:i:s' ),
			);
		}

		return $urls;
	}

	private function get_post_urls( $limit ) {
		global $wpdb;

		// @todo - exclude post types that aren't publicly queryable

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT ID, post_modified FROM {$wpdb->posts} WHERE post_status = 'publish' ORDER BY post_modified DESC LIMIT 0, %d",
				$limit
			)
		);

		$urls = array();
		foreach ( $results as $result ) {
			$urls[ 'post_id_' . $result->ID ] = array(
				'url'      => get_permalink( $result->ID ),
				'modified' => get_post_modified_time( 'Y-m-d H:i:s', false, $result ),
			);
		}

		return $urls;
	}

	/**
	 * Removes duplicate URLs from the $post_urls list and reduces the
	 * size of that list based on the additional URLs.
	 *
	 * @param  $post_urls       List of URLs to cleanup.
	 * @param  $additional_urls List of URLs to lookup while cleaning.
	 *
	 * @return array
	 */
	private function cleanup_post_urls( $post_urls, $additional_urls ) {
		$clean   = array();
		$removed = 0;

		foreach ( $post_urls as $key => $item ) {
			if ( in_array( $item['url'], $additional_urls, true ) ) {
				$removed++;
				continue;
			}

			$clean[ $key ] = $item;
		}

		$cutoff = count( $additional_urls ) - $removed;

		return array_slice(
			$clean,
			0,
			count( $clean ) - $cutoff,
			true
		);
	}
}

<?php

namespace Automattic\Jetpack_Boost\Lib;

class Site_Urls {

	public static function get( $limit = 1000 ) {
		// @todo - after removing the core urls from the post urls,
		// there might be core urls left that aren't in the posts urls
		// and combining the two would result in a list over the $limit

		$core_urls = self::get_wp_core_urls();
		$post_urls = self::cleanup_post_urls(
			self::get_post_urls( $limit ),
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

	private static function get_wp_core_urls() {
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
		}

		if ( empty( $front_page ) && empty( $posts_page ) ) {
			$urls['posts_page'] = array(
				'url'      => home_url( '/' ),
				'modified' => current_time( 'Y-m-d H:i:s' ),
			);
		}

		return $urls;
	}

	private static function get_post_urls( $limit ) {
		global $wpdb;

		$public_post_types       = self::get_public_post_types();
		$post_types_placeholders = implode(
			',',
			array_fill(
				0,
				count( $public_post_types ),
				'%s'
			)
		);

		$prepare_values   = $public_post_types;
		$prepare_values[] = $limit;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$results = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT ID, post_modified FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type IN ({$post_types_placeholders}) ORDER BY post_modified DESC LIMIT 0, %d",
				$prepare_values
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
	 * Removes duplicate URLs from the $post_urls list
	 * based on the additional URLs.
	 *
	 * @param  $post_urls       List of URLs to cleanup.
	 * @param  $additional_urls List of URLs to lookup while cleaning.
	 *
	 * @return array
	 */
	private static function cleanup_post_urls( $post_urls, $additional_urls ) {
		$clean = array();

		foreach ( $post_urls as $key => $item ) {
			if ( in_array( $item['url'], $additional_urls, true ) ) {
				continue;
			}

			$clean[ $key ] = $item;
		}

		return $clean;
	}

	private static function get_public_post_types() {
		$post_types = get_post_types(
			array(
				'public' => true,
			)
		);
		unset( $post_types['attachment'] );

		return array_values(
			array_filter(
				$post_types,
				'is_post_type_viewable'
			)
		);
	}
}

<?php

namespace Automattic\Jetpack_Boost\Lib;

class Site_Urls {

	public static function get( $limit = 100 ) {
		$core_urls = self::get_wp_core_urls();
		$post_urls = self::cleanup_post_urls(
			self::get_post_urls( $limit ),
			wp_list_pluck(
				$core_urls,
				'url'
			)
		);

		$urls = array_slice(
			array_merge(
				$core_urls,
				$post_urls
			),
			0,
			$limit
		);

		/**
		 * Filters the list of site URLs used by the Image Size Analysis.
		 *
		 * @since 3.7.0
		 *
		 * @param array $urls An array of URLs.
		 * @param int   $limit The maximum number of URLs that should be returned.
		 */
		return apply_filters( 'jetpack_boost_site_urls', $urls, $limit );
	}

	private static function get_wp_core_urls() {
		$urls = array();

		$front_page = get_option( 'page_on_front' );
		if ( ! empty( $front_page ) ) {
			$urls['core_front_page'] = array(
				'url'      => get_permalink( $front_page ),
				'modified' => get_post_modified_time( 'Y-m-d H:i:s', false, $front_page ),
				'group'    => 'core_front_page',
			);
		} else {
			$urls['core_front_page'] = array(
				'url'      => home_url( '/' ),
				'modified' => current_time( 'Y-m-d H:i:s' ),
				'group'    => 'core_front_page',
			);
		}

		$posts_page = get_option( 'page_for_posts' );
		if ( ! empty( $posts_page ) ) {
			$urls['core_posts_page'] = array(
				'url'      => get_permalink( $posts_page ),
				'modified' => get_post_modified_time( 'Y-m-d H:i:s', false, $posts_page ),
				'group'    => 'other',
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
				'group'    => self::get_post_group( $result ),
			);
		}

		return $urls;
	}

	/**
	 * Removes duplicate URLs from the $post_urls list
	 * based on the additional URLs.
	 *
	 * @param  array $post_urls       List of URLs to cleanup.
	 * @param  array $additional_urls List of URLs to lookup while cleaning.
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

	/**
	 * Returns the group for the post.
	 *
	 * @param \WP_Post $p Post object.
	 *
	 * @return string
	 */
	private static function get_post_group( $p ) {
		$post_type = get_post_type( $p->ID );
		if ( 'post' === $post_type || 'page' === $post_type ) {
			return 'singular_' . $post_type;
		}

		return 'other';
	}
}

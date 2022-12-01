<?php

namespace Automattic\Jetpack_Boost\Lib;

class Site_Urls_Grabber {

	public static function grab( $limit = 1000 ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT ID, post_modified FROM {$wpdb->posts} WHERE post_status = 'publish' ORDER BY post_modified DESC LIMIT 0, %d",
				$limit
			)
		);

		$urls = array();
		foreach ( $results as $result ) {
			$url_id = self::get_key( $result );

			$urls[ $url_id ] = self::get_info( $result );
		}

		return $urls;
	}

	public static function get_key( $post ) {
		return 'post_id_' . $post->ID;
	}

	public static function get_info( $post ) {
		return array(
			'url'      => get_permalink( $post->ID ),
			'modified' => $post->post_modified,
		);
	}
}

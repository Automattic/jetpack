<?php

namespace Automattic\Jetpack_Inspect;

class Log {

	const POST_TYPE_NAME = 'jetpack_inspect_log';

	/**
	 * Static initialization.
	 */
	public static function register_post_type() {

		// Check if post type already registered.
		if ( post_type_exists( static::POST_TYPE_NAME ) ) {
			return;
		}

		register_post_type(
			static::POST_TYPE_NAME,
			array(
				'label'       => 'Jetpack Inspect Log',
				'description' => 'Cache entries for the Jetpack Boost plugin.',
				'public'      => false,
			)
		);
	}

	public static function insert( $url, $data ) {

		$data_post_data = array(
			'post_type'    => static::POST_TYPE_NAME,
			'post_title'   => $url,
			'post_name'    => uniqid( 'jetpack_inspect_log_', true ),
			'post_status'  => 'publish',
			'post_content' => base64_encode( wp_json_encode( $data ) ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		);

		wp_insert_post( $data_post_data );
	}

	public static function post_to_entry( \WP_Post $post ): array {
		$post_id = $post->ID;
		try {
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
			$data = json_decode( base64_decode( $post->post_content ), true, 512, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING | JSON_OBJECT_AS_ARRAY );
		} catch ( \JsonException $e ) {
			$data = 'Error decoding JSON: ' . $e->getMessage();
		}

		return array_merge(
			array(
				'id'   => $post_id,
				'date' => $post->post_date,
			),
			$data
		);
	}

	public static function get_latest() {
		$posts = get_posts(
			array(
				'post_type'           => static::POST_TYPE_NAME,
				'numberposts'         => 50,
				'orderby'             => 'date',
				'order'               => 'DESC',
				'no_found_rows'       => true,
				'ignore_sticky_posts' => true,
			)
		);

		return array_map( array( __CLASS__, 'post_to_entry' ), $posts );
	}

	public static function clear() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->delete(
			$wpdb->posts,
			array( 'post_type' => static::POST_TYPE_NAME ),
			array( '%s' )
		);
	}
}

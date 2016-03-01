<?php

class Jetpack_Post_Sync {

	static $sync = array();
	static $delete = array();

	static function init() {
		add_action( 'transition_post_status', array( __CLASS__, 'transition_post_status' ), 10, 3 );
		add_action( 'delete_post', array( __CLASS__, 'delete_post' ) );

		// Mark the post as needs updating when post meta data changes.
		add_action( 'added_post_meta', array( __CLASS__, 'update_post_meta' ), 10, 4 );
		add_action( 'updated_postmeta', array( __CLASS__, 'update_post_meta' ), 10, 4 );
		add_action( 'deleted_post_meta', array( __CLASS__, 'update_post_meta' ), 10, 4 );

		// Mark the post as needs updating when taxonomies get added to it.
		add_action( 'set_object_terms', array( __CLASS__, 'set_object_terms' ), 10, 6 );

		// Update comment count
		add_action( 'wp_update_comment_count', array( __CLASS__, 'wp_update_comment_count' ), 10, 3 );

		// Sync post when the cache is cleared
		add_action( 'clean_post_cache', array( __CLASS__, 'clear_post_cache' ), 10, 2 );
	}

	static function transition_post_status( $new_status, $old_status, $post ) {
		if ( 'trash' === $new_status ) {
			self::$delete[] = $post->ID;
			return;
		}
		self::$sync[] = $post->ID;
	}

	static function delete_post( $post_id ) {
		self::$delete[] = $post_id;
	}

	/**
	 * added_post_meta, update_post_meta, delete_post_meta
	 */
	static function update_post_meta( $meta_id, $post_id, $meta_key, $_meta_value ) {
		self::$sync[] = $post_id;
	}

	/**
	 * Updates to taxonomies such as categories, etc
	 */
	static function set_object_terms( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ) {
		self::$sync[] = $object_id;
	}

	static function clear_post_cache( $post_id, $post ) {
		self::$sync[] = $post_id;
	}

	static function wp_update_comment_count( $post_id, $new, $old ) {
		self::$sync[] = $post_id;
	}


	static function get_post_ids_to_sync() {
		if ( empty( self::$sync ) ) {
			return array();
		}
		$post_types_to_sync = apply_filters( 'jetpack_post_sync_post_type', array( 'post', 'page', 'attachment' ) );
		$post_stati_to_sync = apply_filters( 'jetpack_post_sync_post_stati', array( 'publish', 'draft', 'inherit' ) );

		$args = array(
			'post__in'               => array_unique( self::$sync ),
			'post_type'              => $post_types_to_sync,
			'post_status'            => $post_stati_to_sync,
			'nopaging'               => true,
			'no_found_rows'          => false,
			'cache_results'          => false,
			'update_post_term_cache' => false,
			'update_post_meta_cache' => false,
		);

		$the_query        = new WP_Query( $args );
		$post_ids_to_sync = array();
		// The Loop
		if ( $the_query->have_posts() ) {
			while ( $the_query->have_posts() ) {
				$the_query->the_post();
				$post_ids_to_sync[] = get_the_id();
			}
		}
		wp_reset_postdata();

		return $post_ids_to_sync;
	}


	static function json_api( $post_id ) {
		$method       = 'GET';
		$url          = self::get_post_api_url( $post_id );

		require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
		$api = WPCOM_JSON_API::init( $method, $url, null, true );
		require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
		require_once JETPACK__PLUGIN_DIR . 'json-endpoints.php';

		$_SERVER['HTTP_USER_AGENT'] = '';
		$contents = $api->serve( false, true );

		return $contents;
	}

	static function posts_to_sync() {

		define( 'REST_API_REQUEST', true );
		define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );

		$posts = array();
		foreach( self::get_post_ids_to_sync() as $post_id ) {
			$posts[ $post_id ] = self::json_api( $post_id );
		}
		return $posts;
	}

	static function posts_to_delete() {
		return array_unique( self::$delete );
	}

	static function get_post_api_url( $post_id ) {
		return sprintf( 'http://public-api.wordpress.com/rest/v1.1/sites/%1$d/posts/%2$s', Jetpack_Options::get_option( 'id' ), $post_id );
	}
}

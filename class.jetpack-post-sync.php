<?php

class Jetpack_Post_Sync {

	static $posts = array(
		'sync' => array(),
		'delete' => array(),
		);

	static function init() {
		add_action( 'transition_post_status', array( __CLASS__, 'transition_post_status' ), 10, 3 );
		add_action( 'delete_post', array( __CLASS__, 'delete_post_action' ) );

		// Mark the post as needs updating when post meta data changes.
		add_action( 'added_post_meta', array( __CLASS__, 'update_post_meta') , 10, 4 );
		add_action( 'updated_postmeta', array( __CLASS__, 'update_post_meta') , 10, 4 );
		add_action( 'deleted_post_meta', array( __CLASS__, 'update_post_meta') , 10, 4 );

		// Mark the post as needs updating when taxonomies get added to it.
		add_action( 'set_object_terms',  array( __CLASS__, 'update_post_taxomony') , 10, 6 );

		// Update comment count
		add_action( 'wp_update_comment_count',  array( __CLASS__, 'update_comment_count' ) , 10, 3 );

		// Sync post when the cache is cleared
		add_action( 'clean_post_cache', array( __CLASS__, 'clear_post_cache' ), 10, 2 );
	}

	static function transition_post_status( $new_status, $old_status, $post ) {
		if ( 'trash' === $new_status && self::should_post_delete_sync( $post->ID, $post ) ) {
			self::$posts['delete'][] = $post->ID;
			return;
		}

		if ( self::should_post_sync( $post->ID, $post ) ) {
			self::$posts['sync'][] = $post->ID;
		}
	}

	static function delete_post_action( $post_id ) {
		if ( self::should_post_delete_sync( $post_id ) ) {
			self::$posts['delete'][] = $post_id;
		}
	}

	static function update_post_meta( $meta_id, $post_id, $meta_key, $_meta_value ) {
		if ( self::should_post_sync( $post_id ) ) {
			self::$posts['sync'][] = $post_id;
		}
	}

	static function update_post_taxomony( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ) {
		if ( self::should_post_sync( $object_id ) ) {
			self::$posts['sync'][] = $object_id;
		}
	}

	static function clear_post_cache( $post_id, $post ) {
		if ( self::should_post_sync( $post_id, $post ) ) {
			self::$posts['sync'][] = $post_id;
		}
	}

	static function update_comment_count( $post_id, $new, $old ) {
		if ( self::should_post_sync( $post_id ) && $new !== $old ) {
			self::$posts['sync'][] = $post_id;
		}
	}

	static function should_post_sync( $post_id, $post = null ) {
		// Is already marked as to be synced?
		if ( in_array( $post_id, self::$posts['sync'] ) ) {
			return false;
		}

		if ( ! $post ) {
			$post = get_post( $post_id );
		}
		// white list the post types that you want to sync
		$post_types_to_sync = apply_filters( 'jetpack_post_sync_post_type', array( 'post', 'page', 'attachment' ) );

		if ( ! in_array( $post->post_type, $post_types_to_sync ) ) {
			return false;
		}

		$post_stati_to_sync = apply_filters( 'jetpack_post_sync_post_stati', array( 'publish', 'draft', 'inherit' ) );

		if ( ! in_array( $post->post_status, $post_stati_to_sync ) ) {
			return false;
		}

		return apply_filters( 'jetpack_should_post_sync', true, $post_id, $post );
	}

	static function should_post_delete_sync( $post_id, $post = null ) {

		if ( in_array( $post_id, self::$posts['delete'] ) ) {
			return false;
		}

		if ( ! $post ) {
			$post = get_post( $post_id );
		}

		// white list the post types that you want to sync
		$post_types_to_sync = apply_filters( 'jetpack_post_sync_post_type', array( 'post', 'page', 'attachment' ) );

		if ( ! in_array( $post->post_type, $post_types_to_sync ) ) {
			return false;
		}

		$post_stati_to_sync = apply_filters( 'jetpack_post_sync_post_stati', array( 'publish', 'draft', 'inherit', 'trash' ) );

		if ( ! in_array( $post->post_status, $post_stati_to_sync ) ) {
			return false;
		}

		return apply_filters( 'jetpack_should_post_delete_sync', true, $post_id, $post );
	}
}

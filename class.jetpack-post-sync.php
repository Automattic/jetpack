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
	}

	static function transition_post_status( $new_status, $old_status, $post ) {
		// Don't even try to sync revisions.
		if ( 'revision' === $post->post_type ) {
			return;
		}

		if ( 'trash' === $new_status && ! in_array( $post->ID, self::$posts['delete'] ) ) {
			self::$posts['delete'][] = $post->ID;
			return;
		}

		if ( ! in_array( $post->ID, self::$posts['sync'] ) ) {
			self::$posts['sync'][] = $post->ID;
		}
	}

	static function delete_post_action( $post_id ) {
		if ( ! in_array( $post_id, self::$posts['delete'] ) ) {
			self::$posts['delete'][] = $post_id;
			return;
		}
	}

	static function update_post_meta( $meta_id, $post_id, $meta_key, $_meta_value ) {
		if ( ! in_array( $post_id, self::$posts['sync'] ) ) {
			self::$posts['sync'][] = $post_id;
		}
	}

	static function update_post_taxomony( $object_id, $terms, $tt_ids, $taxonomy, $append, $old_tt_ids ) {
		if ( ! in_array( $object_id, self::$posts['sync'] ) ) {

			// Check that we are dealing with a post that exists in the post table.
			$post = get_post( $object_id );
			if ( $post->ID ) {
				self::$posts['sync'][] = $post->ID;
			}
		}
	}
}

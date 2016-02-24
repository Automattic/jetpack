<?php

class Jetpack_Rest_Sync {

	static $posts = array(
		'new' => array(),
		'update' => array(),
		'delete' => array(),
		);

	static function init() {
		add_action( 'transition_post_status', array( __CLASS__, 'transition_post_status' ), 10, 3 );
		add_action( 'delete_post', array( __CLASS__, 'delete_post_action' ) );

		// set mark the post as needs updating when post meta changes.
		add_action( 'added_post_meta', array( __CLASS__, 'update_post_meta') , 10, 4 );
		add_action( 'updated_postmeta', array( __CLASS__, 'update_post_meta') , 10, 4 );
		add_action( 'deleted_post_meta', array( __CLASS__, 'update_post_meta') , 10, 4 );
	}

	static function transition_post_status( $new_status, $old_status, $post ) {
		if ( 'new' === $old_status && ! in_array( $post->ID, self::$posts['new'] ) ) {
			self::$posts['new'][] = $post->ID;
			return;
		}

		if ( 'trash' === $new_status && ! in_array( $post->ID, self::$posts['delete'] ) ) {
			self::$posts['delete'][] = $post->ID;
			return;
		}

		if ( ! in_array( $post->ID, self::$posts['update'] ) ) {
			self::$posts['update'][] = $post->ID;
		}
	}

	static function delete_post_action( $post_id ) {
		if ( ! in_array( $post_id, self::$posts['delete'] ) ) {
			self::$posts['delete'][] = $post_id;
			return;
		}
	}

	static function update_post_meta( $meta_id, $post_id, $meta_key, $_meta_value ) {
		if ( ! in_array( $post_id, self::$posts['update'] ) ) {
			self::$posts['update'][] = $post_id;
		}
	}
}

Jetpack_Rest_Sync::init();

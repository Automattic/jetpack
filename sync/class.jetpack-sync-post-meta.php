<?php

class Jetpack_Sync_Post_Meta {

	static $sync = array();
	static $delete = array();

	static $max_to_sync = 10;
	static $que_option_name = 'jetpack_sync_post_ids_que';

	static function init() {
		// Mark the post as needs updating when post meta data changes.
		add_action( 'added_post_meta', array( __CLASS__, 'update_post_meta' ), 10, 4 );
		add_action( 'updated_postmeta', array( __CLASS__, 'update_post_meta' ), 10, 4 );
		add_action( 'deleted_post_meta', array( __CLASS__, 'delete_post_meta' ), 10, 4 );

	}

	/**
	 * added_post_meta, update_post_meta, delete_post_meta
	 */
	static function update_post_meta( $meta_ids, $post_id, $meta_key, $meta_value ) {
		$ignore_meta_keys = array( '_edit_lock', '_pingme', '_encloseme' );
		if ( in_array( $meta_key, $ignore_meta_keys ) ) {
			return;
		}
		$data = array( 'id' => $meta_ids, 'key' => $meta_key, 'post_id' => $post_id, 'value' => $meta_value );
		$key  = ( ! is_array( $meta_ids ) ? $meta_ids : json_encode( $data ) );

		self::$sync[ $key ] = $data;
		Jetpack_Sync::schedule_sync();
	}

	static function delete_post_meta( $meta_ids, $post_id, $meta_key, $meta_value ) {
		$data                 = array(
			'id'      => $meta_ids,
			'key'     => $meta_key,
			'post_id' => $post_id,
			'value'   => $meta_value
		);
		$key                  = ( ! is_array( $meta_ids ) ? $meta_ids : json_encode( $data ) );
		self::$delete[ $key ] = $data;
		Jetpack_Sync::schedule_sync();
	}

	static function post_meta_to_sync() {
		return array_values( self::$sync );
	}

	static function post_meta_to_delete() {
		return array_values( self::$delete );
	}
}


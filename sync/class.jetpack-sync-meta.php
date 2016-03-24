<?php

class Jetpack_Sync_Meta {

	static $sync = array();
	static $delete = array();

	static $max_to_sync = 10;

	static private $meta_types = array( 'post', 'comment' );


	static function init() {
		foreach ( self::$meta_types as $type ) {
			add_action( 'added_' . $type . '_meta', array( __CLASS__, 'update_meta' ), 10, 4 );
			add_action( 'updated_' . $type . '_meta', array( __CLASS__, 'update_meta' ), 10, 4 );
			add_action( 'deleted_' . $type . '_meta', array( __CLASS__, 'delete_meta' ), 10, 4 );
		}
	}

	static function update_meta( $meta_ids, $object_id, $meta_key, $meta_value ) {
		$action_array = explode( '_', current_action() );
		$type = $action_array[1];

		$ignore_meta_keys = array( '_edit_lock', '_pingme', '_encloseme' );
		if ( in_array( $meta_key, $ignore_meta_keys ) ) {
			return;
		}
		$data = array( 'id' => $meta_ids, 'key' => $meta_key, $type.'_id' => $object_id, 'value' => $meta_value );
		$key  = ( ! is_array( $meta_ids ) ? $meta_ids : json_encode( $data ) );

		self::$sync[ $type ][ $key ] = $data;
		Jetpack_Sync::schedule_sync();
	}

	static function delete_meta( $meta_ids, $object_id, $meta_key, $meta_value ) {
		$action_array = explode( '_', current_action() );
		$type = $action_array[1];
		$data = array(
			'id'      => $meta_ids,
			'key'     => $meta_key,
			$type.'_id' => $object_id,
			'value'   => $meta_value,
		);

		$key = ( ! is_array( $meta_ids ) ? $meta_ids : json_encode( $data ) );

		self::$delete[ $type ][ $key ] = $data;
		Jetpack_Sync::schedule_sync();
	}

	static function meta_to_sync( $type ) {
		if ( isset( self::$sync[ $type ] ) ) {
			return array_values( self::$sync[ $type ] );
		}
		return array();
	}

	static function meta_to_delete( $type ) {
		if ( isset(  self::$delete[ $type ] ) ) {
			return array_values( self::$delete[ $type ] );
		}
		return array();
	}
}


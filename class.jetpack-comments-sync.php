<?php

class Jetpack_Comments_Sync {

	static $sync = array();
	static $delete = array();

	static $jetpack_sync = null;

	static function init() {

		$jetpack = Jetpack::init();
		self::$jetpack_sync = $jetpack->sync;

		add_action( 'wp_insert_comment',         array( __CLASS__, 'wp_insert_comment' ),         10, 2 );
		add_action( 'transition_comment_status', array( __CLASS__, 'transition_comment_status' ), 10, 3 );
		add_action( 'edit_comment',              array( __CLASS__, 'edit_comment' ) );
		add_action( 'delete_comment',              array( __CLASS__, 'delete_comment' ) );
	}
	static function sync( $comment_id ) {
		self::$sync[] = $comment_id;
	}
	static function get_comment_ids_to_sync() {
		return array_unique( self::$sync );
	}

	static function get_comment_ids_to_delete() {
		return array_unique( self::$delete );
	}

	static function wp_insert_comment( $comment_id, $comment ) {
		self::sync( $comment_id );
	}

	static function transition_comment_status( $new_status, $old_status, $comment ) {
		self::sync( $comment->comment_ID );
	}

	static function edit_comment( $comment_id ) {
		self::sync( $comment_id );
	}

	static function delete_comment( $comment_id ) {
		self::$delete[] = $comment_id;
	}

}
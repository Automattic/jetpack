<?php

class Jetpack_Sync_Comments {

	static $sync = array();
	static $delete = array();

	static $max_to_sync = 20;
	static $que_option_name = 'jetpack_sync_comment_ids_que';

	static function init() {
		add_action( 'wp_insert_comment',         array( __CLASS__, 'wp_insert_comment' ),         10, 2 );
		add_action( 'transition_comment_status', array( __CLASS__, 'transition_comment_status' ), 10, 3 );
		add_action( 'edit_comment',              array( __CLASS__, 'edit_comment' ) );
		add_action( 'delete_comment',              array( __CLASS__, 'delete_comment' ) );
	}

	static function sync( $comment_id ) {
		self::$sync[] = $comment_id;
		Jetpack_Sync::schedule_sync();
	}

	static function get_comment_ids_to_sync() {
		$ids_que = get_option( self::$que_option_name );
		if ( ! empty( $ids_que ) ) {
			self::$sync = array_unique( array_merge( self::$sync, $ids_que ) );
		}
		return self::slice_ids( self::$sync );
	}

	static function get_post_ids_that_changed() {
		$post_ids_que = get_option( self::$que_option_name );
		if( ! empty( $post_ids_que ) ) {
			self::$sync = array_unique( array_merge( self::$sync, $post_ids_que ) );
		}
		return self::slice_ids( self::$sync );
	}

	static function slice_ids( $ids ) {
		if( sizeof( $ids ) <= self::$max_to_sync ) {
			delete_option( self::$que_option_name );
			return $ids;
		}
		$to_save = array_splice( $ids, self::$max_to_sync );
		update_option( self::$que_option_name, $to_save );
		Jetpack_Sync::schedule_next_cron();
		// 1440 minutes in a day ( if max is 20 ) we can only sync 28800 comments in a day using this que.
		return $ids;
	}

	static function comments_to_delete() {
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
		Jetpack_Sync::schedule_sync();
	}

	static function comments_to_sync() {
		// Preserve the global comment
		$global_comment = isset( $GLOBALS['comment'] ) ? $GLOBALS['comment'] : null;
		unset( $GLOBALS['comment'] );

		$comments = array();
		foreach ( self::get_comment_ids_to_sync() as $comment_id ) {
			$comments[ $comment_id ] = self::get_comment( $comment_id );
		}
		$GLOBALS['comment'] = $global_comment;
		unset( $global_comment );
		return $comments;
	}

	static function get_comment( $comment_id ) {
//		$defaults = array(
//			'post_types'    => array( 'post', 'page' ),
//			// For what post types will we sync comments?
//			'post_stati'    => array( 'publish' ),
//			// For what post stati will we sync comments?
//			'comment_types' => array( '', 'comment', 'trackback', 'pingback' ),
//			// What comment types will we sync?
//			'comment_stati' => array( 'approved' ),
//			// What comment stati will we sync?
//		);
		$comment_obj = get_comment( $comment_id );
		if ( ! $comment_obj ) {
			return false;
		}
		$comment = get_object_vars( $comment_obj );

		$meta            = get_comment_meta( $comment_id, false );
		$comment['meta'] = array();
		foreach ( $meta as $key => $value ) {
			$comment['meta'][ $key ] = array_map( 'maybe_unserialize', $value );
		}

		return $comment;
	}

}

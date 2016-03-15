<?php

class Jetpack_Sync_Comments {

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
	}

	static function comments_to_sync() {
		$comments = array();
		foreach ( self::get_comment_ids_to_sync() as $comment_id ) {
			$comments[ $comment_id ] = self::get_comment( $comment_id );
		}

		return $comments;
	}

	static function get_comment( $comment_id ) {
		return self::json_api( self::get_api_url( $comment_id) );
	}

	static function get_api_url( $comment_id ) {
		return sprintf( 'https://' . JETPACK__WPCOM_JSON_API_HOST . '/rest/v1.1/sites/%1$d/comments/%2$s', Jetpack_Options::get_option( 'id' ), $comment_id );
	}

	static function json_api( $url, $method = 'GET' ) {
		require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
		$api = WPCOM_JSON_API::init( $method, $url, null, true );

		require_once( JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php' );
		require_once( JETPACK__PLUGIN_DIR . 'json-endpoints.php' );

		new WPCOM_JSON_API_Get_Comment_Endpoint( array(
			'description' => 'Get a single comment.',
			'group'       => 'comments',
			'stat'        => 'comments:1',
			'method'      => 'GET',
			'path'        => '/sites/%s/comments/%d',
			'path_labels' => array(
				'$site'       => '(int|string) Site ID or domain',
				'$comment_ID' => '(int) The comment ID'
			),
		) );

		$contents = $api->serve( false, true );

		return $contents;
	}

}

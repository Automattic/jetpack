<?php

// special factory that creates transient versions of various WP objects
class JetpackSyncTestObjectFactory {
	static $default_post_props = array(
		'post_title'            => 'The Title',
		'post_content'          => 'The Content',
		'post_name'             => 'the-title',
		'post_content_filtered' => 'The Content',
		'filter'                => 'raw',
		'post_author'           => '0',
		'post_excerpt'          => '',
		'post_status'           => 'publish',
		'post_type'             => 'post',
		'comment_status'        => 'closed',
		'ping_status'           => '',
		'post_password'         => '',
		'to_ping'               => '',
		'pinged'                => '',
		'post_parent'           => 0,
		'menu_order'            => 0,
		'guid'                  => ''
	);

	static $default_comment_props = array(
		'comment_author'       => 'foobar',
		'comment_author_email' => 'foo@example.com',
		'comment_author_url'   => 'http://example.com',
		'comment_content'      => 'Hi there!',
		'comment_approved'     => '1',
		'comment_type'         => ''
	);

	static $default_user_props = array(
		'user_url' => 'http://example.com',
		'user_activation_key' => '',
		'user_status' => 0,
	);

	function post( $id, $props = array() ) {

		$now     = current_time( 'mysql' );
		$now_gmt = get_gmt_from_date( $now );

		$post = (object) array_merge(
			self::$default_post_props,
			$props,
			array(
				'ID'                => $id,
				'post_date'         => $now,
				'post_date_gmt'     => $now_gmt,
				'post_modified'     => $now,
				'post_modified_gmt' => $now_gmt
			)
		);

		return new WP_Post( $post );
	}

	function comment( $id, $post_id, $props = array() ) {

		$now     = current_time( 'mysql' );
		$now_gmt = get_gmt_from_date( $now );

		$comment = (object) array_merge(
			self::$default_comment_props,
			$props,
			array(
				'comment_ID'       => $id,
				'comment_post_ID'  => $post_id,
				'comment_date'     => $now,
				'comment_date_gmt' => $now_gmt,
			)
		);

		return new WP_Comment( $comment );
	}

	function user( $id, $username, $props = array() ) {
		$now     = current_time( 'mysql' );

		$user = (object) array_merge(
			self::$default_user_props,
			$props,
			array(
				'ID' => $id,
				'user_login' => $username,
				'user_nicename' => $username,
				'user_email' => "$username@example.com",
				'user_registered' => $now,
				'display_name' => $username,
			)
		);

		return new WP_User( $user );
	}
}
<?php

require_once dirname( __FILE__ ) . '/../../../sal/class.json-api-platform.php';

class SalPostsTest extends WP_UnitTestCase {
	static $token;
	static $site;

	static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		self::$token = (object) array(
			'blog_id'          => get_current_blog_id(),
			'user_id'          => get_current_user_id(),
			'external_user_id' => 2,
			'role'             => 'administrator'
		);

		$platform = wpcom_get_sal_platform( self::$token );

		self::$site = $platform->get_site( self::$token->blog_id );
	}

	function test_returns_content_wrapped_in_a_post_object() {
		// Insert the post into the database
		$post_id = wp_insert_post( array(
			'post_title'    => 'Title',
			'post_content'  => 'The content.',
			'post_status'   => 'publish',
			'post_author'   => get_current_user_id()
		) );

		$post = get_post( $post_id );

		$wrapped_post = self::$site->wrap_post( $post, 'display' );

		$this->assertEquals( $post->post_type, $wrapped_post->get_type() );
	}
}

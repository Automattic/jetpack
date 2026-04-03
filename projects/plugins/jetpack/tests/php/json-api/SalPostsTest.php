<?php

require_once JETPACK__PLUGIN_DIR . 'sal/class.json-api-platform.php';

class SalPostsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public static $token;
	public static $site;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$token = (object) array(
			'blog_id'          => get_current_blog_id(),
			'user_id'          => get_current_user_id(),
			'external_user_id' => 2,
			'role'             => 'administrator',
		);

		$platform = wpcom_get_sal_platform( self::$token );

		self::$site = $platform->get_site( self::$token->blog_id );
	}

	public function test_returns_content_wrapped_in_a_post_object() {
		// Insert the post into the database
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Title',
				'post_content' => 'The content.',
				'post_status'  => 'publish',
				'post_author'  => get_current_user_id(),
			)
		);

		$post = get_post( $post_id );

		$wrapped_post = self::$site->wrap_post( $post, 'display' );

		$this->assertEquals( $post->post_type, $wrapped_post->get_type() );
	}

	public function test_get_has_password_returns_true_when_post_has_password() {
		$post_id = wp_insert_post(
			array(
				'post_title'    => 'Password Protected Post',
				'post_content'  => 'Secret content.',
				'post_status'   => 'publish',
				'post_password' => 'secret123',
				'post_author'   => get_current_user_id(),
			)
		);

		$post         = get_post( $post_id );
		$wrapped_post = self::$site->wrap_post( $post, 'display' );

		$this->assertTrue( $wrapped_post->get_has_password() );
	}

	public function test_get_has_password_returns_false_when_post_has_no_password() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Public Post',
				'post_content' => 'Public content.',
				'post_status'  => 'publish',
				'post_author'  => get_current_user_id(),
			)
		);

		$post         = get_post( $post_id );
		$wrapped_post = self::$site->wrap_post( $post, 'display' );

		$this->assertFalse( $wrapped_post->get_has_password() );
	}
}

<?php
/**
 * Blog Transient Lib Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Tests for blog-scoped transient lib functions.
 */
class Transients_Test extends \WorDBless\BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	public function tear_down(): void {
		wpcom_delete_blog_transient( 'test_transient' );
		parent::tear_down();
	}

	/**
	 * Tests that set and get work together.
	 */
	public function test_set_and_get_blog_transient() {
		wpcom_set_blog_transient( 'test_transient', 'hello', 60 );
		$this->assertSame( 'hello', wpcom_get_blog_transient( 'test_transient' ) );
	}

	/**
	 * Tests that get returns false when transient is not set.
	 */
	public function test_get_returns_false_when_not_set() {
		$this->assertFalse( wpcom_get_blog_transient( 'nonexistent_transient' ) );
	}

	/**
	 * Tests that delete removes the transient.
	 */
	public function test_delete_blog_transient() {
		wpcom_set_blog_transient( 'test_transient', 'value', 60 );
		wpcom_delete_blog_transient( 'test_transient' );
		$this->assertFalse( wpcom_get_blog_transient( 'test_transient' ) );
	}
}

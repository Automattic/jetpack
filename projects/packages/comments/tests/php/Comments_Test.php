<?php
/**
 * Tests for the package entry point.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use WorDBless\BaseTestCase;

/**
 * Tests for the Comments class.
 */
class Comments_Test extends BaseTestCase {

	/**
	 * Clean up between tests.
	 *
	 * @after
	 */
	#[\PHPUnit\Framework\Attributes\After]
	public function tear_down_filters() {
		remove_all_filters( 'jetpack_comments_new_hotness' );
		Comment_Form_Test::reset_comment_form();
	}

	/**
	 * Nothing loads until the filter says so.
	 */
	public function test_is_disabled_by_default() {
		$this->assertFalse( Comments::is_enabled() );
	}

	/**
	 * The filter turns it on.
	 */
	public function test_filter_enables_the_experience() {
		add_filter( 'jetpack_comments_new_hotness', '__return_true' );

		$this->assertTrue( Comments::is_enabled() );
	}

	/**
	 * Whatever the filter returns is coerced to a boolean.
	 */
	public function test_is_enabled_returns_a_boolean() {
		add_filter(
			'jetpack_comments_new_hotness',
			function () {
				return 1;
			}
		);

		$this->assertSame( true, Comments::is_enabled() );
	}

	/**
	 * Booting the package registers the comment form.
	 */
	public function test_init_registers_the_comment_form() {
		$this->assertFalse( has_filter( 'comment_form_submit_field' ) );

		Comments::init();

		$this->assertNotFalse( has_filter( 'comment_form_submit_field' ) );
	}
}

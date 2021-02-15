<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

/**
 * Connection Manager functionality testing.
 */
class TokensTest extends TestCase {

	/**
	 * Temporary stack for `wp_redirect`.
	 *
	 * @var array
	 */
	protected $arguments_stack = array();

	/**
	 * User ID added for the test.
	 *
	 * @var int
	 */
	protected $user_id;

	const DEFAULT_TEST_CAPS = array( 'default_test_caps' );

	/**
	 * Initialize the object before running the test method.
	 *
	 * @before
	 */
	public function set_up() {
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'test_is_user_connected_with_user_id_logged_in',
				'user_pass'  => '123',
			)
		);
		wp_set_current_user( 0 );
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		Constants::clear_constants();
	}
}

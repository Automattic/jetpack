<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The hook manager test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Provides unit tests for the methods in the Hook_Manager class.
 */
class Test_Hook_Manager extends TestCase {

	/**
	 * The hook manager we're testing.
	 *
	 * @var Hook_Manager
	 */
	private $hook_manager;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->hook_manager = new Hook_Manager();
	}

	/**
	 * Teardown runs after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		cleanup_test_wordpress_data();
	}

	/**
	 * Tests that the hook manager can add actions.
	 */
	public function test_adds_action() {
		$callable = function () {};

		$this->hook_manager->add_action( 'test', $callable, 11, 12 );

		$this->assertFalse( test_has_filter( 'test', $callable, 10, 12 ) );
		$this->assertTrue( test_has_filter( 'test', $callable, 11, 12 ) );
	}

	/**
	 * Tests that the hook manager can add filters.
	 */
	public function test_adds_filters() {
		$callable = function () {};

		$this->hook_manager->add_filter( 'test', $callable, 11, 12 );

		$this->assertFalse( test_has_filter( 'test', $callable, 10, 12 ) );
		$this->assertTrue( test_has_filter( 'test', $callable, 11, 12 ) );
	}

	/**
	 * Tests that the hook manager removes hooks on reset.
	 */
	public function test_resets() {
		$callable = function () {};

		$this->hook_manager->add_filter( 'test', $callable );

		$this->assertTrue( test_has_filter( 'test', $callable ) );

		$this->hook_manager->reset();

		$this->assertFalse( test_has_filter( 'test', $callable ) );
	}
}

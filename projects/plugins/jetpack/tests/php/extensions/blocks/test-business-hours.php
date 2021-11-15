<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Business Hours Block tests
 *
 * @package automattic/jetpack
 */

/**
 * Include the file containing the block's registration and render functions.
 */
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/business-hours/business-hours.php';

/**
 * Include a test case that we can inherit from to make it easier to test against existing fixtures.
 */
require_once __DIR__ . '/class-block-fixture-testcase.php';

/**
 * Business Hours Block tests.
 *
 * These tests primarily check that server rendered markup is not changing unexpectedly
 * when serialized fixtures are updated via the block's JS-based save behaviour.
 *
 * The goal is to catch when changes to serialized markup affects server rendering of the block.
 */
class Business_Hours_Block_Test extends \Jetpack_Block_Fixture_TestCase {
	/**
	 * A variable to track whether or not the block was already registered before the test was run.
	 *
	 * @access private
	 *
	 * @var boolean
	 */
	private $was_registered = false;

	/**
	 * The name of the block under test.
	 *
	 * @access private
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'jetpack/business-hours';

	/**
	 * Setup and ensure the block is registered before running the tests.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();
		$this->was_registered = \Automattic\Jetpack\Blocks::is_registered( self::BLOCK_NAME );
		\Automattic\Jetpack\Extensions\Business_Hours\register_block();
	}

	/**
	 * Teardown and unregister the block if it wasn't registered before running these tests.
	 *
	 * @after
	 */
	public function tear_down() {
		if ( ! $this->was_registered ) {
			unregister_block_type( 'jetpack/business-hours' );
		}
		parent::tear_down();
	}

	/**
	 * Test that the block is registered, which means that it can be registered.
	 */
	public function test_block_can_be_registered() {
		$is_registered = \Automattic\Jetpack\Blocks::is_registered( self::BLOCK_NAME );
		$this->assertTrue( $is_registered );
	}

	/**
	 * This test iterates over the block's serialized fixtures, and tests that the generated
	 * markup matches a fixture for the server rendered markup for the block.
	 *
	 * If no server rendered fixture can be found, then one is created.
	 */
	public function test_server_side_rendering_based_on_serialized_fixtures() {
		$this->generate_server_side_rendering_based_on_serialized_fixtures(
			self::BLOCK_NAME,
			'business-hours',
			'.server-rendered.html'
		);
	}
}

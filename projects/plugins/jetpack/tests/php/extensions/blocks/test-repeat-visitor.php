<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Repeat Visitor Block tests
 *
 * @package automattic/jetpack
 */

/**
 * Include the file containing the block's registration and render functions.
 */
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/repeat-visitor/repeat-visitor.php';

/**
 * Include a test case that we can inherit from to make it easier to test against existing fixtures.
 */
require_once __DIR__ . '/class-block-fixture-testcase.php';

/**
 * Repeat Visitor Block tests.
 *
 * These tests primarily check that server rendered markup is not changing unexpectedly
 * when serialized fixtures are updated via the block's JS-based save behaviour.
 *
 * The goal is to catch when changes to serialized markup affects server rendering of the block.
 *
 * Because the Repeat Visitor block can render in two different states depending on the number
 * of times a visitor has visited the page, in this set of tests, we generate two different kinds
 * of server-rendered fixtures: a set where the visitor is below the visit threshold, and a set
 * where the visitor is above the visit threshold.
 */
class Repeat_Visitor_Block_Test extends \Jetpack_Block_Fixture_TestCase {
	/**
	 * A variable to track whether or not the block was already registered before the test was run.
	 *
	 * @access private
	 *
	 * @var boolean
	 */
	private $was_registered = false;

	/**
	 * A variable to track the current cookie value of repeat visits.
	 *
	 * @access private
	 *
	 * @var number
	 */
	private $original_visit_counter;

	/**
	 * The name of the block under test.
	 *
	 * @access private
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'jetpack/repeat-visitor';

	/**
	 * Setup and ensure the block is registered before running the tests.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();
		$this->was_registered = \Automattic\Jetpack\Blocks::is_registered( self::BLOCK_NAME );
		\Automattic\Jetpack\Extensions\Repeat_Visitor\register_block();

		if ( isset( $_COOKIE['jp-visit-counter'] ) ) {
			$this->original_visit_counter = intval( $_COOKIE['jp-visit-counter'] );
		}
	}

	/**
	 * Teardown and unregister the block if it wasn't registered before running these tests.
	 *
	 * @after
	 */
	public function tear_down() {
		if ( ! $this->was_registered ) {
			unregister_block_type( self::BLOCK_NAME );
		}

		if ( isset( $this->original_visit_counter ) ) {
			$_COOKIE['jp-visit-counter'] = $this->original_visit_counter;
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
	 * Set the visit counter to zero, and test the serialized fixtures as though the visitor
	 * is below the Repeat Visitor block's threshold.
	 *
	 * This will generate server-rendered fixtures if they do not exist.
	 */
	public function test_server_side_rendering_based_on_serialized_fixtures_below_threshold() {
		$_COOKIE['jp-visit-counter'] = 0;

		$this->generate_server_side_rendering_based_on_serialized_fixtures(
			self::BLOCK_NAME,
			'repeat-visitor',
			'.server-rendered-below-threshold.html'
		);
	}

	/**
	 * Set the visit counter to zero, and test the serialized fixtures as though the visitor
	 * is above the Repeat Visitor block's threshold.
	 *
	 * This will generate server-rendered fixtures if they do not exist.
	 */
	public function test_server_side_rendering_based_on_serialized_fixtures_above_threshold() {
		$_COOKIE['jp-visit-counter'] = 999;

		$this->generate_server_side_rendering_based_on_serialized_fixtures(
			self::BLOCK_NAME,
			'repeat-visitor',
			'.server-rendered-above-threshold.html'
		);
	}
}

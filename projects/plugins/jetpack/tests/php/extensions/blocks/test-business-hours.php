<?php
/**
 * Business Hours Block tests
 *
 * @package automattic/jetpack
 */

/**
 * Include the file containing the block's registration and render functions.
 */
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/business-hours/business-hours.php';

const BLOCK_NAME = 'jetpack/business-hours';

/**
 * Business Hours Block tests.
 *
 * These tests primarily check that server rendered markup is not changing unexpectedly
 * when serialized fixtures are updated via the block's JS-based save behaviour.
 *
 * The goal is to catch when changes to serialized markup affects server rendering of the block.
 */
class Business_Hours_Block_Test extends \WP_UnitTestCase {
	/**
	 * A variable to track whether or not the block was already registered before the test was run.
	 *
	 * @access private
	 *
	 * @var boolean
	 */
	private $was_registered = false;

	/**
	 * Setup and ensure the block is registered before running the tests.
	 *
	 * @before
	 */
	public function set_up() {
		$this->was_registered = \Automattic\Jetpack\Blocks::is_registered( BLOCK_NAME );
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
	}

	/**
	 * Test that the block is registered, which means that it can be registered.
	 */
	public function test_block_can_be_registered() {
		$is_registered = \Automattic\Jetpack\Blocks::is_registered( BLOCK_NAME );
		$this->assertTrue( $is_registered );
	}

	/**
	 * This test iterates over the block's serialized fixtures, and tests that the generated
	 * markup matches a fixture for the server rendered markup for the block.
	 *
	 * If no server rendered fixture can be found, then one is created.
	 */
	public function test_server_side_rendering_based_on_serialized_fixtures() {
		// phpcs:disable WordPress.WP.AlternativeFunctions
		$fixtures_path = 'extensions/blocks/business-hours/test/fixtures/';
		$file_pattern  = '*.serialized.html';
		$files         = glob( JETPACK__PLUGIN_DIR . $fixtures_path . $file_pattern );

		$fail_messages = array();

		foreach ( $files as $file ) {
			$block_markup = trim( file_get_contents( $file ) );

			$parsed_blocks   = parse_blocks( $block_markup );
			$rendered_output = render_block( $parsed_blocks[0] );

			$target_markup_filename = str_replace( '.serialized.html', '.server-rendered.html', $file );

			// Create a server rendered fixture if one does not exist.
			if ( ! file_exists( $target_markup_filename ) ) {
				file_put_contents( $target_markup_filename, $rendered_output );
				$fail_messages[] =
					sprintf(
						"No server rendered fixture could be found for the %s block's %s fixture\n" .
						"A fixture file has been created in: %s\n",
						BLOCK_NAME,
						basename( $file ),
						$fixtures_path . basename( $target_markup_filename )
					);
			}

			$server_rendered_fixture = file_get_contents( $target_markup_filename );
			$this->assertEquals(
				$rendered_output,
				trim( $server_rendered_fixture ),
				sprintf(
					'The results of render_block for %s called with serialized markup from %s do not match ' .
					"the server-rendered fixture: %s\n",
					BLOCK_NAME,
					basename( $file ),
					basename( $target_markup_filename )
				)
			);
		}

		// Fail the test if any fixtures were missing, and report that fixtures have been generated.
		if ( ! empty( $fail_messages ) ) {
			$this->fail(
				implode( "\n", $fail_messages ) .
				"\nTry running this test again. Be sure to commit generated fixture files with any code changes."
			);
		}
		// phpcs:enable WordPress.WP.AlternativeFunctions
	}
}

<?php
/**
 * Story Block tests
 *
 * @package automattic/jetpack
 */

/**
 * Include the file containing the block's registration and render functions.
 */
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/story/story.php';

/**
 * Story Block tests.
 *
 * These tests primarily check that server rendered markup is not changing unexpectedly
 * when serialized fixtures are updated via the block's JS-based save behaviour.
 *
 * The goal is to catch when changes to serialized markup affects server rendering of the block.
 */
class Story_Block_Test extends \WP_UnitTestCase {
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
		parent::set_up();
		$this->was_registered = \Automattic\Jetpack\Blocks::is_registered( 'jetpack/story' );
		\Automattic\Jetpack\Extensions\Story\register_block();
		add_filter( 'get_post_metadata', array( $this, 'get_metadata' ), 10, 2 );
	}

	/**
	 * Teardown and unregister the block if it wasn't registered before running these tests.
	 *
	 * @after
	 */
	public function tear_down() {
		if ( ! $this->was_registered ) {
			unregister_block_type( 'jetpack/story' );
		}
		remove_filter( 'get_post_metadata', array( $this, 'get_attachment_metadata' ) );
		parent::tear_down();
	}

	/**
	 * Mock function to retrieve metadata about some post attachement
	 *
	 * @param mixed $metadata   Current metadata value.
	 * @param int   $object_id  ID of the object.
	 */
	public function get_metadata( $metadata, $object_id ) {
		// Attachment with id 14 represents the videopress media
		// in `extensions/blocks/story/test/fixtures/jetpack__story__story-with-videopress.html`.
		if ( 14 === $object_id ) {
			return array(
				array(
					'width'      => 320,
					'height'     => 640,
					'original'   => array(
						'url' => 'https://videos.files.wordpress.com/xxyyzz/videopress.mp4',
					),
					'videopress' => array(
						'description' => 'This is the video description',
						'poster'      => 'http://localhost/wp-includes/images/videopress_poster.png',
					),
				),
			);
		}
		return $metadata;
	}

	/**
	 * Test that the block is registered, which means that it can be registered.
	 */
	public function test_block_can_be_registered() {
		$is_registered = \Automattic\Jetpack\Blocks::is_registered( 'jetpack/story' );
		$this->assertTrue( $is_registered );
	}

	/**
	 * This test iterates over the block's serialized fixtures, and tests that the generated
	 * markup matches a fixture for the server rendered markup for the block.
	 *
	 * If no server rendered fixture can be found, then one is created.
	 */
	public function test_server_side_rendering_based_on_serialized_fixtures() {
		$fixtures_path = 'extensions/blocks/story/test/fixtures/';
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
						'jetpack/story',
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
					'jetpack/story',
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
	}
}

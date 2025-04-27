<?php
/**
 * Test class for WPCOM_Enqueue_Dynamic_Script.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class for WPCOM_Enqueue_Dynamic_Script_Test.
 *
 * @covers WPCOM_Enqueue_Dynamic_Script
 */
#[CoversClass( WPCOM_Enqueue_Dynamic_Script::class )]
class WPCOM_Enqueue_Dynamic_Script_Test extends \WorDBless\BaseTestCase {
	/**
	 * Original scripts.
	 *
	 * @var WP_Scripts
	 */
	private $original_scripts;

	/**
	 * Runs the routine before each test is executed.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_scripts;
		$this->original_scripts = $wp_scripts;

		// Start with a clean state.
		$wp_scripts = new WP_Scripts();
		WPCOM_Enqueue_Dynamic_Script::reset();
	}

	/**
	 * Runs the routine after each test is executed.
	 */
	public function tear_down() {
		WPCOM_Enqueue_Dynamic_Script::reset();
		global $wp_scripts;

		// Reset to original state.
		$wp_scripts = $this->original_scripts;
		parent::tear_down();
	}

	/**
	 * Test enqueueing a simple chain of scripts.
	 */
	public function test_simple_chain() {
		// c <- b <- a
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array(), '100', true );
		wp_register_script( 'test-script-b', '/wp-includes/js/test-script-b.js', array( 'test-script-a' ), '101', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-b' ), '102', true );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// Test URLs
		$expected_keys = array( 'test-script-a', 'test-script-b', 'test-script-c' );
		$this->assertEquals( $expected_keys, array_keys( $script_data['urls'] ) );
		foreach ( $script_data['urls'] as $key => $url ) {
			$expected_substring = "/wp-includes/js/{$key}.js";
			$this->assertStringContainsString( $expected_substring, $url, "URL for $key does not contain $expected_substring" );
		}

		// Test extras
		$this->assertEquals(
			array(
				'test-script-a' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
				'test-script-b' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
				'test-script-c' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
			),
			$script_data['extras']
		);

		// Test loader
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'test-script-a' => array(),
					'test-script-b' => array( 'test-script-a' ),
					'test-script-c' => array( 'test-script-b' ),
				),
			),
			$script_data['loader']
		);
	}

	/**
	 * Test enqueueing a script with a dependency that is already enqueued.
	 */
	public function test_dummy_script() {
		$script = 'console.log("dummy script loaded");';
		wp_register_script( 'my-dummy-script', false, array(), '0.1.0', true );
		wp_add_inline_script( 'my-dummy-script', $script );

		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array( 'my-dummy-script' ), '100', true );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-a' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// Urls
		$expected_keys = array( 'my-dummy-script', 'test-script-a' );
		$this->assertEquals( $expected_keys, array_keys( $script_data['urls'] ) );
		$this->assertStringContainsString( '/wp-includes/js/test-script-a.js', $script_data['urls']['test-script-a'] );
		$this->assertEmpty( $script_data['urls']['my-dummy-script'] );

		// Extras
		$this->assertEquals(
			array(
				'my-dummy-script' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(
						0 => 'console.log("dummy script loaded");',
					),
				),
				'test-script-a'   => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
			),
			$script_data['extras']
		);

		// Loader
		$this->assertEquals(
			array(
				'test-script-a' => array(
					'my-dummy-script' => array(),
					'test-script-a'   => array( 'my-dummy-script' ),
				),
			),
			$script_data['loader']
		);
	}

	/**
	 * Test dynamically enqueueing a script with a dependency that is statically enqueued.
	 */
	public function test_before_after() {
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array(), '100', true );
		wp_register_script( 'test-script-b', '/wp-includes/js/test-script-b.js', array( 'test-script-a' ), '101', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-b' ), '102', true );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );

		$before_script = 'console.log("This is printed before test-script-a.");';
		wp_add_inline_script( 'test-script-a', $before_script, 'before' );

		$after_script = 'console.log("This is printed after test-script-a.");';
		wp_add_inline_script( 'test-script-a', $after_script, 'after' );

		$before_script = 'console.log("This is printed before test-script-b.");';
		wp_add_inline_script( 'test-script-b', $before_script, 'before' );

		$after_script = 'console.log("This is printed after test-script-c.");';
		wp_add_inline_script( 'test-script-c', $after_script, 'after' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// test-script-a should have both 'before' and 'after' extras.
		$this->assertArrayHasKey( 'before', $script_data['extras']['test-script-a'] );
		$this->assertArrayHasKey( 'after', $script_data['extras']['test-script-a'] );
		$this->assertEquals( 'console.log("This is printed before test-script-a.");', $script_data['extras']['test-script-a']['before'][0] );
		$this->assertEquals( 'console.log("This is printed after test-script-a.");', $script_data['extras']['test-script-a']['after'][0] );

		// test-script-b should only have 'before' extra.
		$this->assertArrayHasKey( 'before', $script_data['extras']['test-script-b'] );
		$this->assertArrayHasKey( 'after', $script_data['extras']['test-script-b'] );
		$this->assertEquals( 'console.log("This is printed before test-script-b.");', $script_data['extras']['test-script-b']['before'][0] );
		$this->assertEmpty( $script_data['extras']['test-script-b']['after'] );

		// test-script-c should only have 'after' extra.
		$this->assertArrayHasKey( 'before', $script_data['extras']['test-script-c'] );
		$this->assertArrayHasKey( 'after', $script_data['extras']['test-script-c'] );
		$this->assertEmpty( $script_data['extras']['test-script-c']['before'] );
		$this->assertEquals( 'console.log("This is printed after test-script-c.");', $script_data['extras']['test-script-c']['after'][0] );

		ob_start();
		do_action( 'wp_footer' );
		$output = ob_get_clean();

		$this->assertTrue( strpos( $output, "'test-script-a': { translations: 0, before: 1, after: 1 }" ) !== false );
		$this->assertTrue( strpos( $output, "'test-script-b': { translations: 0, before: 1, after: 0 }" ) !== false );
		$this->assertTrue( strpos( $output, "'test-script-c': { translations: 0, before: 0, after: 1 }" ) !== false );

		$this->assertSame( 1, substr_count( $output, "'test-script-a': { translations: 0, before: 1, after: 1 }" ) );
		$this->assertSame( 1, substr_count( $output, "'test-script-b': { translations: 0, before: 1, after: 0 }" ) );
		$this->assertSame( 1, substr_count( $output, "'test-script-c': { translations: 0, before: 0, after: 1 }" ) );
	}

	/**
	 * Test whether statically enqueued dependencies are skipped for dynamic loading.
	 */
	public function test_statically_enqueued_dependency() {
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array(), '100', true );
		wp_register_script( 'test-script-b', '/wp-includes/js/test-script-b.js', array( 'test-script-a' ), '101', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-b' ), '102', true );
		wp_enqueue_script( 'test-script-a' );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// Test URLs
		$expected_keys = array( 'test-script-b', 'test-script-c' );
		$this->assertEquals( $expected_keys, array_keys( $script_data['urls'] ) );
		foreach ( $script_data['urls'] as $key => $url ) {
			$expected_substring = "/wp-includes/js/{$key}.js";
			$this->assertStringContainsString( $expected_substring, $url, "URL for $key does not contain $expected_substring" );
		}

		// Test extras
		$this->assertEquals(
			array(
				'test-script-b' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
				'test-script-c' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
			),
			$script_data['extras']
		);

		// Test loader
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'test-script-b' => array(),
					'test-script-c' => array( 'test-script-b' ),
				),
			),
			$script_data['loader']
		);
	}

	/**
	 * Test whether a statically enqueued top-level script is skipped entirely for dynamic loading.
	 */
	public function test_statically_enqueued_top_level_script() {
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array(), '100', true );
		wp_register_script( 'test-script-b', '/wp-includes/js/test-script-b.js', array( 'test-script-a' ), '101', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-b' ), '102', true );

		$before_script = 'console.log("This is printed before test-script-c.");';
		wp_add_inline_script( 'test-script-c', $before_script, 'before' );
		$after_script = 'console.log("This is printed after test-script-c.");';
		wp_add_inline_script( 'test-script-c', $after_script, 'after' );

		wp_enqueue_script( 'test-script-c' );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// Test URLs
		$expected_keys = array( 'test-script-c' );
		$this->assertEquals( $expected_keys, array_keys( $script_data['urls'] ) );
		$expected_substring = '';
		$url                = $script_data['urls']['test-script-c'];
		$this->assertEquals( $expected_substring, $url, 'URL for test-script-c is not empty' );

		// Test extras
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
			),
			$script_data['extras']
		);

		// Test loader
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'test-script-c' => array(),
				),
			),
			$script_data['loader']
		);
	}

	/**
	 * Test the same script enqueued multiple times.
	 */
	public function test_multiple_enqueues() {
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array(), '100', true );
		wp_register_script( 'test-script-b', '/wp-includes/js/test-script-b.js', array( 'test-script-a' ), '101', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-b' ), '102', true );

		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// Test URLs
		$expected_keys = array( 'test-script-a', 'test-script-b', 'test-script-c' );
		$this->assertEquals( $expected_keys, array_keys( $script_data['urls'] ) );
		foreach ( $script_data['urls'] as $key => $url ) {
			$expected_substring = "/wp-includes/js/{$key}.js";
			$this->assertStringContainsString( $expected_substring, $url, "URL for $key does not contain $expected_substring" );
		}

		// Test extras
		$this->assertEquals(
			array(
				'test-script-a' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
				'test-script-b' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
				'test-script-c' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
			),
			$script_data['extras']
		);

		// Test loader
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'test-script-a' => array(),
					'test-script-b' => array( 'test-script-a' ),
					'test-script-c' => array( 'test-script-b' ),
				),
			),
			$script_data['loader']
		);
	}

	/**
	 * Tests unregistered script enqueue.
	 */
	public function test_unregistered_script_enqueue() {
		// This doesn't throw an exception; instead, the enqueue is ignored.
		$result = WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'unregistered-script' );

		$this->assertFalse( $result );

		$script_data = WPCOM_Enqueue_Dynamic_Script::build_script_data();
		$this->assertNull( $script_data );
	}

	/**
	 * Tests script with unregistered dependency enqueued.
	 */
	public function test_unregistered_dep_enqueue() {
		// This doesn't throw an exception; instead, the unknown dependency is removed.
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-b' ), '102', true );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// Test URLs
		$expected_keys = array( 'test-script-c' );
		$this->assertEquals( $expected_keys, array_keys( $script_data['urls'] ) );
		foreach ( $script_data['urls'] as $key => $url ) {
			$expected_substring = "/wp-includes/js/{$key}.js";
			$this->assertStringContainsString( $expected_substring, $url, "URL for $key does not contain $expected_substring" );
		}

		// Test extras
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'translations' => array(),
					'before'       => array(),
					'after'        => array(),
				),
			),
			$script_data['extras']
		);

		// Test loader
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'test-script-c' => array( 'test-script-b' ),
				),
			),
			$script_data['loader']
		);
	}

	/**
	 * Tests script with diamond dependencies.
	 */
	public function test_diamond_deps() {
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array(), '100', true );
		wp_register_script( 'test-script-b1', '/wp-includes/js/test-script-b1.js', array( 'test-script-a' ), '101', true );
		wp_register_script( 'test-script-b2', '/wp-includes/js/test-script-b2.js', array( 'test-script-a' ), '102', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-b1', 'test-script-b2' ), '103', true );

		$after_script = 'console.log("This is printed after test-script-a.");';
		wp_add_inline_script( 'test-script-a', $after_script, 'after' );

		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-c' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();

		// Test URLs
		$expected_keys = array( 'test-script-a', 'test-script-b1', 'test-script-b2', 'test-script-c' );
		$this->assertEquals( $expected_keys, array_keys( $script_data['urls'] ) );
		foreach ( $script_data['urls'] as $key => $url ) {
			$expected_substring = "/wp-includes/js/{$key}.js";
			$this->assertStringContainsString( $expected_substring, $url, "URL for $key does not contain $expected_substring" );
		}

		// Test extras
		$this->assertArrayHasKey( 'after', $script_data['extras']['test-script-a'] );
		$this->assertEquals( 'console.log("This is printed after test-script-a.");', $script_data['extras']['test-script-a']['after'][0] );
		$this->assertEquals(
			array(
				'translations' => array(),
				'before'       => array(),
				'after'        => array(),
			),
			$script_data['extras']['test-script-b1']
		);
		$this->assertEquals(
			array(
				'translations' => array(),
				'before'       => array(),
				'after'        => array(),
			),
			$script_data['extras']['test-script-b2']
		);
		$this->assertEquals(
			array(
				'translations' => array(),
				'before'       => array(),
				'after'        => array(),
			),
			$script_data['extras']['test-script-c']
		);

		// Test loader
		$this->assertEquals(
			array(
				'test-script-c' => array(
					'test-script-a'  => array(),
					'test-script-b1' => array( 'test-script-a' ),
					'test-script-b2' => array( 'test-script-a' ),
					'test-script-c'  => array( 'test-script-b1', 'test-script-b2' ),
				),
			),
			$script_data['loader']
		);

		ob_start();
		WPCOM_Enqueue_Dynamic_Script::output_inline_scripts( $script_data );
		$output = ob_get_clean();

		$expected_substring = 'wp-enqueue-dynamic-script:test-script-a:after:1';
		$first_instance     = strpos( $output, $expected_substring );
		$this->assertNotFalse( $first_instance, 'Output does not contain expected inline script tag' );

		$next_match = strpos( $output, $expected_substring, $first_instance + 1 );
		$this->assertFalse( $next_match, 'Two copies of same inline script tag found' );

		$unexpected_substring = 'wp-enqueue-dynamic-script:test-script-a:after:2';
		$this->assertStringNotContainsString( $unexpected_substring, $output, 'Inline script tag found for unknown extra script' );
	}

	/**
	 * Tests interleaved dependencies.
	 */
	public function test_interleaved_deps() {
		/*
		// a -> b -> c -> d
		//  \   \ -> e -/^
		//  ->f--------/^
		Seen in my browser:
		@@@ d.js loaded
		!!! c.js loaded
		### e.js loaded
		$$$ f.js loaded
		+++ b.js loaded
		=== a.js loaded
		*/
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array( 'test-script-b', 'test-script-f' ), '100', true );
		wp_register_script( 'test-script-b', '/wp-includes/js/test-script-b.js', array( 'test-script-c', 'test-script-e' ), '101', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-d' ), '102', true );
		wp_register_script( 'test-script-d', '/wp-includes/js/test-script-d.js', array(), '103', true );
		wp_register_script( 'test-script-e', '/wp-includes/js/test-script-e.js', array( 'test-script-d' ), '104', true );
		wp_register_script( 'test-script-f', '/wp-includes/js/test-script-f.js', array( 'test-script-d' ), '105', true );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-a' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();
		$this->assertEquals(
			array(
				'test-script-a' => array(
					'test-script-d' => array(),
					'test-script-c' => array( 'test-script-d' ),
					'test-script-e' => array( 'test-script-d' ),
					'test-script-b' => array( 'test-script-c', 'test-script-e' ),
					'test-script-f' => array( 'test-script-d' ),
					'test-script-a' => array( 'test-script-b', 'test-script-f' ),
				),
			),
			$script_data['loader']
		);
	}

	/**
	 * Tests interleaved dependencies with a script that is already enqueued.
	 */
	public function test_interleaved_deps_not_root() {
		/*
		// a -> b -> c -> d
		// \   \ -> e -/^
		// ->f--------/^
		But we only enqueue B, so A and F shouldn't be needed.
		Seen in my browser:
		@@@ d.js loaded
		!!! c.js loaded
		### e.js loaded
		+++ b.js loaded
		*/
		wp_register_script( 'test-script-a', '/wp-includes/js/test-script-a.js', array( 'test-script-b', 'test-script-f' ), '100', true );
		wp_register_script( 'test-script-b', '/wp-includes/js/test-script-b.js', array( 'test-script-c', 'test-script-e' ), '101', true );
		wp_register_script( 'test-script-c', '/wp-includes/js/test-script-c.js', array( 'test-script-d' ), '102', true );
		wp_register_script( 'test-script-d', '/wp-includes/js/test-script-d.js', array(), '103', true );
		wp_register_script( 'test-script-e', '/wp-includes/js/test-script-e.js', array( 'test-script-d' ), '104', true );
		wp_register_script( 'test-script-f', '/wp-includes/js/test-script-f.js', array( 'test-script-d' ), '105', true );
		WPCOM_Enqueue_Dynamic_Script::enqueue_script( 'test-script-b' );

		$script_data = (array) WPCOM_Enqueue_Dynamic_Script::build_script_data();
		$this->assertEquals(
			array(
				'test-script-b' => array(
					'test-script-d' => array(),
					'test-script-c' => array( 'test-script-d' ),
					'test-script-e' => array( 'test-script-d' ),
					'test-script-b' => array( 'test-script-c', 'test-script-e' ),
				),
			),
			$script_data['loader']
		);
	}
}

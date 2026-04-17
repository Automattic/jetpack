<?php
/**
 * Tests for the shared extension utils asset registration hooks.
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack\Assets;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\Assets\Shared_Extension_Utils_Assets
 */
#[CoversClass( Shared_Extension_Utils_Assets::class )]
class Shared_Extension_Utils_Assets_Test extends TestCase {

	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Run after every test.
	 */
	public function tearDown(): void {
		parent::tearDown();
		Monkey\tearDown();
	}

	/**
	 * Test that configure registers the expected hooks.
	 */
	public function test_configure() {
		$actions = array();

		Functions\when( 'add_action' )->alias(
			function ( ...$args ) use ( &$actions ) {
				$actions[] = $args;
			}
		);

		Shared_Extension_Utils_Assets::configure();

		$this->assertSame(
			array(
				array( 'wp_loaded', array( Shared_Extension_Utils_Assets::class, 'register_assets' ) ),
				array( 'wp_enqueue_scripts', array( Shared_Extension_Utils_Assets::class, 'enqueue_styles' ), 20, 0 ),
				array( 'admin_enqueue_scripts', array( Shared_Extension_Utils_Assets::class, 'enqueue_styles' ), 20, 0 ),
				array( 'enqueue_block_editor_assets', array( Shared_Extension_Utils_Assets::class, 'enqueue_styles' ), 20, 0 ),
			),
			$actions
		);
	}

	/**
	 * Test that styles are enqueued only when the script dependency is in use.
	 */
	public function test_enqueue_styles() {
		$enqueued_handle = null;

		Functions\when( 'wp_script_is' )->alias(
			function ( $handle, $status ) {
				return $handle === Shared_Extension_Utils_Assets::SCRIPT_HANDLE && $status === 'enqueued';
			}
		);
		Functions\when( 'wp_style_is' )->alias(
			function ( $handle, $status ) {
				return $handle === Shared_Extension_Utils_Assets::SCRIPT_HANDLE && $status === 'registered';
			}
		);
		Functions\when( 'wp_enqueue_style' )->alias(
			function ( $handle ) use ( &$enqueued_handle ) {
				$enqueued_handle = $handle;
			}
		);

		Shared_Extension_Utils_Assets::enqueue_styles();

		$this->assertSame( Shared_Extension_Utils_Assets::SCRIPT_HANDLE, $enqueued_handle );
	}

	/**
	 * Test that styles are not enqueued when the shared bundle script is absent.
	 */
	public function test_enqueue_styles_without_script() {
		$checked_style  = false;
		$enqueued_style = false;

		Functions\when( 'wp_script_is' )->justReturn( false );
		Functions\when( 'wp_style_is' )->alias(
			function () use ( &$checked_style ) {
				$checked_style = true;
				return false;
			}
		);
		Functions\when( 'wp_enqueue_style' )->alias(
			function () use ( &$enqueued_style ) {
				$enqueued_style = true;
			}
		);

		Shared_Extension_Utils_Assets::enqueue_styles();

		$this->assertFalse( $checked_style );
		$this->assertFalse( $enqueued_style );
	}
}

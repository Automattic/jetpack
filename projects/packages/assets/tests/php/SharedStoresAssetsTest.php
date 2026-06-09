<?php
/**
 * Tests for the shared stores asset registration hooks.
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack\Assets;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\Assets\Shared_Stores_Assets
 */
#[CoversClass( Shared_Stores_Assets::class )]
class SharedStoresAssetsTest extends TestCase {

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
	 * Test that configure registers the expected hook.
	 */
	public function test_configure() {
		$actions = array();

		Functions\when( 'add_action' )->alias(
			function ( ...$args ) use ( &$actions ) {
				$actions[] = $args;
			}
		);

		Shared_Stores_Assets::configure();

		$this->assertSame(
			array(
				array( 'wp_loaded', array( Shared_Stores_Assets::class, 'register_assets' ) ),
			),
			$actions
		);
	}
}

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

	/**
	 * Test that register_assets registers the externalized bundle under the
	 * expected handle, path, and footer option (the externalization contract).
	 */
	public function test_register_assets() {
		Functions\stubs(
			array(
				'wp_parse_url'       => 'parse_url',
				'plugins_url'        => function ( $path ) {
					return 'http://example.com/wp-content/plugins/assets/' . basename( $path );
				},
				'add_query_arg'      => function ( $key, $value, $url ) {
					return $url . ( strpos( $url, '?' ) === false ? '?' : '&' ) . "$key=$value";
				},
				'wp_style_is'        => false,
				'wp_script_add_data' => true,
				// Used only when the bundle has not been built; harmless otherwise.
				'filemtime'          => 1234567,
			)
		);

		// Initialized so static analysis knows the types; the mock overwrites them by reference.
		$registered_handle    = '';
		$registered_url       = '';
		$registered_in_footer = false;
		Functions\expect( 'wp_register_script' )->once()->andReturnUsing(
			function ( $handle, $url, $deps, $ver, $args ) use ( &$registered_handle, &$registered_url, &$registered_in_footer ) {
				$registered_handle    = (string) $handle;
				$registered_url       = (string) $url;
				$registered_in_footer = (bool) $args['in_footer'];
				return true;
			}
		);

		Shared_Stores_Assets::register_assets();

		$this->assertSame( 'jetpack-shared-stores', Shared_Stores_Assets::SCRIPT_HANDLE );
		$this->assertSame( Shared_Stores_Assets::SCRIPT_HANDLE, $registered_handle );
		$this->assertStringContainsString( 'jetpack-shared-stores.js', $registered_url );
		$this->assertTrue( $registered_in_footer );
	}
}

<?php
/**
 * Tests for the shared stores asset registration hooks.
 *
 * @package automattic/jetpack-assets
 */

namespace Automattic\Jetpack\Assets;

use Automattic\Jetpack\Assets;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\Assets\Shared_Stores_Assets
 * @covers \Automattic\Jetpack\Assets
 */
#[CoversClass( Shared_Stores_Assets::class )]
#[CoversClass( Assets::class )]
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

	/**
	 * An older sibling copy's actions.php leaves the handle unregistered while classes still
	 * resolve here, so Script_Data::configure() has to carry the bootstrap. See JETPACK-2649.
	 */
	public function test_script_data_configure_bootstraps_shared_stores() {
		$actions = array();

		Functions\when( 'is_admin' )->justReturn( true );
		Functions\when( 'add_action' )->alias(
			function ( ...$args ) use ( &$actions ) {
				$actions[] = $args;
			}
		);

		Script_Data::configure();

		$hooked = array_filter(
			$actions,
			function ( $action ) {
				return array( Shared_Stores_Assets::class, 'register_assets' ) === $action[1];
			}
		);

		$this->assertCount( 1, $hooked, 'Script_Data::configure() must bootstrap the shared stores registration.' );
		$this->assertSame( 'wp_loaded', reset( $hooked )[0] );
	}

	/**
	 * The healthy case re-hooks a callback actions.php already added, so WordPress must see the same
	 * static callable each time to dedupe it.
	 */
	public function test_bootstrap_is_idempotent() {
		$actions = array();

		Functions\when( 'add_action' )->alias(
			function ( ...$args ) use ( &$actions ) {
				$actions[] = $args;
			}
		);

		Assets::ensure_package_bootstrap();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Calling twice is the assertion.
		Assets::ensure_package_bootstrap();

		$expected = array( 'wp_loaded', array( Shared_Stores_Assets::class, 'register_assets' ) );
		$this->assertSame( array( $expected, $expected ), $actions );
	}

	/**
	 * Guards the trap the design depends on: a plugins_loaded entry added to actions.php but
	 * not to ensure_package_bootstrap() would silently not run under an older sibling copy.
	 *
	 * The bootstrap loads actions.php before Brain Monkey defines add_action, so the file takes
	 * its $wp_filter branch and the entries are readable here.
	 */
	public function test_every_plugins_loaded_entry_is_recovered() {
		$declared = array();
		foreach ( $GLOBALS['wp_filter']['plugins_loaded'] ?? array() as $entries ) {
			foreach ( $entries as $entry ) {
				$callback = $entry['function'];
				if ( is_array( $callback ) && Script_Data::class !== $callback[0] ) {
					$declared[] = implode( '::', $callback );
				}
			}
		}

		$this->assertNotEmpty( $declared, 'actions.php should declare at least one non-Script_Data plugins_loaded entry.' );
		$this->assertSame(
			array( Shared_Stores_Assets::class . '::configure' ),
			$declared,
			'A new plugins_loaded entry in actions.php must also be re-run from Assets::ensure_package_bootstrap().'
		);
	}
}

<?php
/**
 * Unit tests for the Connection Plugin Manager class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Plugin
 */

namespace Automattic\Jetpack\Connection;

use Exception;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Depends;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Connection Plugin Manager class.
 *
 * @see \Automattic\Jetpack\Connection\Plugin
 * @covers \Automattic\Jetpack\Connection\Plugin
 */
#[CoversClass( Plugin::class )]
class Plugin_Test extends TestCase {

	const PLUGIN_SLUG = 'sample-plugin-slug';

	const PLUGIN_NAME = 'Sample Plugin Name';

	/**
	 * Sample plugin arguments.
	 *
	 * @var array
	 */
	private $plugin_args = array(
		'url_info' => 'https://example.org/',
	);

	/**
	 * Initialization of the test class
	 */
	protected function setUp(): void {
		parent::setUp();
		Plugin_Storage::configure();
	}

	protected function tearDown(): void {
		parent::tearDown();

		$reflection       = new \ReflectionClass( Plugin_Storage::class );
		$plugins_property = $reflection->getProperty( 'plugins' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$plugins_property->setAccessible( true );
		}
		$plugins_property->setValue( null, array() );
	}

	/**
	 * Unit test for the `Plugin::add()` method.
	 */
	public function test_add() {
		$plugin = new Plugin( self::PLUGIN_SLUG );

		$plugin->add( self::PLUGIN_NAME, $this->plugin_args + array( 'invalid_key' => 'value' ) );

		$this->assertEquals( array( 'name' => self::PLUGIN_NAME ) + $this->plugin_args, Plugin_Storage::get_one( self::PLUGIN_SLUG ) );
	}

	/**
	 * Unit test for the `Plugin::remove()` method.
	 *
	 * @depends test_add
	 */
	#[Depends( 'test_add' )]
	public function test_remove() {
		$plugin = new Plugin( self::PLUGIN_SLUG );
		$plugin->remove();

		$this->assertArrayNotHasKey( self::PLUGIN_SLUG, Plugin_Storage::get_all() );
	}

	/**
	 * Unit test for the `Plugin::is_only()` method when no plugins exist.
	 */
	public function test_is_only_no_plugins() {
		$plugin = new Plugin( self::PLUGIN_SLUG );

		$this->assertTrue( $plugin->is_only() );
	}

	/**
	 * Unit test for the `Plugin::is_only()` method when current plugin is the only one.
	 */
	public function test_is_only_single_plugin() {
		$plugin = new Plugin( self::PLUGIN_SLUG );
		$plugin->add( self::PLUGIN_NAME, $this->plugin_args );

		$this->assertTrue( $plugin->is_only() );
	}

	/**
	 * Unit test for the `Plugin::is_only()` method when multiple plugins exist.
	 */
	public function test_is_only_multiple_plugins() {
		$plugin1 = new Plugin( self::PLUGIN_SLUG );
		$plugin1->add( self::PLUGIN_NAME, $this->plugin_args );

		$plugin2 = new Plugin( 'another-plugin' );
		$plugin2->add( 'Another Plugin', array() );

		$this->assertFalse( $plugin1->is_only() );
	}

	/**
	 * Unit test for the `Plugin::is_only()` method when Plugin_Storage::get_all() returns WP_Error with 'too_early' code.
	 */
	public function test_is_only_too_early() {
		$plugin = new Plugin( self::PLUGIN_SLUG );

		// De-configuring the `Plugin_Storage` to trigger the error.
		$reflection          = new \ReflectionClass( Plugin_Storage::class );
		$configured_property = $reflection->getProperty( 'configured' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$configured_property->setAccessible( true );
		}
		$configured_property->setValue( null, false );

		set_error_handler(
			// @phan-suppress-next-line PhanPluginNeverReturnFunction,PhanTypeMismatchArgumentInternal The complaints aren't compatible with PHP <8.0
			static function ( int $errno, string $errstr ): void {
				restore_error_handler();
				throw new Exception( $errstr, $errno );
			},
			E_ALL
		);

		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'too_early' );

		$plugin->is_only();
	}
}

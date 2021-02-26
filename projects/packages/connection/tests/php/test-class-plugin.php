<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Unit tests for the Connection Plugin Manager class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Plugin
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Connection Plugin Manager class.
 *
 * @see \Automattic\Jetpack\Connection\Plugin
 */
class Test_Plugin extends TestCase {

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
	 *
	 * @before
	 * @throws MockEnabledException PHPUnit wasn't able to enable mock functions  ¯\_(⊙︿⊙)_/¯.
	 */
	protected function set_up() {
		Plugin_Storage::configure();
	}

	/**
	 * Unit test for the `Plugin::add()` method.
	 *
	 * @covers Automattic\Jetpack\Connection\Plugin::add
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
	 * @covers Automattic\Jetpack\Connection\Plugin::remove
	 */
	public function test_remove() {
		$plugin = new Plugin( self::PLUGIN_SLUG );
		$plugin->remove();

		$this->assertArrayNotHasKey( self::PLUGIN_SLUG, Plugin_Storage::get_all() );
	}

}

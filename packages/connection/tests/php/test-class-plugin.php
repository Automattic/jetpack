<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Unit tests for the Connection Plugin Manager class.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\Plugin
 */

namespace Automattic\Jetpack\Connection;

require_once __DIR__ . '/mock/trait-options.php';
require_once __DIR__ . '/mock/trait-hooks.php';

use Automattic\Jetpack\Connection\Test\Mock\Hooks;
use Automattic\Jetpack\Connection\Test\Mock\Options;
use phpmock\Mock;
use phpmock\MockEnabledException;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Connection Plugin Manager class.
 *
 * @see \Automattic\Jetpack\Connection\Plugin
 */
class Test_Plugin extends TestCase {

	use Options, Hooks;

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
	 * @throws MockEnabledException PHPUnit wasn't able to enable mock functions  ¯\_(⊙︿⊙)_/¯.
	 */
	protected function setUp() {
		parent::setUp();

		$this->build_mock_options();
		$this->build_mock_actions();

		$this->update_option->enable();
		$this->get_option->enable();
		$this->do_action->enable();

		Plugin_Storage::configure();
	}

	/**
	 * Clean up the test environment.
	 */
	protected function tearDown() {
		parent::tearDown();

		Mock::disableAll();
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

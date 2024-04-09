<?php
/**
 * Autoloader guard test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;
use Test_Plugin_Factory;

/**
 * Test suite class for the Autoloader part responsible for ensuring only the latest autoloader is ever executed.
 */
class LatestAutoloaderGuardTest extends TestCase {

	/**
	 * The mock Plugins_Handler instance.
	 *
	 * @var Plugins_Handler|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $plugins_handler;

	/**
	 * The mock Autoloader_Handler instance.
	 *
	 * @var Autoloader_Handler|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $autoloader_handler;

	/**
	 * The mock Autoloader_Locator instance.
	 *
	 * @var Autoloader_Locator|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $autoloader_locator;

	/**
	 * The class we're testing.
	 *
	 * @var Latest_Autoloader_Guard
	 */
	private $guard;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->plugins_handler    = $this->getMockBuilder( Plugins_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$this->autoloader_handler = $this->getMockBuilder( Autoloader_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$this->autoloader_locator = $this->getMockBuilder( Autoloader_Locator::class )
			->disableOriginalConstructor()
			->getMock();

		$this->guard = new Latest_Autoloader_Guard(
			$this->plugins_handler, // @phan-suppress-current-line PhanTypeMismatchArgument -- It's correct, but PHPUnit 9.6 only declares `@psalm-template` and not `@template` and such so Phan can't know the right types.
			$this->autoloader_handler, // @phan-suppress-current-line PhanTypeMismatchArgument -- Same.
			$this->autoloader_locator // @phan-suppress-current-line PhanTypeMismatchArgument -- Same.
		);
	}

	/**
	 * Tests that the guard stops initialization when the autoloader has already initialized.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_should_stop_init_when_autoloader_already_initialized() {
		global $jetpack_autoloader_latest_version;
		$jetpack_autoloader_latest_version = Test_Plugin_Factory::VERSION_CURRENT;

		$this->assertTrue(
			$this->guard->should_stop_init(
				TEST_PLUGIN_DIR,
				array(),
				false
			)
		);
	}

	/**
	 * Tests that the guard allows initialization when the autoloader has been initialized but we've been deliberately included by it.
	 *
	 * @preserveGlobalState disabled
	 */
	public function test_should_allow_init_when_including_latest() {
		// Mark it as already initialized so we can make sure it overrides it.
		global $jetpack_autoloader_latest_version;
		$jetpack_autoloader_latest_version = Test_Plugin_Factory::VERSION_CURRENT;

		$this->assertFalse(
			$this->guard->should_stop_init(
				TEST_PLUGIN_DIR,
				array(),
				true
			)
		);
	}

	/**
	 * Tests that the guard stops initialization when not the latest autoloader.
	 *
	 * @preserveGlobalState disabled
	 */
	public function test_should_stop_init_when_not_latest_autoloader() {
		$this->plugins_handler->method( 'have_plugins_changed' )
			->with( array() )
			->willReturn( true );
		$this->autoloader_locator->method( 'find_latest_autoloader' )
			->willReturn( 'new-latest' );
		$this->autoloader_locator->method( 'get_autoloader_path' )
			->with( 'new-latest' ) // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- PHPUnit 9.6 declares the wrong type for this method.
			->willReturn( TEST_PLUGIN_DIR . '/functions.php' );

		$this->assertTrue(
			$this->guard->should_stop_init(
				TEST_PLUGIN_DIR,
				array(),
				false
			)
		);

		// Make sure we loaded the newer autoloader.
		global $jetpack_autoloader_testing_loaded_files;
		$this->assertContains( Test_Plugin_Factory::VERSION_CURRENT, $jetpack_autoloader_testing_loaded_files );
	}

	/**
	 * Tests that the guard allows initialization when the latest.
	 */
	public function test_should_allow_init_when_latest() {
		$this->plugins_handler->method( 'have_plugins_changed' )
			->with( array() )
			->willReturn( true );
		$this->autoloader_locator->method( 'find_latest_autoloader' )
			->willReturn( null );

		$this->assertFalse(
			$this->guard->should_stop_init(
				TEST_PLUGIN_DIR,
				array(),
				false
			)
		);
	}

	/**
	 * Tests that the guard resets when plugins have changed.
	 *
	 * @preserveGlobalState disabled
	 */
	public function test_should_stop_init_should_reset_when_plugins_change() {
		$this->plugins_handler->method( 'have_plugins_changed' )
			->with( array() )
			->willReturn( true );
		$this->autoloader_handler->expects( $this->once() )->method( 'reset_autoloader' );
		$this->autoloader_locator->method( 'find_latest_autoloader' )
			->willReturn( null );

		$this->assertFalse(
			$this->guard->should_stop_init(
				TEST_PLUGIN_DIR,
				array(),
				false
			)
		);
	}
}

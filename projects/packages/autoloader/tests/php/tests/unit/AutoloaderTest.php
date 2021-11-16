<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;
use Test_Plugin_Factory;

/**
 * Test suite class for the Autoloader.
 *
 * @runTestsInSeparateProcesses Ensure that each test loads class files new.
 * @preserveGlobalState disabled
 */
class AutoloaderTest extends TestCase {

	/**
	 * The older version of the autoloader that we want to use. Note that
	 * the version should support PSR-4 since this one does.
	 */
	const OLDER_VERSION = '2.4.0.0';

	/**
	 * The directory of a plugin using the autoloader.
	 *
	 * @var string
	 */
	private static $older_plugin_dir;

	/**
	 * Setup before class runs before the class.
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		self::$older_plugin_dir = Test_Plugin_Factory::create_test_plugin( false, self::OLDER_VERSION )->make();
	}

	/**
	 * Tests that the autoloader is initialized correctly and registers the correct hook.
	 */
	public function test_init_autoloader() {
		$test_container = new Test_Container();

		$plugin_locator = $this->getMockBuilder( Plugin_Locator::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Plugin_Locator::class, $plugin_locator );

		$autoloader_handler = $this->getMockBuilder( Autoloader_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Autoloader_Handler::class, $autoloader_handler );

		$plugins_handler = $this->getMockBuilder( Plugins_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Plugins_Handler::class, $plugins_handler );

		$guard = $this->getMockBuilder( Latest_Autoloader_Guard::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Latest_Autoloader_Guard::class, $guard );

		$plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( TEST_PLUGIN_DIR );
		$plugins_handler->expects( $this->once() )
			->method( 'get_cached_plugins' )
			->willReturn( array( self::$older_plugin_dir ) );
		$autoloader_handler->expects( $this->once() )
			->method( 'is_initializing' )
			->willReturn( false );
		$plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->willReturn( array( TEST_PLUGIN_DIR ) );
		$guard->expects( $this->once() )
			->method( 'should_stop_init' )
			->with(
				TEST_PLUGIN_DIR,
				array( TEST_PLUGIN_DIR, self::$older_plugin_dir ),
				false
			)
			->willReturn( false );
		$autoloader_handler->expects( $this->once() )
			->method( 'activate_autoloader' )
			->with( array( TEST_PLUGIN_DIR, self::$older_plugin_dir ) );

		Autoloader::init( $test_container );
	}

	/**
	 * Tests that the autoloader is stopped by the guard correctly.
	 */
	public function test_init_autoloader_stopped_by_guard() {
		$test_container = new Test_Container();

		$plugin_locator = $this->getMockBuilder( Plugin_Locator::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Plugin_Locator::class, $plugin_locator );

		$autoloader_handler = $this->getMockBuilder( Autoloader_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Autoloader_Handler::class, $autoloader_handler );

		$plugins_handler = $this->getMockBuilder( Plugins_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Plugins_Handler::class, $plugins_handler );

		$guard = $this->getMockBuilder( Latest_Autoloader_Guard::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Latest_Autoloader_Guard::class, $guard );

		$plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( TEST_PLUGIN_DIR );
		$plugins_handler->expects( $this->once() )
			->method( 'get_cached_plugins' )
			->willReturn( array( self::$older_plugin_dir ) );
		$autoloader_handler->expects( $this->once() )
			->method( 'is_initializing' )
			->willReturn( false );
		$plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->willReturn( array( TEST_PLUGIN_DIR ) );
		$guard->expects( $this->once() )
			->method( 'should_stop_init' )
			->with(
				TEST_PLUGIN_DIR,
				array( TEST_PLUGIN_DIR, self::$older_plugin_dir ),
				false
			)
			->willReturn( true );
		$autoloader_handler->expects( $this->never() )->method( 'activate_autoloader' );

		Autoloader::init( $test_container );
	}
}

<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader.
 *
 * @runTestsInSeparateProcesses Ensure that each test loads class files new.
 * @preserveGlobalState disabled
 */
class Test_Autoloader extends TestCase {

	/**
	 * Tests that the autoloader is initialized correctly and registers the correct hook.
	 */
	public function test_init_autoloader() {
		global $test_container;

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
			->willReturn( TEST_DATA_PATH . '/plugins/dummy_current' );
		$plugins_handler->expects( $this->once() )
			->method( 'get_cached_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/dummy_newer' ) );
		$autoloader_handler->expects( $this->once() )
			->method( 'is_initializing' )
			->willReturn( false );
		$plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/dummy_current' ) );
		$guard->expects( $this->once() )
			->method( 'should_stop_init' )
			->with(
				TEST_DATA_PATH . '/plugins/dummy_current',
				array( TEST_DATA_PATH . '/plugins/dummy_current', TEST_DATA_PATH . '/plugins/dummy_newer' ),
				false
			)
			->willReturn( false );
		$autoloader_handler->expects( $this->once() )
			->method( 'activate_autoloader' )
			->with( array( TEST_DATA_PATH . '/plugins/dummy_current', TEST_DATA_PATH . '/plugins/dummy_newer' ) );

		Autoloader::init( $test_container );
	}

	/**
	 * Tests that the autoloader is stopped by the guard correctly.
	 */
	public function test_init_autoloader_stopped_by_guard() {
		global $test_container;

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
			->willReturn( TEST_DATA_PATH . '/plugins/dummy_current' );
		$plugins_handler->expects( $this->once() )
			->method( 'get_cached_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/dummy_newer' ) );
		$autoloader_handler->expects( $this->once() )
			->method( 'is_initializing' )
			->willReturn( false );
		$plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/dummy_current' ) );
		$guard->expects( $this->once() )
			->method( 'should_stop_init' )
			->with(
				TEST_DATA_PATH . '/plugins/dummy_current',
				array( TEST_DATA_PATH . '/plugins/dummy_current', TEST_DATA_PATH . '/plugins/dummy_newer' ),
				false
			)
			->willReturn( true );

		Autoloader::init( $test_container );
	}
}

<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Jetpack\AutoloaderTestData\Plugin\Test;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader.
 *
 * @runTestsInSeparateProcesses Ensure that each test loads class files new.
 * @preserveGlobalState disabled
 */
class Test_Autoloader extends TestCase {

	/**
	 * The version loader mock.
	 *
	 * @var Version_Loader|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $version_loader;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->version_loader = $this->getMockBuilder( Version_Loader::class )
			->disableOriginalConstructor()
			->setMethods( array( 'load_filemap' ) )
			->getMock();
	}

	/**
	 * Tests that the autoloader is initialized correctly and registers the correct hook.
	 */
	public function test_init_autoloader() {
		global $test_container;

		$plugin_locator = $this->getMockBuilder( Plugin_Locator::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Plugin_Locator::class, $plugin_locator );

		$plugins_handler = $this->getMockBuilder( Plugins_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Plugins_Handler::class, $plugins_handler );

		$guard = $this->getMockBuilder( Latest_Autoloader_Guard::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Latest_Autoloader_Guard::class, $guard );

		$autoloader_handler = $this->getMockBuilder( Autoloader_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$test_container->replace( Autoloader_Handler::class, $autoloader_handler );

		$plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( TEST_DATA_PATH . '/plugins/dummy_current' );
		$plugins_handler->expects( $this->once() )
			->method( 'get_cached_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/dummy_newer' ) );
		$plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/dummy_current' ) );
		$guard->expects( $this->once() )
			->method( 'should_stop_init' )
			->with(
				TEST_DATA_PATH . '/plugins/dummy_current',
				array( TEST_DATA_PATH . '/plugins/dummy_current', TEST_DATA_PATH . '/plugins/dummy_newer' )
			)
			->willReturn( false );
		$autoloader_handler->expects( $this->once() )
			->method( 'create_autoloader' )
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
		$plugins_handler->expects( $this->once() )
			->method( 'get_active_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/dummy_current' ) );
		$guard->expects( $this->once() )
			->method( 'should_stop_init' )
			->with(
				TEST_DATA_PATH . '/plugins/dummy_current',
				array( TEST_DATA_PATH . '/plugins/dummy_current', TEST_DATA_PATH . '/plugins/dummy_newer' )
			)
			->willReturn( true );

		Autoloader::init( $test_container );
	}

	/**
	 * Tests that activate registers the autoloader.
	 */
	public function test_activate_registers_autoloader() {
		global $jetpack_autoloader_loader;

		$this->version_loader->expects( $this->once() )->method( 'load_filemap' );

		Autoloader::activate( $this->version_loader );

		$autoloaders = spl_autoload_functions();
		$this->assertEquals( array( Autoloader::class, 'load_class' ), reset( $autoloaders ) );
		$this->assertEquals( $this->version_loader, $jetpack_autoloader_loader );
	}

	/**
	 * Tests that activate removes the v2 autoload functions.
	 */
	public function test_activate_removes_v2_autoload_functions() {
		$removed_autoloader = 'Automattic\\Jetpack\\Autoloader\\jp123\\autoload';
		spl_autoload_register( $removed_autoloader );

		$this->version_loader->expects( $this->once() )->method( 'load_filemap' );

		Autoloader::activate( $this->version_loader );

		$autoloaders = spl_autoload_functions();
		$this->assertEquals( array( Autoloader::class, 'load_class' ), reset( $autoloaders ) );
		$this->assertNotContains( $removed_autoloader, $autoloaders );
	}

	/**
	 * Tests that activate removes the v2 autoload class.
	 */
	public function test_activate_removes_v2_class_autoloader() {
		$removed_autoloader = \Automattic\Jetpack\Autoloader\jp123\Autoloader::class . '::load_class';
		spl_autoload_register( $removed_autoloader );

		$this->version_loader->expects( $this->once() )->method( 'load_filemap' );

		Autoloader::activate( $this->version_loader );

		$autoloaders = spl_autoload_functions();
		$this->assertEquals( array( Autoloader::class, 'load_class' ), reset( $autoloaders ) );
		$this->assertNotContains( $removed_autoloader, $autoloaders );
	}

	/**
	 * Tests that class files are loaded correctly.
	 */
	public function test_load_class() {
		$loader = $this->getMockBuilder( Version_Loader::class )
			->disableOriginalConstructor()
			->setMethods( array( 'find_class_file' ) )
			->getMock();

		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = $loader;
		$loader->expects( $this->once() )
			->method( 'find_class_file' )
			->with( Test::class )
			->willReturn( TEST_DATA_PATH . '/plugins/dummy_current/includes/class-test.php' );

		$this->assertTrue( Autoloader::load_class( Test::class ) );
		$this->assertTrue( class_exists( Test::class, false ) );
	}

	/**
	 * Tests that nothing happens when a class file isn't found.
	 */
	public function test_load_class_does_nothing_without_class() {
		$loader = $this->getMockBuilder( Version_Loader::class )
			->disableOriginalConstructor()
			->setMethods( array( 'find_class_file' ) )
			->getMock();

		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = $loader;
		$loader->expects( $this->once() )
			->method( 'find_class_file' )
			->with( Test::class )
			->willReturn( null );

		$this->assertFalse( Autoloader::load_class( Test::class ) );
		$this->assertFalse( class_exists( Test::class, false ) );
	}
}

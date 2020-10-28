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
 * @runClassInSeparateProcess
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
	 */
	public function setup() {
		parent::setup();

		$this->version_loader = $this->getMockBuilder( Version_Loader::class )
			->disableOriginalConstructor()
			->getMock();
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
		spl_autoload_register( $removed_autoloader, false );

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
		$removed_autoloader = 'Automattic\\Jetpack\\Autoloader\\jp123\\' . Autoloader::class . '::load_class';
		spl_autoload_register( $removed_autoloader, false );

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
		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = $this->version_loader;
		$this->version_loader->expects( $this->once() )
			->method( 'find_class_file' )
			->with( Test::class )
			->willReturn( TEST_DATA_PATH . '/plugins/plugin_current/includes/class-test.php' );

		$this->assertTrue( Autoloader::load_class( Test::class ) );
		$this->assertTrue( class_exists( Test::class, false ) );
	}

	/**
	 * Tests that nothing happens when a class file isn't found.
	 */
	public function test_load_class_does_nothing_without_class() {
		global $jetpack_autoloader_loader;
		$jetpack_autoloader_loader = $this->version_loader;
		$this->version_loader->expects( $this->once() )
			->method( 'find_class_file' )
			->with( Test::class )
			->willReturn( null );

		$this->assertFalse( Autoloader::load_class( Test::class ) );
		$this->assertFalse( class_exists( Test::class, false ) );
	}
}

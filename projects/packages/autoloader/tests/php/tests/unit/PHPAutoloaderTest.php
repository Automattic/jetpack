<?php // phpcs:ignore WordPress.Files.FileName
/**
 * PHP autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use Automattic\Jetpack\AutoloaderTesting\SharedTestClass;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the management of the PHP autoloader.
 *
 * @runTestsInSeparateProcesses Ensure that each test loads class files new.
 * @preserveGlobalState disabled
 */
class PHPAutoloaderTest extends TestCase {

	/**
	 * Tests that the autoloader can be registered correctly.
	 */
	public function test_register_autoloader() {
		$removed_autoloader = 'Automattic\\Jetpack\\Autoloader\\jp123\\autoload';
		spl_autoload_register( $removed_autoloader );

		global $jetpack_autoloader_loader;

		$loader = $this->getMockBuilder( Version_Loader::class )
			->disableOriginalConstructor()
			->getMock();

		( new PHP_Autoloader() )->register_autoloader( $loader );

		$autoloaders = spl_autoload_functions();

		// Drop the autoloader so that PHPUnit does not throw errors.
		spl_autoload_unregister( PHP_Autoloader::class . '::load_class' );

		$this->assertContains( array( PHP_Autoloader::class, 'load_class' ), $autoloaders );
		$this->assertEquals( $loader, $jetpack_autoloader_loader );
	}

	/**
	 * Tests that the autoloader can be unregistered.
	 */
	public function test_unregister_autoloader() {
		// v2 Function Autoloader.
		$removed_autoloader = 'Automattic\\Jetpack\\Autoloader\\jp123\\autoload';
		spl_autoload_register( $removed_autoloader );

		( new PHP_Autoloader() )->unregister_autoloader();

		$autoloaders = spl_autoload_functions();
		$this->assertNotContains( $removed_autoloader, $autoloaders );

		// v2 Class Autoloader.
		$removed_autoloader = array( \Automattic\Jetpack\Autoloader\jp123\PHP_Autoloader::class, 'load_class' );
		spl_autoload_register( $removed_autoloader );

		( new PHP_Autoloader() )->unregister_autoloader();

		$autoloaders = spl_autoload_functions();
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
			->with( SharedTestClass::class )
			->willReturn( TEST_PLUGIN_DIR . '/src/SharedTestClass.php' );

		$this->assertTrue( PHP_Autoloader::load_class( SharedTestClass::class ) );
		$this->assertTrue( class_exists( SharedTestClass::class, false ) );
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
			->with( SharedTestClass::class )
			->willReturn( null );

		$this->assertFalse( PHP_Autoloader::load_class( SharedTestClass::class ) );
		$this->assertFalse( class_exists( SharedTestClass::class, false ) );
	}
}

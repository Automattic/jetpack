<?php
/**
 * Autoloader handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader handler.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class AutoloaderHandlerTest extends TestCase {

	/**
	 * The php autoloader mock;
	 *
	 * @var PHP_Autoloader&\PHPUnit\Framework\MockObject\MockObject
	 */
	private $php_autoloader;

	/**
	 * The hook manager mock;
	 *
	 * @var Hook_Manager&\PHPUnit\Framework\MockObject\MockObject
	 */
	private $hook_manager;

	/**
	 * The manifest reader mock.
	 *
	 * @var Manifest_Reader&\PHPUnit\Framework\MockObject\MockObject
	 */
	private $manifest_reader;

	/**
	 * The autoloader handler we're testing.
	 *
	 * @var Autoloader_Handler
	 */
	private $autoloader_handler;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->php_autoloader     = $this->getMockBuilder( PHP_Autoloader::class )
			->disableOriginalConstructor()
			->getMock();
		$this->hook_manager       = $this->getMockBuilder( Hook_Manager::class )
			->disableOriginalConstructor()
			->getMock();
		$this->manifest_reader    = $this->getMockBuilder( Manifest_Reader::class )
			->disableOriginalConstructor()
			->getMock();
		$version_selector         = $this->getMockBuilder( Version_Selector::class )
			->disableOriginalConstructor()
			->getMock();
		$this->autoloader_handler = new Autoloader_Handler(
			$this->php_autoloader,
			$this->hook_manager,
			$this->manifest_reader,
			$version_selector
		);
	}

	/**
	 * Tests that the handler is able to activate the autoloader successfully.
	 */
	public function test_activates_autoloader() {
		$plugins = array( TEST_PLUGIN_DIR );

		$this->manifest_reader->expects( $this->exactly( 3 ) )
			->method( 'read_manifests' )
			->with(
				...with_consecutive(
					array( $plugins, 'vendor/composer/jetpack_autoload_psr4.php' ),
					array( $plugins, 'vendor/composer/jetpack_autoload_classmap.php' ),
					array( $plugins, 'vendor/composer/jetpack_autoload_filemap.php' )
				)
			);
		$this->php_autoloader->expects( $this->once() )
			->method( 'register_autoloader' );

		$this->autoloader_handler->activate_autoloader( $plugins );
	}

	/**
	 * Tests that the handler is able to reset the autoloader successfully.
	 */
	public function test_reset_autoloader() {
		global $jetpack_autoloader_loader;
		global $jetpack_autoloader_latest_version;

		$jetpack_autoloader_loader         = 'test';
		$jetpack_autoloader_latest_version = 'test';
		$this->php_autoloader->expects( $this->once() )
			->method( 'unregister_autoloader' );
		$this->hook_manager->expects( $this->once() )
			->method( 'reset' );

		$this->autoloader_handler->reset_autoloader();
	}
}

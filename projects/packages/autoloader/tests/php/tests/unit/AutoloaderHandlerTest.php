<?php
/**
 * Autoloader handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader handler.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class AutoloaderHandlerTest extends TestCase {

	/**
	 * Tests that the handler is able to activate the autoloader successfully.
	 */
	public function test_activates_autoloader() {
		$plugins = array( TEST_PLUGIN_DIR );

		$php_autoloader     = $this->createMock( PHP_Autoloader::class );
		$hook_manager       = $this->createStub( Hook_Manager::class );
		$manifest_reader    = $this->createMock( Manifest_Reader::class );
		$version_selector   = $this->createStub( Version_Selector::class );
		$autoloader_handler = new Autoloader_Handler( $php_autoloader, $hook_manager, $manifest_reader, $version_selector );

		$manifest_reader->expects( $this->exactly( 3 ) )
			->method( 'read_manifests' )
			->with(
				...with_consecutive(
					array( $plugins, 'vendor/composer/jetpack_autoload_psr4.php' ),
					array( $plugins, 'vendor/composer/jetpack_autoload_classmap.php' ),
					array( $plugins, 'vendor/composer/jetpack_autoload_filemap.php' )
				)
			);
		$php_autoloader->expects( $this->once() )
			->method( 'register_autoloader' );

		$autoloader_handler->activate_autoloader( $plugins );
	}

	/**
	 * Tests that the handler is able to reset the autoloader successfully.
	 */
	public function test_reset_autoloader() {
		global $jetpack_autoloader_loader;
		global $jetpack_autoloader_latest_version;

		$php_autoloader     = $this->createMock( PHP_Autoloader::class );
		$hook_manager       = $this->createMock( Hook_Manager::class );
		$manifest_reader    = $this->createStub( Manifest_Reader::class );
		$version_selector   = $this->createStub( Version_Selector::class );
		$autoloader_handler = new Autoloader_Handler( $php_autoloader, $hook_manager, $manifest_reader, $version_selector );

		$jetpack_autoloader_loader         = 'test';
		$jetpack_autoloader_latest_version = 'test';
		$php_autoloader->expects( $this->once() )
			->method( 'unregister_autoloader' );
		$hook_manager->expects( $this->once() )
			->method( 'reset' );

		$autoloader_handler->reset_autoloader();
	}
}

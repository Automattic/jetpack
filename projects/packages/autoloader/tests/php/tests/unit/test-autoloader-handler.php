<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader handler.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class Test_Autoloader_Handler extends TestCase {

	/**
	 * The hook manager mock;
	 *
	 * @var Hook_Manager|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $hook_manager;

	/**
	 * The manifest reader mock.
	 *
	 * @var Manifest_Reader|\PHPUnit\Framework\MockObject\MockObject
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
			$this->hook_manager,
			$this->manifest_reader,
			$version_selector
		);
	}

	/**
	 * Tests that the handler is able to creates the autoloader successfully.
	 */
	public function test_create_autoloader() {
		$plugins = array( TEST_DATA_PATH . '/plugins/dummy_newer' );

		$this->manifest_reader->expects( $this->exactly( 3 ) )
			->method( 'read_manifests' )
			->withConsecutive(
				array( $plugins, 'vendor/composer/jetpack_autoload_psr4.php' ),
				array( $plugins, 'vendor/composer/jetpack_autoload_classmap.php' ),
				array( $plugins, 'vendor/composer/jetpack_autoload_filemap.php' )
			);

		$this->autoloader_handler->create_autoloader( $plugins );

		global $jetpack_autoloader_loader;
		$this->assertInstanceOf( Version_Loader::class, $jetpack_autoloader_loader );
	}

	/**
	 * Tests that the handler is able to reset the autoloader successfully.
	 */
	public function test_reset_autoloader() {
		global $jetpack_autoloader_loader;
		global $jetpack_autoloader_latest_version;

		$jetpack_autoloader_loader         = 'test';
		$jetpack_autoloader_latest_version = 'test';
		$this->hook_manager->expects( $this->once() )
			->method( 'reset' );

		$this->autoloader_handler->reset_autoloader();

		$this->assertNull( $jetpack_autoloader_loader );
		$this->assertNull( $jetpack_autoloader_latest_version );
	}
}

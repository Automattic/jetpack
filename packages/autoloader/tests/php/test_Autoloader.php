<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Jetpack\TestCase_ABC\Psr4_ClassName_ABC;
use PHPUnit\Framework\TestCase;
use Jetpack\TestCase_ABC\ClassName_ABC;

/**
 * Test suite class for the Autoloader.
 */
class WP_Test_Autoloader extends TestCase {

	/**
	 * The manifest handler for registering classes.
	 *
	 * @var Manifest_Handler
	 */
	private $manifest_handler;

	/**
	 * Setup runs before each test.
	 */
	public function setup() {
		parent::setup();
		$this->manifest_handler = new Manifest_Handler( new Plugins_Handler(), new Version_Selector() );
		spl_autoload_register( 'autoloader' );
	}

	/**
	 * Tests whether manifest registration works with autoloading.
	 */
	public function test_register_manifest_to_autoload_works_correctly() {
		global $jetpack_packages_classmap;

		$method = new ReflectionMethod( Manifest_Handler::class, 'register_manifest' );
		$method->setAccessible( true );
		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest.php', &$jetpack_packages_classmap ) );

		$class = new ClassName_ABC();

		$this->assertTrue( $class->return_true() );
	}

	/**
	 * Tests whether or not the autoloader falls back to PSR-4 autoloading when a classmap is not available.
	 */
	public function test_autoloader_falls_back_to_psr4_namespaces() {
		global $jetpack_packages_psr4;

		$method = new ReflectionMethod( Manifest_Handler::class, 'register_manifest' );
		$method->setAccessible( true );
		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest_psr4.php', &$jetpack_packages_psr4 ) );

		$class = new Psr4_ClassName_ABC();

		$this->assertTrue( $class->return_true() );
	}
}

<?php // phpcs:ignore WordPress.Files.FileName
/**
 * File loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class WP_Test_Manifest_Handler extends TestCase {

	/**
	 * The manifest handler we're testing.
	 *
	 * @var Manifest_Handler
	 */
	private $manifest_handler;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->manifest_handler = new Manifest_Handler( array(), new Version_Selector() );
	}

	/**
	 * Tests whether registering a manifest file registers the individual class file.
	 */
	public function test_registering_adds_to_the_input_array() {
		$method = new ReflectionMethod( Manifest_Handler::class, 'register_manifest' );
		$method->setAccessible( true );
		$input_array = null;

		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest.php', &$input_array ) );

		$identifier = 'Jetpack\\TestCase_ABC\\ClassName_ABC';
		$this->assertTrue( isset( $input_array[ $identifier ] ) );
		$this->assertEquals( $input_array[ $identifier ]['version'], '1.0.0.0' );
		$this->assertEquals( $input_array[ $identifier ]['path'], __DIR__ . '/data/path_to_class.php' );
	}

	/**
	 * Tests whether registering a manifest file will override already registered paths with newer ones.
	 */
	public function test_registering_adds_latest_version_to_the_input_array() {
		$method = new ReflectionMethod( Manifest_Handler::class, 'register_manifest' );
		$method->setAccessible( true );
		$input_array = null;

		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest.php', &$input_array ) );
		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest_newer.php', &$input_array ) );

		$identifier = 'Jetpack\\TestCase_ABC\\ClassName_ABC';
		$this->assertTrue( isset( $input_array[ $identifier ] ) );
		$this->assertEquals( $input_array[ $identifier ]['version'], '2.0.0.0' );
		$this->assertEquals( $input_array[ $identifier ]['path'], __DIR__ . '/data/path_to_class_newer.php' );
	}

	/**
	 * Tests whether registering a manifest file ignores the dev version of the file when
	 * JETPACK_AUTOLOAD_DEV is not set.
	 */
	public function test_registering_does_not_add_dev_versions_to_the_input_array() {
		$method = new ReflectionMethod( Manifest_Handler::class, 'register_manifest' );
		$method->setAccessible( true );
		$input_array = null;

		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest_dev.php', &$input_array ) );
		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest.php', &$input_array ) );

		$identifier = 'Jetpack\\TestCase_ABC\\ClassName_ABC';
		$this->assertTrue( isset( $input_array[ $identifier ] ) );
		$this->assertEquals( $input_array[ $identifier ]['version'], '1.0.0.0' );
		$this->assertEquals( $input_array[ $identifier ]['path'], __DIR__ . '/data/path_to_class.php' );
	}

	/**
	 * Tests whether registering a manifest file prioritizes the dev version of the file when
	 * JETPACK_AUTOLOAD_DEV is set to true.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_registering_adds_the_dev_version_to_the_input_array_with_constant() {
		$method = new ReflectionMethod( Manifest_Handler::class, 'register_manifest' );
		$method->setAccessible( true );
		defined( 'JETPACK_AUTOLOAD_DEV' ) || define( 'JETPACK_AUTOLOAD_DEV', true );
		$input_array = null;

		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest_dev.php', &$input_array ) );
		$method->invokeArgs( $this->manifest_handler, array( __DIR__ . '/data/dummy_manifest.php', &$input_array ) );

		$identifier = 'Jetpack\\TestCase_ABC\\ClassName_ABC';
		$this->assertTrue( isset( $input_array[ $identifier ] ) );
		$this->assertEquals( $input_array[ $identifier ]['version'], 'dev-howdy' );
		$this->assertEquals( $input_array[ $identifier ]['path'], __DIR__ . '/data/path_to_class_dev.php' );
	}
}

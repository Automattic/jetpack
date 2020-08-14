<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Integration test suite for the manifest reading.
 *
 * @package automattic/jetpack-autoloader
 */

// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents

use Automattic\Jetpack\Autoloader\ManifestGenerator;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for verifying that manifests we generate can also be read correctly.
 */
class WP_Test_Integration_Manifest extends TestCase {

	/**
	 * The path to the test manifest we want to operate on.
	 */
	const TEST_MANIFEST_PATH = TEST_DATA_PATH . '/plugins/plugin_current/test-manifest.php';

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

		$this->manifest_handler = new Manifest_Handler(
			array(
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			new Version_Selector()
		);

		// Make sure the test manifest does not exist.
		if ( file_exists( self::TEST_MANIFEST_PATH ) ) {
			unlink( self::TEST_MANIFEST_PATH );
		}
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		// Make sure the test manifest does not exist.
		if ( file_exists( self::TEST_MANIFEST_PATH ) ) {
			unlink( self::TEST_MANIFEST_PATH );
		}
	}

	/**
	 * Tests that the classmap manifest we generate can be read by the handler.
	 */
	public function test_that_handler_reads_classmap_manifests() {
		$this->write_test_manifest(
			'classmap',
			array(
				'TestFile' => array(
					'path'    => '$baseDir . \'/path_to_file.php\'',
					'version' => '1.0.0.0',
				),
			)
		);

		$loaded = array();
		$this->manifest_handler->register_plugin_manifests( 'test-manifest.php', $loaded );

		$this->assertEquals(
			array(
				'TestFile' => array(
					'version' => '1.0.0.0',
					'path'    => TEST_DATA_PATH . '/path_to_file.php',
				),
			),
			$loaded
		);
	}

	/**
	 * Tests that the PSR-4 manifest we generate can be read by the handler.
	 */
	public function test_that_handler_reads_psr4_manifests() {
		$this->write_test_manifest(
			'psr-4',
			array(
				'Automattic\\Jetpack\\' => array(
					'path'    => array( '$baseDir . \'/src\'' ),
					'version' => '1.2.0.0',
				),
			)
		);

		$loaded = array();
		$this->manifest_handler->register_plugin_manifests( 'test-manifest.php', $loaded );

		$this->assertEquals(
			array(
				'Automattic\\Jetpack\\' => array(
					'version' => '1.2.0.0',
					'path'    => array( TEST_DATA_PATH . '/src' ),
				),
			),
			$loaded
		);
	}

	/**
	 * Tests that the files manifest we generate can be read by the handler.
	 */
	public function test_that_handler_reads_files_manifests() {
		$this->write_test_manifest(
			'files',
			array(
				'123d5a6s7vd' => array(
					'path'    => '$baseDir . \'/path_to_file.php\'',
					'version' => '1.3.0.0',
				),
			)
		);

		$loaded = array();
		$this->manifest_handler->register_plugin_manifests( 'test-manifest.php', $loaded );

		$this->assertEquals(
			array(
				'123d5a6s7vd' => array(
					'version' => '1.3.0.0',
					'path'    => TEST_DATA_PATH . '/path_to_file.php',
				),
			),
			$loaded
		);
	}

	/**
	 * Writes the test manifest for the tests to use.
	 *
	 * @param string $autoload_type The type of manifest to generate.
	 * @param array  $content The content to write a manifest using.
	 */
	private function write_test_manifest( $autoload_type, $content ) {
		file_put_contents(
			self::TEST_MANIFEST_PATH,
			ManifestGenerator::buildManifest( $autoload_type, 'test-manifest.php', $content )
		);
	}
}

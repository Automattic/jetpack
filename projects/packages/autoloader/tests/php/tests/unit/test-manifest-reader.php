<?php // phpcs:ignore WordPress.Files.FileName
/**
 * File loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Jetpack\AutoloaderTestData\Plugin\Test;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class Test_Manifest_Reader extends TestCase {

	/**
	 * A mock of the version selector used by the reader.
	 *
	 * @var Version_Selector|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $version_selector;

	/**
	 * The manifest reader we're testing.
	 *
	 * @var Manifest_Reader
	 */
	private $reader;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->version_selector = $this->getMockBuilder( Version_Selector::class )
			->disableOriginalConstructor()
			->getMock();
		$this->reader           = new Manifest_Reader( $this->version_selector );
	}

	/**
	 * Tests that nothing is read without any plugins.
	 */
	public function test_reads_nothing_without_plugins() {
		$input_array = array();

		$this->reader->read_manifests(
			array(),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertEmpty( $input_array );
	}

	/**
	 * Tests that nothing is read for plugins that have no manifest.
	 */
	public function test_reads_nothing_for_plugins_without_manifests() {
		$input_array = array();

		$this->reader->read_manifests(
			array(),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertEmpty( $input_array );
	}

	/**
	 * Tests that a single plugin manifest can be read successfully.
	 */
	public function test_reads_single_plugin_manifest() {
		$input_array = array();

		$this->version_selector->expects( $this->exactly( 2 ) )
			->method( 'is_version_update_required' )
			->withConsecutive(
				array( null, '2.0.0.0' ),
				array( null, '1.0.0.0' )
			)
			->willReturnOnConsecutiveCalls(
				true,
				true
			);

		$this->reader->read_manifests(
			array( TEST_DATA_PATH . '/plugins/dummy_current' ),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertArrayHasKey( Test::class, $input_array );
		$this->assertEquals( '1.0.0.0', $input_array[ Test::class ]['version'] );
		$this->assertEquals( $input_array[ Test::class ]['path'], TEST_DATA_PATH . '/plugins/dummy_current/includes/class-test.php' );
	}

	/**
	 * Tests that the reader only keeps the latest version when processing multiple manifests.
	 */
	public function test_read_overwrites_older_version_in_manifest() {
		$input_array = array();

		$this->version_selector->expects( $this->exactly( 4 ) )
			->method( 'is_version_update_required' )
			->withConsecutive(
				array( null, '2.0.0.0' ),
				array( null, '1.0.0.0' ),
				array( '2.0.0.0', '2.2.0.0' ),
				array( '1.0.0.0', '2.0.0.0' )
			)
			->willReturnOnConsecutiveCalls(
				true,
				true,
				true,
				true
			);

		$this->reader->read_manifests(
			array(
				TEST_DATA_PATH . '/plugins/dummy_current',
				TEST_DATA_PATH . '/plugins/dummy_newer',
			),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertArrayHasKey( Test::class, $input_array );
		$this->assertEquals( '2.0.0.0', $input_array[ Test::class ]['version'] );
		$this->assertEquals( $input_array[ Test::class ]['path'], TEST_DATA_PATH . '/plugins/dummy_newer/includes/class-test.php' );
	}

	/**
	 * Tests that the reader ignores older versions when a newer version is already set.
	 */
	public function test_read_ignores_older_version_when_newer_already_loaded() {
		$input_array = array();

		$this->version_selector->expects( $this->exactly( 4 ) )
			->method( 'is_version_update_required' )
			->withConsecutive(
				array( null, '2.2.0.0' ),
				array( null, '2.0.0.0' ),
				array( '2.2.0.0', '2.0.0.0' ),
				array( '2.0.0.0', '1.0.0.0' )
			)
			->willReturnOnConsecutiveCalls(
				true,
				true,
				false,
				false
			);

		$this->reader->read_manifests(
			array(
				TEST_DATA_PATH . '/plugins/dummy_newer',
				TEST_DATA_PATH . '/plugins/dummy_current',
			),
			'vendor/composer/jetpack_autoload_classmap.php',
			$input_array
		);

		$this->assertArrayHasKey( Test::class, $input_array );
		$this->assertEquals( '2.0.0.0', $input_array[ Test::class ]['version'] );
		$this->assertEquals( $input_array[ Test::class ]['path'], TEST_DATA_PATH . '/plugins/dummy_newer/includes/class-test.php' );
	}
}

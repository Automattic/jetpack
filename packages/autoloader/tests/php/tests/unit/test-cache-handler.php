<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Cache handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles active plugin guessing.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class Test_Cache_Handler extends TestCase {

	/**
	 * The cache handler that we're testing.
	 *
	 * @var Cache_Handler
	 */
	private $handler;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->handler = new Cache_Handler();

		// Make sure the content directory is set so the cache file can be written/read.
		define( 'WP_CONTENT_DIR', TEST_DATA_PATH );
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		// Make sure all of the tests have no cache file.
		// phpcs:disable WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( TEST_DATA_PATH . '/cache/test-cache.json' );
		@unlink( TEST_DATA_PATH . '/cache/cache/test-cache-constant.json' );
		@rmdir( TEST_DATA_PATH . '/cache/cache' );
		@rmdir( TEST_DATA_PATH . '/cache' );
		// phpcs:enable WordPress.PHP.NoSilencedErrors.Discouraged
	}

	/**
	 * Tests that nothing is loaded from an empty cache.
	 */
	public function test_loads_nothing_from_empty_cache() {
		$loaded = $this->handler->read_from_cache( 'test-cache.json' );

		$this->assertFalse( $loaded );
	}

	/**
	 * Tests that the tracker is able to save a cache file and then load that cache file successfully.
	 */
	public function test_saves_and_loads_cache() {
		$cache_content = array( 'test' => 'content' );

		$this->handler->write_to_cache( 'test-cache', $cache_content );
		$this->assertFileExists( TEST_DATA_PATH . '/cache/test-cache.json' );

		$read_cache = $this->handler->read_from_cache( 'test-cache' );
		$this->assertEquals( $cache_content, $read_cache );
	}

	/**
	 * Tests that the constant to change the cache directory works.
	 */
	public function test_uses_cache_directory_override() {
		define( 'JETPACK_AUTOLOAD_CACHE_FOLDER', TEST_DATA_PATH . '/cache/cache' );

		$cache_content = array( 'test' => 'content' );

		$this->handler->write_to_cache( 'test-cache-constant', $cache_content );
		$this->assertFileExists( TEST_DATA_PATH . '/cache/cache/test-cache-constant.json' );

		$read_cache = $this->handler->read_from_cache( 'test-cache-constant' );
		$this->assertEquals( $cache_content, $read_cache );
	}
}

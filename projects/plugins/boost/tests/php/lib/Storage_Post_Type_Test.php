<?php
/**
 * Test class for Storage_Post_Type
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Storage_Post_Type;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;

require_once __DIR__ . '/mocks/storage-post-type/misc.php';
require_once __DIR__ . '/mocks/storage-post-type/class-wp-post.php';
require_once __DIR__ . '/mocks/storage-post-type/class-wp-query.php';
require_once __DIR__ . '/mocks/storage-post-type/class-wpdb.php';

/**
 * Class Storage_Post_Type_Test
 */
class Storage_Post_Type_Test extends Base_TestCase {

	/**
	 * @var Storage_Post_Type
	 */
	private $storage;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->storage = new Storage_Post_Type( 'test_storage' );
		\WP_Query::clear_mock_posts();
	}

	/**
	 * Test that the post type is registered correctly.
	 */
	public function test_post_type_registration() {
		$this->assertTrue( post_type_exists( 'jb_store_test_storage' ) );
	}

	/**
	 * Test setting and getting a value.
	 */
	public function test_set_and_get() {
		$key   = 'test_key';
		$value = 'test_value';

		$this->storage->set( $key, $value );
		$retrieved = $this->storage->get( $key, 'default' );

		$this->assertEquals( $value, $retrieved );
	}

	/**
	 * Test getting a non-existent value returns default.
	 */
	public function test_get_nonexistent_returns_default() {
		$default = 'default_value';
		$result  = $this->storage->get( 'nonexistent_key', $default );

		$this->assertEquals( $default, $result );
	}

	/**
	 * Test setting and getting with expiration.
	 */
	public function test_set_with_expiration() {
		$key    = 'expiring_key';
		$value  = 'expiring_value';
		$expiry = 3600; // 1 hour

		$this->storage->set( $key, $value, $expiry );
		$retrieved = $this->storage->get( $key, 'default' );

		$this->assertEquals( $value, $retrieved );
	}

	/**
	 * Test deleting a value.
	 */
	public function test_delete() {
		$key   = 'key_to_delete';
		$value = 'value_to_delete';

		$this->storage->set( $key, $value );
		$this->storage->delete( $key );

		$retrieved = $this->storage->get( $key, 'default' );
		$this->assertEquals( 'default', $retrieved );
	}

	/**
	 * Test clearing all stored data.
	 */
	public function test_clear() {
		// Set up some test data
		$this->storage->set( 'key1', 'value1' );
		$this->storage->set( 'key2', 'value2' );

		// Clear all data
		$this->storage->clear();

		// Verify data is cleared
		$this->assertEquals( 'default', $this->storage->get( 'key1', 'default' ) );
		$this->assertEquals( 'default', $this->storage->get( 'key2', 'default' ) );
	}

	/**
	 * Test that the post type slug is generated correctly.
	 */
	public function test_post_type_slug() {
		$expected = 'jb_store_test_storage';
		$actual   = $this->storage->post_type_slug();

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Test that the post type name is sanitized correctly.
	 */
	public function test_post_type_name_sanitization() {
		$storage  = new Storage_Post_Type( 'Test Storage With Spaces' );
		$expected = 'jb_store_test-storage-with-spaces';
		$actual   = $storage->post_type_slug();

		$this->assertEquals( $expected, $actual );
	}
}

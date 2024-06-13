<?php
/**
 * FileRestorer Test file.
 *
 * @package wpcomsh
 */

use Imports\Utils\FileRestorer;

/**
 * FileRestorerTest Class.
 */
class FileRestorerTest extends WP_UnitTestCase {
	/**
	 * The FileRestorer instance.
	 *
	 * @var FileRestorer
	 */
	private $file_restorer;

	/**
	 * Sets up the test environment before each test.
	 */
	protected function setUp(): void {
		$this->file_restorer = new FileRestorer( '/path/to/source', '/path/to/destination' );
	}

	/**
	 * Tests the is_file_excluded method with a SQL file.
	 *
	 * This test checks that the is_file_excluded method correctly identifies a SQL file as excluded.
	 */
	public function test_is_sql_file_excluded() {
		// Replace this with a file that should be excluded.
		$excluded_file = '/path/to/excluded/file.sql';

		$this->assertTrue( $this->file_restorer->is_file_excluded( $excluded_file ) );
	}

	/**
	 * Tests the is_file_excluded method with a core file.
	 *
	 * This test checks that the is_file_excluded method correctly identifies a core file as excluded.
	 */
	public function test_is_core_file_excluded() {
		// Replace this with a file that should be excluded.
		$excluded_file = '/path/to/wp-admin/file.php';

		$this->assertTrue( $this->file_restorer->is_file_excluded( $excluded_file ) );
	}

	/**
	 * Tests the get_file_exclusion_list method.
	 *
	 * This test checks that the get_file_exclusion_list method returns an array, and that each item in the array is an array with a 'pattern' and a 'message'.
	 */
	public function test_get_file_exclusion_list() {
		$exclusion_list = $this->file_restorer->get_file_exclusion_list();

		// Check that the exclusion list is an array.
		$this->assertIsArray( $exclusion_list );

		// Check that each item in the exclusion list is an array with a 'pattern' and a 'message'.
		foreach ( $exclusion_list as $exclusion ) {
			$this->assertIsArray( $exclusion );
			$this->assertArrayHasKey( 'pattern', $exclusion );
			$this->assertArrayHasKey( 'message', $exclusion );
		}
	}
}

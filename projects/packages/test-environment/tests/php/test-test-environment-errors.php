<?php
/**
 * Test error cases for the Test_Environment class
 *
 * @package automattic/jetpack-test-environment
 */

namespace Automattic\Jetpack;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

// This allows us to fake the file_exists function.
require_once __DIR__ . '/mock-functions.php';

/**
 * Test error cases for the Test_Environment class
 */
class Test_Environment_Errors_Test extends TestCase {
	/**
	 * Set up before each test
	 */
	public function set_up(): void {
		parent::set_up();
		$GLOBALS['mock_files'] = null;
	}

	/**
	 * Test that an exception is thrown when autoloader cannot be found
	 */
	public function test_throws_exception_when_autoloader_not_found() {
		$GLOBALS['mock_files'] = array();  // Empty filesystem

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Could not locate test environment autoloader' );

		Test_Environment::find_autoloader();
	}
}

<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The UtilsTest class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

/**
 * Provides unit tests for the methods in the Utils class.
 */
class UtilsTest extends TestCase {

	/**
	 * This method is called after each test.
	 */
	public function tearDown() {
		Constants::clear_constants();
	}

	/**
	 * Utils::get_jetpack_api_version should return the JETPACK__API_VERSION
	 * constant when the constant is defined.
	 *
	 *  @covers Automattic\Jetpack\Connection\Utils::get_jetpack_api_version
	 */
	public function test_get_jetpack_api_version_with_constant() {
		$test_constant_value = 3;
		Constants::set_constant( 'JETPACK__API_VERSION', $test_constant_value );
		$this->assertEquals( $test_constant_value, Utils::get_jetpack_api_version() );
	}

	/**
	 * Utils::get_jetpack_api_version should return the default Jetpack API version
	 * value when the JETPACK__API_VERSION constant is not defined.
	 */
	public function test_get_jetpack_api_version_without_constant() {
		$this->assertEquals( Utils::DEFAULT_JETPACK_API_VERSION, Utils::get_jetpack_api_version() );
	}
}

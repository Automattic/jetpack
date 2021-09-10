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
	 *
	 * @after
	 */
	public function tear_down() {
		Constants::clear_constants();
	}

	/**
	 * Tests the Utils::jetpack_api_constant_filter() method.
	 *
	 * @covers Automattic\Jetpack\Connection\Utils
	 * @dataProvider jetpack_api_constant_filter_data_provider
	 *
	 * @param mixed  $constant_value The constant value.
	 * @param string $constant_name The constant name.
	 * @param mixed  $expected_output The expected output of Utils::get_jetpack_api_constant.
	 */
	public function test_jetpack_api_constant_filter( $constant_value, $constant_name, $expected_output ) {
		$this->assertEquals( $expected_output, Utils::jetpack_api_constant_filter( $constant_value, $constant_name ) );
	}

	/**
	 * Data provider for test_jetpack_api_constant_filter.
	 *
	 * The test data arrays have the format:
	 *    'constant_value'  => The value that the constant will be set to. Null if the constant will not be set.
	 *    'constant_name'   => The name of the constant.
	 *    'expected_output' => The expected output of Utils::jetpack_api_constant_filter().
	 */
	public function jetpack_api_constant_filter_data_provider() {
		return array(
			'jetpack__api_base_without_constant'     =>
				array(
					'constant_value'  => null,
					'constant_name'   => 'JETPACK__API_BASE',
					'expected_output' => Utils::DEFAULT_JETPACK__API_BASE,
				),
			'jetpack__api_version_without_constant'  =>
				array(
					'constant_value'  => null,
					'constant_name'   => 'JETPACK__API_VERSION',
					'expected_output' => Utils::DEFAULT_JETPACK__API_VERSION,
				),
			'no_default_value_in_utils'              =>
				array(
					'constant_value'  => null,
					'constant_name'   => 'JETPACK__TEST',
					'expected_output' => null,
				),
			'jetpack__api_base_with_constant_set'    =>
				array(
					'constant_value'  => 'https://example.com/api/base.',
					'constant_name'   => 'JETPACK__API_BASE',
					'expected_output' => 'https://example.com/api/base.',
				),
			'jetpack__api_version_with_constant_set' =>
				array(
					'constant_value'  => 20,
					'constant_name'   => 'JETPACK__API_VERSION',
					'expected_output' => 20,
				),
			'jetpack__wpcom_json_api_base'           =>
				array(
					'constant_value'  => null,
					'constant_name'   => 'JETPACK__WPCOM_JSON_API_BASE',
					'expected_output' => 'https://public-api.wordpress.com',
				),
		);
	}
}

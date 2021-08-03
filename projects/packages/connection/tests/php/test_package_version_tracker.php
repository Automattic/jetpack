<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Package_Version_Tracker class.
 *
 * @package automattic/jetpack-connection
 */
class Test_Package_Version_Tracker extends TestCase {

	/**
	 * Tests the maybe_update_package_versions method.
	 *
	 * @param array $option_value The value that will be set in the 'jetpack_package_versions' option.
	 * @param array $filter_value The value that will be returned by the 'jetpack_package_versions' filter.
	 * @param array $expected_value The value of the 'jetpack_package_versions' option after maybe_update_package_versions
	 *                              is called.
	 *
	 * @dataProvider jetpack_api_constant_filter_data_provider
	 */
	public function test_maybe_update_package_versions( $option_value, $filter_value, $expected_value ) {
		update_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, $option_value );

		add_filter(
			'jetpack_package_versions',
			function () use ( $filter_value ) {
				return $filter_value;
			}
		);

		Package_Version_Tracker::maybe_update_package_versions();

		$this->assertSame( $expected_value, get_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION ) );
	}

	/**
	 * Data provider for 'test_maybe_update_package_versions'.
	 *
	 * The test data arrays have the format:
	 *    'option_value' => The value that will be set in the 'jetpack_package_versions' option.
	 *    'filter_value' => The value that will be returned by the 'jetpack_package_versions' filter.
	 *     'expected_value' => The expected value of the option after maybe_update_package_versions is called.
	 */
	public function jetpack_api_constant_filter_data_provider() {
		$package_versions = array(
			'connection' => '1.0',
			'backup'     => '2.0',
			'sync'       => '3.0',
		);

		$changed_versions = array(
			'connection' => '1.2',
			'backup'     => '3.4',
			'sync'       => '4.5',
		);

		$added_version = array_merge( $package_versions, array( 'test' => '4.0' ) );

		$removed_version = $package_versions;
		unset( $removed_version['sync'] );

		return array(
			'versions did not change'  =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => $package_versions,
					'expected_option' => $package_versions,
				),
			'option is empty'          =>
				array(
					'option_value'    => array(),
					'filter_value'    => $package_versions,
					'expected_option' => $package_versions,
				),
			'filter is empty'          =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => array(),
					'expected_option' => array(),
				),
			'versions changed'         =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => $changed_versions,
					'expected_option' => $changed_versions,
				),
			'filter added new package' =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => $added_version,
					'expected_option' => $added_version,
				),
			'filter removed a package' =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => $removed_version,
					'expected_option' => $removed_version,
				),
			'filter not an array'      =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => 'not an array',
					'expected_option' => $package_versions,
				),
			'option not an array'      =>
				array(
					'option_value'    => 'not an array',
					'filter_value'    => $package_versions,
					'expected_option' => $package_versions,
				),
			'option, filter arrays'    =>
				array(
					'option_value'    => 'option not an array',
					'filter_value'    => 'filter not an array',
					'expected_option' => 'option not an array',
				),
			'filter version not string, option version is string' =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => array(
						'connection' => 1,
						'backup'     => '1.0',
						'sync'       => '2.0',
					),
					'expected_option' => array(
						'connection' => '1.0',
						'backup'     => '1.0',
						'sync'       => '2.0',
					),
				),
			'filter version not string, option version also not string' =>
				array(
					'option_value'    => array(
						'connection' => 1,
						'backup'     => '1.0',
						'sync'       => '2.0',
					),
					'filter_value'    => array(
						'connection' => 2,
						'backup'     => '1.0',
						'sync'       => '2.0',
					),
					'expected_option' => array(
						'backup' => '1.0',
						'sync'   => '2.0',
					),
				),
			'filter version not string, option version does not exist' =>
				array(
					'option_value'    => $package_versions,
					'filter_value'    => array(
						'connection' => '2.1',
						'backup'     => '3.2',
						'sync'       => '4.3',
						'test'       => 5,
					),
					'expected_option' => array(
						'connection' => '2.1',
						'backup'     => '3.2',
						'sync'       => '4.3',
					),
				),
		);
	}
}

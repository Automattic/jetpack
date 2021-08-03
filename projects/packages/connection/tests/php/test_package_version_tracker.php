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
	 *
	 * @dataProvider jetpack_api_constant_filter_data_provider
	 */
	public function test_maybe_update_package_versions( $option_value, $filter_value ) {
		update_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, $option_value );

		add_filter(
			'jetpack_package_versions',
			function () use ( $filter_value ) {
				return $filter_value;
			}
		);

		Package_Version_Tracker::maybe_update_package_versions();

		$this->assertSame( $filter_value, get_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION ) );
	}

	/**
	 * Data provider for 'test_maybe_update_package_versions'.
	 *
	 * The test data arrays have the format:
	 *    'option_value' => The value that will be set in the 'jetpack_package_versions' option.
	 *    'filter_value' => The value that will be returned by the 'jetpack_package_versions' filter.
	 */
	public function jetpack_api_constant_filter_data_provider() {
		$package_versions = array(
			'connection' => '1.0',
			'backup'     => '2.0',
			'sync'       => '3.0',
		);

		return array(
			'versions did not change'  =>
				array(
					'option_value' => $package_versions,
					'filter_value' => $package_versions,
				),
			'option is empty'          =>
				array(
					'option_value' => array(),
					'filter_value' => $package_versions,
				),
			'filter is empty'          =>
				array(
					'option_value' => $package_versions,
					'filter_value' => array(),
				),
			'versions changed'         =>
				array(
					'option_value' => $package_versions,
					'filter_value' => array(
						'connection' => '1.2',
						'backup'     => '3.4',
						'sync'       => '4.5',
					),
				),
			'filter added new package' =>
				array(
					'option_value' => $package_versions,
					'filter_value' => array(
						'connection' => '1.0',
						'backup'     => '2.0',
						'sync'       => '3.0',
						'test'       => '4.0',
					),
				),
			'filter removed a package' =>
				array(
					'option_value' => $package_versions,
					'filter_value' => array(
						'connection' => '1.0',
						'backup'     => '2.1',
					),
				),
		);
	}
}

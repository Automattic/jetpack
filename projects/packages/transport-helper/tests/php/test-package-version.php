<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Transport_Helper;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Package_Version class.
 *
 * @package automattic/jetpack-helper-script
 */
class Test_Package_Version extends TestCase {

	/**
	 * Tests that the helper-script package version is added to the package verions array obtained by the
	 * Package_Version_Tracker.
	 */
	public function test_send_package_version_to_tracker_empty_array() {
		$expected = array(
			Package_Version::PACKAGE_SLUG => Package_Version::PACKAGE_VERSION,
		);

		add_filter( 'jetpack_package_versions', __NAMESPACE__ . '\Package_Version::send_package_version_to_tracker' );

		$this->assertSame( $expected, apply_filters( 'jetpack_package_versions', array() ) );
	}

	/**
	 * Tests that the transport-helper package version is added to the package verions array obtained by the
	 * Package_Version_Tracker.
	 */
	public function test_send_package_version_to_tracker_existing_array() {
		$existing_array = array(
			'test-package-slug' => '1.0.0',
		);

		$expected = array_merge(
			$existing_array,
			array( Package_Version::PACKAGE_SLUG => Package_Version::PACKAGE_VERSION )
		);

		add_filter( 'jetpack_package_versions', __NAMESPACE__ . '\Package_Version::send_package_version_to_tracker' );

		$this->assertSame( $expected, apply_filters( 'jetpack_package_versions', $existing_array ) );
	}
}

<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Package_Version class.
 *
 * @package automattic/jetpack-identity-crisis
 */
class Test_Package_Version extends TestCase {

	/**
	 * Tests that the identity-crisis package version is added to the package versions array obtained by the
	 * Package_Version_Tracker.
	 */
	public function test_send_package_version_to_tracker_empty_array() {
		Identity_Crisis::init();

		$expected = array(
			Identity_Crisis::PACKAGE_SLUG => Identity_Crisis::PACKAGE_VERSION,
		);

		$this->assertSame( $expected, apply_filters( 'jetpack_package_versions', array() ) );
	}

	/**
	 * Tests that the identity-crisis package version is added to the package versions array obtained by the
	 * Package_Version_Tracker.
	 */
	public function test_send_package_version_to_tracker_existing_array() {
		$existing_array = array(
			'test-package-slug' => '1.0.0',
		);

		$expected = array_merge(
			$existing_array,
			array( Identity_Crisis::PACKAGE_SLUG => Identity_Crisis::PACKAGE_VERSION )
		);

		add_filter( 'jetpack_package_versions', 'Automattic\\Jetpack\\Identity_Crisis::send_package_version_to_tracker' );

		$this->assertSame( $expected, apply_filters( 'jetpack_package_versions', $existing_array ) );
	}
}

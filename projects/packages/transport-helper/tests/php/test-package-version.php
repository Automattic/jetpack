<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Transport_Helper\V0001;

use PHPUnit\Framework\TestCase;
use function add_filter;
use function apply_filters;

/**
 * Unit tests for the Package_Version class.
 *
 * @package automattic/jetpack-helper-script
 */
class Test_Package_Version extends TestCase {

	/**
	 * Tests that the helper-script package version is added to the package versions array obtained by the
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

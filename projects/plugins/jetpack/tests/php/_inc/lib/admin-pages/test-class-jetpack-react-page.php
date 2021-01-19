<?php
/**
 * Jetpack_React_Page unit tests.
 *
 * @package Jetpack
 */

jetpack_require_lib( 'admin-pages/class.jetpack-react-page' );

/**
 * Class for testing the Jetpack_React_Page class.
 */
class WP_Test_Jetpack_React_Page extends WP_UnitTestCase {

	/**
	 * Tests the Jetpack_React_Page::show_dev_packages_notice method.
	 *
	 * @dataProvider data_provider_show_dev_packages_notice
	 *
	 * @param bool $jp_dev_version Whether the Jetpack verision is a development version.
	 * @param bool $change_autoloader Whether the autoloader classmap should be changed so i doesn't
	 *                                match Jetpack's classmap file.
	 * @param bool $expected_output The expected output of the Jetpack_React_Page::show_dev_package_notice method.
	 */
	public function test_show_dev_packages_notice( $jp_dev_version, $change_autoloader, $expected_output ) {
		global $jetpack_autoloader_loader;

		if ( $change_autoloader ) {
			$real_autoloader = clone $jetpack_autoloader_loader;
			$this->change_autoloader_classmap();
		}

		if ( $jp_dev_version ) {
			add_filter( 'jetpack_development_version', '__return_true' );
		} else {
			add_filter( 'jetpack_development_version', '__return_false' );
		}

		$output = ( new Jetpack_React_Page() )->show_dev_packages_notice();

		if ( $change_autoloader ) {
			// Restore the original autoloader.
			$jetpack_autoloader_loader = $real_autoloader;
		}

		$this->assertEquals( $expected_output, $output );
	}

	/**
	 * Changes the autoloader's in-memory classmap so that it doesn't match
	 * Jetpack's classmap file.
	 *
	 * In the 'Automattic\Jetpack\Autoloader\AutoloadGenerator' path, replaces
	 * 'jetpack' with 'not-jetpack'.
	 */
	private function change_autoloader_classmap() {
		global $jetpack_autoloader_loader;

		array_walk(
			$jetpack_autoloader_loader,
			function ( &$value, $key ) {
				if ( substr( $key, -strlen( 'classmap' ) ) === 'classmap' ) {
					$current_path = $value['Automattic\Jetpack\Autoloader\AutoloadGenerator']['path'];
					$new_path     = str_replace( 'jetpack', 'not-jetpack', $current_path );
					$value['Automattic\Jetpack\Autoloader\AutoloadGenerator']['path'] = $new_path;
				}
			}
		);
	}

	/**
	 * Data provider for test_show_dev_packages_notice.
	 *
	 * @return array An array containing the test data:
	 *   [
	 *     'jp_dev_version' => (bool) Whether the Jetpack verison is a development version.
	 *     'change_autoloader' => (bool) Whether the autoloader classmap should be changed.
	 *     'expected_output' => The expected output of Jetpack_React_Page::show_dev_packages_notice.
	 * ]
	 */
	public function data_provider_show_dev_packages_notice() {
		return array(
			array(
				'jp_dev_version'    => true,
				'change_autoloader' => false,
				'expected_output'   => false,
			),
			array(
				'jp_dev_version'    => false,
				'change_autoloader' => true,
				'expected_output'   => false,
			),
			array(
				'jp_dev_version'    => true,
				'change_autoloader' => true,
				'expected_output'   => true,
			),
		);
	}
}

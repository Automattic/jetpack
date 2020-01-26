<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Contains tests for the Jetpack Autoloader.
 */
class WP_Test_Jetpack_Include_Autoloader extends WP_UnitTestCase {

	/**
	 * Tests that the Autoloader properly includes class files when the files
	 * are renamed.
	 */
	public function test_renaming_files_in_autoloader_does_not_cause_errors() {
		$packages = $this->get_packages_classes();
		$this->unset_package_classes();

		$empty_packages = $this->get_packages_classes();
		$this->assertTrue( empty( $empty_packages ), 'package classes are not empty!' );

		// Fake the plugin update.
		apply_filters( 'upgrader_post_install', true, array( 'plugin' => JETPACK__PLUGIN_FILE ), array() );

		$this->assertEquals( $packages, $this->get_packages_classes(), 'package classes are not the same as before' );
	}

	/**
	 * Returns the global $jetpack_packages_classes variable.
	 *
	 * @return array
	 */
	public function get_packages_classes() {
		global $jetpack_packages_classes;
		return $jetpack_packages_classes;
	}

	/**
	 * Unsets the global $jetpack_packages_classes variable.
	 */
	public function unset_package_classes() {
		global $jetpack_packages_classes;
		$jetpack_packages_classes = array();
	}
}

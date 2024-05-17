<?php //phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * The WP_Test_Jetpack_Photon_Static_Assets_CDN class file.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/photon-cdn.php';

/**
 * Unit tests for the Jetpack_Photon_Static_Assets_CDN class.
 */
class WP_Test_Jetpack_Photon_Static_Assets_CDN extends WP_UnitTestCase {

	/**
	 * Test Jetpack_Photon_Static_Assets_CDN::fix_local_script_translation_path.
	 *
	 * @covers Jetpack_Photon_Static_Assets_CDN::fix_local_script_translation_path
	 *
	 * @param string|false $file The path to the translation file to load. False if there isn't one.
	 * @param string       $script_src The script source.
	 * @param string|false $expected_output The expected output of fix_local_script_translation_path().
	 *
	 * @dataProvider fix_local_script_translation_path_data_provider
	 */
	public function test_fix_local_script_translation_path( $file, $script_src, $expected_output ) {
		global $wp_scripts;
		$handle = 'test_handle';

		$test_script                       = (object) array( 'src' => $script_src );
		$wp_scripts->registered[ $handle ] = $test_script;

		$actual_output = Jetpack_Photon_Static_assets_CDN::fix_local_script_translation_path( $file, $handle, 'test_domain' );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Data provider for test_fix_local_script_translation_path.
	 *
	 * @return array An array of test data. The structure of the test data is:
	 *    [0] string|false $file The path to the translation file to load. False if there isn't one.
	 *    [1] string       $script_src The script source.
	 *    [2] string|false $expected_output The expected output of fix_local_script_translation_path().
	 */
	public function fix_local_script_translation_path_data_provider() {
		return array(
			'File is false'              => array(
				false,
				'https://c0.wp.com/p/jetpack/8.7/_inc/blocks/editor.js',
				false,
			),
			'Has a file, src is CDN'     => array(
				'path/to/test_translation_file.json',
				'https://c0.wp.com/p/jetpack/8.7/_inc/blocks/editor.js',
				WP_LANG_DIR . '/plugins/test_translation_file.json',
			),
			'Has a file, src is not CDN' => array(
				'path/to/test_translation_file.json',
				'https://example.com/p/jetpack/8.7/_inc/blocks/editor.js',
				'path/to/test_translation_file.json',
			),
		);
	}
}

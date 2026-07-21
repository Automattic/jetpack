<?php
/**
 * Test class for the AI Launchpad script-translation inline loader.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\CoversFunction;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';

/**
 * Tests for the inline JED loader feeding wp.i18n on the Site Setup page.
 *
 * @covers ::wpcom_ai_launchpad_script_translations_inline
 */
#[CoversFunction( 'wpcom_ai_launchpad_script_translations_inline' )]
class AI_Launchpad_I18n_Test extends \WorDBless\BaseTestCase {

	/**
	 * Temp dir standing in for WP_LANG_DIR/mu-plugins.
	 *
	 * @var string
	 */
	private $lang_dir;

	/**
	 * The md5 the language pack uses for the app bundle's JED file: keyed to the
	 * unminified route bundle path the make-pot extraction records.
	 *
	 * @var string
	 */
	private $bundle_md5;

	/**
	 * Set up a fake language-pack directory.
	 */
	protected function set_up() {
		parent::set_up();
		$this->lang_dir   = sys_get_temp_dir() . '/ai-launchpad-i18n-test-' . wp_rand();
		$this->bundle_md5 = md5( 'jetpack_vendor/automattic/jetpack-mu-wpcom/build/routes/site-setup/content.js' );
		mkdir( $this->lang_dir, 0777, true );
	}

	/**
	 * Remove the fake language-pack directory.
	 */
	protected function tear_down() {
		foreach ( (array) glob( $this->lang_dir . '/*' ) as $file ) {
			unlink( $file );
		}
		rmdir( $this->lang_dir );
		parent::tear_down();
	}

	/**
	 * Write a pack JSON for a locale into the fake directory.
	 *
	 * @param string $locale  The WP locale.
	 * @param mixed  $payload The decoded file contents to encode, or a raw string to write as-is.
	 */
	private function write_pack_file( $locale, $payload ) {
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$this->lang_dir . '/jetpack-mu-wpcom-' . $locale . '-' . $this->bundle_md5 . '.json',
			is_string( $payload ) ? $payload : wp_json_encode( $payload, JSON_UNESCAPED_SLASHES )
		);
	}

	/**
	 * A valid pack file produces a setLocaleData inline carrying the messages.
	 */
	public function test_inlines_set_locale_data_from_a_valid_pack_file() {
		$this->write_pack_file(
			'it_IT',
			array(
				'locale_data' => array(
					'messages' => array(
						''     => array( 'domain' => 'messages' ),
						'Skip' => array( 'Salta' ),
					),
				),
			)
		);

		$inline = wpcom_ai_launchpad_script_translations_inline( 'it_IT', $this->lang_dir );

		$this->assertNotNull( $inline );
		$this->assertStringContainsString( 'wp.i18n.setLocaleData(', $inline );
		$this->assertStringContainsString( '"Salta"', $inline );
		$this->assertStringContainsString( '"jetpack-mu-wpcom"', $inline );
	}

	/**
	 * A locale with no pack file is a no-op.
	 */
	public function test_returns_null_when_no_pack_file_exists() {
		$this->assertNull( wpcom_ai_launchpad_script_translations_inline( 'it_IT', $this->lang_dir ) );
	}

	/**
	 * The pack file for another locale is not picked up.
	 */
	public function test_pack_files_are_per_locale() {
		$this->write_pack_file( 'de_DE', array( 'locale_data' => array( 'messages' => array( 'x' => array( 'y' ) ) ) ) );

		$this->assertNull( wpcom_ai_launchpad_script_translations_inline( 'it_IT', $this->lang_dir ) );
	}

	/**
	 * Malformed JSON and empty message sets are no-ops rather than broken inlines.
	 */
	public function test_returns_null_for_malformed_or_empty_pack_files() {
		$this->write_pack_file( 'it_IT', 'not json {' );
		$this->assertNull( wpcom_ai_launchpad_script_translations_inline( 'it_IT', $this->lang_dir ) );

		$this->write_pack_file( 'it_IT', array( 'locale_data' => array( 'messages' => array() ) ) );
		$this->assertNull( wpcom_ai_launchpad_script_translations_inline( 'it_IT', $this->lang_dir ) );
	}
}

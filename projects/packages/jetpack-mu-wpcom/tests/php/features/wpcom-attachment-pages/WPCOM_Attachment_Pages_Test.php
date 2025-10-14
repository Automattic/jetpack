<?php
/**
 * WPCOM attachment pages settings test file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-attachment-pages/wpcom-attachment-pages.php';

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests for WPCOM attachment pages settings.
 *
 * @covers ::wpcom_attachment_pages_setting_sanitization
 * @covers ::wpcom_attachment_pages_settings_init
 */
#[CoversFunction( 'wpcom_attachment_pages_setting_sanitization' )]
#[CoversFunction( 'wpcom_attachment_pages_settings_init' )]
class WPCOM_Attachment_Pages_Test extends \WorDBless\BaseTestCase {
	/**
	 * Tests the sanitization function.
	 *
	 * @dataProvider wpcom_attachment_pages_setting_sanitization_provider
	 *
	 * @param string|int|null $value    Value passed to the sanitization callback.
	 * @param string          $expected Expected string value returned from the sanitization callback.
	 * @return void
	 */
	#[DataProvider( 'wpcom_attachment_pages_setting_sanitization_provider' )]
	public function test_wpcom_attachment_pages_setting_sanitization( $value, $expected ) {
		$sanitized_value = wpcom_attachment_pages_setting_sanitization( $value );

		$this->assertSame( $expected, $sanitized_value );
	}

	/**
	 * Data provider for the wpcom_attachment_pages_setting_sanitization_provider test
	 *
	 * @return array Array of values and expected returns.
	 */
	public static function wpcom_attachment_pages_setting_sanitization_provider() {
		return array(
			'int 1 value'      => array(
				'value'    => 1,
				'expected' => '1',
			),
			'int 0 value'      => array(
				'value'    => 0,
				'expected' => '0',
			),
			'bool true value'  => array(
				'value'    => true,
				'expected' => '1',
			),
			'bool false value' => array(
				'value'    => false,
				'expected' => '0',
			),
			'string 1 value'   => array(
				'value'    => '1',
				'expected' => '1',
			),
			'string 0 value'   => array(
				'value'    => '0',
				'expected' => '0',
			),
			'string 2 value'   => array(
				'value'    => '2',
				'expected' => '1',
			),
			'null value'       => array(
				'value'    => null,
				'expected' => '0',
			),
		);
	}

	/**
	 * Tests whether the attachment pages settings is being hooked to admin_init
	 * and on correct priority.
	 *
	 * @return void
	 */
	public function test_wpcom_attachment_pages_settings_init_hooked() {
		$this->assertSame( 11, has_action( 'admin_init', 'wpcom_attachment_pages_settings_init' ) );
	}

	/**
	 * Tests whether the wpcom_attachment_pages_settings_init function registers the setting to correct section.
	 *
	 * @return void
	 */
	public function test_wpcom_attachment_pages_settings_init() {
		wpcom_attachment_pages_settings_init();

		$expected_settings = array(
			'type'              => 'string',
			'group'             => 'media',
			'label'             => '',
			'description'       => '',
			'sanitize_callback' => 'wpcom_attachment_pages_setting_sanitization',
			'show_in_rest'      => false,
		);

		$this->assertSame( $expected_settings, $GLOBALS['wp_registered_settings']['wp_attachment_pages_enabled'] );
		$this->assertTrue( isset( $GLOBALS['wp_settings_sections']['media']['wpcom_attachment_pages'] ) );
	}
}

<?php
/**
 * Class Jetpack_SEO_Titles_Test.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-titles.php';

/**
 * Class Jetpack_SEO_Titles_Test
 */
class Jetpack_SEO_Titles_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test for expected output after sanitizing the custom SEO page title structures.
	 */
	public function test_sanitize_title_formats() {
		$mock_inputs = array(
			'page_type' => array(
				array(
					'type'                     => 'string',
					'value'                    => 'test <script>alert(123)</script> test',
					'expected_sanitized_value' => 'test test',
					'test_message'             => 'Script tags should be stripped including inner contents.',
				),
				array(
					'type'                     => 'string',
					'value'                    => 'test <h1>title</h1> test',
					'expected_sanitized_value' => 'test title test',
					'test_message'             => 'Non-script tags should be stripped, with inner contents preseved.',
				),
				array(
					'type'                     => 'string',
					'value'                    => 'Welcome to [site_name] | [tagline]',
					'expected_sanitized_value' => 'Welcome to [site_name] | [tagline]',
					'test_message'             => 'Spacing between arbitrary strings and known tokens should be preserved.',
				),
				array(
					'type'                     => 'string',
					'value'                    => '     test     test     ',
					'expected_sanitized_value' => ' test test ',
					'test_message'             => 'Extraneous spacing should be removed.',
				),
				array(
					'type'                     => 'string',
					'value'                    => '< hello, world > & Welcome 🙂',
					'expected_sanitized_value' => '< hello, world > & Welcome 🙂',
					'test_message'             => 'Reserved characters should be preserved as-is.',
				),
			),
		);

		$sanitized_title_formats = Jetpack_SEO_Titles::sanitize_title_formats( $mock_inputs );

		foreach ( $sanitized_title_formats as $format_array ) {
			foreach ( $format_array as $item ) {
				$this->assertSame( $item['value'], $item['expected_sanitized_value'], $item['test_message'] );
			}
		}
	}
}

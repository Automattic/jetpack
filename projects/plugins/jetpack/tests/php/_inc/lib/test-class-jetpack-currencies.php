<?php
/**
 * Currencies unit tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-currencies.php';

/**
 * Class for testing the Jetpack_Currencies class.
 */
class WP_Test_Jetpack_Currencies extends WP_UnitTestCase {
	/**
	 * Test that USD currencies are formatted in fixed format, regardless the user locale.
	 */
	public function test_format_price_usd() {
		global $wp_locale;
		$previous_number_format   = $wp_locale->number_format;
		$wp_locale->number_format = array(
			'thousands_sep' => '-',
			'decimal_point' => '|',
		);
		$formatted_price          = Jetpack_Currencies::format_price( '12345.67890', 'USD' );
		$this->assertEquals( '$12,345.68', $formatted_price );
		$wp_locale->number_format = $previous_number_format;
	}

	/**
	 * Test that non-USD currencies are formatted according to the user locale.
	 */
	public function test_format_price_non_usd() {
		global $wp_locale;
		$previous_number_format   = $wp_locale->number_format;
		$wp_locale->number_format = array(
			'thousands_sep' => '-',
			'decimal_point' => '|',
		);
		$formatted_price          = Jetpack_Currencies::format_price( '12345.67890', 'EUR' );
		$this->assertEquals( '&#8364;12-345|68', $formatted_price );
		$wp_locale->number_format = $previous_number_format;
	}

	/**
	 * Test that no currency symbol is displayed when specified.
	 */
	public function test_format_price_no_currency_symbol() {
		$formatted_price = Jetpack_Currencies::format_price( '12345.67890', 'USD', false );
		$this->assertEquals( '12,345.68', $formatted_price );
	}

	/**
	 * Test that the unspecified currency symbol is displayed when the currency is not found.
	 */
	public function test_format_price_unspecified_currency_symbol() {
		$formatted_price = Jetpack_Currencies::format_price( '12345.67890', 'TEST', false );
		$this->assertEquals( '¤12,345.68', $formatted_price );
	}
}

<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\ContactForm\Country_Code_Utils trait.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WorDBless\BaseTestCase;

/**
 * Test class for Country_Code_Utils trait.
 *
 * Tests are for the trait methods used by this class.
 * Coverage is tracked through the classes that use the trait.
 */
class Country_Code_Utils_Test extends BaseTestCase {
	use Country_Code_Utils {
		country_code_to_emoji_flag as public;
	}

	/**
	 * Test valid country codes return correct flags.
	 */
	public function test_valid_country_codes_return_flags() {
		$this->assertEquals( '🇺🇸', self::country_code_to_emoji_flag( 'US' ) );
		$this->assertEquals( '🇬🇧', self::country_code_to_emoji_flag( 'GB' ) );
		$this->assertEquals( '🇩🇪', self::country_code_to_emoji_flag( 'DE' ) );
		$this->assertEquals( '🇫🇷', self::country_code_to_emoji_flag( 'FR' ) );
		$this->assertEquals( '🇯🇵', self::country_code_to_emoji_flag( 'JP' ) );
	}

	/**
	 * Test lowercase country codes are handled correctly.
	 */
	public function test_lowercase_country_codes_return_flags() {
		$this->assertEquals( '🇺🇸', self::country_code_to_emoji_flag( 'us' ) );
		$this->assertEquals( '🇬🇧', self::country_code_to_emoji_flag( 'gb' ) );
	}

	/**
	 * Test mixed case country codes are handled correctly.
	 */
	public function test_mixed_case_country_codes_return_flags() {
		$this->assertEquals( '🇺🇸', self::country_code_to_emoji_flag( 'Us' ) );
		$this->assertEquals( '🇬🇧', self::country_code_to_emoji_flag( 'gB' ) );
	}

	/**
	 * Test empty string returns empty string.
	 */
	public function test_empty_string_returns_empty() {
		$this->assertSame( '', self::country_code_to_emoji_flag( '' ) );
	}

	/**
	 * Test single character returns empty string.
	 */
	public function test_single_character_returns_empty() {
		$this->assertSame( '', self::country_code_to_emoji_flag( 'U' ) );
	}

	/**
	 * Test three characters returns empty string.
	 */
	public function test_three_characters_returns_empty() {
		$this->assertSame( '', self::country_code_to_emoji_flag( 'USA' ) );
	}

	/**
	 * Test numeric input returns empty string.
	 */
	public function test_numeric_input_returns_empty() {
		$this->assertSame( '', self::country_code_to_emoji_flag( '12' ) );
	}

	/**
	 * Test special characters return empty string.
	 */
	public function test_special_characters_return_empty() {
		$this->assertSame( '', self::country_code_to_emoji_flag( '!@' ) );
	}

	/**
	 * Test mixed alphanumeric returns empty string.
	 */
	public function test_mixed_alphanumeric_returns_empty() {
		$this->assertSame( '', self::country_code_to_emoji_flag( 'U1' ) );
		$this->assertSame( '', self::country_code_to_emoji_flag( '1S' ) );
	}
}

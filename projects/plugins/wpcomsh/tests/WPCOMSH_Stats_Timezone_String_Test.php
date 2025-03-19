<?php
/**
 * Wpcomsh Test file.
 *
 * @package wpcomsh
 */

/**
 * Class WPCOMSH_Stats_Timezone_String_Test
 */
class WPCOMSH_Stats_Timezone_String_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private $original_timezone_string;
	private $original_gmt_offset;

	public function setUp(): void {
		parent::setUp();
		// Backup original options
		$this->original_timezone_string = get_option( 'timezone_string' );
		$this->original_gmt_offset      = get_option( 'gmt_offset' );
	}

	public function tearDown(): void {
		// Restore original options
		update_option( 'timezone_string', $this->original_timezone_string );
		update_option( 'gmt_offset', $this->original_gmt_offset );
		parent::tearDown();
	}

	/** Test with a named timezone (e.g., "America/New_York") */
	public function test_wpcomsh_stats_timezone_string_with_named_tz() {
		update_option( 'timezone_string', 'America/New_York' );
		update_option( 'gmt_offset', '' ); // Clear offset to ensure we use timezone_string

		$actual_output   = wpcomsh_stats_timezone_string();
		$expected_output = 'America/New_York';
		$this->assertEquals( $expected_output, $actual_output );
	}

	/** Test with integer hour offset (e.g., UTC+5) */
	public function test_wpcomsh_stats_timezone_string_with_integer_offset() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', 5 ); // +5 hours

		$actual_output   = wpcomsh_stats_timezone_string();
		$expected_output = 'Etc/GMT-5'; // Note the flipped sign per the function spec
		$this->assertEquals( $expected_output, $actual_output );
	}

	/** Test with negative integer hour offset (e.g., UTC-3) */
	public function test_wpcomsh_stats_timezone_string_with_negative_integer_offset() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', -3 ); // -3 hours

		$actual_output   = wpcomsh_stats_timezone_string();
		$expected_output = 'Etc/GMT+3'; // Note the flipped sign per the function spec
		$this->assertEquals( $expected_output, $actual_output );
	}

	/** Test with fractional hour offset (e.g., UTC+5:30) */
	public function test_wpcomsh_stats_timezone_string_with_fractional_offset() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', 5.5 ); // +5 hours 30 minutes

		$actual_output = wpcomsh_stats_timezone_string();
		// Expecting a city timezone like "Asia/Kolkata" for +5:30
		// Note: exact result might depend on PHP's timezone database
		$this->assertEquals( 'Asia/Kolkata', $actual_output );
	}

	/** Test with fractional offset that has no city match (fall back to integer) */
	public function test_wpcomsh_stats_timezone_string_with_unmatched_fractional_offset() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', 5.25 ); // +5 hours 15 minutes (no common city match)

		$actual_output = wpcomsh_stats_timezone_string();
		// Should fall back to integer offset "Etc/GMT-5"
		$this->assertEquals( 'Etc/GMT-5', $actual_output );
	}

	public function test_wpcomsh_stats_timezone_string_with_zero_offset() {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', 0 );

		$actual_output   = wpcomsh_stats_timezone_string();
		$expected_output = 'Etc/GMT-0';
		$this->assertEquals( $expected_output, $actual_output );
	}
}

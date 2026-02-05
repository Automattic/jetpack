<?php
/**
 * Holiday Snow Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionClass;
use ReflectionMethod;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/holiday-snow/class-holiday-snow.php';

/**
 * Tests for the Holiday_Snow class.
 */
class Holiday_Snow_Test extends \WorDBless\BaseTestCase {
	/**
	 * Reflection class instance for accessing private methods.
	 *
	 * @var ReflectionClass
	 */
	private $reflection_class;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->reflection_class = new ReflectionClass( Holiday_Snow::class );

		// Remove any existing filters.
		remove_all_filters( 'jetpack_holiday_snow_hemisphere' );
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		// Clean up any filters.
		remove_all_filters( 'jetpack_holiday_snow_hemisphere' );
		remove_all_filters( 'jetpack_is_holiday_snow_season' );

		// Reset timezone to default.
		delete_option( 'timezone_string' );
		delete_option( 'gmt_offset' );

		// Clean up holiday snow options.
		delete_option( 'jetpack_holiday_snow_speed' );

		parent::tear_down();
	}

	/**
	 * Get the private get_hemisphere_setting method using reflection.
	 *
	 * @return ReflectionMethod
	 */
	private function get_hemisphere_setting_method(): ReflectionMethod {
		$method = $this->reflection_class->getMethod( 'get_hemisphere_setting' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method;
	}

	/**
	 * Data provider for test_get_hemisphere_setting.
	 *
	 * @return \Iterator
	 */
	public static function provide_hemisphere_setting_scenarios(): \Iterator {
		// Northern hemisphere timezones.
		yield 'Europe/London (Northern)' => array(
			'timezone_string' => 'Europe/London',
			'expected'        => 'north',
		);

		yield 'America/New_York (Northern)' => array(
			'timezone_string' => 'America/New_York',
			'expected'        => 'north',
		);

		yield 'Asia/Tokyo (Northern)' => array(
			'timezone_string' => 'Asia/Tokyo',
			'expected'        => 'north',
		);

		// Southern hemisphere timezones.
		yield 'Australia/Sydney (Southern)' => array(
			'timezone_string' => 'Australia/Sydney',
			'expected'        => 'south',
		);

		yield 'America/Santiago (Southern)' => array(
			'timezone_string' => 'America/Santiago',
			'expected'        => 'south',
		);

		yield 'Africa/Johannesburg (Southern)' => array(
			'timezone_string' => 'Africa/Johannesburg',
			'expected'        => 'south',
		);

		// UTC and offset-based timezones (should default to north).
		yield 'UTC (defaults to north)' => array(
			'timezone_string' => '',
			'expected'        => 'north',
		);

		yield 'GMT offset +5 (defaults to north)' => array(
			'timezone_string' => '',
			'expected'        => 'north',
			'gmt_offset'      => '5',
		);

		yield 'GMT offset -3 (defaults to north)' => array(
			'timezone_string' => '',
			'expected'        => 'north',
			'gmt_offset'      => '-3',
		);

		// Timezone near equator (latitude >= 0 defaults to north).
		yield 'Africa/Lagos (near equator, defaults to north)' => array(
			'timezone_string' => 'Africa/Lagos',
			'expected'        => 'north',
		);
	}

	/**
	 * Test get_hemisphere_setting with various timezone scenarios.
	 *
	 * @dataProvider provide_hemisphere_setting_scenarios
	 * @param string      $timezone_string The timezone string to set.
	 * @param string      $expected The expected hemisphere result.
	 * @param string|null $gmt_offset Optional GMT offset if timezone_string is empty.
	 */
	#[DataProvider( 'provide_hemisphere_setting_scenarios' )]
	public function test_get_hemisphere_setting( string $timezone_string, string $expected, ?string $gmt_offset = null ) {
		// Set the timezone.
		if ( ! empty( $timezone_string ) ) {
			update_option( 'timezone_string', $timezone_string );
			update_option( 'gmt_offset', '0' );
		} else {
			update_option( 'timezone_string', '' );
			update_option( 'gmt_offset', $gmt_offset ?? '0' );
		}

		// Get the method and invoke it.
		$method = $this->get_hemisphere_setting_method();
		$result = $method->invoke( null );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Test that the filter can override the detected hemisphere.
	 */
	public function test_get_hemisphere_setting_filter_override() {
		// Set a Northern hemisphere timezone.
		update_option( 'timezone_string', 'Europe/London' );
		update_option( 'gmt_offset', 0 );

		// Get the method.
		$method = $this->get_hemisphere_setting_method();

		// Test without filter - should return north.
		$result = $method->invoke( null );
		$this->assertSame( 'north', $result, 'Should detect north for Europe/London' );

		// Add filter to override to south.
		add_filter(
			'jetpack_holiday_snow_hemisphere',
			function () {
				return 'south';
			}
		);

		$result = $method->invoke( null );
		$this->assertSame( 'south', $result, 'Filter should override detected hemisphere to south' );

		// Remove filter and test with different override.
		remove_all_filters( 'jetpack_holiday_snow_hemisphere' );

		add_filter(
			'jetpack_holiday_snow_hemisphere',
			function () {
				return 'north';
			}
		);

		// Set a Southern hemisphere timezone.
		update_option( 'timezone_string', 'Australia/Sydney' );

		$result = $method->invoke( null );
		$this->assertSame( 'north', $result, 'Filter should override detected hemisphere to north even for Southern timezone' );
	}

	/**
	 * Data provider for test_holiday_snow_markup.
	 *
	 * @return \Iterator
	 */
	public static function provide_holiday_snow_markup_scenarios(): \Iterator {
		// Test with config initialized and valid speed values.
		yield 'Default speed (9) with config initialized' => array(
			'init_config'    => true,
			'speed_option'   => null,
			'expected_speed' => 9,
			'description'    => 'Should use default speed of 9 when option is not set and config is initialized',
		);

		yield 'Custom speed (5) within range with config initialized' => array(
			'init_config'    => true,
			'speed_option'   => 5,
			'expected_speed' => 5,
			'description'    => 'Should use custom speed value within valid range',
		);

		yield 'Custom speed (15) within range with config initialized' => array(
			'init_config'    => true,
			'speed_option'   => 15,
			'expected_speed' => 15,
			'description'    => 'Should use custom speed value within valid range',
		);

		yield 'Speed below minimum (0) with config initialized' => array(
			'init_config'    => true,
			'speed_option'   => 0,
			'expected_speed' => 9,
			'description'    => 'Should default to 9 when speed is below minimum (1)',
		);

		yield 'Speed above maximum (25) with config initialized' => array(
			'init_config'    => true,
			'speed_option'   => 25,
			'expected_speed' => 9,
			'description'    => 'Should default to 9 when speed is above maximum (20)',
		);

		// Test with config not initialized (fallback behavior).
		yield 'Default speed (9) without config initialized' => array(
			'init_config'    => false,
			'speed_option'   => null,
			'expected_speed' => 9,
			'description'    => 'Should use hardcoded default of 9 when config is not initialized',
		);

		yield 'Valid speed (10) without config initialized' => array(
			'init_config'    => false,
			'speed_option'   => 10,
			'expected_speed' => 10,
			'description'    => 'Should use option value when config is not initialized and value is valid',
		);

		yield 'Invalid speed (0) without config initialized' => array(
			'init_config'    => false,
			'speed_option'   => 0,
			'expected_speed' => 9,
			'description'    => 'Should default to 9 when speed is invalid and config is not initialized',
		);

		yield 'Invalid speed (25) without config initialized' => array(
			'init_config'    => false,
			'speed_option'   => 25,
			'expected_speed' => 9,
			'description'    => 'Should default to 9 when speed exceeds max and config is not initialized',
		);
	}

	/**
	 * Test holiday_snow_markup with various speed scenarios.
	 *
	 * @dataProvider provide_holiday_snow_markup_scenarios
	 * @param bool     $init_config Whether to initialize the config.
	 * @param int|null $speed_option The speed option value to set (null to not set).
	 * @param int      $expected_speed The expected speed in the output.
	 * @param string   $description Description of the test case.
	 */
	#[DataProvider( 'provide_holiday_snow_markup_scenarios' )]
	public function test_holiday_snow_markup( bool $init_config, ?int $speed_option, int $expected_speed, string $description ) {
		// Initialize config if needed.
		if ( $init_config ) {
			Holiday_Snow::init();
		}

		// Set speed option if provided.
		if ( $speed_option !== null ) {
			update_option( 'jetpack_holiday_snow_speed', $speed_option );
		} else {
			delete_option( 'jetpack_holiday_snow_speed' );
		}

		// Capture output.
		ob_start();
		Holiday_Snow::holiday_snow_markup();
		$output = ob_get_clean();

		// Verify output format.
		$expected_output = '<div id="jetpack-holiday-snow" style="--jetpack-holiday-snow-speed: ' . $expected_speed . 's;" ></div>';
		$this->assertSame( $expected_output, $output, $description );
	}

	/**
	 * Test holiday_snow_markup output format.
	 */
	public function test_holiday_snow_markup_output_format() {
		// Initialize config.
		Holiday_Snow::init();

		// Set a valid speed.
		update_option( 'jetpack_holiday_snow_speed', 12 );

		// Capture output.
		ob_start();
		Holiday_Snow::holiday_snow_markup();
		$output = ob_get_clean();

		// Verify output contains expected elements.
		$this->assertStringContainsString( 'id="jetpack-holiday-snow"', $output, 'Output should contain the div with correct id' );
		$this->assertStringContainsString( '--jetpack-holiday-snow-speed:', $output, 'Output should contain the CSS variable' );
		$this->assertStringContainsString( '12s', $output, 'Output should contain the correct speed value' );
	}

	/**
	 * Data provider for test_is_snow_season_boolean_values.
	 *
	 * @return \Iterator
	 */
	public static function get_is_snow_season_boolean_scenarios(): \Iterator {
		// Filter override scenarios.
		yield 'Filter returns true' => array(
			'filter_return' => true,
			'expected'      => true,
		);

		yield 'Filter returns false' => array(
			'filter_return' => false,
			'expected'      => false,
		);

		// No filter scenarios - should return boolean based on natural behavior.
		yield 'No filter with Northern hemisphere timezone' => array(
			'filter_return' => null,
			'expected'      => null,
		);
	}

	/**
	 * Test that is_snow_season returns the correct boolean values, including filter overrides.
	 *
	 * @dataProvider get_is_snow_season_boolean_scenarios
	 * @param mixed     $filter_return The value the filter should return, or null for no filter.
	 * @param bool|null $expected The expected boolean result from is_snow_season, or null if we just verify it's a boolean.
	 */
	#[DataProvider( 'get_is_snow_season_boolean_scenarios' )]
	public function test_is_snow_season_boolean_values( $filter_return, ?bool $expected ) {
		// Add filter if specified.
		if ( $filter_return !== null ) {
			add_filter(
				'jetpack_is_holiday_snow_season',
				function () use ( $filter_return ) {
					return $filter_return;
				}
			);
		}

		$result = Holiday_Snow::is_snow_season();

		// We can't predict the actual boolean,
		// but we can verify it returns a boolean.
		$this->assertIsBool( $result, 'is_snow_season should always return a boolean' );

		// If we have an expected value, verify it matches.
		if ( $expected !== null ) {
			$this->assertSame( $expected, $result );
		}
	}
}

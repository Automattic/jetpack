<?php
/**
 * Compatibility tests.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Compatibility;
use Automattic\Jetpack\Waf\Waf_Initializer;
use Automattic\Jetpack\Waf\Waf_Rules_Manager;
use Automattic\Jetpack\Waf\Waf_Runner;

/**
 * Integration tests for the backwards-compatibility of the package.
 */
final class WafCompatibilityIntegrationTest extends WorDBless\BaseTestCase {

	/**
	 * Mock data for 'jetpack_protect_whitelist' option.
	 *
	 * @var array
	 */
	private static $brute_force_list_mocks;

	/**
	 * Mock data for 'jetpack_waf_ip_allow_list' option.
	 *
	 * @var array
	 */
	private static $waf_list_mocks;

	/**
	 * Test setup.
	 */
	public function set_up() {
		// Mock data.
		self::$waf_list_mocks         = array(
			'null'   => null,
			'empty'  => '',
			'single' => '1.1.1.1',
			'multi'  => "1.1.1.1,2.2.2.2\n3.3.3.3 4.4.4.4",
			'ranges' => '1.1.1.1,2.2.2.2-3.3.3.3,4.4.4.4',
		);
		self::$brute_force_list_mocks = array(
			'null'   => null,
			'empty'  => array(),
			'single' => array(
				(object) array(
					'range'      => false,
					'ip_address' => '1.1.1.1',
				),
			),
			'multi'  => array(
				(object) array(
					'range'      => false,
					'ip_address' => '1.1.1.1',
				),
				(object) array(
					'range'      => false,
					'ip_address' => '2.2.2.2',
				),
				(object) array(
					'range'      => false,
					'ip_address' => '3.3.3.3',
				),
			),
			'ranges' => array(
				(object) array(
					'range'      => true,
					'range_low'  => '1.1.1.1',
					'range_high' => '2.2.2.2',
				),
				(object) array(
					'range'      => false,
					'ip_address' => '3.3.3.3',
				),
				(object) array(
					'range'      => true,
					'range_low'  => '4.4.4.4',
					'range_high' => '5.5.5.5',
				),
			),
		);

		// Add the WAF module to the available modules.
		add_filter( 'jetpack_get_available_modules', array( $this, 'add_waf_to_available_modules' ), 10, 1 );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_waf_to_available_modules' ), 10, 1 );

		// Initialize the firewall.
		Waf_Initializer::init();
	}

	/**
	 * Add "waf" to the available Jetpack modules.
	 *
	 * @param array $modules The available modules.
	 * @return array The available modules, including "waf".
	 */
	public function add_waf_to_available_modules( $modules ) {
		if ( ! in_array( 'waf', $modules, true ) ) {
			$modules[] = 'waf';
		}
		return $modules;
	}

	/**
	 * Test that the IP allow list migration works as expected.
	 */
	public function testIpListMigration() {
		$update_count          = 0;
		$expected_update_count = 0;

		/**
		 * Generates a function that can be used with the 'wordbless_wpdb_query_results' filter.
		 *
		 * @param string        $waf_list_mock         The mock value for the WAF IP allow list.
		 * @param array<object> $brute_force_list_mock The mock value for the Brute Force Protection IP allow list.
		 * @return callable The function to be used with the 'wordbless_wpdb_query_results' filter.
		 */
		$query_filter_factory = function ( $waf_list_mock, $brute_force_list_mock ) use ( &$update_count ) {
			return function ( $result, $query ) use ( &$update_count, $waf_list_mock, $brute_force_list_mock ) {
				global $wpdb;

				// Mock the value of 'jetpack_waf_ip_allow_list' for Jetpack_Options::get_raw_option().
				if ( $query === "SELECT option_value FROM $wpdb->options WHERE option_name = 'jetpack_waf_ip_allow_list' LIMIT 1" ) {
					return array(
						(object) array(
							'option_value' => $waf_list_mock,
						),
					);
				}

				// Mock the value of 'jetpack_protect_whitelist' for Jetpack_Options::get_raw_option().
				if ( $query === "SELECT option_value FROM $wpdb->options WHERE option_name = 'jetpack_protect_whitelist' LIMIT 1" ) {
					return array(
						(object) array(
							'option_value' => $brute_force_list_mock,
						),
					);
				}

				// Test that the update query is run, and includes the correct option value.
				if ( preg_match( "/UPDATE wp_options SET option_value = '(.*)' WHERE option_name = 'jetpack_waf_ip_allow_list'/sim", $query ) === 1 ) {
					++$update_count;
					$expected_query = "UPDATE wp_options SET option_value = '" . Waf_Compatibility::merge_ip_allow_lists( $waf_list_mock, $brute_force_list_mock ) . "' WHERE option_name = 'jetpack_waf_ip_allow_list'";
					$this->assertEquals( $expected_query, $query );
				}

				return $result;
			};
		};

		/**
		 * Test each possible combination of WAF and Brute Force Protection IP allow list mock values.
		 */
		foreach ( self::$waf_list_mocks as $waf_list_mock_value ) {
			foreach ( self::$brute_force_list_mocks as $brute_force_list_mock_value ) {
				// If there is a value for the Brute Force Protection IP allow list, then we expect the update query to be run.
				if ( $brute_force_list_mock_value ) {
					++$expected_update_count;
				}

				// Mock the value of 'jetpack_waf_ip_allow_list' and 'jetpack_protect_whitelist' for Jetpack_Options::get_raw_option().
				$filter = $query_filter_factory( $waf_list_mock_value, $brute_force_list_mock_value );
				add_filter( 'wordbless_wpdb_query_results', $filter, 10, 2 );

				// Run the migration.
				Waf_Compatibility::migrate_brute_force_protection_ip_allow_list();

				// Clean up.
				remove_filter( 'wordbless_wpdb_query_results', $filter, 10, 2 );
			}
		}

		// Test that the update query was run the correct number of times.
		$this->assertSame( $expected_update_count, $update_count );
	}

	/**
	 * Test that the automatic rules option inherits from the module status when it is doesn't exist.
	 */
	public function testAutomaticRulesOptionInheritsFromModuleStatus() {
		// Enable the WAF module.
		Waf_Runner::enable();

		// Manually delete the automatic rules option to simulate a site that installed the WAF before the automatic rules option was introduced.
		delete_option( Waf_Rules_Manager::AUTOMATIC_RULES_ENABLED_OPTION_NAME );

		// Check that the automatic rules option is enabled by default.
		$this->assertTrue( Waf_Runner::is_enabled() );
	}
}

<?php
/**
 * Compatibility test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Compatibility;

/**
 * Compatibility test suite.
 */
class WafCompatibilityTest extends PHPUnit\Framework\TestCase {

	/**
	 * Test Waf_Compatibility::merge_ip_allow_lists().
	 */
	public function testMergeIPAllowLists() {
		$waf_allow_list         = "1.1.1.1,2.2.2.2\n3.3.3.3-4.4.4.4";
		$brute_force_allow_list = array(
			(object) array(
				'ip_address' => '5.5.5.5',
				'range'      => false,
			),
			(object) array(
				'range'      => true,
				'range_low'  => '6.6.6.6',
				'range_high' => '7.7.7.7',
			),
			(object) array(
				'ip_address' => '8.8.8.8',
			),
		);

		// Contains duplicate IP addresses from $waf_allow_list.
		$brute_force_allow_list_with_duplicates = array(
			(object) array(
				'ip_address' => '1.1.1.1',
				'range'      => false,
			),
			(object) array(
				'range'      => true,
				'range_low'  => '3.3.3.3',
				'range_high' => '4.4.4.4',
			),
			(object) array(
				'ip_address' => '8.8.8.8',
			),
		);

		$waf_empty_allow_list         = '';
		$brute_force_empty_allow_list = array();

		// Test merging both lists.
		$expected_result = "1.1.1.1,2.2.2.2\n3.3.3.3-4.4.4.4\n5.5.5.5\n6.6.6.6-7.7.7.7\n8.8.8.8";
		$merged_lists    = Waf_Compatibility::merge_ip_allow_lists( $waf_allow_list, $brute_force_allow_list );
		$this->assertEquals( $expected_result, $merged_lists );

		// Test empty WAF allow list.
		$expected_result = "5.5.5.5\n6.6.6.6-7.7.7.7\n8.8.8.8";
		$merged_lists    = Waf_Compatibility::merge_ip_allow_lists( $waf_empty_allow_list, $brute_force_allow_list );
		$this->assertEquals( $expected_result, $merged_lists );

		// Test empty Brute Force allow list.
		$expected_result = "1.1.1.1,2.2.2.2\n3.3.3.3-4.4.4.4";
		$merged_lists    = Waf_Compatibility::merge_ip_allow_lists( $waf_allow_list, $brute_force_empty_allow_list );
		$this->assertEquals( $expected_result, $merged_lists );

		// Test duplicate values are not removed.
		$expected_result = "1.1.1.1,2.2.2.2\n3.3.3.3-4.4.4.4\n1.1.1.1\n3.3.3.3-4.4.4.4\n8.8.8.8";
		$merged_lists    = Waf_Compatibility::merge_ip_allow_lists( $waf_allow_list, $brute_force_allow_list_with_duplicates );
		$this->assertEquals( $expected_result, $merged_lists );
	}
}

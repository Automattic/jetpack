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

		$expected_result = "1.1.1.1,2.2.2.2\n3.3.3.3-4.4.4.4\n5.5.5.5\n6.6.6.6-7.7.7.7\n8.8.8.8";

		$merged_lists = Waf_Compatibility::merge_ip_allow_lists( $waf_allow_list, $brute_force_allow_list );

		$this->assertEquals( $expected_result, $merged_lists );
	}

}

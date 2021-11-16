<?php
/**
 * Tests for the Automattic\Jetpack\Mobile package.
 *
 * @package automattic/jetpack-device-detection
 *
 * @phpcs:disable WordPress.Files.FileName
 */

use Automattic\Jetpack\Device_Detection;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Device_Detection class.
 */
class Test_Device_Detection extends TestCase {

	/**
	 * The is_mobile tests.
	 *
	 * @param string $ua                   User agent string.
	 * @param array  $expected_types       Expected device types to be detected for a user-agent.
	 * @param bool   $expected_ua_returned Expected value for UA returned by the method.
	 *
	 * @return void
	 *
	 * @dataProvider ua_provider
	 */
	public function test_is_mobile( $ua, array $expected_types, $expected_ua_returned ) {
		$_SERVER['HTTP_USER_AGENT'] = $ua;

		$device_info      = Device_Detection::get_info();
		$all_tested_types = array( 'is_phone', 'is_smartphone', 'is_handheld', 'is_tablet', 'is_desktop' );

		foreach ( $all_tested_types as $type ) {
			$is_type_match_expected = in_array( $type, $expected_types, true );

			// Test the info returned by `get_info`.
			$this->assertEquals( $is_type_match_expected, $device_info[ $type ] );

			// Make sure the appropriate type method exists on Device_Detection.
			$this->assertTrue( method_exists( 'Automattic\Jetpack\Device_Detection', $type ) );

			// Make sure the direct method (e.g. Device_Detection::is_desktop) returns the correct value.
			$this->assertEquals( $is_type_match_expected, call_user_func( array( 'Automattic\Jetpack\Device_Detection', $type ), $ua ) );
		}
		$this->assertEquals( $device_info['is_phone'] ? $expected_ua_returned : false, $device_info['is_phone_matched_ua'] );
	}

	/**
	 * Data provider for test_is_mobile.
	 *
	 * @return array
	 */
	public function ua_provider() {
		return array(

			// Nokia 6300, dumb phone.
			array(
				'Nokia6300/2.0 (05.00) Profile/MIDP-2.0 Configuration/CLDC-1.1',
				array(
					'is_phone',
					'is_handheld',
				),
				'nokia',
			),

			// Samsung Galaxy S8 smart phone.
			array(
				'Mozilla/5.0 (Linux; Android 9; SM-G950F Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36',
				array(
					'is_phone',
					'is_smartphone',
					'is_handheld',
				),
				'android',
			),

			// iPhone X smart phone.
			array(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1',
				array(
					'is_phone',
					'is_smartphone',
					'is_handheld',
				),
				'iphone',
			),

			// iPad 2 10.5 tablet.
			array(
				'Mozilla/5.0 (iPad; CPU OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15G77 [FBAN/FBIOS;FBDV/iPad7,3;FBMD/iPad;FBSN/iOS;FBSV/11.4.1;FBSS/2;FBCR/;FBID/tablet;FBLC/en_US;FBOP/5;FBRV/0]',
				array(
					'is_tablet',
					'is_handheld',
				),
				false,
			),

			// Kindle 3.
			array(
				'Mozilla/5.0 (X11; U; Linux armv7l like Android; en-us) AppleWebKit/531.2+ (KHTML, like Gecko) Version/5.0 Safari/533.2+ Kindle/3.0+',
				array(
					'is_phone',
					'is_smartphone',
					'is_tablet',
					'is_handheld',
				),
				'android',
			),

			// Huawei p20 smartphone.
			array(
				'Mozilla/5.0 (Linux; Android 8.1.0; CLT-L09 Build/HUAWEICLT-L09) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Mobile Safari/537.36',
				array(
					'is_phone',
					'is_smartphone',
					'is_handheld',
				),
				'android',
			),

			// Googlebot smartphone.
			array(
				'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z‡ Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
				array(
					'is_phone',
					'is_smartphone',
					'is_handheld',
				),
				'android',
			),

			// Googlebot desktop.
			array(
				'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
				array(
					'is_desktop',
				),
				false,
			),
		);
	}
}

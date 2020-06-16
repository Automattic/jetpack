<?php
/**
 * Tests for the Automattic\Jetpack\Mobile package.
 */

use PHPUnit\Framework\TestCase;
use Automattic\Jetpack\Mobile;

/**
 * Tests for the Mobile class.
 */
class Test_Mobile extends TestCase {

	/**
	 * The is_mobile tests.
	 *
	 * @param string $ua              User agent string.
	 * @param bool   $expected_dumb   Expected value for `dumb` mobile detection.
	 * @param bool   $expected_smart  Expected value for `smart` mobile detection.
	 * @param bool   $expected_mobile Expected value for `any` mobile detection.
	 *
	 * @return void
	 *
	 * @dataProvider ua_provider
	 */
	public function test_is_mobile( $ua, $expected_dumb, $expected_smart, $expected_mobile ) {
		$_SERVER['HTTP_USER_AGENT'] = $ua;

		$dumb_test   = Mobile::is_mobile( 'dumb', false );
		$smart_test  = Mobile::is_mobile( 'smart', false );
		$mobile_test = Mobile::is_mobile( 'any', false );

		$this->assertEquals( $dumb_test, $expected_dumb );
		$this->assertEquals( $smart_test, $expected_smart );
		$this->assertEquals( $mobile_test, $expected_mobile );
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
				true,
				false,
				true,
			),

			// Samsung Galaxy S8 smart phone.
			array(
				'Mozilla/5.0 (Linux; Android 9; SM-G950F Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36',
				false,
				true,
				true,
			),

			// iPhone X smart phone.
			array(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1',
				false,
				true,
				true,
			),

			// iPad 2 10.5 tablet.
			array(
				'Mozilla/5.0 (iPad; CPU OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15G77 [FBAN/FBIOS;FBDV/iPad7,3;FBMD/iPad;FBSN/iOS;FBSV/11.4.1;FBSS/2;FBCR/;FBID/tablet;FBLC/en_US;FBOP/5;FBRV/0]',
				false,
				false,
				false, // not considered a mobile device, this is intended.
			),

			// Kindle 3.
			array(
				'Mozilla/5.0 (X11; U; Linux armv7l like Android; en-us) AppleWebKit/531.2+ (KHTML, like Gecko) Version/5.0 Safari/533.2+ Kindle/3.0+',
				false,
				true,
				true,
			),

			// Huawei p20 smartphone.
			array(
				'Mozilla/5.0 (Linux; Android 8.1.0; CLT-L09 Build/HUAWEICLT-L09) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Mobile Safari/537.36',
				false,
				true,
				true,
			),

			// Googlebot smartphone.
			array(
				'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z‡ Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
				false,
				true,
				true,
			),

			// Googlebot desktop.
			array(
				'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
				false,
				false,
				false,
			),
		);
	}
}

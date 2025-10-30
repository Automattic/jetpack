<?php
/**
 * Tests for the User_Agent_Info class.
 *
 * @package automattic/jetpack-device-detection
 */

use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the User_Agent_Info class static methods.
 *
 * Tests both explicit user agent parameter passing and fallback to $_SERVER['HTTP_USER_AGENT'].
 */
class User_Agent_Info_Test extends TestCase {

	/**
	 * Test browser detection methods with both explicit UA and $_SERVER fallback.
	 *
	 * @param string $ua User agent string.
	 * @param string $method Method name to test.
	 * @param bool   $expected_result Expected result.
	 * @param bool   $use_server Whether to test $_SERVER fallback.
	 * @return void
	 *
	 * @dataProvider browser_detection_provider
	 */
	#[DataProvider( 'browser_detection_provider' )]
	public function test_browser_detection( string $ua, string $method, bool $expected_result, bool $use_server ) {
		if ( $use_server ) {
			$_SERVER['HTTP_USER_AGENT'] = $ua;
			$actual_result              = call_user_func( array( User_Agent_Info::class, $method ) );
		} else {
			$actual_result = call_user_func( array( User_Agent_Info::class, $method ), $ua );
		}

		$this->assertEquals( $expected_result, $actual_result );
	}

	/**
	 * Test platform detection methods with both explicit UA and $_SERVER fallback.
	 *
	 * @param string      $ua User agent string.
	 * @param string      $method Method name to test.
	 * @param bool        $expected_result Expected result.
	 * @param bool        $use_server Whether to test $_SERVER fallback.
	 * @param string|null $type Optional type parameter for methods like is_iphone_or_ipod and is_ipad.
	 * @return void
	 *
	 * @dataProvider platform_detection_provider
	 */
	#[DataProvider( 'platform_detection_provider' )]
	public function test_platform_detection( string $ua, string $method, bool $expected_result, bool $use_server, ?string $type = null ) {
		if ( $use_server ) {
			$_SERVER['HTTP_USER_AGENT'] = $ua;
			if ( $type !== null ) {
				$actual_result = call_user_func( array( User_Agent_Info::class, $method ), $type );
			} else {
				$actual_result = call_user_func( array( User_Agent_Info::class, $method ) );
			}
		} elseif ( $type !== null ) {
				$actual_result = call_user_func( array( User_Agent_Info::class, $method ), $type, $ua );
		} else {
			$actual_result = call_user_func( array( User_Agent_Info::class, $method ), $ua );
		}

		$this->assertEquals( $expected_result, $actual_result );
	}

	/**
	 * Data provider for browser detection tests.
	 *
	 * Returns test cases for each browser detection method, testing both with explicit UA parameter
	 * and with $_SERVER['HTTP_USER_AGENT'] fallback.
	 *
	 * @return array
	 */
	public static function browser_detection_provider() {
		$test_cases = array();

		// Samsung Internet tests
		$samsung_ua = 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/19.0 Chrome/102.0.5005.125 Mobile Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				// Test with explicit UA parameter
				array( $samsung_ua, 'is_samsung_browser', true, false ),
				// Test with $_SERVER fallback
				array( $samsung_ua, 'is_samsung_browser', true, true ),
			)
		);

		// UC Browser tests
		$uc_ua      = 'Mozilla/5.0 (Linux; U; Android 13; en-US; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 UCBrowser/13.4.0.1306 Mobile Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $uc_ua, 'is_uc_browser', true, false ),
				array( $uc_ua, 'is_uc_browser', true, true ),
			)
		);

		// Yandex Browser tests
		$yandex_ua  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 YaBrowser/23.1.1.138 Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $yandex_ua, 'is_yandex_browser', true, false ),
				array( $yandex_ua, 'is_yandex_browser', true, true ),
			)
		);

		// Vivaldi tests
		$vivaldi_ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Vivaldi/5.3.2679.68';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $vivaldi_ua, 'is_vivaldi_browser', true, false ),
				array( $vivaldi_ua, 'is_vivaldi_browser', true, true ),
			)
		);

		// MIUI Browser tests
		$miui_ua    = 'Mozilla/5.0 (Linux; U; Android 11; zh-CN; Redmi K30 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.116 MiuiBrowser/12.10.0-gn Mobile Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $miui_ua, 'is_miui_browser', true, false ),
				array( $miui_ua, 'is_miui_browser', true, true ),
			)
		);

		// Amazon Silk tests
		$silk_ua    = 'Mozilla/5.0 (Linux; Android 9; KFMAWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/96.3.7 like Chrome/96.0.4664.45 Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $silk_ua, 'is_silk_browser', true, false ),
				array( $silk_ua, 'is_silk_browser', true, true ),
			)
		);

		// Chrome tests
		$chrome_ua  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $chrome_ua, 'is_chrome_desktop', true, false ),
				array( $chrome_ua, 'is_chrome_desktop', true, true ),
			)
		);

		// Firefox tests
		$firefox_ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $firefox_ua, 'is_firefox_desktop', true, false ),
				array( $firefox_ua, 'is_firefox_desktop', true, true ),
			)
		);

		// Safari tests
		$safari_ua  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $safari_ua, 'is_safari_browser', true, false ),
				array( $safari_ua, 'is_safari_browser', true, true ),
			)
		);

		// Edge tests (modern Chromium-based)
		$edge_ua    = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $edge_ua, 'is_edge_browser', true, false ),
				array( $edge_ua, 'is_edge_browser', true, true ),
			)
		);

		// Opera tests
		$opera_ua   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/105.0.0.0';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $opera_ua, 'is_opera_desktop', true, false ),
				array( $opera_ua, 'is_opera_desktop', true, true ),
			)
		);

		// IE tests
		$ie_ua      = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $ie_ua, 'is_ie_browser', true, false ),
				array( $ie_ua, 'is_ie_browser', true, true ),
			)
		);

		// Negative tests - Chrome UA should not be detected as Samsung
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $chrome_ua, 'is_samsung_browser', false, false ),
				array( $chrome_ua, 'is_samsung_browser', false, true ),
			)
		);

		return $test_cases;
	}

	/**
	 * Data provider for platform detection tests.
	 *
	 * Returns test cases for each platform detection method, testing both with explicit UA parameter
	 * and with $_SERVER['HTTP_USER_AGENT'] fallback.
	 *
	 * @return array
	 */
	public static function platform_detection_provider() {
		$test_cases = array();

		// iPhone tests (uses is_iphone_or_ipod method)
		$iphone_ua  = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $iphone_ua, 'is_iphone_or_ipod', true, false, 'iphone-any' ),
				array( $iphone_ua, 'is_iphone_or_ipod', true, true, 'iphone-any' ),
			)
		);

		// iPad tests (requires specific user agent with Safari/Version)
		$ipad_ua    = 'Mozilla/5.0 (iPad; CPU OS 11_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15G77 Safari/604.1';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $ipad_ua, 'is_ipad', true, false, 'ipad-any' ),
				array( $ipad_ua, 'is_ipad', true, true, 'ipad-any' ),
			)
		);

		// Android tests
		$android_ua = 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $android_ua, 'is_android', true, false, null ),
				array( $android_ua, 'is_android', true, true, null ),
			)
		);

		// BlackBerry tests (uses is_blackbeberry with typo in method name)
		$bb_ua      = 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $bb_ua, 'is_blackbeberry', true, false, null ),
				array( $bb_ua, 'is_blackbeberry', true, true, null ),
			)
		);

		// Windows Phone 8 tests
		$wp8_ua     = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $wp8_ua, 'is_windows_phone_8', true, false, null ),
				array( $wp8_ua, 'is_windows_phone_8', true, true, null ),
			)
		);

		// Kindle Fire tests (needs specific Kindle Fire user agent)
		$kindle_ua  = 'Mozilla/5.0 (Linux; U; en-us; KFAPWI Build/JDQ39) AppleWebKit/535.19 (KHTML, like Gecko) Silk/3.13 Safari/535.19 Silk-Accelerated=true';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $kindle_ua, 'is_kindle_fire', true, false, null ),
				array( $kindle_ua, 'is_kindle_fire', true, true, null ),
			)
		);

		// Android tablet tests
		$tablet_ua  = 'Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-T820) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/9.2 Chrome/67.0.3396.87 Safari/537.36';
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $tablet_ua, 'is_android_tablet', true, false, null ),
				array( $tablet_ua, 'is_android_tablet', true, true, null ),
			)
		);

		// Negative tests - iPhone UA should not be detected as Android
		$test_cases = array_merge(
			$test_cases,
			array(
				array( $iphone_ua, 'is_android', false, false, null ),
				array( $iphone_ua, 'is_android', false, true, null ),
			)
		);

		return $test_cases;
	}

	/**
	 * Test get_browser_display_name() returns human-readable browser names.
	 *
	 * @param string $ua User agent string.
	 * @param string $expected_name Expected browser display name.
	 * @return void
	 *
	 * @dataProvider browser_display_name_provider
	 */
	#[DataProvider( 'browser_display_name_provider' )]
	public function test_get_browser_display_name( string $ua, string $expected_name ) {
		$ua_info = new User_Agent_Info( $ua );
		$this->assertEquals( $expected_name, $ua_info->get_browser_display_name() );
	}

	/**
	 * Data provider for browser display name tests.
	 *
	 * @return array
	 */
	public static function browser_display_name_provider() {
		return array(
			// Chrome Desktop
			array(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
				'Chrome',
			),
			// Firefox Desktop
			array(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
				'Firefox',
			),
			// Safari Desktop
			array(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
				'Safari',
			),
			// Edge
			array(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
				'Edge',
			),
			// Opera
			array(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.277',
				'Opera',
			),
			// Internet Explorer
			array(
				'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
				'Internet Explorer',
			),
			// Samsung Browser
			array(
				'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/19.0 Chrome/102.0.5005.125 Mobile Safari/537.36',
				'Samsung Browser',
			),
			// UC Browser
			array(
				'Mozilla/5.0 (Linux; U; Android 13; en-US; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 UCBrowser/13.4.0.1306 Mobile Safari/537.36',
				'UC Browser',
			),
			// Yandex Browser
			array(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 YaBrowser/21.5.0.582 Yowser/2.5 Safari/537.36',
				'Yandex Browser',
			),
			// Vivaldi
			array(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 Vivaldi/4.0.2312.38',
				'Vivaldi',
			),
			// MIUI Browser
			array(
				'Mozilla/5.0 (Linux; U; Android 11; zh-cn; Mi 10 Build/RKQ1.200826.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.116 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.10.0-gn',
				'MIUI Browser',
			),
			// Amazon Silk
			array(
				'Mozilla/5.0 (Linux; Android 9; KFMAWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/89.3.12 like Chrome/89.0.4389.116 Safari/537.36',
				'Amazon Silk',
			),
			// Unknown/Other browser (should return the display name from the map)
			array(
				'CustomBrowser/1.0',
				'Other',
			),
		);
	}

	/**
	 * Test that get_browser_display_name() returns the display name for unknown browsers.
	 *
	 * @return void
	 */
	public function test_get_browser_display_name_returns_constant_for_unknown() {
		$ua_info      = new User_Agent_Info( 'UnknownBrowser/1.0' );
		$browser      = $ua_info->get_browser();
		$display_name = $ua_info->get_browser_display_name();

		// Browser should be 'other' constant
		$this->assertEquals( 'other', $browser );
		// Display name should be 'Other' (capitalized)
		$this->assertEquals( 'Other', $display_name );
	}

	/**
	 * Test that get_browser_display_name() handles empty user agent.
	 *
	 * @return void
	 */
	public function test_get_browser_display_name_handles_empty_ua() {
		// Unset the server variable to ensure we're testing with truly empty UA
		$original_ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
		unset( $_SERVER['HTTP_USER_AGENT'] );

		$ua_info      = new User_Agent_Info( '' );
		$display_name = $ua_info->get_browser_display_name();

		// Should return 'Other' (capitalized) for empty UA
		$this->assertEquals( 'Other', $display_name );

		// Restore original UA
		if ( $original_ua !== null ) {
			$_SERVER['HTTP_USER_AGENT'] = $original_ua;
		}
	}
}

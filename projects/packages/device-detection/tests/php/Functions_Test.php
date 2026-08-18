<?php
/**
 * Tests for the package's namespaced function wrappers.
 *
 * @package automattic/jetpack-device-detection
 */

use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use function Automattic\Jetpack\Device_Detection\sanitize_text_field;

/**
 * Tests the sanitize_text_field() wrapper.
 *
 * WordPress is not loaded in this suite, so these exercise the fallback that runs when the
 * package is loaded before WordPress. The expectations below are the values WordPress core
 * produces for the same input, so that detection does not change with load order.
 */
class Functions_Test extends TestCase {

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		parent::tearDown();
		unset( $_SERVER['HTTP_USER_AGENT'] );
	}

	/**
	 * Tests the fallback used when WordPress is not loaded.
	 *
	 * @param string $value    Raw value.
	 * @param string $expected Expected sanitized value.
	 * @dataProvider sanitize_provider
	 */
	#[DataProvider( 'sanitize_provider' )]
	public function test_sanitize_text_field_fallback( $value, $expected ) {
		$this->assertFalse(
			function_exists( '\\sanitize_text_field' ),
			'These expectations describe the fallback, which only runs while WordPress is absent.'
		);
		$this->assertSame( $expected, sanitize_text_field( $value ) );
	}

	/**
	 * Data provider for 'test_sanitize_text_field_fallback'.
	 *
	 * @return array
	 */
	public static function sanitize_provider() {
		return array(
			'a plain user agent is untouched' => array( 'Mozilla/5.0 (X11; Linux x86_64)', 'Mozilla/5.0 (X11; Linux x86_64)' ),
			'a bot user agent is untouched'   => array( 'Googlebot/2.1 (+http://www.google.com/bot.html)', 'Googlebot/2.1 (+http://www.google.com/bot.html)' ),
			'script contents are removed'     => array( 'Mozilla/5.0 <script>alert(1)</script>', 'Mozilla/5.0' ),
			'style contents are removed'      => array( 'Mozilla/5.0 <style>a{}</style>', 'Mozilla/5.0' ),
			'other tags are stripped'         => array( '<b>curl</b>/8.4.0', 'curl/8.4.0' ),
			'newlines become a space'         => array( "Mozilla/5.0\r\nAcceptLanguage", 'Mozilla/5.0 AcceptLanguage' ),
			'tabs become a space'             => array( "Mozilla/5.0\tSafari", 'Mozilla/5.0 Safari' ),
			'runs of spaces collapse'         => array( 'Mozilla/5.0    Safari', 'Mozilla/5.0 Safari' ),
			'percent encoding is removed'     => array( 'Bot/1.0 (+http://example.com/bot%20info)', 'Bot/1.0 (+http://example.com/botinfo)' ),
			'space left behind collapses'     => array( 'Bot/1.0 %20 Crawler', 'Bot/1.0 Crawler' ),
			'surrounding space is trimmed'    => array( '  Mozilla/5.0  ', 'Mozilla/5.0' ),
			'an empty string stays empty'     => array( '', '' ),
		);
	}

	/**
	 * Tests that a user agent read from the server is sanitized before it is stored.
	 */
	public function test_user_agent_from_server_is_sanitized() {
		$_SERVER['HTTP_USER_AGENT'] = "Mozilla/5.0 <script>alert(1)</script>\niPhone";

		$info = new User_Agent_Info();

		$this->assertStringNotContainsString( '<', $info->useragent );
		$this->assertStringNotContainsString( "\n", $info->useragent );
		$this->assertSame( 'Mozilla/5.0 iPhone', $info->useragent );
	}

	/**
	 * Tests that sanitizing the user agent leaves a real one intact, so detection still works.
	 *
	 * @dataProvider detection_provider
	 */
	#[DataProvider( 'detection_provider' )]
	public function test_sanitizing_does_not_break_detection( $ua, $method ) {
		$_SERVER['HTTP_USER_AGENT'] = $ua;

		$this->assertTrue( call_user_func( array( User_Agent_Info::class, $method ) ) );
	}

	/**
	 * Data provider for 'test_sanitizing_does_not_break_detection'.
	 *
	 * @return array
	 */
	public static function detection_provider() {
		return array(
			'iPhone' => array( 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', 'is_iphone_or_ipod' ),
			'bot'    => array( 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'is_bot' ),
		);
	}
}

<?php
/**
 * Tests for the PayPal_Payment_Buttons class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Class Paypal_Payment_Buttons_Test
 *
 * @coversDefaultClass Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons
 */
#[CoversClass( PayPal_Payment_Buttons::class )]
class Paypal_Payment_Buttons_Test extends TestCase {

	/**
	 * Test that valid PayPal URLs pass through unchanged.
	 *
	 * @dataProvider valid_paypal_urls_provider
	 *
	 * @param string $url The URL to test.
	 */
	#[DataProvider( 'valid_paypal_urls_provider' )]
	public function test_valid_paypal_urls_pass_through( $url ) {
		$result = PayPal_Payment_Buttons::sanitize_paypal_script_url( $url );

		$this->assertNotFalse( $result, "URL should not return false: $url" );

		// Parse both URLs to compare hosts
		$original_parsed = wp_parse_url( $url );
		$result_parsed   = wp_parse_url( $result );

		$this->assertEquals( $original_parsed['host'], $result_parsed['host'], "Host should remain unchanged for valid PayPal URL: $url" );
	}

	/**
	 * Data provider for valid PayPal URLs.
	 *
	 * @return array
	 */
	public static function valid_paypal_urls_provider() {
		return array(
			'paypal.com'                    => array( 'https://www.paypal.com/sdk/js' ),
			'paypal.com subdomain'          => array( 'https://www.paypal.com/sdk/js?client-id=test' ),
			'sandbox.paypal.com'            => array( 'https://www.sandbox.paypal.com/sdk/js' ),
			'sandbox.paypal.com with query' => array( 'https://www.sandbox.paypal.com/sdk/js?client-id=test&currency=USD' ),
			'www.paypal.com'                => array( 'https://www.paypal.com/webapps/xoplatform' ),
			'www.sandbox.paypal.com'        => array( 'https://www.sandbox.paypal.com/webapps/xoplatform' ),
		);
	}

	/**
	 * Test that invalid URLs have their hosts replaced with www.paypal.com.
	 *
	 * @dataProvider invalid_urls_provider
	 *
	 * @param string $url                The URL to test.
	 * @param bool   $should_be_replaced Whether the URL should be sanitized or return false.
	 */
	#[DataProvider( 'invalid_urls_provider' )]
	public function test_invalid_urls_are_sanitized( $url, $should_be_replaced ) {
		$result = PayPal_Payment_Buttons::sanitize_paypal_script_url( $url );

		if ( ! $should_be_replaced ) {
			$this->assertFalse( $result, "URL should return false: $url" );
		} else {
			$this->assertNotFalse( $result, "URL should be sanitized: $url" );

			$result_parsed = wp_parse_url( $result );
			$this->assertEquals( 'www.paypal.com', $result_parsed['host'], "Host should be replaced with www.paypal.com for: $url" );
			$this->assertEquals( 'https', $result_parsed['scheme'], "Scheme should be https for: $url" );
		}
	}

	/**
	 * Data provider for invalid URLs.
	 *
	 * @return array Array of [url, should_be_replaced].
	 */
	public static function invalid_urls_provider() {
		return array(
			'empty string'              => array( '', false ),
			'attacker domain'           => array( 'https://attacker.example/x.js', true ),
			'attacker with paypal name' => array( 'https://paypal.com.evil.com/script.js', true ),
			'subdomain injection'       => array( 'https://evilpaypal.com/script.js', true ),
			'javascript protocol'       => array( 'javascript:alert(1)', false ),
			'data protocol'             => array( 'data:text/html,<script>alert(1)</script>', false ),
			'no host'                   => array( '/script.js', false ),
			'malformed url'             => array( 'not-a-url', false ),
			'paypal typo domain'        => array( 'https://paypai.com/script.js', true ),
			'different TLD'             => array( 'https://paypal.co/script.js', true ),
		);
	}

	/**
	 * Test that paths are preserved when sanitizing URLs.
	 */
	public function test_paths_are_preserved() {
		// Valid PayPal URL with path
		$valid_url = 'https://www.paypal.com/sdk/js/some/deep/path.js';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( '/sdk/js/some/deep/path.js', $result_parsed['path'] );

		// Invalid URL with path - should preserve path but replace host
		$invalid_url = 'https://evil.com/malicious/script.js';
		$result      = PayPal_Payment_Buttons::sanitize_paypal_script_url( $invalid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'] );
		$this->assertEquals( '/malicious/script.js', $result_parsed['path'] );
	}

	/**
	 * Test that query parameters are preserved when sanitizing URLs.
	 */
	public function test_query_parameters_are_preserved() {
		// Valid PayPal URL with query params
		$valid_url = 'https://www.paypal.com/sdk/js?client-id=test&currency=USD&locale=en_US';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'client-id=test&currency=USD&locale=en_US', $result_parsed['query'] );

		// Invalid URL with query params - should preserve query but replace host
		$invalid_url = 'https://evil.com/script.js?param1=value1&param2=value2';
		$result      = PayPal_Payment_Buttons::sanitize_paypal_script_url( $invalid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'] );
		$this->assertEquals( 'param1=value1&param2=value2', $result_parsed['query'] );
	}

	/**
	 * Test that fragments are preserved when sanitizing URLs.
	 */
	public function test_fragments_are_preserved() {
		// Valid PayPal URL with fragment
		$valid_url = 'https://www.paypal.com/sdk/js#section';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'section', $result_parsed['fragment'] );

		// Invalid URL with fragment - should preserve fragment but replace host
		$invalid_url = 'https://evil.com/script.js#anchor';
		$result      = PayPal_Payment_Buttons::sanitize_paypal_script_url( $invalid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'] );
		$this->assertEquals( 'anchor', $result_parsed['fragment'] );
	}

	/**
	 * Test that all URL components work together.
	 */
	public function test_all_url_components_together() {
		// Valid PayPal URL with all components
		$valid_url = 'https://www.paypal.com:443/sdk/js?client-id=test&currency=USD#init';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'] );
		$this->assertEquals( 'https', $result_parsed['scheme'] );
		$this->assertEquals( '/sdk/js', $result_parsed['path'] );
		$this->assertEquals( 'client-id=test&currency=USD', $result_parsed['query'] );
		$this->assertEquals( 'init', $result_parsed['fragment'] );

		// Invalid URL with all components - should preserve everything except host and scheme
		$invalid_url = 'http://evil.com:8080/malicious/path?bad=params#fragment';
		$result      = PayPal_Payment_Buttons::sanitize_paypal_script_url( $invalid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'], 'Host should be replaced' );
		$this->assertEquals( 'https', $result_parsed['scheme'], 'Scheme should be forced to https' );
		$this->assertEquals( '/malicious/path', $result_parsed['path'], 'Path should be preserved' );
		$this->assertEquals( 'bad=params', $result_parsed['query'], 'Query should be preserved' );
		$this->assertEquals( 'fragment', $result_parsed['fragment'], 'Fragment should be preserved' );
		$this->assertSame( '8080', $result_parsed['port'], 'Port should be preserved' );
	}

	/**
	 * Test that HTTP scheme is upgraded to HTTPS.
	 */
	public function test_http_is_upgraded_to_https() {
		// Valid PayPal URL with http should be upgraded to https
		$http_url = 'http://www.paypal.com/sdk/js';
		$result   = PayPal_Payment_Buttons::sanitize_paypal_script_url( $http_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'https', $result_parsed['scheme'], 'HTTP should be upgraded to HTTPS' );

		// Invalid URL with http should also get https
		$invalid_http = 'http://evil.com/script.js';
		$result       = PayPal_Payment_Buttons::sanitize_paypal_script_url( $invalid_http );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'https', $result_parsed['scheme'], 'HTTP should be upgraded to HTTPS even for invalid hosts' );
	}

	/**
	 * Test that the XSS attack from the security report is mitigated.
	 */
	public function test_xss_attack_is_mitigated() {
		$malicious_url = 'https://attacker.example/malicious.js';
		$result        = PayPal_Payment_Buttons::sanitize_paypal_script_url( $malicious_url );

		$this->assertNotFalse( $result );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'], 'Malicious host should be replaced with www.paypal.com' );
		$this->assertEquals( 'https', $result_parsed['scheme'], 'Scheme should be https' );

		// The path from the malicious URL should be preserved
		$this->assertEquals( '/malicious.js', $result_parsed['path'] );
	}
}

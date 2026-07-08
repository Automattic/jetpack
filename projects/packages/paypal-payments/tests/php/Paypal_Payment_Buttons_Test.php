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
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();
		// Clean up any registered scripts.
		global $wp_scripts;
		$wp_scripts = null;
	}

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
			'paypal.com'                              => array( 'https://www.paypal.com/sdk/js' ),
			'paypal.com subdomain'                    => array( 'https://www.paypal.com/sdk/js?client-id=test' ),
			'paypal.com subdomain with escaped query' => array( 'https://www.paypal.com/sdk/js?client-id=test&amp;currency=USD' ),
			'sandbox.paypal.com'                      => array( 'https://www.sandbox.paypal.com/sdk/js' ),
			'sandbox.paypal.com with query'           => array( 'https://www.sandbox.paypal.com/sdk/js?client-id=test&currency=USD' ),
			'www.paypal.com'                          => array( 'https://www.paypal.com/webapps/xoplatform' ),
			'www.sandbox.paypal.com'                  => array( 'https://www.sandbox.paypal.com/webapps/xoplatform' ),
		);
	}

	/**
	 * Test that invalid URLs are rejected and return false.
	 *
	 * @dataProvider invalid_urls_provider
	 *
	 * @param string $url The URL to test.
	 */
	#[DataProvider( 'invalid_urls_provider' )]
	public function test_invalid_urls_are_rejected( $url ) {
		$result = PayPal_Payment_Buttons::sanitize_paypal_script_url( $url );
		$this->assertFalse( $result, "URL should return false: $url" );
	}

	/**
	 * Data provider for invalid URLs.
	 *
	 * @return array
	 */
	public static function invalid_urls_provider() {
		return array(
			'empty string'              => array( '' ),
			'attacker domain'           => array( 'https://attacker.example/x.js' ),
			'attacker with paypal name' => array( 'https://paypal.com.evil.com/script.js' ),
			'subdomain injection'       => array( 'https://evilpaypal.com/script.js' ),
			'javascript protocol'       => array( 'javascript:alert(1)' ),
			'data protocol'             => array( 'data:text/html,<script>alert(1)</script>' ),
			'no host'                   => array( '/script.js' ),
			'malformed url'             => array( 'not-a-url' ),
			'paypal typo domain'        => array( 'https://paypai.com/script.js' ),
			'different TLD'             => array( 'https://paypal.co/script.js' ),
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
	}

	/**
	 * Test that query parameters are preserved when sanitizing URLs.
	 */
	public function test_query_parameters_are_preserved() {
		// Valid PayPal URL with query params
		$valid_url = 'https://www.paypal.com/sdk/js?client-id=test&currency=USD&locale=en_US&amp;foo=bar';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'client-id=test&currency=USD&locale=en_US&foo=bar', $result_parsed['query'] );
	}

	/**
	 * Test that fragments are stripped when sanitizing URLs.
	 * PayPal SDK URLs don't use fragments, so they are not preserved.
	 */
	public function test_fragments_are_stripped() {
		// Valid PayPal URL with fragment
		$valid_url = 'https://www.paypal.com/sdk/js#section';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertArrayNotHasKey( 'fragment', $result_parsed );
	}

	/**
	 * Test that all URL components work together.
	 */
	public function test_all_url_components_together() {
		// Valid PayPal URL with all components (fragment and port are stripped)
		$valid_url = 'https://www.paypal.com:443/sdk/js?client-id=test&currency=USD&amp;foo=bar#init';
		$result    = PayPal_Payment_Buttons::sanitize_paypal_script_url( $valid_url );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'] );
		$this->assertEquals( 'https', $result_parsed['scheme'] );
		$this->assertEquals( '/sdk/js', $result_parsed['path'] );
		$this->assertEquals( 'client-id=test&currency=USD&foo=bar', $result_parsed['query'] );
		$this->assertArrayNotHasKey( 'fragment', $result_parsed, 'Fragment should be stripped' );
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
	}

	/**
	 * Test that the XSS attack from the security report is mitigated.
	 */
	public function test_xss_attack_is_mitigated() {
		$malicious_url = 'https://attacker.example/malicious.js';
		$result        = PayPal_Payment_Buttons::sanitize_paypal_script_url( $malicious_url );

		$this->assertFalse( $result, 'Malicious URL should be rejected' );
	}

	/**
	 * Test that trailing dots in hostnames are normalized.
	 * FQDNs can technically end with a dot (DNS root), so www.paypal.com. should be treated as www.paypal.com
	 */
	public function test_trailing_dot_is_normalized() {
		// Test with trailing dot
		$url_with_dot = 'https://www.paypal.com./sdk/js';
		$result       = PayPal_Payment_Buttons::sanitize_paypal_script_url( $url_with_dot );

		$this->assertNotFalse( $result, 'URL with trailing dot should be accepted' );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'www.paypal.com', $result_parsed['host'], 'Trailing dot should be stripped' );

		// Test sandbox with trailing dot
		$sandbox_with_dot = 'https://sandbox.paypal.com./sdk/js';
		$result           = PayPal_Payment_Buttons::sanitize_paypal_script_url( $sandbox_with_dot );

		$this->assertNotFalse( $result, 'Sandbox URL with trailing dot should be accepted' );

		$result_parsed = wp_parse_url( $result );
		$this->assertEquals( 'sandbox.paypal.com', $result_parsed['host'], 'Trailing dot should be stripped from sandbox' );
	}

	/**
	 * Test that render_block uses CSS selector with # prefix for stacked buttons.
	 *
	 * This test ensures that the render() call uses a proper CSS ID selector (with #)
	 * rather than just the container ID. The PayPal SDK expects a CSS selector.
	 *
	 * @see https://github.com/Automattic/jetpack/pull/46259
	 */
	public function test_render_block_uses_css_selector_with_hash_prefix() {
		$attributes = array(
			'buttonType'     => 'stacked',
			'scriptSrc'      => 'https://www.paypal.com/sdk/js?client-id=test',
			'hostedButtonId' => 'TESTBUTTONID123',
		);

		// Call render_block
		$result = PayPal_Payment_Buttons::render_block( $attributes, '' );

		// Verify the container div is created
		$this->assertStringContainsString(
			'id="paypal-container-TESTBUTTONID123"',
			$result,
			'Container div should have the correct ID'
		);

		// Get the inline script that was added
		global $wp_scripts;
		$inline_script = $wp_scripts->get_data( 'paypal-payment-buttons-block-head', 'after' );

		$this->assertNotEmpty( $inline_script, 'Inline script should be registered' );

		// The inline script is an array, join it to search
		$script_content = implode( '', $inline_script );

		// Verify the render call uses CSS selector with # prefix
		$this->assertStringContainsString(
			'.render("#paypal-container-TESTBUTTONID123")',
			$script_content,
			'The render() call must use a CSS ID selector with # prefix'
		);

		// Verify it does NOT use the container ID without #
		$this->assertStringNotContainsString(
			'.render("paypal-container-TESTBUTTONID123")',
			$script_content,
			'The render() call must NOT use container ID without # prefix'
		);
	}
}

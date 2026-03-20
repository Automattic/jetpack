<?php
/**
 * Tests for Pixel_Builder SOCKS proxy detection.
 *
 * Uses plain TestCase (not WorDBless) to allow @runInSeparateProcess,
 * which is needed to define the WP_PROXY_HOST constant per test.
 *
 * @package automattic/woocommerce-analytics
 */

namespace Automattic\Woocommerce_Analytics;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Pixel_Builder SOCKS proxy detection.
 */
class Pixel_Builder_Socks_Proxy_Test extends TestCase {

	/**
	 * Helper to invoke the private is_socks_proxy_configured method.
	 *
	 * @return bool
	 */
	private static function invoke_is_socks_proxy_configured() {
		$reflection = new \ReflectionClass( Pixel_Builder::class );
		$method     = $reflection->getMethod( 'is_socks_proxy_configured' );
		$method->setAccessible( true );

		return $method->invoke( null );
	}

	/**
	 * Test is_socks_proxy_configured returns false when WP_PROXY_HOST is not defined.
	 */
	public function test_returns_false_when_proxy_not_defined(): void {
		if ( defined( 'WP_PROXY_HOST' ) ) {
			$this->markTestSkipped( 'WP_PROXY_HOST is already defined in the environment.' );
		}

		$this->assertFalse( self::invoke_is_socks_proxy_configured() );
	}

	/**
	 * Test is_socks_proxy_configured returns true for socks5 proxy.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_returns_true_for_socks5_proxy(): void {
		if ( ! defined( 'WP_PROXY_HOST' ) ) {
			define( 'WP_PROXY_HOST', 'socks5://127.0.0.1' );
		}

		$this->assertTrue( self::invoke_is_socks_proxy_configured() );
	}

	/**
	 * Test is_socks_proxy_configured returns true for socks4 proxy.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_returns_true_for_socks4_proxy(): void {
		if ( ! defined( 'WP_PROXY_HOST' ) ) {
			define( 'WP_PROXY_HOST', 'socks4://127.0.0.1' );
		}

		$this->assertTrue( self::invoke_is_socks_proxy_configured() );
	}

	/**
	 * Test is_socks_proxy_configured returns false for HTTP proxy.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_returns_false_for_http_proxy(): void {
		if ( ! defined( 'WP_PROXY_HOST' ) ) {
			define( 'WP_PROXY_HOST', 'proxy.example.com' );
		}

		$this->assertFalse( self::invoke_is_socks_proxy_configured() );
	}
}

<?php
/**
 * Tests for Premium Analytics Jetpack Connection configuration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Plugin;
use Automattic\Jetpack\Connection\Plugin_Storage;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Connection_Configuration
 */
#[CoversClass( Connection_Configuration::class )]
class Connection_Configuration_Test extends TestCase {

	/**
	 * Premium Analytics owns the connection even when WooCommerce is not active.
	 */
	public function test_registers_connection_consumer_without_woocommerce() {
		$this->assertFalse( class_exists( 'WooCommerce' ) );
		$this->assertFalse( function_exists( 'WC' ) );

		Connection_Configuration::configure();
		( new Plugin( 'jetpack' ) )->add( 'Jetpack' );
		Plugin_Storage::configure();

		$plugins = (array) Plugin_Storage::get_all();
		$this->assertArrayHasKey( 'jetpack-premium-analytics', $plugins );
		$this->assertFalse( ( new Plugin( 'jetpack' ) )->is_only() );
	}
}

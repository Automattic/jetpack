<?php
/**
 * Tests for the Sync Configuration class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Plugin_Storage;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Sync\Configuration
 */
#[CoversClass( Configuration::class )]
class Configuration_Test extends TestCase {

	/**
	 * Invoke a private method on a Configuration instance.
	 *
	 * @param string $method Method name.
	 * @return mixed
	 */
	private function call_private( string $method ) {
		$ref = new ReflectionMethod( Configuration::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		return $ref->invoke( new Configuration() );
	}

	/**
	 * The connection config must use the 'jetpack-premium-analytics' slug the WPCom gate matches.
	 */
	public function test_connection_config_uses_expected_slug() {
		$config = $this->call_private( 'get_jetpack_connection_config' );

		$this->assertSame( 'jetpack-premium-analytics', $config['slug'] );
		$this->assertNotEmpty( $config['name'] );
	}

	/**
	 * JETPACK_PREMIUM_ANALYTICS__VERSION must be whitelisted so syncing it triggers WPCom provisioning.
	 */
	public function test_sync_config_whitelists_premium_analytics_version() {
		$config = $this->call_private( 'get_jetpack_sync_config' );

		$this->assertContains( 'JETPACK_PREMIUM_ANALYTICS__VERSION', $config['jetpack_sync_constants_whitelist'] );
		// WC_ANALYTICS_VERSION is the standalone plugin's constant; PA must not whitelist it.
		$this->assertNotContains( 'WC_ANALYTICS_VERSION', $config['jetpack_sync_constants_whitelist'] );
	}

	/**
	 * Ensuring the connection feature with the PA config lands the slug in the connection
	 * registry (the jetpack_connection_active_plugins option WPCom's provisioning gate reads).
	 * This is the exact path configure_sync() drives when WooCommerce is active.
	 */
	public function test_connection_config_registers_slug_in_plugin_storage() {
		( new Config() )->ensure( 'connection', $this->call_private( 'get_jetpack_connection_config' ) );

		Plugin_Storage::configure();
		$this->assertArrayHasKey( 'jetpack-premium-analytics', (array) Plugin_Storage::get_all() );
	}
}

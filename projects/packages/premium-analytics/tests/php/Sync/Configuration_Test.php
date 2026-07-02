<?php
/**
 * Tests for the Sync Configuration class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Connection\Plugin_Storage;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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
		$ref->setAccessible( true );
		return $ref->invoke( new Configuration() );
	}

	/**
	 * The connection config must use the literal 'premium-analytics' slug the WPCom gate matches.
	 */
	public function test_connection_config_uses_literal_slug() {
		$config = $this->call_private( 'get_jetpack_connection_config' );

		$this->assertSame( 'premium-analytics', $config['slug'] );
		$this->assertNotEmpty( $config['name'] );
	}

	/**
	 * PREMIUM_ANALYTICS_VERSION must be whitelisted so syncing it triggers WPCom provisioning.
	 */
	public function test_sync_config_whitelists_premium_analytics_version() {
		$config = $this->call_private( 'get_jetpack_sync_config' );

		$this->assertContains( 'PREMIUM_ANALYTICS_VERSION', $config['jetpack_sync_constants_whitelist'] );
		$this->assertContains( 'WC_ANALYTICS_VERSION', $config['jetpack_sync_constants_whitelist'] );
	}

	/**
	 * With WooCommerce active, configure_sync registers the sync filters and the connected plugin.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_configure_sync_registers_filters_and_connection() {
		// Make is_woocommerce_active() return true without loading WooCommerce.
		require_once __DIR__ . '/../fixtures/wc-stub.php';

		( new Configuration() )->configure_sync();

		$this->assertNotFalse( has_filter( 'jetpack_sync_modules' ) );
		$this->assertNotFalse( has_filter( 'jetpack_sync_post_meta_whitelist' ) );

		// The connected plugin slug must land in the connection registry: the WPCom provisioning gate.
		Plugin_Storage::configure();
		$this->assertArrayHasKey( 'premium-analytics', (array) Plugin_Storage::get_all() );
	}
}

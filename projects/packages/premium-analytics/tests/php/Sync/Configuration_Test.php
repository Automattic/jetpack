<?php
/**
 * Tests for the Sync Configuration class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

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
	 * WooCommerce-specific Sync hooks remain disabled without WooCommerce.
	 */
	public function test_configure_sync_without_woocommerce_is_a_no_op() {
		$this->assertFalse( class_exists( 'WooCommerce' ) );
		$this->assertFalse( function_exists( 'WC' ) );

		$configuration = new Configuration();
		$configuration->configure_sync();

		$this->assertFalse( has_filter( 'jetpack_sync_modules', array( $configuration, 'add_woocommerce_analytics_module' ) ) );
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
}

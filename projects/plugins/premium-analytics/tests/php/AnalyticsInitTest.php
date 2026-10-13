<?php
/**
 * Tests for Analytics::init() configuration.
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

use Automattic\Jetpack\PremiumAnalytics\Analytics;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Analytics::init() configuration.
 */
class AnalyticsInitTest extends TestCase {

	/**
	 * Test that the Analytics class exists and is loadable.
	 */
	public function test_analytics_class_exists() {
		$this->assertTrue( class_exists( Analytics::class ) );
	}

	/**
	 * Cookie Consent resolves translated defaults, so its initialization must wait for init.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_cookie_consent_initialization_is_deferred_until_init() {
		if ( ! defined( 'ABSPATH' ) ) {
			define( 'ABSPATH', __DIR__ );
		}

		$GLOBALS['jpa_test_analytics_init_calls']        = 0;
		$GLOBALS['jpa_test_cookie_consent_init_configs'] = array();

		require_once __DIR__ . '/fixtures/class-analytics.php';
		require_once __DIR__ . '/fixtures/class-cookie-consent.php';
		require_once __DIR__ . '/fixtures/functions-wordpress.php';
		require_once __DIR__ . '/../../src/class-jetpack-premium-analytics.php';

		new Jetpack_Premium_Analytics();

		$this->assertSame( 1, $GLOBALS['jpa_test_analytics_init_calls'] );
		$this->assertSame( array(), $GLOBALS['jpa_test_cookie_consent_init_configs'] );
		$this->assertSame(
			array( Jetpack_Premium_Analytics::class, 'init_cookie_consent' ),
			$GLOBALS['jpa_test_actions']['init'][0]['callback'] ?? null
		);
		$this->assertSame( 0, $GLOBALS['jpa_test_actions']['init'][0]['priority'] ?? null );

		call_user_func( $GLOBALS['jpa_test_actions']['init'][0]['callback'] );

		$this->assertSame( array( array( 'enabled' => false ) ), $GLOBALS['jpa_test_cookie_consent_init_configs'] );
	}
}

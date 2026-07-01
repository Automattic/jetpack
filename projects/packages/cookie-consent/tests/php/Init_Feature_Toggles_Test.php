<?php
/**
 * Tests that feature toggles gate init() hook registration.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionProperty;

#[CoversClass( Cookie_Consent::class )]
class Init_Feature_Toggles_Test extends TestCase {

	public function tearDown(): void {
		$this->reset_init();
		parent::tearDown();
	}

	private function reset_init() {
		Cookie_Consent::deactivate();
		$prop = new ReflectionProperty( Cookie_Consent::class, 'config' );
		$prop->setAccessible( true );
		$prop->setValue( null, null );
	}

	public function test_enabled_false_registers_nothing() {
		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ) ) );
	}

	public function test_defaults_register_banner_and_ccpa() {
		Cookie_Consent::init();

		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertNotFalse( has_action( 'init', array( Cookie_Consent::class, 'maybe_create_ccpa_page' ) ) );
	}
}

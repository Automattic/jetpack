<?php
/**
 * Tests that enqueue_assets() gates its internal emissions on features.*.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionProperty;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 */
#[CoversClass( Cookie_Consent::class )]
class Enqueue_Assets_Test extends TestCase {

	public function setUp(): void {
		parent::setUp();
		$this->reset_registries();
	}

	public function tearDown(): void {
		$this->reset_init();
		$this->reset_registries();
		parent::tearDown();
	}

	/**
	 * Reset the global script/style/script-module registries between tests, since
	 * WorDBless only clears options/posts/users — enqueue state persists otherwise.
	 */
	private function reset_registries() {
		global $wp_scripts, $wp_styles, $wp_script_modules, $wp_interactivity;
		$wp_scripts        = null;
		$wp_styles         = null;
		$wp_script_modules = null;
		$wp_interactivity  = null;
	}

	private function reset_init() {
		Cookie_Consent::deactivate();
		$prop = new ReflectionProperty( Cookie_Consent::class, 'config' );
		$prop->setAccessible( true );
		$prop->setValue( null, null );
	}

	private function init_and_enqueue( array $config ) {
		Cookie_Consent::init( $config );
		// enqueue_assets() prints the window.jetpackCookieConsentConfig inline
		// script tag directly (wp_print_inline_script_tag echoes rather than
		// returning); swallow it so PHPUnit's failOnWarning doesn't flag the
		// unrelated output as a risky test.
		ob_start();
		Cookie_Consent::enqueue_assets();
		ob_end_clean();
	}

	public function test_is_admin_is_false_in_harness() {
		// enqueue_assets() early-returns under is_admin(); confirm the harness runs
		// as frontend so the rest of these assertions are meaningful.
		$this->assertFalse( is_admin() );
	}

	public function test_tracks_on_enqueues_tracks_script() {
		$this->init_and_enqueue( array( 'features' => array( 'tracks' => true ) ) );

		$this->assertTrue( wp_script_is( 'jetpack-cookie-consent-tracks', 'enqueued' ) );
	}

	public function test_tracks_off_does_not_enqueue_tracks_script() {
		$this->init_and_enqueue( array( 'features' => array( 'tracks' => false ) ) );

		$this->assertFalse( wp_script_is( 'jetpack-cookie-consent-tracks', 'enqueued' ) );
	}

	public function test_banner_off_skips_interactivity_module_and_config() {
		$this->init_and_enqueue( array( 'features' => array( 'banner' => false ) ) );

		$queue = wp_script_modules()->get_queue();
		$this->assertNotContains( '@automattic/jetpack-cookie-consent', $queue );

		$config = wp_interactivity_config( 'jetpack/cookie-consent' );
		$this->assertArrayNotHasKey( 'geo', $config );
		$this->assertArrayNotHasKey( 'geoEnabled', $config );
	}

	public function test_banner_on_enqueues_interactivity_module_and_config() {
		$this->init_and_enqueue( array( 'features' => array( 'banner' => true ) ) );

		$queue = wp_script_modules()->get_queue();
		$this->assertContains( '@automattic/jetpack-cookie-consent', $queue );

		$this->assertTrue( wp_style_is( 'jetpack-cookie-consent', 'enqueued' ) );

		$config = wp_interactivity_config( 'jetpack/cookie-consent' );
		$this->assertArrayHasKey( 'geo', $config );
		$this->assertArrayHasKey( 'geoEnabled', $config );
	}

	public function test_geo_on_emits_geo_enabled_true_and_full_geo() {
		$this->init_and_enqueue(
			array(
				'features' => array(
					'banner' => true,
					'geo'    => true,
				),
			)
		);

		$config = wp_interactivity_config( 'jetpack/cookie-consent' );

		$this->assertTrue( $config['geoEnabled'] );
		$this->assertNotEmpty( $config['geo'] );
		$this->assertArrayHasKey( 'provider', $config['geo'] );
		$this->assertArrayHasKey( 'apiUrl', $config['geo'] );
		$this->assertArrayHasKey( 'countryCodeCookie', $config['geo'] );
		$this->assertArrayHasKey( 'regionCookie', $config['geo'] );
	}

	public function test_geo_off_still_emits_full_geo_but_geo_enabled_false() {
		$this->init_and_enqueue(
			array(
				'features' => array(
					'banner' => true,
					'geo'    => false,
				),
			)
		);

		$config = wp_interactivity_config( 'jetpack/cookie-consent' );

		$this->assertFalse( $config['geoEnabled'] );
		// The banner JS dereferences config.geo unconditionally, so the sub-array
		// must still be present and populated even when the geo feature is off.
		$this->assertNotEmpty( $config['geo'] );
		$this->assertArrayHasKey( 'provider', $config['geo'] );
		$this->assertArrayHasKey( 'apiUrl', $config['geo'] );
		$this->assertArrayHasKey( 'countryCodeCookie', $config['geo'] );
		$this->assertArrayHasKey( 'regionCookie', $config['geo'] );
	}
}

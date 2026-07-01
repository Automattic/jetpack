<?php
/**
 * Tests that feature toggles gate init() hook registration.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 */
#[CoversClass( Cookie_Consent::class )]
class Init_Feature_Toggles_Test extends TestCase {

	public function tearDown(): void {
		$this->reset_init();
		parent::tearDown();
	}

	private function reset_init() {
		Cookie_Consent::deactivate();
		$this->reset_cookie_consent_config();
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

	public function test_ccpa_page_off_skips_its_hooks() {
		Cookie_Consent::init( array( 'features' => array( 'ccpa_page' => false ) ) );

		$this->assertFalse( has_action( 'init', array( Cookie_Consent::class, 'maybe_create_ccpa_page' ) ) );
		$this->assertFalse( has_filter( 'get_pages', array( Cookie_Consent::class, 'exclude_ccpa_from_get_pages' ) ) );
		$this->assertFalse( has_action( 'rest_api_init', array( Cookie_Consent::class, 'register_ccpa_page_setting' ) ) );
	}

	public function test_ccpa_page_on_registers_its_hooks() {
		Cookie_Consent::init( array( 'features' => array( 'ccpa_page' => true ) ) );

		$this->assertNotFalse( has_action( 'init', array( Cookie_Consent::class, 'maybe_create_ccpa_page' ) ) );
		$this->assertNotFalse( has_filter( 'get_pages', array( Cookie_Consent::class, 'exclude_ccpa_from_get_pages' ) ) );
		$this->assertNotFalse( has_action( 'rest_api_init', array( Cookie_Consent::class, 'register_ccpa_page_setting' ) ) );
	}

	public function test_geo_off_skips_boost_filter() {
		Cookie_Consent::init( array( 'features' => array( 'geo' => false ) ) );

		$this->assertFalse( has_filter( 'jetpack_boost_ignore_cookies', array( Cookie_Consent::class, 'ignore_geo_cookies_in_page_cache' ) ) );
	}

	public function test_geo_on_registers_boost_filter() {
		Cookie_Consent::init( array( 'features' => array( 'geo' => true ) ) );

		$this->assertNotFalse( has_filter( 'jetpack_boost_ignore_cookies', array( Cookie_Consent::class, 'ignore_geo_cookies_in_page_cache' ) ) );
	}

	public function test_footer_links_off_skips_block_hooks() {
		Cookie_Consent::init( array( 'features' => array( 'footer_links' => false ) ) );

		$this->assertFalse( has_filter( 'hooked_block_types', array( Cookie_Consent::class, 'register_footer_navigation_links' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'maybe_render_footer_links_fallback' ) ) );
	}

	public function test_footer_links_on_registers_block_hooks() {
		Cookie_Consent::init( array( 'features' => array( 'footer_links' => true ) ) );

		$this->assertNotFalse( has_filter( 'hooked_block_types', array( Cookie_Consent::class, 'register_footer_navigation_links' ) ) );
		$this->assertNotFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'maybe_render_footer_links_fallback' ) ) );
	}

	public function test_consent_log_off_skips_cron_schedule() {
		Cookie_Consent::init( array( 'features' => array( 'consent_log' => false ) ) );

		$this->assertFalse( wp_next_scheduled( 'jetpack_cookie_consent_cleanup_consent_logs' ) );
	}

	public function test_consent_log_on_schedules_cron() {
		Cookie_Consent::init( array( 'features' => array( 'consent_log' => true ) ) );

		$this->assertNotFalse( wp_next_scheduled( 'jetpack_cookie_consent_cleanup_consent_logs' ) );
	}

	public function test_banner_off_skips_render_banner() {
		// render_banner is only ever added inside the banner branch of init(), so
		// its absence is unambiguous regardless of the other (default-on) toggles.
		Cookie_Consent::init( array( 'features' => array( 'banner' => false ) ) );

		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ), 999 ) );
	}

	public function test_tracks_and_geo_off_without_banner_skips_enqueue() {
		// enqueue_assets is registered when banner OR tracks OR geo is on. Turning
		// all three off is the only way to observe "tracks off" and "geo off" as an
		// absent hook, since neither toggle owns a dedicated registration of its own.
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner' => false,
					'tracks' => false,
					'geo'    => false,
				),
			)
		);

		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
	}

	public function test_tracks_on_without_banner_still_registers_enqueue() {
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner' => false,
					'tracks' => true,
					'geo'    => false,
				),
			)
		);

		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ), 999 ) );
	}

	public function test_geo_on_without_banner_or_tracks_still_registers_enqueue() {
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner' => false,
					'tracks' => false,
					'geo'    => true,
				),
			)
		);

		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ), 999 ) );
	}

	public function test_page_deletion_lock_registers_no_hooks_of_its_own() {
		// page_deletion_lock is a reserved toggle: init() branches on no other feature
		// flag to wire it, so enabling it must register exactly the same hooks as leaving
		// it at its default. This guards against a future edit adding a hook gated on
		// page_deletion_lock without also updating deactivate() to remove it.
		global $wp_filter;

		Cookie_Consent::init( array( 'features' => array( 'page_deletion_lock' => false ) ) );
		$without = array_keys( $wp_filter );
		$this->reset_init();

		Cookie_Consent::init( array( 'features' => array( 'page_deletion_lock' => true ) ) );
		$with = array_keys( $wp_filter );

		$this->assertSame( $without, $with, 'Enabling page_deletion_lock must not register any hook.' );
	}
}

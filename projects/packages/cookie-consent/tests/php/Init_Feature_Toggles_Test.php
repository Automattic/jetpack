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
		// The side effects that outlive the request must stay unregistered too: the
		// consent-log cleanup cron, the geo Boost cache-key filter, and the CCPA REST hook.
		// These guard against a regression that registers durable state before the enabled bail.
		$this->assertFalse( wp_next_scheduled( 'jetpack_cookie_consent_cleanup_consent_logs' ) );
		$this->assertFalse( has_filter( 'jetpack_boost_ignore_cookies', array( Cookie_Consent::class, 'ignore_geo_cookies_in_page_cache' ) ) );
		$this->assertFalse( has_action( 'rest_api_init', array( Cookie_Consent::class, 'register_ccpa_page_setting' ) ) );
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

	public function test_banner_off_still_renders_modal_when_footer_links_on() {
		// The footer "Manage Privacy Preferences" link reopens the banner/preferences modal,
		// so render_banner must stay registered when the banner is off but footer_links is on.
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner'       => false,
					'footer_links' => true,
				),
			)
		);

		$this->assertNotFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ), 999 ) );
	}

	public function test_modal_skipped_when_banner_and_footer_links_off() {
		// The modal is only needed by the banner or the footer manage-preferences link, so
		// with both off it must not render — even when ccpa_page is on, since the CCPA
		// opt-out flow uses its own snackbar rather than the modal.
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner'       => false,
					'footer_links' => false,
					'ccpa_page'    => true,
				),
			)
		);

		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ), 999 ) );
	}

	public function test_module_enqueued_for_ccpa_only() {
		// The CCPA opt-out button relies on the Interactivity module, so it must be enqueued
		// when ccpa_page is on even though the banner and footer links are off.
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner'       => false,
					'footer_links' => false,
					'ccpa_page'    => true,
				),
			)
		);

		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
	}

	public function test_module_enqueued_for_footer_links_only() {
		// The footer manage-preferences link drives the modal through the same module, so it
		// must be enqueued when footer_links is on even though the banner is off.
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner'       => false,
					'ccpa_page'    => false,
					'footer_links' => true,
				),
			)
		);

		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
	}

	public function test_module_and_modal_skipped_when_no_consent_ui_feature() {
		// With banner, ccpa_page, and footer_links all off, nothing surfaces consent UI, so
		// neither the module nor the modal is registered regardless of tracks/geo/consent_log.
		Cookie_Consent::init(
			array(
				'features' => array(
					'banner'       => false,
					'ccpa_page'    => false,
					'footer_links' => false,
					'tracks'       => true,
					'geo'          => true,
					'consent_log'  => true,
				),
			)
		);

		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
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

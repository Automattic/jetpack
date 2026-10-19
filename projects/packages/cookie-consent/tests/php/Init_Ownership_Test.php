<?php
/**
 * Tests for the init ownership API.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 */
#[CoversClass( Cookie_Consent::class )]
class Init_Ownership_Test extends TestCase {

	public function tearDown(): void {
		remove_all_actions( 'jetpack_cookie_consent_initialized' );
		Cookie_Consent::deactivate();
		$this->reset_cookie_consent_config();
		parent::tearDown();
	}

	public function test_not_initialized_before_init() {
		$this->assertFalse( Cookie_Consent::is_initialized() );
		$this->assertNull( Cookie_Consent::get_active_config() );
	}

	public function test_lazily_resolved_config_is_not_reported_as_active() {
		// get_config() resolves and stashes a config on first access even without init(),
		// for example from a render path. That must not read as another consumer's boot.
		Cookie_Consent::get_config();

		$this->assertFalse( Cookie_Consent::is_initialized() );
		$this->assertNull( Cookie_Consent::get_active_config() );
	}

	public function test_init_reports_the_resolved_config() {
		Cookie_Consent::init( array( 'event_prefix' => 'first_consumer' ) );

		$this->assertTrue( Cookie_Consent::is_initialized() );
		$this->assertSame( 'first_consumer', Cookie_Consent::get_active_config()['event_prefix'] );
		$this->assertTrue( Cookie_Consent::get_active_config()['enabled'] );
	}

	public function test_second_init_keeps_the_first_config() {
		Cookie_Consent::init( array( 'event_prefix' => 'first_consumer' ) );
		Cookie_Consent::init( array( 'event_prefix' => 'second_consumer' ) );

		$this->assertSame( 'first_consumer', Cookie_Consent::get_active_config()['event_prefix'] );
	}

	public function test_disabled_init_is_reported() {
		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertTrue( Cookie_Consent::is_initialized() );
		$this->assertFalse( Cookie_Consent::get_active_config()['enabled'] );
	}

	public function test_initialized_action_fires_once_with_the_resolved_config() {
		$received = array();
		add_action(
			'jetpack_cookie_consent_initialized',
			static function ( $config ) use ( &$received ) {
				$received[] = $config;
			}
		);

		Cookie_Consent::init( array( 'event_prefix' => 'first_consumer' ) );
		Cookie_Consent::init( array( 'event_prefix' => 'second_consumer' ) );

		$this->assertCount( 1, $received );
		$this->assertSame( 'first_consumer', $received[0]['event_prefix'] );
		$this->assertSame( Cookie_Consent::get_active_config(), $received[0] );
	}

	public function test_initialized_action_fires_for_a_disabled_init() {
		$received = array();
		add_action(
			'jetpack_cookie_consent_initialized',
			static function ( $config ) use ( &$received ) {
				$received[] = $config;
			}
		);

		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertCount( 1, $received );
		$this->assertFalse( $received[0]['enabled'] );
	}

	public function test_initialized_action_fires_after_the_runtime_hooks_are_registered() {
		$hooked_when_fired = null;
		add_action(
			'jetpack_cookie_consent_initialized',
			static function () use ( &$hooked_when_fired ) {
				$hooked_when_fired = false !== has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ) );
			}
		);

		Cookie_Consent::init();

		$this->assertTrue( $hooked_when_fired );
	}

	public function test_deactivate_from_an_initialized_listener_leaves_the_package_inactive() {
		add_action(
			'jetpack_cookie_consent_initialized',
			static function () {
				Cookie_Consent::deactivate();
			}
		);

		Cookie_Consent::init();

		$this->assertFalse( Cookie_Consent::is_initialized() );
		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'maybe_render_footer_links_fallback' ) ) );
		$this->assertFalse( has_filter( 'hooked_block_types', array( Cookie_Consent::class, 'register_footer_navigation_links' ) ) );
		$this->assertFalse( has_action( 'init', array( Cookie_Consent::class, 'maybe_create_ccpa_page' ) ) );
		$this->assertFalse( has_filter( 'jetpack_boost_ignore_cookies', array( Cookie_Consent::class, 'ignore_geo_cookies_in_page_cache' ) ) );
	}

	public function test_deactivate_clears_ownership() {
		Cookie_Consent::init();
		Cookie_Consent::deactivate();

		$this->assertFalse( Cookie_Consent::is_initialized() );
		$this->assertNull( Cookie_Consent::get_active_config() );
	}
}

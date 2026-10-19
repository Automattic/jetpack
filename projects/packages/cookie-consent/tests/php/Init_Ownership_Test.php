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
		remove_all_filters( 'jetpack_cookie_consent_config' );
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

	public function test_init_reports_the_stable_part_of_the_config() {
		Cookie_Consent::init(
			array(
				'event_prefix' => 'first_consumer',
				'features'     => array( 'geo' => false ),
			)
		);

		$this->assertTrue( Cookie_Consent::is_initialized() );
		$active = Cookie_Consent::get_active_config();
		$this->assertSame( array( 'enabled', 'features' ), array_keys( $active ) );
		$this->assertTrue( $active['enabled'] );
		$this->assertFalse( $active['features']['geo'] );
		$this->assertTrue( $active['features']['banner'] );
	}

	public function test_two_enabled_inits_keep_the_first_config() {
		Cookie_Consent::init( array( 'features' => array( 'geo' => false ) ) );
		Cookie_Consent::init( array( 'features' => array( 'geo' => true ) ) );

		$this->assertFalse( Cookie_Consent::get_active_config()['features']['geo'] );
		$this->assertFalse( Cookie_Consent::get_config()['features']['geo'] );
	}

	public function test_disabled_init_alone_boots_nothing() {
		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertFalse( Cookie_Consent::is_initialized() );
		$this->assertNull( Cookie_Consent::get_active_config() );
		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'maybe_render_footer_links_fallback' ) ) );
		$this->assertFalse( has_filter( 'hooked_block_types', array( Cookie_Consent::class, 'register_footer_navigation_links' ) ) );
	}

	public function test_enabled_init_after_a_disabled_init_boots_the_banner() {
		// A consumer that bundles the package but keeps it off, early on `init`.
		Cookie_Consent::init( array( 'enabled' => false ) );
		// Another consumer, later in the same request.
		Cookie_Consent::init( array( 'event_prefix' => 'second_consumer' ) );

		$this->assertTrue( Cookie_Consent::is_initialized() );
		$this->assertTrue( Cookie_Consent::get_active_config()['enabled'] );
		$this->assertSame( 'second_consumer', Cookie_Consent::get_config()['event_prefix'] );
		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertNotFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ) ) );
	}

	public function test_disabled_init_after_an_enabled_init_is_a_no_op() {
		Cookie_Consent::init();
		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertTrue( Cookie_Consent::is_initialized() );
		$this->assertTrue( Cookie_Consent::get_config()['enabled'] );
		$this->assertNotFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ) ) );
	}

	public function test_initialized_action_fires_once_with_the_active_config() {
		$received = array();
		add_action(
			'jetpack_cookie_consent_initialized',
			static function ( $config ) use ( &$received ) {
				$received[] = $config;
			}
		);

		Cookie_Consent::init( array( 'features' => array( 'geo' => false ) ) );
		Cookie_Consent::init( array( 'features' => array( 'geo' => true ) ) );

		$this->assertCount( 1, $received );
		$this->assertFalse( $received[0]['features']['geo'] );
		$this->assertSame( Cookie_Consent::get_active_config(), $received[0] );
	}

	public function test_initialized_action_does_not_fire_for_a_disabled_init() {
		$received = array();
		add_action(
			'jetpack_cookie_consent_initialized',
			static function ( $config ) use ( &$received ) {
				$received[] = $config;
			}
		);

		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertCount( 0, $received );

		Cookie_Consent::init();

		$this->assertCount( 1, $received );
		$this->assertTrue( $received[0]['enabled'] );
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

	public function test_init_from_a_config_filter_callback_does_not_recurse() {
		$filter_calls = 0;
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) use ( &$filter_calls ) {
				++$filter_calls;
				if ( $filter_calls > 5 ) {
					return $config;
				}
				Cookie_Consent::init( array( 'event_prefix' => 'nested_consumer' ) );
				return $config;
			}
		);

		Cookie_Consent::init( array( 'event_prefix' => 'outer_consumer' ) );

		$this->assertSame( 1, $filter_calls );
		$this->assertTrue( Cookie_Consent::is_initialized() );
		$this->assertSame( 'outer_consumer', Cookie_Consent::get_config()['event_prefix'] );
	}

	public function test_init_after_a_throwing_config_filter_still_boots() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function () {
				throw new \RuntimeException( 'filter failed' );
			}
		);

		try {
			Cookie_Consent::init();
			$this->fail( 'Expected the filter exception to propagate.' );
		} catch ( \RuntimeException $e ) {
			$this->assertSame( 'filter failed', $e->getMessage() );
		}

		remove_all_filters( 'jetpack_cookie_consent_config' );
		Cookie_Consent::init();

		$this->assertTrue( Cookie_Consent::is_initialized() );
	}
}

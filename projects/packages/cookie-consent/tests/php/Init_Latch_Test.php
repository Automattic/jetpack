<?php
/**
 * Tests for which init() call boots the package.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 */
#[CoversClass( Cookie_Consent::class )]
class Init_Latch_Test extends TestCase {

	public function tearDown(): void {
		remove_all_filters( 'jetpack_cookie_consent_config' );
		Cookie_Consent::deactivate();
		$this->reset_cookie_consent_config();
		parent::tearDown();
	}

	/**
	 * Whether the banner hook is registered.
	 *
	 * @return bool
	 */
	private function banner_is_hooked() {
		return false !== has_action( 'wp_footer', array( Cookie_Consent::class, 'render_banner' ) );
	}

	public function test_disabled_init_alone_boots_nothing() {
		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertFalse( $this->banner_is_hooked() );
		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertFalse( has_action( 'wp_footer', array( Cookie_Consent::class, 'maybe_render_footer_links_fallback' ) ) );
		$this->assertFalse( has_filter( 'hooked_block_types', array( Cookie_Consent::class, 'register_footer_navigation_links' ) ) );
	}

	public function test_enabled_init_after_a_disabled_init_boots_the_banner() {
		// A consumer that bundles the package but keeps it off, early on `init`.
		Cookie_Consent::init( array( 'enabled' => false ) );
		// Another consumer, later in the same request.
		Cookie_Consent::init( array( 'event_prefix' => 'second_consumer' ) );

		$this->assertTrue( $this->banner_is_hooked() );
		$this->assertNotFalse( has_action( 'wp_enqueue_scripts', array( Cookie_Consent::class, 'enqueue_assets' ) ) );
		$this->assertTrue( Cookie_Consent::get_config()['enabled'] );
		$this->assertSame( 'second_consumer', Cookie_Consent::get_config()['event_prefix'] );
	}

	public function test_two_enabled_inits_keep_the_first_config() {
		Cookie_Consent::init( array( 'features' => array( 'geo' => false ) ) );
		Cookie_Consent::init( array( 'features' => array( 'geo' => true ) ) );

		$this->assertFalse( Cookie_Consent::get_config()['features']['geo'] );
	}

	public function test_disabled_init_after_an_enabled_init_is_a_no_op() {
		Cookie_Consent::init();
		Cookie_Consent::init( array( 'enabled' => false ) );

		$this->assertTrue( Cookie_Consent::get_config()['enabled'] );
		$this->assertTrue( $this->banner_is_hooked() );
	}

	public function test_enabled_init_after_deactivate_boots_again() {
		Cookie_Consent::init();
		Cookie_Consent::deactivate();

		$this->assertFalse( $this->banner_is_hooked() );

		Cookie_Consent::init();

		$this->assertTrue( $this->banner_is_hooked() );
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
		$this->assertTrue( $this->banner_is_hooked() );
		$this->assertSame( 'outer_consumer', Cookie_Consent::get_config()['event_prefix'] );
	}

	public function test_init_after_a_throwing_config_filter_still_boots() {
		add_filter(
			'jetpack_cookie_consent_config',
			/** @return never */
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

		$this->assertTrue( $this->banner_is_hooked() );
	}
}

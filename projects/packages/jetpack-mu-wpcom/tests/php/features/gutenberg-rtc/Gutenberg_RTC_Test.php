<?php
/**
 * Gutenberg RTC Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/gutenberg-rtc/gutenberg-rtc.php';

/**
 * Tests for the gutenberg-rtc.php feature gating functions.
 *
 * @covers ::wpcom_rtc_is_desktop_app
 * @covers ::wpcom_enable_rtc
 * @covers ::wpcom_is_rtc_http_polling_rollout
 * @covers ::wpcom_is_rtc_websocket_rollout
 * @covers ::wpcom_rtc_providers
 * @covers ::wpcom_has_features_edge_sticker
 */
#[CoversFunction( 'wpcom_rtc_is_desktop_app' )]
#[CoversFunction( 'wpcom_enable_rtc' )]
#[CoversFunction( 'wpcom_is_rtc_http_polling_rollout' )]
#[CoversFunction( 'wpcom_is_rtc_websocket_rollout' )]
#[CoversFunction( 'wpcom_rtc_providers' )]
#[CoversFunction( 'wpcom_has_features_edge_sticker' )]
class Gutenberg_RTC_Test extends \WorDBless\BaseTestCase {

	/**
	 * Original $_SERVER['HTTP_USER_AGENT'] value.
	 *
	 * @var string|null
	 */
	private $original_user_agent;

	/**
	 * Set up before each test.
	 */
	public function set_up(): void {
		parent::set_up();
		\Brain\Monkey\setUp();
		$this->original_user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down(): void {
		// Restore original user agent.
		if ( null === $this->original_user_agent ) {
			unset( $_SERVER['HTTP_USER_AGENT'] );
		} else {
			$_SERVER['HTTP_USER_AGENT'] = $this->original_user_agent;
		}

		remove_all_filters( 'jetpack_rtc_enabled' );
		remove_all_filters( 'jetpack_rtc_providers' );

		\Brain\Monkey\tearDown();

		parent::tear_down();
	}

	// ─── wpcom_rtc_is_desktop_app ────────────────────────────────────

	/**
	 * Tests that the desktop app is detected via user agent.
	 */
	public function test_is_desktop_app_with_desktop_user_agent() {
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 WordPressDesktop/8.5.0';
		$this->assertTrue( wpcom_rtc_is_desktop_app() );
	}

	/**
	 * Tests that a regular browser is not detected as desktop app.
	 */
	public function test_is_desktop_app_with_regular_browser() {
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0';
		$this->assertFalse( wpcom_rtc_is_desktop_app() );
	}

	/**
	 * Tests that missing user agent returns false.
	 */
	public function test_is_desktop_app_without_user_agent() {
		unset( $_SERVER['HTTP_USER_AGENT'] );
		$this->assertFalse( wpcom_rtc_is_desktop_app() );
	}

	/**
	 * Tests that an empty user agent returns false.
	 */
	public function test_is_desktop_app_with_empty_user_agent() {
		$_SERVER['HTTP_USER_AGENT'] = '';
		$this->assertFalse( wpcom_rtc_is_desktop_app() );
	}

	/**
	 * Tests that mobile app user agents are not detected as desktop.
	 */
	public function test_is_desktop_app_with_mobile_app_user_agent() {
		$_SERVER['HTTP_USER_AGENT'] = 'wp-iphone/24.0';
		$this->assertFalse( wpcom_rtc_is_desktop_app() );
	}

	// ─── wpcom_enable_rtc ────────────────────────────────────────────

	/**
	 * Tests that RTC is disabled on the desktop app.
	 */
	public function test_enable_rtc_returns_false_on_desktop_app() {
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 WordPressDesktop/8.5.0';
		$this->assertFalse( wpcom_enable_rtc() );
	}

	/**
	 * Tests that RTC is disabled when the site lacks the RTC feature.
	 *
	 * Without `wpcom_site_has_feature` available, `wpcom_enable_rtc` should
	 * return false because the feature cannot be verified.
	 */
	public function test_enable_rtc_returns_false_without_rtc_feature() {
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 Chrome/120.0.0.0';
		$this->assertFalse( wpcom_enable_rtc() );
	}

	/**
	 * Tests that RTC is disabled on WordPress 7.0+ when Gutenberg is not available.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enable_rtc_returns_false_on_wp_7_without_gutenberg() {
		define( 'IS_WPCOM', true );

		global $wp_version;
		$wp_version = '7.0';

		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 Chrome/120.0.0.0';

		Functions\expect( 'wpcom_site_has_feature' )->andReturn( true );

		$this->assertFalse( wpcom_enable_rtc() );
	}

	/**
	 * Tests that RTC can be enabled when the site has the RTC feature and Gutenberg is available.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enable_rtc_returns_true_with_rtc_feature_and_gutenberg() {
		define( 'IS_WPCOM', true );
		define( 'GUTENBERG_VERSION', '22.7.0' );

		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 Chrome/120.0.0.0';

		Functions\expect( 'wpcom_site_has_feature' )->andReturn( true );

		$this->assertTrue( wpcom_enable_rtc() );
	}

	// ─── wpcom_is_rtc_http_polling_rollout ───────────────────────────

	/**
	 * Tests that HTTP polling is not enforced when IS_ATOMIC is not defined.
	 */
	public function test_enforce_http_polling_returns_false_when_not_atomic() {
		// IS_ATOMIC is not defined in the test environment.
		$this->assertFalse( wpcom_is_rtc_http_polling_rollout() );
	}

	// ─── wpcom_is_rtc_websocket_rollout ──────────────────────────────

	/**
	 * Tests that WebSocket rollout returns false when IS_WPCOM is not defined.
	 */
	public function test_websocket_rollout_returns_false_when_not_wpcom() {
		// IS_WPCOM is not defined in the test environment.
		$this->assertFalse( wpcom_is_rtc_websocket_rollout() );
	}

	// ─── wpcom_has_features_edge_sticker ─────────────────────────────

	/**
	 * Tests that features edge sticker returns false without wpcom functions.
	 *
	 * Neither `wpcomsh_is_site_sticker_active` nor `has_blog_sticker` exist
	 * in the test environment.
	 */
	public function test_features_edge_sticker_returns_false_without_wpcom_functions() {
		$this->assertFalse( wpcom_has_features_edge_sticker() );
	}

	// ─── wpcom_rtc_providers ─────────────────────────────────────────

	/**
	 * Tests that providers pass through when HTTP polling is not enforced.
	 */
	public function test_rtc_providers_passes_through_when_not_enforcing_http_polling() {
		$providers = array( 'pinghub' );
		$this->assertSame( $providers, wpcom_rtc_providers( $providers ) );
	}
}

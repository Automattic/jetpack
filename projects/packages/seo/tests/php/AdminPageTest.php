<?php
/**
 * Tests for the SEO admin page shell.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Admin_Page
 */
#[CoversClass( Admin_Page::class )]
class AdminPageTest extends TestCase {

	/**
	 * The page's URL-facing slug is pinned: it's baked into redirect URLs
	 * (the opt-in handler, My Jetpack's card) and users' bookmarks.
	 */
	public function test_menu_slug_constant_is_defined() {
		$this->assertSame( 'jetpack-seo', Admin_Page::MENU_SLUG );
	}

	/**
	 * Read the `is_gated` flag the way the dashboard does — off the injected script
	 * data — so the gate is exercised through its public surface.
	 *
	 * @return bool
	 */
	private function read_is_gated() {
		$data = Admin_Page::inject_script_data( array() );

		return $data[ Initializer::SCRIPT_DATA_KEY ]['gating']['is_gated'];
	}

	/**
	 * Put the site on WordPress.com, entitled to `advanced-seo` or not.
	 *
	 * `advanced-seo` sits in the FREE plan's supports list and plan classes are
	 * cumulative, so the plan data alone can never report it unsupported. On
	 * WordPress.com `Current_Plan::supports()` hijacks to the platform's own feature
	 * check instead, and that hijack is the only thing that can gate the dashboard —
	 * so that is what these tests drive.
	 *
	 * @param bool $entitled Whether the site is entitled to `advanced-seo`.
	 */
	private function simulate_wpcom_site( $entitled ) {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		\Wpcom_Test_Features::$known    = array( 'advanced-seo' );
		\Wpcom_Test_Features::$entitled = $entitled ? array( 'advanced-seo' ) : array();
	}

	/**
	 * Undo {@see self::simulate_wpcom_site()}.
	 */
	private function reset_wpcom_site() {
		\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		\Wpcom_Test_Features::reset();
	}

	/**
	 * Self-hosted Jetpack is never plan-gated: SEO stays free there, so the gate
	 * short-circuits on the host check before any plan lookup happens.
	 */
	public function test_is_gated_is_false_on_self_hosted() {
		$this->assertFalse( $this->read_is_gated() );
	}

	/**
	 * On WordPress.com, a site not entitled to `advanced-seo` (below Premium after
	 * the March 2026 rebundling) is gated.
	 */
	public function test_is_gated_is_true_on_wpcom_without_advanced_seo() {
		$this->simulate_wpcom_site( false );

		try {
			$this->assertTrue( $this->read_is_gated() );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * On WordPress.com, a site entitled to `advanced-seo` (Premium and above) keeps
	 * the full dashboard — the upsell must never show to someone already paying.
	 */
	public function test_is_gated_is_false_on_wpcom_with_advanced_seo() {
		$this->simulate_wpcom_site( true );

		try {
			$this->assertFalse( $this->read_is_gated() );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * The upsell URL points at Premium (`value_bundle`) checkout for this site. It's
	 * only built when the site is actually gated (the ungated case is asserted empty
	 * below), so this drives a gated wpcom site.
	 */
	public function test_upsell_url_targets_premium_checkout() {
		$this->simulate_wpcom_site( false );

		try {
			$data       = Admin_Page::inject_script_data( array() );
			$upsell_url = $data[ Initializer::SCRIPT_DATA_KEY ]['gating']['upsell_url'];

			$this->assertIsString( $upsell_url );
			$this->assertStringStartsWith( 'https://wordpress.com/checkout/', $upsell_url );
			$this->assertStringEndsWith( '/value_bundle', $upsell_url );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * An ungated site carries no upsell URL — it's never shown, so the site-suffix
	 * lookup that builds it is skipped.
	 */
	public function test_upsell_url_is_empty_when_not_gated() {
		$data = Admin_Page::inject_script_data( array() );

		$this->assertSame( '', $data[ Initializer::SCRIPT_DATA_KEY ]['gating']['upsell_url'] );
	}

	/**
	 * The gate's load-bearing assumption: `advanced-seo` sits in the FREE plan's
	 * supports list and plan classes are cumulative, so plan data alone can never
	 * report it unsupported — only the WordPress.com feature hijack can gate. If
	 * `advanced-seo` were ever dropped from the wpcom feature registry (so
	 * `wpcom_feature_exists()` returns false), the hijack no longer fires and the
	 * site falls through to plan data: ungated. This pins that fail-open direction —
	 * a lookup that can't answer must never hide a paid feature.
	 */
	public function test_is_not_gated_when_wpcom_does_not_register_advanced_seo() {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		// Platform present, but it doesn't gate `advanced-seo` at all.
		\Wpcom_Test_Features::$known    = array();
		\Wpcom_Test_Features::$entitled = array();

		try {
			$this->assertFalse( $this->read_is_gated() );
		} finally {
			$this->reset_wpcom_site();
		}
	}

	/**
	 * The Tracks bootstrap exposes exactly the standard identifier set the client
	 * `recordSeoEvent()` wrapper spreads onto every event, with the types the Data
	 * team's schema expects. `blog_id` is the join key for the distinct-site launch
	 * metric, so it must always be an int and never null.
	 */
	public function test_get_tracks_context_shape() {
		$context = Admin_Page::get_tracks_context();

		$this->assertSame(
			array( 'blog_id', 'site_type', 'is_a11n', 'is_test', 'product_version' ),
			array_keys( $context )
		);
		$this->assertIsInt( $context['blog_id'] );
		$this->assertContains( $context['site_type'], array( 'simple', 'atomic', 'jetpack' ) );
		$this->assertIsBool( $context['is_a11n'] );
		$this->assertIsBool( $context['is_test'] );
		$this->assertSame( Initializer::PACKAGE_VERSION, $context['product_version'] );
	}

	/**
	 * A WordPress.com staging site counts as internal traffic, so `is_test` is true
	 * and the launch metric can filter it out. `wpcom_is_staging_site` is the signal
	 * Dotcom sets, and it's the case the deprecated `Status::is_staging_site()`
	 * wouldn't have caught on its own.
	 */
	public function test_get_tracks_context_flags_a_wpcom_staging_site_as_test() {
		$this->assertFalse( Admin_Page::get_tracks_context()['is_test'] );

		update_option( 'wpcom_is_staging_site', '1' );

		try {
			$this->assertTrue( Admin_Page::get_tracks_context()['is_test'] );
		} finally {
			delete_option( 'wpcom_is_staging_site' );
		}
	}

	/**
	 * The WordPress.com Tracks transport is enqueued on the SEO admin page once the
	 * site has opted in. Without it `jetpack-analytics` only ever queues events into
	 * `window._tkq` and nothing reaches Tracks, so every event this package fires
	 * would be silently dropped.
	 */
	public function test_enqueue_tracks_transport_enqueues_the_tracks_script() {
		$this->assertFalse( wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->agree_to_terms_of_service();

		try {
			Admin_Page::enqueue_tracks_transport();

			$this->assertTrue( wp_script_is( 'jp-tracks', 'enqueued' ) );
		} finally {
			wp_dequeue_script( 'jp-tracks' );
			wp_deregister_script( 'jp-tracks' );
			$this->revoke_terms_of_service();
		}
	}

	/**
	 * A self-hosted site that hasn't agreed to the terms of service (or connected a
	 * user) gets no transport, so nothing it queues is ever sent. The host plugin
	 * applies the same gate before starting its own tracking; the SEO dashboard is
	 * reachable before that happens, so it has to check for itself.
	 */
	public function test_enqueue_tracks_transport_is_skipped_without_consent() {
		$this->assertFalse( Admin_Page::can_use_analytics() );

		Admin_Page::enqueue_tracks_transport();

		$this->assertFalse( wp_script_is( 'jp-tracks', 'enqueued' ) );
	}

	/**
	 * Mark the site as having agreed to the Jetpack terms of service, which is what
	 * `Tracking::should_enable_tracking()` reads on a self-hosted site.
	 */
	private function agree_to_terms_of_service() {
		\Jetpack_Options::update_option( 'tos_agreed', true );
		Status_Cache::clear();
	}

	/**
	 * Undo {@see self::agree_to_terms_of_service()} — the option store persists
	 * between tests in this suite.
	 */
	private function revoke_terms_of_service() {
		\Jetpack_Options::delete_option( 'tos_agreed' );
		Status_Cache::clear();
	}
}

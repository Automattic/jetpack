<?php
/**
 * Tests for the SEO admin page shell.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

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
}

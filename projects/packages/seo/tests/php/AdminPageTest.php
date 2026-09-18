<?php
/**
 * Tests for the SEO admin page shell.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Admin_Page
 */
#[CoversClass( Admin_Page::class )]
class AdminPageTest extends TestCase {

	/**
	 * Undo what maybe_load_wp_build() and add_menu_item() register.
	 */
	protected function tearDown(): void {
		remove_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'alias_screen_id_for_wp_build' ) );
		remove_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'restore_screen_id_after_wp_build' ) );
		remove_filter( 'jetpack_admin_js_script_data', array( Admin_Page::class, 'inject_script_data' ) );
		remove_filter( 'jetpack_display_jitms_on_screen', array( Admin_Page::class, 'hide_jitms_on_wp_build_dashboard' ) );
		unset( $_GET['page'], $GLOBALS['current_screen'] );

		$menu_items = new \ReflectionProperty( Admin_Menu::class, 'menu_items' );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to access non-public members before PHP 8.1; deprecated no-op since PHP 8.5.
			$menu_items->setAccessible( true );
		}
		$menu_items->setValue( null, array() );

		parent::tearDown();
	}

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
	 * The alias and its restore bracket the generated enqueue check, at its priority.
	 */
	public function test_maybe_load_wp_build_hooks_the_screen_alias_around_the_generated_check() {
		$this->enter_seo_admin_request();

		Admin_Page::maybe_load_wp_build();

		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'alias_screen_id_for_wp_build' ) ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'restore_screen_id_after_wp_build' ) ) );
		$this->assertFalse( has_action( 'current_screen', array( Admin_Page::class, 'alias_screen_id_for_wp_build' ) ) );
	}

	/**
	 * JITM reads the screen ID after `admin_enqueue_scripts`, to build its message path.
	 */
	public function test_screen_id_is_restored_after_admin_enqueue_scripts() {
		$this->enter_seo_admin_request();

		Admin_Page::maybe_load_wp_build();
		do_action( 'admin_enqueue_scripts', 'jetpack_page_jetpack-seo' );

		$this->assertSame( 'jetpack_page_jetpack-seo', get_current_screen()->id );
	}

	/**
	 * The alias and its restore pair up, and do nothing without a screen or an alias to undo.
	 */
	public function test_alias_screen_id_round_trip() {
		unset( $GLOBALS['current_screen'] );
		Admin_Page::alias_screen_id_for_wp_build();
		Admin_Page::restore_screen_id_after_wp_build();

		set_current_screen( 'jetpack_page_jetpack-seo' );
		Admin_Page::restore_screen_id_after_wp_build();
		$this->assertSame( 'jetpack_page_jetpack-seo', get_current_screen()->id );

		Admin_Page::alias_screen_id_for_wp_build();
		$this->assertSame( Admin_Page::WP_BUILD_SLUG, get_current_screen()->id );

		Admin_Page::restore_screen_id_after_wp_build();
		$this->assertSame( 'jetpack_page_jetpack-seo', get_current_screen()->id );
	}

	/**
	 * The dashboard opts the screen Admin_Menu registers out of JITMs, and no other.
	 */
	public function test_dashboard_opts_its_screen_out_of_jitms() {
		Admin_Page::add_menu_item();

		$this->assertFalse( apply_filters( 'jetpack_display_jitms_on_screen', true, 'jetpack_page_jetpack-seo' ) );
		$this->assertTrue( apply_filters( 'jetpack_display_jitms_on_screen', true, 'jetpack_page_jetpack-social' ) );
		$this->assertFalse( apply_filters( 'jetpack_display_jitms_on_screen', false, 'jetpack_page_jetpack-social' ) );
	}

	/**
	 * Put the request on the SEO admin page.
	 */
	private function enter_seo_admin_request() {
		set_current_screen( 'jetpack_page_jetpack-seo' );
		$_GET['page'] = Admin_Page::MENU_SLUG;
	}
}

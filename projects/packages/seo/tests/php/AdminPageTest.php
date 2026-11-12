<?php
/**
 * Tests for the SEO admin page shell.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Admin_Page
 * @covers \Automattic\Jetpack\SEO\Initializer
 */
#[CoversClass( Admin_Page::class )]
#[CoversClass( Initializer::class )]
class AdminPageTest extends TestCase {

	/**
	 * Undo what maybe_load_wp_build() and add_menu_item() register.
	 */
	protected function tearDown(): void {
		remove_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'alias_screen_id_for_wp_build' ) );
		remove_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'restore_screen_id_after_wp_build' ) );
		remove_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'enqueue_tracks_transport' ) );
		remove_filter( 'jetpack_admin_js_script_data', array( Admin_Page::class, 'inject_script_data' ) );
		remove_filter( 'jetpack_admin_js_script_data', array( Admin_Page::class, 'inject_tracks_context' ) );
		wp_dequeue_script( 'jp-tracks' );
		wp_deregister_script( 'jp-tracks' );
		remove_filter( 'jetpack_display_jitms_on_screen', array( Admin_Page::class, 'hide_jitms_on_wp_build_dashboard' ) );
		remove_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'register_page_data' ), 0 );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		$this->set_wp_build_index( null );

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
	 * The page's URL, used by the opt-in redirect and the SEO modules' Configure links.
	 */
	public function test_get_url_points_at_the_seo_page() {
		$this->assertSame( admin_url( 'admin.php?page=jetpack-seo' ), Admin_Page::get_url() );
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
	 * Every tab reads whether SEO output is paused from the same script data.
	 */
	public function test_script_data_reports_the_output_state() {
		$plugin = static function () {
			return 'Yoast SEO';
		};
		add_filter( 'jetpack_seo_conflicting_plugin', $plugin );

		try {
			$data = Admin_Page::inject_script_data( array() );
		} finally {
			remove_filter( 'jetpack_seo_conflicting_plugin', $plugin );
		}

		$this->assertSame(
			array(
				'paused'             => true,
				'conflicting_plugin' => 'Yoast SEO',
			),
			$data[ Initializer::SCRIPT_DATA_KEY ]['output']
		);
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
	 * @dataProvider upgrade_plans
	 */
	#[DataProvider( 'upgrade_plans' )]
	public function test_upsell_url_targets_premium_checkout( $simple, $plan_slug, $product ) {
		$this->simulate_wpcom_site( false );
		if ( ! $simple ) {
			Constants::clear_single_constant( 'IS_WPCOM' );
			Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		}
		Status_Cache::clear();
		\WPCOM_Store_API::$plan = array( 'product_slug' => $simple ? $plan_slug : 'jetpack_free' );
		Current_Plan::update_from_site_record( array( 'plan' => array( 'product_slug' => $simple ? 'jetpack_free' : $plan_slug ) ) );

		try {
			$data       = Admin_Page::inject_script_data( array() );
			$upsell_url = $data[ Initializer::SCRIPT_DATA_KEY ]['gating']['upsell_url'];

			$this->assertIsString( $upsell_url );
			$this->assertStringStartsWith( 'https://wordpress.com/checkout/', $upsell_url );
			$this->assertStringEndsWith( '/' . $product, wp_parse_url( $upsell_url, PHP_URL_PATH ) );
			parse_str( wp_parse_url( $upsell_url, PHP_URL_QUERY ), $query );
			$this->assertSame( admin_url( 'admin.php?page=jetpack-seo' ), $query['redirect_to'] );
			$this->assertSame( Admin_Page::get_url(), $query['checkoutBackUrl'] );
		} finally {
			\WPCOM_Store_API::$plan = array();
			Current_Plan::update_from_site_record( array( 'plan' => array() ) );
			delete_option( Current_Plan::PLAN_OPTION );
			Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
			Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
			Constants::clear_single_constant( 'WPCOMSH__PLUGIN_FILE' );
			Status_Cache::clear();
			$this->reset_wpcom_site();
		}
	}

	public static function upgrade_plans() {
		$cases = array();
		foreach ( array(
			'Simple' => true,
			'Atomic' => false,
		) as $host => $simple ) {
			foreach ( array(
				'jetpack_free'            => 'value_bundle',
				'personal-bundle-monthly' => 'value_bundle',
				'personal-bundle'         => 'value_bundle',
				'personal-bundle-2y'      => 'value_bundle-2y',
				'personal-bundle-3y'      => 'value_bundle-3y',
			) as $plan => $product ) {
				$cases[ "$host $plan" ] = array( $simple, $plan, $product );
			}
		}
		return $cases;
	}

	public function test_p2_sites_have_no_upgrade_offer() {
		$this->simulate_wpcom_site( false );
		$stylesheet = static function () {
			return 'pub/p2';
		};
		add_filter( 'stylesheet', $stylesheet );
		try {
			$data = Admin_Page::inject_script_data( array() );
			$this->assertTrue( $data[ Initializer::SCRIPT_DATA_KEY ]['gating']['is_gated'] );
			$this->assertSame( '', $data[ Initializer::SCRIPT_DATA_KEY ]['gating']['upsell_url'] );
		} finally {
			remove_filter( 'stylesheet', $stylesheet );
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

	public function test_maybe_load_wp_build_hooks_the_screen_alias_around_the_generated_check() {
		$this->enter_seo_admin_request();

		Admin_Page::maybe_load_wp_build();

		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'alias_screen_id_for_wp_build' ) ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Admin_Page::class, 'restore_screen_id_after_wp_build' ) ) );
		$this->assertFalse( has_action( 'current_screen', array( Admin_Page::class, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_screen_id_is_restored_after_admin_enqueue_scripts() {
		$this->enter_seo_admin_request();

		Admin_Page::maybe_load_wp_build();
		do_action( 'current_screen', get_current_screen() );
		do_action( 'admin_enqueue_scripts', 'jetpack_page_jetpack-seo' );

		$this->assertSame( 'jetpack_page_jetpack-seo', get_current_screen()->id );
	}

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
	 * The menu item hides while seo-tools is off, like other Jetpack modules.
	 */
	public function test_menu_item_is_gated_on_seo_tools() {
		Admin_Page::add_menu_item();

		$menu_items = new \ReflectionProperty( Admin_Menu::class, 'menu_items' );
		if ( \PHP_VERSION_ID < 80100 ) {
			$menu_items->setAccessible( true );
		}
		$seo_item = null;
		foreach ( $menu_items->getValue( null ) as $item ) {
			if ( Admin_Page::MENU_SLUG === $item['menu_slug'] ) {
				$seo_item = $item;
				break;
			}
		}

		$this->assertNotNull( $seo_item, 'SEO menu item was not registered' );
		$this->assertSame( 'seo-tools', $seo_item['args']['module'] ?? null );
		$this->assertSame( 'jetpack-seo', $seo_item['args']['key'] ?? null );
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
	 * `blog_id` is the launch metric's join key, so it must always be an int.
	 */
	public function test_get_tracks_context_shape() {
		$context = Admin_Page::get_tracks_context();

		$this->assertSame(
			array( 'blog_id', 'site_type', 'is_a11n', 'is_test', 'product_version' ),
			array_keys( $context )
		);
		$this->assertIsInt( $context['blog_id'] );
		$this->assertIsBool( $context['is_a11n'] );
		$this->assertIsBool( $context['is_test'] );
		$this->assertSame( Initializer::PACKAGE_VERSION, $context['product_version'] );
	}

	public function test_get_tracks_context_reports_the_site_type_per_platform() {
		$this->assertSame( 'jetpack', Admin_Page::get_tracks_context()['site_type'] );

		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		try {
			$this->assertSame( 'simple', Admin_Page::get_tracks_context()['site_type'] );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}

		$this->simulate_wpcom_on_atomic();
		try {
			$this->assertSame( 'atomic', Admin_Page::get_tracks_context()['site_type'] );
		} finally {
			$this->reset_wpcom_on_atomic();
		}
	}

	/**
	 * A local id would collide with the WordPress.com site that has the same id.
	 */
	public function test_get_tracks_context_reports_no_blog_id_before_connecting() {
		$this->assertSame( 0, Admin_Page::get_tracks_context()['blog_id'] );

		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		try {
			$this->assertSame( get_current_blog_id(), Admin_Page::get_tracks_context()['blog_id'] );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	public function test_tracks_context_and_transport_are_only_added_once_the_site_allows_tracking() {
		$transport = array( Admin_Page::class, 'enqueue_tracks_transport' );
		$this->enter_seo_admin_request();

		Admin_Page::maybe_load_wp_build();
		$data = apply_filters( 'jetpack_admin_js_script_data', array() );
		$this->assertArrayNotHasKey( 'tracks', $data[ Initializer::SCRIPT_DATA_KEY ] );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', $transport ) );

		$this->agree_to_terms_of_service();
		try {
			Admin_Page::maybe_load_wp_build();
			$data = apply_filters( 'jetpack_admin_js_script_data', array() );
			$this->assertArrayHasKey( 'tracks', $data[ Initializer::SCRIPT_DATA_KEY ] );
			$this->assertNotFalse( has_action( 'admin_enqueue_scripts', $transport ) );
		} finally {
			$this->revoke_terms_of_service();
		}
	}

	public function test_get_tracks_context_reads_the_automattician_flag() {
		$this->assertFalse( Admin_Page::get_tracks_context()['is_a11n'] );

		\Wpcom_Test_User::$is_automattician = true;
		try {
			$this->assertTrue( Admin_Page::get_tracks_context()['is_a11n'] );
		} finally {
			\Wpcom_Test_User::reset();
		}
	}

	public function test_get_tracks_context_flags_a_proxied_request_as_automattician() {
		\Automattic\Jetpack\Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		try {
			$this->assertTrue( Admin_Page::get_tracks_context()['is_a11n'] );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'AT_PROXIED_REQUEST' );
		}
	}

	public function test_get_tracks_context_flags_a_wpcom_staging_site_as_test() {
		$this->assertFalse( Admin_Page::get_tracks_context()['is_test'] );

		update_option( 'wpcom_is_staging_site', '1' );
		try {
			$this->assertTrue( Admin_Page::get_tracks_context()['is_test'] );
		} finally {
			delete_option( 'wpcom_is_staging_site' );
		}
	}

	public function test_enqueue_tracks_transport_enqueues_the_tracks_script() {
		Admin_Page::enqueue_tracks_transport();

		$this->assertTrue( wp_script_is( 'jp-tracks', 'enqueued' ) );
	}

	public function test_enqueue_tracks_transport_is_skipped_on_simple() {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );
		try {
			$this->assertTrue( Admin_Page::can_use_analytics() );

			Admin_Page::enqueue_tracks_transport();

			$this->assertFalse( wp_script_is( 'jp-tracks', 'enqueued' ) );
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	public function test_can_use_analytics_on_atomic_without_jetpack_consent() {
		$this->assertFalse( Admin_Page::can_use_analytics() );

		$this->simulate_wpcom_on_atomic();
		try {
			$this->assertTrue( Admin_Page::can_use_analytics() );
		} finally {
			$this->reset_wpcom_on_atomic();
		}
	}

	/**
	 * Without this hook, every event queues into `window._tkq` and is never sent.
	 */
	public function test_maybe_load_wp_build_registers_the_tracks_transport_on_the_seo_page_only() {
		$hook = array( Admin_Page::class, 'enqueue_tracks_transport' );

		$this->agree_to_terms_of_service();
		try {
			set_current_screen( 'dashboard' );
			$_GET['page'] = 'jetpack';
			Admin_Page::maybe_load_wp_build();
			$this->assertFalse( has_action( 'admin_enqueue_scripts', $hook ) );

			$this->enter_seo_admin_request();
			Admin_Page::maybe_load_wp_build();
			$this->assertNotFalse( has_action( 'admin_enqueue_scripts', $hook ) );
		} finally {
			$this->revoke_terms_of_service();
		}
	}

	/**
	 * The shell offers SEO only where the page has a build, its menu link, and a non-Simple host.
	 *
	 * @dataProvider admin_shell_member_cases
	 *
	 * @param bool $built           Whether build/build.php exists.
	 * @param bool $seo_tools       Whether the seo-tools module is active.
	 * @param bool $simple          Whether the site is WordPress.com Simple.
	 * @param bool $expected_listed Whether SEO should join the shell.
	 */
	#[DataProvider( 'admin_shell_member_cases' )]
	public function test_admin_shell_member( $built, $seo_tools, $simple, $expected_listed ) {
		$this->set_wp_build_index( __DIR__ . ( $built ? '/files/build-entry/build.php' : '/files/build-entry/absent.php' ) );
		$modules = static function ( $active ) use ( $seo_tools ) {
			$active = array_diff( (array) $active, array( 'seo-tools' ) );
			return $seo_tools ? array_merge( $active, array( 'seo-tools' ) ) : $active;
		};
		add_filter( 'jetpack_active_modules', $modules );
		if ( $simple ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}

		try {
			$members = Admin_Page::add_admin_shell_member( array( 'other' => array() ) );
		} finally {
			remove_filter( 'jetpack_active_modules', $modules );
			Constants::clear_single_constant( 'IS_WPCOM' );
		}

		$this->assertArrayHasKey( 'other', $members );
		$this->assertSame( $expected_listed, isset( $members[ Admin_Page::MENU_SLUG ] ) );
	}

	/**
	 * Admin shell member cases.
	 *
	 * @return array<string, array{bool, bool, bool, bool}>
	 */
	public static function admin_shell_member_cases() {
		return array(
			'built, seo-tools on, self-hosted' => array( true, true, false, true ),
			'unbuilt'                          => array( false, true, false, false ),
			'seo-tools off'                    => array( true, false, false, false ),
			'Simple'                           => array( true, true, true, false ),
		);
	}

	/**
	 * Hosted by another dashboard, SEO still hands its app the initial state when the shell prints its assets.
	 */
	public function test_admin_shell_guest_adds_the_page_data_when_assets_print() {
		$this->set_wp_build_index( __DIR__ . '/files/build-entry/absent.php' );
		Admin_Page::load_as_admin_shell_guest();
		$this->assertFalse( has_filter( 'jetpack_admin_js_script_data', array( Admin_Page::class, 'inject_script_data' ) ) );

		set_current_screen( 'toplevel_page_jetpack' );
		do_action( 'admin_enqueue_scripts', 'toplevel_page_jetpack' );

		$data = apply_filters( 'jetpack_admin_js_script_data', array() );
		$this->assertArrayHasKey( 'gating', $data[ Initializer::SCRIPT_DATA_KEY ] ?? array() );
	}

	/**
	 * Point the build-entry lookup at a path of our choosing, or back at the real one with null.
	 *
	 * @param string|null $path Path to stand in for build/build.php.
	 */
	private function set_wp_build_index( $path ) {
		$property = new \ReflectionProperty( Admin_Page::class, 'wp_build_index' );
		if ( \PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $path );
	}

	/**
	 * Put the request on the SEO admin page.
	 */
	private function enter_seo_admin_request() {
		set_current_screen( 'jetpack_page_jetpack-seo' );
		$_GET['page'] = Admin_Page::MENU_SLUG;
	}

	/**
	 * WordPress.com on Atomic: the platform constants plus wpcomsh, which other Atomic hosts lack.
	 */
	private function simulate_wpcom_on_atomic() {
		\Automattic\Jetpack\Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		\Automattic\Jetpack\Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		\Automattic\Jetpack\Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		Status_Cache::clear();
	}

	/**
	 * Undo {@see self::simulate_wpcom_on_atomic()}.
	 */
	private function reset_wpcom_on_atomic() {
		\Automattic\Jetpack\Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
		\Automattic\Jetpack\Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
		\Automattic\Jetpack\Constants::clear_single_constant( 'WPCOMSH__PLUGIN_FILE' );
		Status_Cache::clear();
	}

	/**
	 * What `Tracking::should_enable_tracking()` reads on a self-hosted site.
	 */
	private function agree_to_terms_of_service() {
		\Jetpack_Options::update_option( 'tos_agreed', true );
		Status_Cache::clear();
	}

	/**
	 * The option store persists between tests in this suite.
	 */
	private function revoke_terms_of_service() {
		\Jetpack_Options::delete_option( 'tos_agreed' );
		Status_Cache::clear();
	}
}

<?php
/**
 * Settings admin page tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Monetize\Dashboard as Monetize_Dashboard;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\PremiumAnalytics\Analytics;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-settings-react-page.php';

/**
 * @covers \Jetpack_Settings_React_Page
 */
#[CoversClass( Jetpack_Settings_React_Page::class )]
class Jetpack_Settings_React_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * What arrange_moved_out_site() changed, for tear_down() to put back.
	 *
	 * @var array|null
	 */
	private $moved_out_site;

	/**
	 * Log in as an administrator of a connected site.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_menus();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "honey.badger.$user_id" ) );

		( new Connection_Manager() )->reset_connection_status();
		Status_Cache::clear();
	}

	/**
	 * Clear the connection, the menus and the request.
	 */
	public function tear_down() {
		foreach ( array( 'master_user', 'id', 'blog_token', 'user_tokens', 'purchase_token' ) as $option ) {
			Jetpack_Options::delete_option( $option );
		}
		unset( $_GET['page'] );

		( new Connection_Manager() )->reset_connection_status();
		Status_Cache::clear();
		$this->reset_menus();

		wp_deregister_script( 'react-plugin' );
		remove_all_filters( 'pre_http_request' );
		remove_filter( 'wp_doing_ajax', '__return_true' );
		unset( $_GET['action'] );
		$user_id = get_current_user_id();
		foreach ( array( 'sharing-options', "monitor_receive_notifications$user_id", "post_by_email_address$user_id" ) as $option ) {
			remove_all_filters( "pre_update_option_$option" );
			delete_option( $option );
		}
		remove_all_filters( 'pre_update_option_jetpack_private_options' );
		wp_dequeue_style( 'components-css' );
		set_current_screen( 'front' );
		$this->restore_moved_out_site();

		parent::tear_down();
	}

	/**
	 * A Settings page whose request is blocked by an identity crisis.
	 *
	 * @return Jetpack_Settings_React_Page
	 */
	private function page_in_idc() {
		return new class() extends Jetpack_Settings_React_Page {
			/**
			 * Pretend the IDC blocks rendering.
			 *
			 * @return bool
			 */
			protected function block_page_rendering_for_idc() {
				return true;
			}
		};
	}

	/**
	 * A Settings page that loaded wp-build on this request.
	 *
	 * @return Jetpack_Settings_React_Page
	 */
	private function page_on_wp_build() {
		return new class() extends Jetpack_Settings_React_Page {
			/**
			 * Pretend the build loaded.
			 *
			 * @return bool
			 */
			public function should_render_wp_build() {
				return true;
			}

			/**
			 * Stand in for the route bundle's real classic dependencies.
			 *
			 * @return string[]
			 */
			protected function get_wp_build_script_dependencies() {
				return array( 'lodash' );
			}
		};
	}

	/**
	 * Empty the menu globals and Admin_Menu's queue; WP_UnitTestCase restores neither.
	 */
	private function reset_menus() {
		global $menu, $submenu, $_parent_pages, $_registered_pages;
		$menu              = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu           = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$_parent_pages     = array();
		$_registered_pages = array();
		Admin_Menu::reset();
	}

	/**
	 * Register the page and build the submenu as the admin_menu pass does.
	 *
	 * @return string[] Jetpack submenu slugs.
	 */
	private function register_and_list_slugs() {
		( new Jetpack_Settings_React_Page() )->get_page_hook();
		Admin_Menu::admin_menu_hook_callback();

		return array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 );
	}

	/**
	 * Move settings out on a site that has what a provide_sites_once_settings_move_out() row names.
	 *
	 * @param array $site What the site has.
	 */
	private function arrange_moved_out_site( array $site ) {
		$modules              = array_fill_keys( array_merge( $site['modules'], array( 'monetize' ) ), '1.0' );
		$this->moved_out_site = array(
			'active_modules' => Jetpack_Options::get_option( 'active_modules' ),
			'protect_page'   => $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] ?? null,
			'odyssey'        => Stats_Options::get_option( 'enable_odyssey_stats' ),
			'stats_v2'       => Analytics::is_initialized(),
			'modules'        => static function () use ( $modules ) {
				return $modules;
			},
			'plugins'        => static function () use ( $site ) {
				return empty( $site['akismet'] ) ? array() : array( 'akismet/akismet.php' );
			},
		);

		if ( ! empty( $site['editor'] ) ) {
			wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		}
		add_filter( 'jetpack_feature_flag_enabled_' . My_Jetpack_Initializer::SETTINGS_CONSOLIDATION_FLAG, empty( $site['flag_off'] ) ? '__return_true' : '__return_false' );
		// An earlier test can leave a local site URL, which Status reads as offline.
		add_filter( 'jetpack_offline_mode', '__return_false' );
		add_filter( 'jetpack_get_available_modules', $this->moved_out_site['modules'], PHP_INT_MAX );
		add_filter( 'pre_option_active_plugins', $this->moved_out_site['plugins'], PHP_INT_MAX );

		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		if ( $site['protect_page'] ) {
			$GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] = 1;
		}

		if ( ! empty( $site['vip'] ) ) {
			Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );
		}
		Stats_Options::set_option( 'enable_odyssey_stats', $site['odyssey'] );
		self::set_stats_v2_booted( ! empty( $site['analytics'] ) );

		add_filter( 'jetpack_feature_flag_enabled_' . Monetize_Dashboard::FEATURE_FLAG, $site['ads_home'] ? '__return_true' : '__return_false' );
		if ( $site['ads_home'] ) {
			Jetpack_Options::update_option( 'active_modules', array( 'monetize' ) );
		}

		if ( ! empty( $site['atomic'] ) ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 2 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'wpcomsh/wpcomsh.php' );
		}
		Status_Cache::clear();
	}

	/**
	 * Undo arrange_moved_out_site().
	 */
	private function restore_moved_out_site() {
		if ( null === $this->moved_out_site ) {
			return;
		}

		remove_all_filters( 'jetpack_feature_flag_enabled_' . My_Jetpack_Initializer::SETTINGS_CONSOLIDATION_FLAG );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Monetize_Dashboard::FEATURE_FLAG );
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		remove_filter( 'jetpack_get_available_modules', $this->moved_out_site['modules'], PHP_INT_MAX );
		remove_filter( 'pre_option_active_plugins', $this->moved_out_site['plugins'], PHP_INT_MAX );
		Jetpack_Options::update_option( 'active_modules', $this->moved_out_site['active_modules'] );

		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		if ( null !== $this->moved_out_site['protect_page'] ) {
			$GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] = $this->moved_out_site['protect_page'];
		}

		// Stats_Options caches its options in a static the database rollback doesn't reach.
		Stats_Options::set_option( 'enable_odyssey_stats', $this->moved_out_site['odyssey'] );
		self::set_stats_v2_booted( $this->moved_out_site['stats_v2'] );
		Constants::clear_constants();
		Status_Cache::clear();
		$this->moved_out_site = null;
	}

	/**
	 * Pin whether Stats v2 booted in this request, which Analytics::init() sets once per process.
	 *
	 * @param bool $booted Whether it booted.
	 */
	private static function set_stats_v2_booted( $booted ) {
		$initialized = new ReflectionProperty( Analytics::class, 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}
		$initialized->setValue( null, $booted );
	}

	/**
	 * Tests that the page registers under the Jetpack menu with its own hook.
	 */
	public function test_registers_the_settings_page() {
		$this->assertSame( 'jetpack_page_jetpack-settings', ( new Jetpack_Settings_React_Page() )->get_page_hook() );
	}

	/**
	 * Tests that a connected admin sees the Settings entry.
	 */
	public function test_connected_admins_see_the_entry() {
		$this->assertContains( 'jetpack-settings', $this->register_and_list_slugs() );

		Admin_Menu::remove_hidden_menu_items();

		$this->assertContains( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'], 2 ) );
	}

	/**
	 * Tests that an unconnected site keeps the page for the connection screen but hides its entry.
	 */
	public function test_unconnected_site_keeps_the_page_but_hides_the_entry() {
		foreach ( array( 'master_user', 'id', 'blog_token', 'user_tokens', 'purchase_token' ) as $option ) {
			Jetpack_Options::delete_option( $option );
		}
		( new Connection_Manager() )->reset_connection_status();

		$this->assertContains( 'jetpack-settings', $this->register_and_list_slugs() );

		Admin_Menu::remove_hidden_menu_items();

		$this->assertNotContains( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 ) );
	}

	/**
	 * Tests that an editor without a user connection keeps the page for #/connect-user but loses the entry.
	 */
	public function test_unlinked_editors_keep_the_page_but_lose_the_entry() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertContains( 'jetpack-settings', $this->register_and_list_slugs() );

		Admin_Menu::remove_hidden_menu_items();

		$this->assertNotContains( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 ) );
	}

	/**
	 * @dataProvider provide_settings_consolidation
	 *
	 * @param bool $consolidation Whether settings move to My Jetpack.
	 * @param bool $has_entry     Whether the editor should see the Settings entry.
	 */
	#[DataProvider( 'provide_settings_consolidation' )]
	public function test_post_by_email_gives_linked_editors_the_entry_until_it_moves_to_their_profile( $consolidation, $has_entry ) {
		$active_modules = Jetpack_Options::get_option( 'active_modules' );
		$editor_id      = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );
		Jetpack_Options::update_option( 'user_tokens', Jetpack_Options::get_option( 'user_tokens' ) + array( $editor_id => "honey.badger.$editor_id" ) );
		Jetpack_Options::update_option( 'active_modules', array( 'post-by-email' ) );
		// An earlier test can leave a local site URL, which Status reads as offline.
		add_filter( 'jetpack_offline_mode', '__return_false' );
		add_filter( 'jetpack_feature_flag_enabled_' . My_Jetpack_Initializer::SETTINGS_CONSOLIDATION_FLAG, $consolidation ? '__return_true' : '__return_false' );

		try {
			$this->register_and_list_slugs();
			Admin_Menu::remove_hidden_menu_items();

			$this->assertSame( $has_entry, in_array( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 ), true ) );
		} finally {
			remove_all_filters( 'jetpack_feature_flag_enabled_' . My_Jetpack_Initializer::SETTINGS_CONSOLIDATION_FLAG );
			remove_filter( 'jetpack_offline_mode', '__return_false' );
			Jetpack_Options::update_option( 'active_modules', $active_modules );
		}
	}

	/**
	 * Whether settings move to My Jetpack, and whether an editor with only Post by Email keeps Settings.
	 *
	 * @return array[]
	 */
	public static function provide_settings_consolidation() {
		return array(
			'settings stay'     => array( false, true ),
			'settings move out' => array( true, false ),
		);
	}

	/**
	 * @dataProvider provide_sites_once_settings_move_out
	 *
	 * @param array         $site What the site has, as arrange_moved_out_site() reads it.
	 * @param string[]|null $tabs The tabs left.
	 */
	#[DataProvider( 'provide_sites_once_settings_move_out' )]
	public function test_remaining_tabs_are_the_ones_without_a_new_home( $site, $tabs ) {
		$this->arrange_moved_out_site( $site );

		$this->assertSame( $tabs, Jetpack_Settings_React_Page::get_remaining_tabs() );
	}

	/**
	 * Sites with settings moved out, by what each still has, and the tabs left on Settings.
	 *
	 * @return array[]
	 */
	public static function provide_sites_once_settings_move_out() {
		$settled = array(
			'modules'      => array( 'protect', 'sso', 'stats', 'seo-tools', 'wordads' ),
			'protect_page' => true,
			'odyssey'      => true,
			'ads_home'     => true,
		);

		return array(
			'nothing left'                               => array( $settled, array() ),
			'Security without the Protect page'          => array( array( 'protect_page' => false ) + $settled, array( 'security' ) ),
			'Security for Akismet alone'                 => array(
				array(
					'modules'      => array(),
					'protect_page' => false,
					'akismet'      => true,
				) + $settled,
				array( 'security' ),
			),
			'Traffic for the legacy SEO settings on VIP' => array( array( 'vip' => true ) + $settled, array( 'traffic' ) ),
			'Traffic for canonical URLs alone'           => array(
				array(
					'modules' => array( 'canonical-urls' ),
					'vip'     => true,
				) + $settled,
				array( 'traffic' ),
			),
			'Traffic for classic Stats'                  => array( array( 'odyssey' => false ) + $settled, array( 'traffic' ) ),
			'nothing left on Stats v2'                   => array(
				array(
					'odyssey'   => false,
					'analytics' => true,
				) + $settled,
				array(),
			),
			'Traffic for Google Analytics on Atomic'     => array(
				array(
					'atomic'  => true,
					'modules' => array( 'protect', 'sso', 'stats' ),
				) + $settled,
				array( 'traffic' ),
			),
			'Monetize while the Ads settings stay'       => array( array( 'ads_home' => false ) + $settled, array( 'earn' ) ),
			'null with the flag off'                     => array( array( 'flag_off' => true ) + $settled, null ),
			'null for users who cannot manage modules'   => array( array( 'editor' => true ) + $settled, null ),
		);
	}

	/**
	 * @dataProvider provide_entry_once_settings_move_out
	 *
	 * @param array $site      What the site has, as arrange_moved_out_site() reads it.
	 * @param bool  $has_entry Whether the admin should see the Settings entry.
	 */
	#[DataProvider( 'provide_entry_once_settings_move_out' )]
	public function test_admins_keep_the_entry_only_while_a_tab_is_left( $site, $has_entry ) {
		$this->arrange_moved_out_site( $site );

		// Old page=jetpack-settings#/… links and #/privacy need the page either way.
		$this->assertContains( 'jetpack-settings', $this->register_and_list_slugs() );
		Admin_Menu::remove_hidden_menu_items();

		$this->assertSame( $has_entry, in_array( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 ), true ) );
	}

	/**
	 * Sites with settings moved out, and whether Settings keeps its sidebar entry.
	 *
	 * @return array[]
	 */
	public static function provide_entry_once_settings_move_out() {
		$settled = self::provide_sites_once_settings_move_out()['nothing left'][0];

		return array(
			'nothing left' => array( $settled, false ),
			'a tab left'   => array( array( 'odyssey' => false ) + $settled, true ),
		);
	}

	/**
	 * Tests that core notices stay visible, since the IDC banner is one.
	 */
	public function test_keeps_core_notices_visible() {
		$hook = ( new Jetpack_Settings_React_Page() )->get_page_hook();

		$this->assertFalse( has_action( "load-$hook", array( Admin_Menu::class, 'hide_core_admin_notices' ) ) );
	}

	/**
	 * Tests that the app renders without the PHP masthead, as it did at page=jetpack.
	 */
	public function test_renders_the_app_without_the_php_masthead() {
		$_GET['page'] = 'jetpack-settings';

		ob_start();
		( new Jetpack_Settings_React_Page() )->render();
		$output = ob_get_clean();

		$this->assertNotSame( '', trim( $output ) );
		$this->assertStringNotContainsString( '<!-- START OF CALLBACK -->', $output );
	}

	public function test_falls_back_to_the_modules_list_on_rest_authentication_error() {
		$calls  = 0;
		$reject = static function () use ( &$calls ) {
			++$calls;
			return new WP_Error( 'rest_denied' );
		};
		add_filter( 'rest_authentication_errors', $reject, PHP_INT_MAX );
		try {
			$page = new Jetpack_Settings_React_Page();
			$page->add_fallback_redirects();
			$this->assertSame( 1, $calls );
			$this->assertNotFalse( has_action( 'admin_head', array( $page, 'add_fallback_head_meta' ) ) );
		} finally {
			remove_filter( 'rest_authentication_errors', $reject, PHP_INT_MAX );
		}
	}

	/**
	 * Tests that the page falls back to the modules list when the REST API is off.
	 */
	public function test_falls_back_to_the_modules_list_without_the_rest_api() {
		add_filter( 'rest_authentication_errors', '__return_false' );
		$page = new Jetpack_Settings_React_Page();

		$page->add_fallback_redirects();

		$this->assertNotFalse( has_action( 'admin_head', array( $page, 'add_fallback_head_meta' ) ) );
	}

	/**
	 * Network Admin has its own jetpack-settings page; site pages register from jetpack_admin_menu, which must not fire there.
	 */
	public function test_network_admin_menu_does_not_fire_the_site_menu_hook() {
		$fired = did_action( 'jetpack_admin_menu' );

		do_action( 'network_admin_menu' );

		$this->assertSame( $fired, did_action( 'jetpack_admin_menu' ) );
	}

	public function test_wp_build_page_id_is_not_the_menu_slug() {
		$this->assertNotSame( 'jetpack-settings', Jetpack_Settings_React_Page::WP_BUILD_PAGE_ID );
	}

	public function test_loads_wp_build_on_the_settings_page() {
		set_current_screen( 'dashboard' );
		$_GET['page'] = 'jetpack-settings';

		$this->assertTrue( ( new Jetpack_Settings_React_Page() )->should_load_wp_build() );
	}

	public function test_does_not_load_wp_build_elsewhere() {
		$page = new Jetpack_Settings_React_Page();
		set_current_screen( 'dashboard' );

		$_GET['page'] = 'jetpack';
		$this->assertFalse( $page->should_load_wp_build(), 'Not on another Jetpack page.' );

		unset( $_GET['page'] );
		$this->assertFalse( $page->should_load_wp_build(), 'Not without a page parameter.' );

		set_current_screen( 'front' );
		$_GET['page'] = 'jetpack-settings';
		$this->assertFalse( $page->should_load_wp_build(), 'Not outside wp-admin.' );
	}

	public function test_idc_blocked_page_does_not_load_wp_build() {
		set_current_screen( 'dashboard' );
		$_GET['page'] = 'jetpack-settings';

		$this->assertFalse( $this->page_in_idc()->should_load_wp_build() );
	}

	public function test_rtl_loads_wp_build() {
		global $wp_locale;
		set_current_screen( 'dashboard' );
		$_GET['page']              = 'jetpack-settings';
		$direction                 = $wp_locale->text_direction;
		$wp_locale->text_direction = 'rtl';

		try {
			$this->assertTrue( ( new Jetpack_Settings_React_Page() )->should_load_wp_build() );
		} finally {
			$wp_locale->text_direction = $direction;
		}
	}

	public function test_does_not_render_wp_build_before_loading_it() {
		$this->assertFalse( ( new Jetpack_Settings_React_Page() )->should_render_wp_build() );
	}

	public function test_page_without_wp_build_enqueues_no_bundle() {
		$page = new Jetpack_Settings_React_Page();
		$page->page_admin_scripts();

		$this->assertFalse( wp_script_is( 'react-plugin', 'registered' ) );
	}

	public function test_page_without_wp_build_explains_the_missing_build() {
		ob_start();
		( new Jetpack_Settings_React_Page() )->page_render();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'jp-settings-build-error', $html );
		$this->assertStringNotContainsString( 'jp-loading-placeholder', $html, 'The static.html pre-render is gone.' );
	}

	public function test_wrapper_styles_no_longer_load_the_settings_bundle_css() {
		( new Jetpack_Settings_React_Page() )->additional_styles();

		$this->assertTrue( wp_style_is( 'components-css' ) );
		foreach ( wp_styles()->queue as $handle ) {
			$this->assertStringNotContainsString( '_inc/build/admin', (string) wp_styles()->registered[ $handle ]->src );
		}
	}

	/**
	 * @dataProvider provide_admin_shell_loads
	 *
	 * @param bool $is_hover Whether the shell's hover request readies the page, rather than another dashboard's page.
	 */
	#[DataProvider( 'provide_admin_shell_loads' )]
	public function test_only_the_admin_shell_hover_builds_the_state_without_saving_options( $is_hover ) {
		if ( $is_hover ) {
			add_filter( 'wp_doing_ajax', '__return_true' );
			$_GET['action'] = \Automattic\Jetpack\Admin_UI\Admin_Shell::GUEST_ACTION;
		}
		$user_id = get_current_user_id();
		$options = array( 'sharing-options', "monitor_receive_notifications$user_id", "post_by_email_address$user_id" );
		// Monitor and Post by Email read the user's values from WordPress.com over XML-RPC.
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '<?xml version="1.0"?><methodResponse><params><param><value><string>pbe@example.com</string></value></param></params></methodResponse>',
				);
			}
		);

		$page = $this->page_on_wp_build();
		$page->load_as_admin_shell_guest();
		$page->page_admin_scripts();

		$saved = array();
		foreach ( $options as $option ) {
			$saved[ $option ] = false !== get_option( $option );
		}
		$this->assertStringContainsString( 'pbe@example.com', implode( '', (array) wp_scripts()->get_data( 'react-plugin', 'before' ) ) );
		$this->assertSame( array_fill_keys( $options, ! $is_hover ), $saved );
	}

	/**
	 * @dataProvider provide_admin_shell_loads
	 *
	 * @param bool $is_hover Whether the shell's hover request readies the page, rather than another dashboard's page.
	 */
	#[DataProvider( 'provide_admin_shell_loads' )]
	public function test_only_the_admin_shell_hover_skips_creating_the_purchase_token( $is_hover ) {
		if ( $is_hover ) {
			add_filter( 'wp_doing_ajax', '__return_true' );
			$_GET['action'] = \Automattic\Jetpack\Admin_UI\Admin_Shell::GUEST_ACTION;
		}
		// A site connection with no connected user, the only state that gets a purchase token.
		Jetpack_Options::delete_option( array( 'master_user', 'user_tokens' ) );
		( new Connection_Manager() )->reset_connection_status();
		add_filter( 'pre_http_request', array( $this, 'reject_http_request' ) );

		$page = $this->page_on_wp_build();
		$page->load_as_admin_shell_guest();
		$page->page_admin_scripts();

		$this->assertSame( ! $is_hover, (bool) Jetpack_Options::get_option( 'purchase_token' ) );
		$this->assertSame( 'asdasd.123123', Jetpack_Options::get_option( 'blog_token' ), 'The other private options are untouched.' );
	}

	public function test_admin_shell_hover_holds_back_only_the_purchase_token() {
		add_filter( 'wp_doing_ajax', '__return_true' );
		$_GET['action'] = \Automattic\Jetpack\Admin_UI\Admin_Shell::GUEST_ACTION;
		Jetpack_Options::update_option( 'purchase_token', 'stored' );

		$this->page_on_wp_build()->load_as_admin_shell_guest();
		Jetpack_Options::update_option( 'purchase_token', 'replaced' );
		Jetpack_Options::update_option( 'blog_token', 'new.token' );

		$this->assertSame( 'stored', Jetpack_Options::get_option( 'purchase_token' ) );
		$this->assertSame( 'new.token', Jetpack_Options::get_option( 'blog_token' ) );
	}

	/**
	 * Fail every outgoing request, so building the page state stays offline.
	 *
	 * @return WP_Error
	 */
	public function reject_http_request() {
		return new WP_Error( 'offline', 'No requests in tests.' );
	}

	/**
	 * The shell's hover request, and another dashboard's page readying Settings for a later switch.
	 *
	 * @return array<string, array{bool}>
	 */
	public static function provide_admin_shell_loads() {
		return array(
			'hover request'       => array( true ),
			'another member page' => array( false ),
		);
	}

	public function test_wp_build_page_carries_the_state_without_the_bundle() {
		$page = $this->page_on_wp_build();
		$page->page_admin_scripts();
		$page->additional_styles();

		$this->assertFalse( wp_scripts()->registered['react-plugin']->src, 'The route bundle comes from wp-build.' );
		$this->assertTrue( wp_script_is( 'react-plugin' ) );
		$this->assertContains( 'lodash', wp_scripts()->registered['react-plugin']->deps );
		$this->assertStringContainsString( 'var Initial_State=', implode( '', (array) wp_scripts()->get_data( 'react-plugin', 'before' ) ) );
		$this->assertFalse( wp_style_is( 'components-css' ), 'The route bundle carries its own styles.' );
	}
}

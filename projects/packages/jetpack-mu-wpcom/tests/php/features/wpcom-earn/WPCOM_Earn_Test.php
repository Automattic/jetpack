<?php
/**
 * Tests for the Monetize page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Earn;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-earn/wpcom-earn.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-menu/wpcom-admin-menu.php';

/**
 * Tests for the Monetize page.
 */
class WPCOM_Earn_Test extends \WorDBless\BaseTestCase {

	/**
	 * Screen ID wp-admin gives this page, from its parent and menu slug.
	 */
	const SCREEN_ID = 'jetpack_page_jetpack-earn';

	/**
	 * Register the flag the way the feature file does, since the registry is reset between tests.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		WPCOM_Earn::register_feature_flag();
	}

	/**
	 * Leave the admin globals, flag and page state as they were found.
	 *
	 * @return void
	 */
	public function tear_down() {
		unset(
			$GLOBALS['current_screen'],
			$GLOBALS['pagenow'],
			$GLOBALS['plugin_page'],
			$_GET['page']
		);
		remove_all_filters( 'jetpack_feature_flag_enabled_' . WPCOM_Earn::FLAG );
		Feature_Flags::reset();
		WPCOM_Earn::reset();

		parent::tear_down();
	}

	/**
	 * Reset the admin menu globals and sign in an administrator.
	 *
	 * @return void
	 */
	private function set_up_admin_menu() {
		$GLOBALS['menu']              = array();
		$GLOBALS['submenu']           = array();
		$GLOBALS['admin_page_hooks']  = array();
		$GLOBALS['_registered_pages'] = array();
		$GLOBALS['_parent_pages']     = array();
		$GLOBALS['parent_file']       = '';
		unset( $_GET['page'] );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_earn_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);

		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );
	}

	/**
	 * Put the request on the Monetize page, the way wp-admin/admin.php would.
	 *
	 * Built with WP_Screen::get() rather than set_current_screen(), which would fire
	 * `current_screen` and run other features' callbacks in this shared suite.
	 *
	 * @return void
	 */
	private function set_up_page_request() {
		$GLOBALS['pagenow']     = 'admin.php';
		$GLOBALS['plugin_page'] = WPCOM_Earn::MENU_SLUG;
		$_GET['page']           = WPCOM_Earn::MENU_SLUG;

		$screen = \WP_Screen::get( self::SCREEN_ID );
		// WP_Screen::get() hands back a cached object, whose ID an earlier test may have aliased.
		$screen->id = self::SCREEN_ID;

		$GLOBALS['current_screen'] = $screen;
	}

	/**
	 * Run the enqueue pass and hand back the initial state it printed for the page script.
	 *
	 * @return array|null The payload, or null when nothing was printed.
	 */
	private function printed_initial_state() {
		$handle = WPCOM_Earn::WP_BUILD_PAGE . '-wp-admin-prerequisites';

		// The script registry outlives a test, and with it anything an earlier one printed.
		wp_deregister_script( $handle );
		wp_register_script( $handle, 'https://example.org/prerequisites.js', array(), '1', true );

		WPCOM_Earn::enqueue_initial_state();

		$prefix = 'window.' . WPCOM_Earn::INITIAL_STATE_VAR . ' = ';
		foreach ( (array) wp_scripts()->get_data( $handle, 'before' ) as $script ) {
			if ( is_string( $script ) && str_starts_with( $script, $prefix ) ) {
				return json_decode( substr( $script, strlen( $prefix ), -1 ), true );
			}
		}

		return null;
	}

	/**
	 * A WPCOM_Earn subclass that sees the build as present or absent, whatever this checkout holds.
	 *
	 * @param bool $has_build Whether the build exists.
	 * @return string The subclass name.
	 */
	private function page_with_build( $has_build ) {
		$page = $has_build
			? new class() extends WPCOM_Earn {
				/** @return bool */
				public static function has_build() {
					return true;
				}
			}
			: new class() extends WPCOM_Earn {
				/** @return bool */
				public static function has_build() {
					return false;
				}
			};

		return get_class( $page );
	}

	public function test_page_stays_on_calypso_while_the_flag_is_off() {
		$this->assertFalse( WPCOM_Earn::should_register() );
	}

	public function test_page_registers_once_the_flag_is_on() {
		add_filter( 'jetpack_feature_flag_enabled_' . WPCOM_Earn::FLAG, '__return_true' );

		$this->assertTrue( WPCOM_Earn::should_register() );
	}

	public function test_page_steps_aside_when_another_plugin_owns_the_slug() {
		global $submenu;

		$this->set_up_admin_menu();
		$submenu['jetpack'][] = array( 'Monetize', 'manage_options', WPCOM_Earn::MENU_SLUG, 'Monetize' );

		WPCOM_Earn::register_page();

		$this->assertFalse( WPCOM_Earn::owns_page() );
		$this->assertCount( 1, array_keys( array_column( $submenu['jetpack'], 2 ), WPCOM_Earn::MENU_SLUG, true ) );
	}

	/**
	 * Registration must land after Jetpack's Admin_Menu, and before the WordPress.com
	 * menu decides whether to add the Calypso link.
	 */
	public function test_page_registers_between_admin_menu_and_the_wpcom_jetpack_submenu() {
		add_filter( 'jetpack_feature_flag_enabled_' . WPCOM_Earn::FLAG, '__return_true' );
		$page = $this->page_with_build( true );

		$page::init();
		$priority = has_action( 'admin_menu', array( $page, 'register_page' ) );
		remove_action( 'admin_menu', array( $page, 'register_page' ), WPCOM_Earn::REGISTER_PRIORITY );

		$this->assertGreaterThan( 1000, $priority );
		$this->assertLessThan( has_action( 'admin_menu', 'wpcom_add_jetpack_submenu' ), $priority );
	}

	/**
	 * An unbuilt page would replace the Calypso link with a blank screen.
	 */
	public function test_page_leaves_the_calypso_link_when_the_build_is_missing() {
		add_filter( 'jetpack_feature_flag_enabled_' . WPCOM_Earn::FLAG, '__return_true' );
		$page = $this->page_with_build( false );

		$page::init();

		$this->assertFalse( has_action( 'admin_menu', array( $page, 'register_page' ) ) );
	}

	public function test_render_callback_matches_the_wp_build_page_name() {
		$this->assertSame(
			WPCOM_Earn::RENDER_CALLBACK,
			'jetpack_mu_wpcom_' . str_replace( '-', '_', WPCOM_Earn::WP_BUILD_PAGE ) . '_wp_admin_render_page'
		);
	}

	/**
	 * Pages are declared, not discovered: wp-build only emits a page's PHP when
	 * it is listed in wpPlugin.pages, and an undeclared page renders blank.
	 */
	public function test_wp_build_page_is_declared_in_the_package_manifest() {
		$manifest = (array) json_decode( (string) file_get_contents( Jetpack_Mu_Wpcom::PKG_DIR . 'package.json' ), true );

		$this->assertContains( WPCOM_Earn::WP_BUILD_PAGE, $manifest['wpPlugin']['pages'] ?? array() );
	}

	public function test_screen_id_is_aliased_for_wp_build_and_restored_after() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		WPCOM_Earn::register_page();

		WPCOM_Earn::alias_screen_id();
		$this->assertSame( WPCOM_Earn::WP_BUILD_PAGE, get_current_screen()->id );

		WPCOM_Earn::restore_screen_id();
		$this->assertSame( self::SCREEN_ID, get_current_screen()->id );
	}

	public function test_screen_id_is_left_alone_when_another_plugin_owns_the_page() {
		$this->set_up_page_request();

		WPCOM_Earn::alias_screen_id();

		$this->assertSame( self::SCREEN_ID, get_current_screen()->id );
	}

	public function test_ajax_requests_are_not_page_requests() {
		$this->set_up_page_request();
		$GLOBALS['pagenow'] = 'admin-ajax.php';

		$this->assertFalse( WPCOM_Earn::is_page_request() );
	}

	/**
	 * Every section branches on these, so a key that stops arriving, or a boolean that
	 * arrives as a string, changes what the page offers.
	 */
	public function test_initial_state_reaches_the_page_script_with_its_types_intact() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		WPCOM_Earn::register_page();

		$state = (array) $this->printed_initial_state();

		$this->assertSame(
			array( 'domain', 'blogId', 'siteUrl', 'isAtomic', 'features', 'wordadsEnabled', 'siteIntent' ),
			array_keys( $state )
		);
		$this->assertSame( wp_parse_url( home_url(), PHP_URL_HOST ), $state['domain'] );
		$this->assertSame( array_keys( WPCOM_Earn::FEATURES ), array_keys( $state['features'] ) );
		$this->assertContainsOnlyBool( array_merge( $state['features'], array( $state['isAtomic'], $state['wordadsEnabled'] ) ) );
	}

	public function test_initial_state_is_withheld_from_users_who_cannot_manage_options() {
		$this->set_up_admin_menu();
		$this->set_up_page_request();
		WPCOM_Earn::register_page();

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'wpcom_earn_subscriber',
					'user_pass'  => 'password',
					'role'       => 'subscriber',
				)
			)
		);

		$this->assertNull( $this->printed_initial_state() );
	}

	/**
	 * The page has nowhere to show a JITM, and fetching one records a view.
	 */
	public function test_jitms_are_hidden_on_this_page_only() {
		$this->set_up_admin_menu();
		WPCOM_Earn::register_page();

		$this->assertFalse( WPCOM_Earn::hide_jitms( true, self::SCREEN_ID ) );
		$this->assertTrue( WPCOM_Earn::hide_jitms( true, 'jetpack_page_jetpack-newsletter' ) );
	}

	/**
	 * Once the page owns the slug, the Calypso link would be a second Monetize entry.
	 */
	public function test_wpcom_menu_drops_the_calypso_link_once_the_page_is_registered() {
		$this->set_up_admin_menu();
		\Jetpack_Options::update_option( 'id', 200 );
		$calypso_url = 'https://wordpress.com/earn/' . wp_parse_url( home_url(), PHP_URL_HOST );

		wpcom_add_jetpack_submenu();
		$this->assertContains( $calypso_url, array_column( $GLOBALS['submenu']['jetpack'], 2 ) );

		$GLOBALS['submenu'] = array();
		WPCOM_Earn::register_page();
		wpcom_add_jetpack_submenu();
		$this->assertNotContains( $calypso_url, array_column( $GLOBALS['submenu']['jetpack'], 2 ) );
		$this->assertContains( WPCOM_Earn::MENU_SLUG, array_column( $GLOBALS['submenu']['jetpack'], 2 ) );
	}
}

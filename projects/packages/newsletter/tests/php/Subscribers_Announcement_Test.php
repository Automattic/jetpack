<?php
/**
 * Tests for the Subscribers_Announcement class.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Newsletter\Settings;
use Automattic\Jetpack\Newsletter\Subscribers_Announcement;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Subscribers_Announcement.
 *
 * @covers \Automattic\Jetpack\Newsletter\Subscribers_Announcement
 */
#[CoversClass( Subscribers_Announcement::class )]
class Subscribers_Announcement_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Don't let tracking attempt real HTTP requests.
		add_filter( 'pre_http_request', array( $this, 'mock_http_request' ) );

		// Simulate a connected site so add_menu()'s consumers behave.
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'test_token.secret' );

		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'admin_head' );
		remove_all_actions( 'current_screen' );
		remove_all_filters( Settings::MODERNIZATION_FILTER );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		delete_option( Subscribers_Announcement::REMOVED_OPTION );
		remove_all_filters( Settings::MODERNIZATION_FILTER );
		remove_all_filters( 'pre_http_request' );
		wp_set_current_user( 0 );
		unset( $_GET['page'], $_POST['removed'], $_POST['_ajax_nonce'], $_REQUEST['_ajax_nonce'] );

		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );

		parent::tear_down();
	}

	/**
	 * Short-circuit any HTTP request the tracking client might attempt.
	 *
	 * @return array
	 */
	public function mock_http_request() {
		return array(
			'response' => array( 'code' => 200 ),
			'body'     => '{}',
		);
	}

	/**
	 * Confirms is_enabled() defaults to true and follows the modernization filter.
	 */
	public function test_is_enabled_follows_modernization_filter() {
		$this->assertTrue( Subscribers_Announcement::is_enabled() );

		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );
		$this->assertFalse( Subscribers_Announcement::is_enabled() );
	}

	/**
	 * Confirms init() registers the AJAX, admin-post, and admin_menu handlers.
	 */
	public function test_init_registers_handlers() {
		Subscribers_Announcement::init();

		$this->assertNotFalse(
			has_action(
				'wp_ajax_' . Subscribers_Announcement::TOGGLE_ACTION,
				array( Subscribers_Announcement::class, 'handle_toggle_menu' )
			),
			'Toggle AJAX handler should be registered'
		);
		$this->assertNotFalse(
			has_action(
				'admin_post_' . Subscribers_Announcement::GO_ACTION,
				array( Subscribers_Announcement::class, 'handle_go_to_newsletter' )
			),
			'Go-to-newsletter admin-post handler should be registered'
		);
		$this->assertNotFalse(
			has_action( 'admin_menu', array( Subscribers_Announcement::class, 'maybe_load_wp_build' ) ),
			'wp-build loader should be hooked to admin_menu'
		);
	}

	/**
	 * Confirms add_menu() registers the page and its load callback when the menu is visible.
	 */
	public function test_add_menu_registers_visible_menu() {
		Subscribers_Announcement::add_menu();

		$this->assertNotFalse(
			has_action(
				'load-jetpack_page_' . Subscribers_Announcement::PAGE_SLUG,
				array( Subscribers_Announcement::class, 'on_page_load' )
			),
			'The page load callback should be registered for the visible menu'
		);
	}

	/**
	 * Confirms add_menu() still registers the (hidden) page when the user removed the menu.
	 */
	public function test_add_menu_registers_hidden_page_when_removed() {
		// A hidden page is registered with add_submenu_page(), which checks the
		// current user's capability, so an admin must be in place.
		$this->login_as_admin();
		update_option( Subscribers_Announcement::REMOVED_OPTION, 1 );

		Subscribers_Announcement::add_menu();

		$this->assertNotFalse(
			has_action(
				'load-admin_page_' . Subscribers_Announcement::PAGE_SLUG,
				array( Subscribers_Announcement::class, 'on_page_load' )
			),
			'The page should remain reachable (hidden) when the menu item is removed'
		);
	}

	/**
	 * Confirms add_wp_admin_submenu() registers the page under the Jetpack menu
	 * (the wpcom path used by jetpack-mu-wpcom on Simple and WoA sites).
	 */
	public function test_add_wp_admin_submenu_registers_under_jetpack() {
		// WorDBless does not reset the admin menu globals between tests. Read and
		// write them via $GLOBALS so Phan does not narrow the local to an empty
		// array shape (it can't see add_submenu_page() mutate the global).
		$GLOBALS['menu']    = array();
		$GLOBALS['submenu'] = array();
		// add_submenu_page() checks the current user's capability.
		$this->login_as_admin();
		// Provide the Jetpack parent menu that wpcom-admin-menu would have created.
		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );

		Subscribers_Announcement::add_wp_admin_submenu();

		$slugs = wp_list_pluck( (array) ( $GLOBALS['submenu']['jetpack'] ?? array() ), 2 );
		$this->assertContains(
			Subscribers_Announcement::PAGE_SLUG,
			$slugs,
			'add_wp_admin_submenu() should register the announcement page under the Jetpack menu'
		);
		$this->assertNotFalse(
			has_action(
				'load-jetpack_page_' . Subscribers_Announcement::PAGE_SLUG,
				array( Subscribers_Announcement::class, 'on_page_load' )
			),
			'The page load callback should be registered'
		);
	}

	/**
	 * Confirms add_wp_admin_submenu() keeps the page reachable but out of the
	 * sidebar when the user removed the menu item.
	 */
	public function test_add_wp_admin_submenu_hides_from_sidebar_when_removed() {
		// See note in test_add_wp_admin_submenu_registers_under_jetpack() on why
		// the admin menu globals are accessed via $GLOBALS.
		$GLOBALS['menu']    = array();
		$GLOBALS['submenu'] = array();
		$this->login_as_admin();
		add_menu_page( 'Jetpack', 'Jetpack', 'manage_options', 'jetpack', '__return_null' );
		update_option( Subscribers_Announcement::REMOVED_OPTION, 1 );

		Subscribers_Announcement::add_wp_admin_submenu();

		$slugs = wp_list_pluck( (array) ( $GLOBALS['submenu']['jetpack'] ?? array() ), 2 );
		$this->assertNotContains(
			Subscribers_Announcement::PAGE_SLUG,
			$slugs,
			'The removed page should not appear under the Jetpack sidebar menu'
		);
		$this->assertNotFalse(
			has_action(
				'load-admin_page_' . Subscribers_Announcement::PAGE_SLUG,
				array( Subscribers_Announcement::class, 'on_page_load' )
			),
			'The page should remain reachable (hidden) when the menu item is removed'
		);
	}

	/**
	 * Confirms maybe_load_wp_build() does nothing when the feature is disabled.
	 */
	public function test_maybe_load_wp_build_noop_when_disabled() {
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );
		$_GET['page'] = Subscribers_Announcement::PAGE_SLUG;

		Subscribers_Announcement::maybe_load_wp_build();

		$this->assertFalse(
			has_action( 'current_screen', array( Subscribers_Announcement::class, 'alias_screen_id_for_wp_build' ) ),
			'wp-build should not load while the modernization filter is off'
		);
	}

	/**
	 * Confirms maybe_load_wp_build() does nothing on requests that are not the announcement page.
	 */
	public function test_maybe_load_wp_build_noop_on_other_pages() {
		add_filter( Settings::MODERNIZATION_FILTER, '__return_true' );
		$_GET['page'] = 'some-other-page';

		Subscribers_Announcement::maybe_load_wp_build();

		$this->assertFalse(
			has_action( 'current_screen', array( Subscribers_Announcement::class, 'alias_screen_id_for_wp_build' ) ),
			'wp-build should not load on unrelated admin pages'
		);
	}

	/**
	 * Confirms on_page_load() registers the app-data printer.
	 */
	public function test_on_page_load_registers_app_data() {
		Subscribers_Announcement::on_page_load();

		$this->assertNotFalse(
			has_action( 'admin_head', array( Subscribers_Announcement::class, 'print_app_data' ) ),
			'on_page_load should print app data in the admin head'
		);
	}

	/**
	 * Confirms print_app_data() outputs the data the front-end app expects.
	 */
	public function test_print_app_data_outputs_expected_keys() {
		ob_start();
		Subscribers_Announcement::print_app_data();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'JetpackSubscribersAnnouncementData', $output );

		preg_match( '/JetpackSubscribersAnnouncementData = (\{.*\});/', $output, $matches );
		$this->assertArrayHasKey( 1, $matches, 'A JSON payload should be printed' );

		$data = json_decode( $matches[1], true );
		$this->assertIsArray( $data );
		foreach ( array( 'ajaxUrl', 'toggleAction', 'toggleNonce', 'goToNewsletterUrl', 'menuRemoved', 'menuSlug' ) as $key ) {
			$this->assertArrayHasKey( $key, $data );
		}
		$this->assertSame( Subscribers_Announcement::TOGGLE_ACTION, $data['toggleAction'] );
		$this->assertSame( Subscribers_Announcement::PAGE_SLUG, $data['menuSlug'] );
		$this->assertFalse( $data['menuRemoved'] );
	}

	/**
	 * Confirms print_app_data() reflects the removed state.
	 */
	public function test_print_app_data_reflects_removed_state() {
		update_option( Subscribers_Announcement::REMOVED_OPTION, 1 );

		ob_start();
		Subscribers_Announcement::print_app_data();
		$output = ob_get_clean();

		preg_match( '/JetpackSubscribersAnnouncementData = (\{.*\});/', $output, $matches );
		$data = json_decode( $matches[1], true );
		$this->assertIsArray( $data );
		$this->assertTrue( $data['menuRemoved'] );
	}

	/**
	 * Confirms render_fallback() outputs the announcement heading and the CTA.
	 */
	public function test_render_fallback_outputs_markup() {
		ob_start();
		Subscribers_Announcement::render_fallback();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Subscribers moved', $output );
		$this->assertStringContainsString( 'Take me to Newsletter', $output );
	}

	/**
	 * Confirms alias_screen_id_for_wp_build() rewrites the screen id, and tolerates a non-object.
	 */
	public function test_alias_screen_id_for_wp_build() {
		$screen = (object) array( 'id' => 'jetpack_page_jetpack-subscribers' );
		// A stdClass stands in for WP_Screen; the method only reads/writes ->id.
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal
		Subscribers_Announcement::alias_screen_id_for_wp_build( $screen );
		$this->assertSame( Subscribers_Announcement::WP_BUILD_PAGE, $screen->id );

		// Should not error on a non-object.
		Subscribers_Announcement::alias_screen_id_for_wp_build( null );
		$this->assertTrue( true );
	}

	/**
	 * Confirms handle_toggle_menu() persists the choice and reports success for an authorized user.
	 */
	public function test_handle_toggle_menu_persists_choice() {
		add_filter( Settings::MODERNIZATION_FILTER, '__return_true' );
		$this->login_as_admin();

		$_POST['removed']        = '1';
		$_POST['_ajax_nonce']    = wp_create_nonce( Subscribers_Announcement::TOGGLE_ACTION );
		$_REQUEST['_ajax_nonce'] = $_POST['_ajax_nonce'];

		$response = $this->call_dying_method( array( Subscribers_Announcement::class, 'handle_toggle_menu' ) );

		$this->assertTrue( $response['success'] );
		$this->assertTrue( $response['data']['removed'] );
		$this->assertSame( 1, get_option( Subscribers_Announcement::REMOVED_OPTION ) );
	}

	/**
	 * Confirms handle_toggle_menu() rejects the request when the feature is disabled.
	 */
	public function test_handle_toggle_menu_rejects_when_disabled() {
		// Feature explicitly off — even an admin with a valid nonce is rejected.
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );
		$this->login_as_admin();

		$_POST['removed']        = '1';
		$_POST['_ajax_nonce']    = wp_create_nonce( Subscribers_Announcement::TOGGLE_ACTION );
		$_REQUEST['_ajax_nonce'] = $_POST['_ajax_nonce'];

		$response = $this->call_dying_method( array( Subscribers_Announcement::class, 'handle_toggle_menu' ) );

		$this->assertFalse( $response['success'] );
		$this->assertFalse( get_option( Subscribers_Announcement::REMOVED_OPTION ) );
	}

	/**
	 * Log in as an administrator.
	 */
	private function login_as_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin_user_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Invoke a handler that ends in wp_send_json*, capturing the JSON instead of dying.
	 *
	 * @param callable $callback The handler to invoke.
	 * @return array Decoded JSON response.
	 */
	private function call_dying_method( $callback ) {
		add_filter( 'wp_doing_ajax', '__return_true' );

		// wp_send_json* echoes the JSON and then calls wp_die(). Model wp_die by
		// throwing after the echo, so a handler that bails early (wp_send_json_error)
		// stops there instead of falling through to the success branch — exactly
		// what happens in production.
		$die_handler = static function () {
			/**
			 * @return never
			 * @throws \Exception Always, to model wp_die() halting execution.
			 */
			return static function () {
				throw new \Exception( 'wp_die' );
			};
		};
		add_filter( 'wp_die_ajax_handler', $die_handler, 20 );

		ob_start();
		try {
			call_user_func( $callback );
		} catch ( \Exception $e ) {
			unset( $e ); // Expected — wp_die() was reached after the JSON was echoed.
		}
		$output = ob_get_clean();

		remove_filter( 'wp_die_ajax_handler', $die_handler, 20 );
		remove_filter( 'wp_doing_ajax', '__return_true' );

		$response = json_decode( $output, true );
		$this->assertNotNull( $response, 'Handler did not return valid JSON. Output: ' . substr( (string) $output, 0, 200 ) );

		return $response;
	}
}

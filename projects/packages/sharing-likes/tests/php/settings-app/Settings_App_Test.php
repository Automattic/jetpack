<?php
/**
 * Tests for loading the React version of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings_App;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Settings\Section_Environment;
use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;
use WP_REST_Request;

require_once __DIR__ . '/../lib/class-sharing-service.php';
require_once __DIR__ . '/../lib/trait-section-environment.php';

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Settings_App\Settings_App
 */
#[CoversClass( Settings_App::class )]
class Settings_App_Test extends BaseTestCase {

	use Section_Environment;

	private const FIXTURE_BUILD = __DIR__ . '/../fixtures/wp-build/build.php';

	private const RENDER_FUNCTION = 'jetpack_sharing_likes_jetpack_sharing_settings_wp_admin_render_page';

	/**
	 * Start from a connected site with an administrator on the Sharing page.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_up_site();
		$this->given_connection( true );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'sharing_app_admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		set_current_screen( 'settings_page_sharing' );
		$_GET['page'] = Settings_Page::SLUG;

		// wp-admin/includes/menu.php sets this before `admin_menu`; without it the page hooks `admin_page_sharing`.
		$GLOBALS['admin_page_hooks'] = array( 'options-general.php' => 'settings' );
	}

	/**
	 * Undo the request, the hooks and the statics `load()` sets.
	 */
	public function tear_down() {
		global $submenu, $_registered_pages, $admin_page_hooks;

		$_GET = array();
		unset( $GLOBALS['current_screen'] );
		wp_set_current_user( 0 );

		$this->tear_down_site();
		Constants::clear_constants();
		Jetpack_Options::delete_option( 'active_modules' );

		remove_all_filters( Settings_App::FILTER );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_filters( 'jetpack_disable_twitter_cards' );
		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'settings_page_sharing' );
		remove_all_actions( 'rest_api_init' );
		$GLOBALS['wp_rest_server'] = null;

		$this->set_static( Settings_App::class, 'loaded', false );
		$this->set_static( Settings_App::class, 'original_screen_id', null );
		foreach ( array(
			'requested'            => array(),
			'hooked'               => false,
			'wp_version_threshold' => '7.0',
		) as $name => $value ) {
			$this->set_static( WP_Build_Polyfills::class, $name, $value );
		}

		$submenu           = array();
		$_registered_pages = array();
		$admin_page_hooks  = array();

		parent::tear_down();
	}

	/**
	 * The polyfills force-replace core script handles, so loading anywhere else breaks other screens.
	 *
	 * @param bool        $filter Whether the site opted in.
	 * @param string|null $page   The `page` query argument.
	 * @param bool        $admin  Whether this is a wp-admin request.
	 * @param bool        $loads  Expected result.
	 * @dataProvider provide_requests
	 */
	#[DataProvider( 'provide_requests' )]
	public function test_should_load_only_on_the_sharing_page_with_the_filter_on( bool $filter, ?string $page, bool $admin, bool $loads ): void {
		add_filter( Settings_App::FILTER, $filter ? '__return_true' : '__return_false' );
		$_GET = null === $page ? array() : array( 'page' => $page );
		if ( ! $admin ) {
			unset( $GLOBALS['current_screen'] );
		}

		$this->assertSame( $loads, Settings_App::should_load() );
	}

	/**
	 * Requests and whether they load the app.
	 *
	 * @return array<string, array{bool, ?string, bool, bool}>
	 */
	public static function provide_requests(): array {
		return array(
			'opted in, Sharing page'    => array( true, 'sharing', true, true ),
			'filter off'                => array( false, 'sharing', true, false ),
			'another settings page'     => array( true, 'jetpack', true, false ),
			'no page argument'          => array( true, null, true, false ),
			'not wp-admin (admin-menu)' => array( true, 'sharing', false, false ),
		);
	}

	/**
	 * Until the build loads, the menu keeps the PHP screen.
	 */
	public function test_menu_keeps_the_php_screen_until_the_build_loads(): void {
		Settings_Page::register_menu();

		$this->assertNotFalse( has_action( 'settings_page_sharing', array( Settings_Page::class, 'render' ) ) );
	}

	/**
	 * Once the build loads, the same slug renders the app.
	 */
	public function test_menu_renders_the_app_once_the_build_loads(): void {
		Settings_App::load( self::FIXTURE_BUILD );
		Settings_Page::register_menu();

		$this->assertNotFalse( has_action( 'settings_page_sharing', self::RENDER_FUNCTION ) );
		$this->assertFalse( has_action( 'settings_page_sharing', array( Settings_Page::class, 'render' ) ) );
	}

	/**
	 * An unbuilt checkout gets the PHP screen, not a blank page, and nothing else changes.
	 */
	public function test_a_missing_build_changes_nothing(): void {
		Settings_App::load( __DIR__ . '/does-not-exist/build.php' );

		$this->assertNull( Settings_App::render_callback() );
		$this->assertSame( array(), WP_Build_Polyfills::get_consumers() );
		$this->assertFalse( has_filter( 'jetpack_admin_js_script_data', array( Settings_App::class, 'add_script_data' ) ) );
	}

	/**
	 * A build that lacks the page's render function keeps the PHP screen and leaves core's scripts alone.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_partial_build_changes_nothing(): void {
		$this->assertFalse( function_exists( self::RENDER_FUNCTION ), 'Another test already loaded the full fixture.' );

		Settings_App::load( __DIR__ . '/../fixtures/wp-build-partial/build.php' );

		$this->assertNull( Settings_App::render_callback() );
		$this->assertSame( array(), WP_Build_Polyfills::get_consumers() );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Settings_App::class, 'alias_screen_id' ) ) );
		$this->assertFalse( has_filter( 'jetpack_admin_js_script_data', array( Settings_App::class, 'add_script_data' ) ) );
	}

	/**
	 * Another settings page with the filter on loads nothing: no polyfills, no build, no script data.
	 */
	public function test_maybe_load_does_nothing_on_another_page(): void {
		add_filter( Settings_App::FILTER, '__return_true' );
		$_GET['page'] = 'general';

		Settings_App::maybe_load();

		$this->assertNull( Settings_App::render_callback() );
		$this->assertSame( array(), WP_Build_Polyfills::get_consumers() );
		$this->assertFalse( has_filter( 'jetpack_admin_js_script_data', array( Settings_App::class, 'add_script_data' ) ) );
	}

	/**
	 * Loading registers the polyfills, the i18n loader and the script data.
	 */
	public function test_load_registers_polyfills_i18n_and_script_data(): void {
		Settings_App::load( self::FIXTURE_BUILD );

		$this->assertContains( 'jetpack-sharing-likes', array_merge( ...array_values( WP_Build_Polyfills::get_consumers() ) ) );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( Settings_App::class, 'enqueue_i18n_loader' ) ) );
		$this->assertNotFalse( has_filter( 'jetpack_admin_js_script_data', array( Settings_App::class, 'add_script_data' ) ) );
	}

	/**
	 * The generated standalone renderer would take over its page ID outside wp-admin chrome.
	 */
	public function test_load_removes_the_standalone_renderer(): void {
		add_action( 'admin_init', 'jetpack_sharing_likes_jetpack_sharing_settings_intercept_render' );

		Settings_App::load( self::FIXTURE_BUILD );

		$this->assertFalse( has_action( 'admin_init', 'jetpack_sharing_likes_jetpack_sharing_settings_intercept_render' ) );
	}

	/**
	 * Only wp-build's own check may see the aliased ID; JITMs and everything after read the real one.
	 */
	public function test_screen_id_alias_round_trips(): void {
		Settings_App::alias_screen_id();
		$this->assertSame( Settings_App::WP_BUILD_PAGE, get_current_screen()->id );

		Settings_App::restore_screen_id();
		$this->assertSame( 'settings_page_sharing', get_current_screen()->id );
	}

	/**
	 * The placement checkboxes need every choice and its label, which `settings.show` does not carry.
	 */
	public function test_script_data_lists_placement_choices_with_labels(): void {
		$choices = Settings_App::add_script_data( array() )['sharing_likes']['placement_choices'];

		$this->assertSame(
			array(
				'value' => 'index',
				'label' => 'Front Page, Archive Pages, and Search Results',
			),
			$choices[0]
		);
		$this->assertContains(
			array(
				'value' => 'post',
				'label' => 'Posts',
			),
			$choices
		);
	}

	/**
	 * The first paint must match what the routes would answer, or the first save acts on stale data.
	 */
	public function test_script_data_matches_the_routes(): void {
		$GLOBALS['wp_rest_server'] = new \WP_REST_Server();
		\Automattic\Jetpack\Sharing_Likes\REST\Endpoints::init();
		do_action( 'rest_api_init', $GLOBALS['wp_rest_server'] );

		$data = Settings_App::add_script_data( array() )['sharing_likes'];

		$status   = rest_do_request( new WP_REST_Request( 'GET', '/wpcom/v2/sharing-likes/status' ) );
		$settings = rest_do_request( new WP_REST_Request( 'GET', '/wpcom/v2/sharing-likes/settings' ) );

		$this->assertSame( $status->get_data(), $data['status'] );
		$this->assertSame( $settings->get_data(), (array) $data['settings'] );
	}

	/**
	 * `[]` would reach the client as an array, and `'key' in settings` would stop meaning what it says.
	 */
	public function test_script_data_encodes_empty_settings_as_an_object(): void {
		$this->given_connection( false );
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_disable_twitter_cards', '__return_true' );

		$json = wp_json_encode( Settings_App::add_script_data( array() )['sharing_likes']['settings'], JSON_UNESCAPED_SLASHES );

		$this->assertSame( '{}', $json );
	}

	/**
	 * The data is for the screen's own users only.
	 */
	public function test_script_data_is_not_added_for_users_who_cannot_manage_options(): void {
		wp_set_current_user( 0 );

		$this->assertSame( array(), Settings_App::add_script_data( array() ) );
	}

	/**
	 * Set a private static property.
	 *
	 * @param string $class_name Class.
	 * @param string $name       Property.
	 * @param mixed  $value      Value.
	 */
	private function set_static( string $class_name, string $name, $value ): void {
		$property = new \ReflectionProperty( $class_name, $name );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $value );
	}
}

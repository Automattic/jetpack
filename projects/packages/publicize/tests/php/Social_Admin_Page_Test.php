<?php
/**
 * Tests for the Social_Admin_Page class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for Social_Admin_Page.
 */
class Social_Admin_Page_Test extends BaseTestCase {
	/**
	 * Flag to assert that a plan refresh was triggered.
	 *
	 * @var bool
	 */
	protected $refresh_called = false;

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );

		Jetpack_Options::update_option( 'id', 123 );
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_plan_request' ), 10, 3 );
		add_filter( 'jetpack_social_should_refresh_plan_data', array( $this, 'capture_refresh_attempt' ) );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_plan_request' ), 10 );
		remove_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ), 10 );
		remove_filter( 'jetpack_social_should_refresh_plan_data', array( $this, 'capture_refresh_attempt' ) );

		remove_action( 'admin_enqueue_scripts', array( Social_Admin_Page::class, 'alias_screen_id_for_wp_build' ) );
		remove_action( 'admin_enqueue_scripts', array( Social_Admin_Page::class, 'restore_screen_id_after_wp_build' ) );
		remove_action( 'admin_enqueue_scripts', array( Social_Admin_Page::init(), 'enqueue_guest_scripts' ) );
		wp_dequeue_script( Social_Admin_Page::GUEST_DATA_HANDLE );
		wp_deregister_script( Social_Admin_Page::GUEST_DATA_HANDLE );
		$this->set_wp_build_index( null );
		unset( $_GET['refresh_plan_data'], $_GET['_wpnonce'], $_GET['page'], $GLOBALS['current_screen'] );
		$this->refresh_called = false;
		Jetpack_Options::delete_option( 'id' );

		if ( $this->admin_id ) {
			wp_delete_user( $this->admin_id );
		}

		parent::tear_down();
	}

	/**
	 * Mock WPCOM plan request to avoid outbound calls.
	 *
	 * @param mixed  $preempt Whether to preempt the request.
	 * @param array  $args    Request args.
	 * @param string $url     Request URL.
	 * @return array Mocked HTTP response.
	 */
	public function mock_wpcom_plan_request( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->refresh_called = true;

		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode(
				array(
					'plan'     => array( 'product_slug' => 'jetpack_free' ),
					'products' => array(),
				),
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
			),
			'headers'  => array(),
			'cookies'  => array(),
		);
	}

	/**
	 * Capture refresh attempts while allowing tests to short-circuit.
	 *
	 * @return bool
	 */
	public function capture_refresh_attempt() {
		$this->refresh_called = true;
		return false;
	}

	/**
	 * Custom wp_die handler for assertions.
	 *
	 * @return callable
	 */
	public function throw_on_wp_die() {
		/**
		 * Custom wp_die handler that throws an exception to allow assertions on wp_die calls.
		 *
		 * @param string|\Stringable $message Error message passed to wp_die.
		 *
		 * @return never
		 *
		 * @throws \Exception When invoked for assertions.
		 */
		return static function ( $message ) {
			throw new \Exception( esc_html( $message ) );
		};
	}

	/**
	 * It refreshes plan data when the nonce is valid.
	 */
	public function test_admin_init_refreshes_plan_with_valid_nonce() {
		$_GET['refresh_plan_data']     = '1';
		$_REQUEST['refresh_plan_data'] = '1';
		$_REQUEST['_wpnonce']          = wp_create_nonce( Social_Admin_Page::REFRESH_PLAN_NONCE_ACTION );
		$_GET['_wpnonce']              = $_REQUEST['_wpnonce'];

		Social_Admin_Page::init()->admin_init();

		$this->assertTrue( $this->refresh_called );
	}

	/**
	 * The wp-build dashboard owns its own enqueue pipeline, so the enqueue step
	 * never registers a legacy admin script.
	 */
	public function test_enqueue_does_not_register_legacy_script() {
		Social_Admin_Page::init()->enqueue_admin_scripts();

		$this->assertFalse(
			wp_script_is( 'social-admin-page', 'registered' ),
			'The removed legacy admin script should never be registered.'
		);
	}

	/**
	 * It rejects plan refresh when the nonce is missing or invalid.
	 */
	public function test_admin_init_rejects_plan_refresh_without_valid_nonce() {
		$this->expectException( \Exception::class );

		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ), 10 );

		$_GET['refresh_plan_data']     = '1';
		$_REQUEST['refresh_plan_data'] = '1';
		$_REQUEST['_wpnonce']          = 'invalid';
		$_GET['_wpnonce']              = $_REQUEST['_wpnonce'];

		Social_Admin_Page::init()->admin_init();
	}

	public function test_maybe_load_wp_build_hooks_the_screen_alias_around_the_generated_check() {
		set_current_screen( 'jetpack_page_jetpack-social' );
		$_GET['page'] = 'jetpack-social';

		Social_Admin_Page::maybe_load_wp_build();

		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Social_Admin_Page::class, 'alias_screen_id_for_wp_build' ) ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Social_Admin_Page::class, 'restore_screen_id_after_wp_build' ) ) );
		$this->assertFalse( has_action( 'current_screen', array( Social_Admin_Page::class, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_screen_id_is_restored_after_admin_enqueue_scripts() {
		set_current_screen( 'jetpack_page_jetpack-social' );
		$_GET['page'] = 'jetpack-social';

		Social_Admin_Page::maybe_load_wp_build();
		do_action( 'current_screen', get_current_screen() );
		do_action( 'admin_enqueue_scripts', 'jetpack_page_jetpack-social' );

		$this->assertSame( 'jetpack_page_jetpack-social', get_current_screen()->id );
	}

	public function test_alias_screen_id_round_trip() {
		unset( $GLOBALS['current_screen'] );
		Social_Admin_Page::alias_screen_id_for_wp_build();
		Social_Admin_Page::restore_screen_id_after_wp_build();

		set_current_screen( 'jetpack_page_jetpack-social' );
		Social_Admin_Page::restore_screen_id_after_wp_build();
		$this->assertSame( 'jetpack_page_jetpack-social', get_current_screen()->id );

		Social_Admin_Page::alias_screen_id_for_wp_build();
		$this->assertSame( 'jetpack-social-dashboard', get_current_screen()->id );

		Social_Admin_Page::restore_screen_id_after_wp_build();
		$this->assertSame( 'jetpack_page_jetpack-social', get_current_screen()->id );
	}

	/**
	 * Who the admin shell offers Social to: the users the Social menu shows it to, on a built, non-Simple site.
	 *
	 * @return array
	 */
	public static function provide_admin_shell_member_cases() {
		return array(
			'admin, Publicize off'  => array( 'administrator', false, true, false, true, true ),
			'author, Publicize off' => array( 'author', false, true, false, true, false ),
			'author, Publicize on'  => array( 'author', true, true, false, true, true ),
			'unbuilt'               => array( 'administrator', false, false, false, true, false ),
			'Simple'                => array( 'administrator', false, true, true, true, false ),
			'not connected'         => array( 'administrator', false, true, false, false, false ),
		);
	}

	/**
	 * The shell member applies the Social menu's gates, and needs the wp-build dashboard.
	 *
	 * @dataProvider provide_admin_shell_member_cases
	 *
	 * @param string $role         The current user's role.
	 * @param bool   $publicize_on Whether the Publicize module is active.
	 * @param bool   $built        Whether build/build.php exists.
	 * @param bool   $simple       Whether the site is WordPress.com Simple.
	 * @param bool   $connected    Whether the site has a blog token.
	 * @param bool   $expected     Whether Social joins the shell.
	 */
	#[DataProvider( 'provide_admin_shell_member_cases' )]
	public function test_admin_shell_member_follows_the_menu_gate( $role, $publicize_on, $built, $simple, $connected, $expected ) {
		$this->set_wp_build_index( __DIR__ . ( $built ? '/files/build-entry/build.php' : '/files/build-entry/absent.php' ) );
		if ( $connected ) {
			( new Tokens() )->update_blog_token( 'blog.token' );
		}
		if ( $simple ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}
		$active_modules = static function () use ( $publicize_on ) {
			return $publicize_on ? array( 'publicize' ) : array();
		};
		add_filter( 'jetpack_active_modules', $active_modules );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'shell_' . $role,
					'user_pass'  => 'password',
					'role'       => $role,
				)
			)
		);

		// is_connected() caches its answer across tests.
		( new Connection_Manager() )->reset_connection_status();

		try {
			$members = Social_Admin_Page::init()->add_admin_shell_member( array() );
		} finally {
			remove_filter( 'jetpack_active_modules', $active_modules );
			Jetpack_Options::delete_option( 'blog_token' );
			( new Connection_Manager() )->reset_connection_status();
			Constants::clear_single_constant( 'IS_WPCOM' );
		}

		$this->assertSame( $expected, isset( $members['jetpack-social'] ) );
	}

	/**
	 * Hosted by another dashboard, Social hydrates its connection store on a script of its own when assets print.
	 */
	public function test_admin_shell_guest_hydrates_the_connection_store() {
		$this->set_wp_build_index( __DIR__ . '/files/build-entry/build.php' );
		Social_Admin_Page::init()->load_as_admin_shell_guest();

		set_current_screen( 'toplevel_page_jetpack' );
		do_action( 'admin_enqueue_scripts', 'toplevel_page_jetpack' );

		$this->assertTrue( wp_script_is( Social_Admin_Page::GUEST_DATA_HANDLE, 'enqueued' ) );
		$this->assertNotEmpty( wp_scripts()->get_data( Social_Admin_Page::GUEST_DATA_HANDLE, 'before' ) );
	}

	/**
	 * Data provider for test_admin_shell_header_opens_settings_while_social_is_off.
	 *
	 * @return array[] Whether the site is WoA.
	 */
	public static function provide_hosts_that_can_turn_social_on() {
		return array(
			'self-hosted' => array( false ),
			'WoA'         => array( true ),
		);
	}

	/**
	 * Like the dashboard's canToggleSocialModule(), only Simple keeps an admin off Settings while Social is off.
	 *
	 * @dataProvider provide_hosts_that_can_turn_social_on
	 *
	 * @param bool $woa Whether the site is WoA.
	 */
	#[DataProvider( 'provide_hosts_that_can_turn_social_on' )]
	public function test_admin_shell_header_opens_settings_while_social_is_off( $woa ) {
		$this->set_wp_build_index( __DIR__ . '/files/build-entry/build.php' );
		( new Tokens() )->update_blog_token( 'blog.token' );
		( new Connection_Manager() )->reset_connection_status();
		if ( $woa ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 2 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', __FILE__ );
		}
		$can_manage_modules = static function ( $caps ) {
			return array( 'jetpack_manage_modules' => true ) + $caps;
		};
		add_filter( 'user_has_cap', $can_manage_modules );
		add_filter( 'jetpack_active_modules', '__return_empty_array' );
		Cache::clear();

		$members = array();
		try {
			$members = Social_Admin_Page::init()->add_admin_shell_member( array() );
		} finally {
			remove_filter( 'user_has_cap', $can_manage_modules );
			remove_filter( 'jetpack_active_modules', '__return_empty_array' );
			Jetpack_Options::delete_option( 'blog_token' );
			( new Connection_Manager() )->reset_connection_status();
			Constants::clear_constants();
			Cache::clear();
		}

		$this->assertSame( 'Customize how your posts are shared to social media.', $members['jetpack-social']['header']['subtitle'] ?? null );
	}

	/**
	 * Point the build-entry lookup at a path of our choosing, or back at the real one with null.
	 *
	 * @param string|null $path Path to stand in for build/build.php.
	 */
	private function set_wp_build_index( $path ) {
		$property = new \ReflectionProperty( Social_Admin_Page::class, 'wp_build_index' );
		if ( \PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $path );
	}
}

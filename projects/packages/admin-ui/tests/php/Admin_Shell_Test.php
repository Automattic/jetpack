<?php
/**
 * Admin_Shell tests.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Admin_Shell tests.
 *
 * @covers \Automattic\Jetpack\Admin_UI\Admin_Shell
 */
#[CoversClass( Admin_Shell::class )]
class Admin_Shell_Test extends TestCase {

	/**
	 * Actions a test added, removed in tearDown().
	 *
	 * @var array[]
	 */
	private $added_actions = array();

	/**
	 * Whether a test unhooked print_emoji_styles.
	 *
	 * @var bool
	 */
	private $unhook_emoji_styles = false;

	/**
	 * Register the flag the way the plugin does.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		Admin_Shell::register_feature_flag();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
	}

	/**
	 * Clear the registry, filters and query string.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		Feature_Flags::reset();
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Admin_Shell::FLAG );
		remove_all_filters( 'jetpack_admin_shell_enabled' );
		remove_all_filters( 'jetpack_admin_shell_members' );
		remove_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		remove_all_filters( 'host-page-wp-admin_boot_dependencies' );
		remove_all_filters( 'script_module_data_' . Admin_Shell::CLIENT_MODULE );
		unset( $_GET[ Admin_Shell::DISABLE_QUERY_ARG ], $_GET['page'], $_REQUEST['nonce'], $GLOBALS['jetpack_shell_test_guest_page_routes_data'], $GLOBALS['hook_suffix'] );
		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'wp_die_ajax_handler' );
		foreach ( $this->added_actions as list( $hook, $callback ) ) {
			remove_action( $hook, $callback );
		}
		if ( $this->unhook_emoji_styles ) {
			add_action( 'wp_print_styles', 'print_emoji_styles' );
			$this->unhook_emoji_styles = false;
		}
		$GLOBALS['wp_scripts'] = null;
		$GLOBALS['wp_styles']  = null;
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * The shell must ship off.
	 *
	 * @return void
	 */
	public function test_flag_is_registered_off_by_default() {
		$this->assertFalse( Feature_Flags::get( Admin_Shell::FLAG )['default'] ?? null );
		$this->assertFalse( Admin_Shell::is_enabled() );
	}

	/**
	 * Data provider for test_is_enabled.
	 *
	 * @return array[] Flag state, `jetpack_admin_shell_enabled` result (null for none), query arg (null for none), expected.
	 */
	public static function provide_is_enabled_cases() {
		return array(
			'flag on'                        => array( true, null, null, true ),
			'flag on, filter turns it off'   => array( true, false, null, false ),
			'flag off, filter turns it on'   => array( false, true, null, true ),
			'flag on, query arg 0'           => array( true, null, '0', false ),
			'filter on, query arg 0'         => array( false, true, '0', false ),
			'flag on, any other query value' => array( true, null, '1', true ),
		);
	}

	/**
	 * The filter overrides the flag, and `?jetpack_admin_shell=0` overrides both.
	 *
	 * @dataProvider provide_is_enabled_cases
	 *
	 * @param bool        $flag      Feature flag state.
	 * @param bool|null   $filter    What `jetpack_admin_shell_enabled` returns, or null to leave it unhooked.
	 * @param string|null $query_arg Value of `?jetpack_admin_shell`, or null to leave it out.
	 * @param bool        $expected  Expected result.
	 * @return void
	 */
	#[DataProvider( 'provide_is_enabled_cases' )]
	public function test_is_enabled( $flag, $filter, $query_arg, $expected ) {
		add_filter( 'jetpack_feature_flag_enabled_' . Admin_Shell::FLAG, $flag ? '__return_true' : '__return_false' );
		if ( null !== $filter ) {
			add_filter( 'jetpack_admin_shell_enabled', $filter ? '__return_true' : '__return_false' );
		}
		if ( null !== $query_arg ) {
			$_GET[ Admin_Shell::DISABLE_QUERY_ARG ] = $query_arg;
		}

		$this->assertSame( $expected, Admin_Shell::is_enabled() );
	}

	/**
	 * Data provider for test_get_members_fills_in_only_missing_keys.
	 *
	 * @return array[] Member, expected optional keys.
	 */
	public static function provide_valid_members() {
		$set = array(
			'init_modules' => array( '@jetpack/forms-init' ),
			'default_path' => '/responses',
			'capability'   => 'edit_posts',
			'handles'      => array( 'jetpack-forms-dashboard' ),
		);

		return array(
			'required keys only' => array(
				self::valid_member(),
				array(
					'init_modules' => array(),
					'default_path' => null,
					'capability'   => 'manage_options',
					'handles'      => array(),
				),
			),
			'every key set'      => array( $set + self::valid_member(), $set ),
		);
	}

	/**
	 * Optional keys a member leaves out get defaults, and the ones it sets are kept.
	 *
	 * @dataProvider provide_valid_members
	 *
	 * @param array $member   Member definition.
	 * @param array $optional Expected optional keys.
	 * @return void
	 */
	#[DataProvider( 'provide_valid_members' )]
	public function test_get_members_fills_in_only_missing_keys( $member, $optional ) {
		$this->add_members( array( 'jetpack-forms-admin' => $member ) );

		$expected = $optional + self::valid_member();
		$actual   = Admin_Shell::get_members()['jetpack-forms-admin'] ?? array();
		ksort( $expected );
		ksort( $actual );
		$this->assertSame( $expected, $actual );
	}

	/**
	 * Data provider for test_get_members_drops_invalid_member.
	 *
	 * @return array[] Slug, member.
	 */
	public static function provide_invalid_members() {
		$valid   = self::valid_member();
		$without = static function ( $key ) use ( $valid ) {
			unset( $valid[ $key ] );
			return $valid;
		};

		return array(
			'numeric slug'           => array( 0, $valid ),
			'slug needs sanitizing'  => array( 'Jetpack Forms', $valid ),
			'not an array'           => array( 'jetpack-forms', 'jetpack-forms' ),
			'no build_prefix'        => array( 'jetpack-forms', $without( 'build_prefix' ) ),
			'no build_page'          => array( 'jetpack-forms', $without( 'build_page' ) ),
			'empty title'            => array( 'jetpack-forms', array( 'title' => '' ) + $valid ),
			'no load'                => array( 'jetpack-forms', $without( 'load' ) ),
			'load not callable'      => array( 'jetpack-forms', array( 'load' => 'jetpack_no_such_function' ) + $valid ),
			'init_modules not list'  => array( 'jetpack-forms', array( 'init_modules' => array( 'a' => '@jetpack/forms' ) ) + $valid ),
			'handles holds non-text' => array( 'jetpack-forms', array( 'handles' => array( 1 ) ) + $valid ),
			'empty capability'       => array( 'jetpack-forms', array( 'capability' => '' ) + $valid ),
			'default_path not text'  => array( 'jetpack-forms', array( 'default_path' => 1 ) + $valid ),
		);
	}

	/**
	 * A member that breaks the contract is dropped with a notice, and the others still load.
	 *
	 * @dataProvider provide_invalid_members
	 *
	 * @param mixed $slug   Admin page slug.
	 * @param mixed $member Member definition.
	 * @return void
	 */
	#[DataProvider( 'provide_invalid_members' )]
	public function test_get_members_drops_invalid_member( $slug, $member ) {
		$this->add_members(
			array(
				$slug        => $member,
				'my-jetpack' => self::valid_member(),
			)
		);
		$notices = did_action( 'doing_it_wrong_run' );

		$this->assertSame( array( 'my-jetpack' ), array_keys( Admin_Shell::get_members() ) );
		$this->assertSame( $notices + 1, did_action( 'doing_it_wrong_run' ) );
	}

	/**
	 * A filter that returns something other than an array yields no members.
	 *
	 * @return void
	 */
	public function test_get_members_ignores_non_array_filter_result() {
		$this->add_members( 'jetpack-forms' );

		$this->assertSame( array(), Admin_Shell::get_members() );
	}

	/**
	 * Data provider for test_get_host.
	 *
	 * @return array[] Flag state, `page` query arg (null for none), member slugs, expected host, screen (null for the page's own).
	 */
	public static function provide_hosts() {
		$both = array( 'my-jetpack', 'jetpack-forms' );
		return array(
			'member page'                   => array( true, 'my-jetpack', $both, 'my-jetpack' ),
			'other admin page'              => array( true, 'jetpack-settings', $both, null ),
			'no page'                       => array( true, null, $both, null ),
			'only one member'               => array( true, 'my-jetpack', array( 'my-jetpack' ), null ),
			'flag off'                      => array( false, 'my-jetpack', $both, null ),
			'page is not a text'            => array( true, array( 'my-jetpack' ), $both, null ),
			'member slug on another screen' => array( true, 'my-jetpack', $both, null, 'toplevel_page_my-jetpack' ),
		);
	}

	/**
	 * The shell only runs on a member page, and only with another member to switch to.
	 *
	 * @dataProvider provide_hosts
	 *
	 * @param bool        $flag     Feature flag state.
	 * @param mixed       $page     Value of `?page`, or null to leave it out.
	 * @param string[]    $slugs    Registered member slugs.
	 * @param string|null $expected Expected host.
	 * @param string|null $screen   Hook suffix of the screen, or null for the page's own.
	 * @return void
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_get_host( $flag, $page, $slugs, $expected, $screen = null ) {
		add_filter( 'jetpack_feature_flag_enabled_' . Admin_Shell::FLAG, $flag ? '__return_true' : '__return_false' );
		$this->add_members( array_fill_keys( $slugs, self::valid_member() ) );
		if ( null !== $page ) {
			$_GET['page'] = $page;
		}
		$GLOBALS['hook_suffix'] = $screen ?? ( is_string( $page ) ? Admin_Shell::screen_id( $page ) : 'index.php' );

		$this->assertSame( $expected, Admin_Shell::get_host() );
	}

	/**
	 * On a host page, a guest's routes join the import map, and the page hooks its loader added wait for the guest endpoint.
	 *
	 * @return void
	 */
	public function test_setup_loads_guest_and_defers_its_hooks() {
		$guest_enqueue = static function () {};
		$host_enqueue  = static function () {};
		$this->add_action( 'admin_enqueue_scripts', $host_enqueue );
		$this->start_host_page(
			static function () use ( $guest_enqueue ) {
				add_action( 'admin_enqueue_scripts', $guest_enqueue );
				$GLOBALS['jetpack_shell_test_guest_page_routes_data'] = array(
					array(
						'path'    => '/',
						'content' => 'guest/routes/home/content',
						'route'   => 'guest/routes/home/route',
					),
				);
			}
		);

		Admin_Shell::setup();

		$this->assertFalse( has_action( 'admin_enqueue_scripts', $guest_enqueue ), 'the guest page hook was removed' );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', $host_enqueue ), 'hooks from before the guest loaded stay' );
		$this->assertSame(
			array(
				array(
					'import' => 'dynamic',
					'id'     => '@jetpack/guest-init',
				),
				array(
					'import' => 'dynamic',
					'id'     => 'guest/routes/home/route',
				),
				array(
					'import' => 'dynamic',
					'id'     => 'guest/routes/home/content',
				),
			),
			apply_filters( 'host-page-wp-admin_boot_dependencies', array() ) // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- wp-build names this hook.
		);
		$config = apply_filters( 'script_module_data_' . Admin_Shell::CLIENT_MODULE, array() );
		$this->assertSame( 'host-page', $config['host'] ?? null );
		$this->assertSame( array( 'host-page', 'guest-page' ), array_keys( $config['members'] ?? array() ) );
		$this->assertSame(
			array(
				array(
					'path'           => '/',
					'content_module' => 'guest/routes/home/content',
					'route_module'   => 'guest/routes/home/route',
				),
			),
			$config['members']['guest-page']['routes'] ?? null
		);
	}

	/**
	 * A guest the user can't open is left out, and with no guest left the shell stays off.
	 *
	 * @return void
	 */
	public function test_setup_skips_guest_without_capability() {
		$this->start_host_page(
			static function () {
				$GLOBALS['jetpack_shell_test_guest_page_routes_data'] = array( array( 'path' => '/' ) );
			},
			'jetpack_shell_test_no_one_has_this'
		);

		Admin_Shell::setup();

		$this->assertFalse( has_filter( 'script_module_data_' . Admin_Shell::CLIENT_MODULE ) );
		$this->assertFalse( has_filter( 'host-page-wp-admin_boot_dependencies' ) );
	}

	/**
	 * Data provider for test_guest_assets_refuses.
	 *
	 * @return array[] Flag state, member slug asked for, capability the guest requires, expected status.
	 */
	public static function provide_refused_guest_assets() {
		return array(
			'shell off'     => array( false, 'guest-page', 'manage_options', 404 ),
			'not a member'  => array( true, 'jetpack-settings', 'manage_options', 404 ),
			'no capability' => array( true, 'guest-page', 'jetpack_shell_test_no_one_has_this', 403 ),
		);
	}

	/**
	 * The guest endpoint answers only for members of a shell that is on, and only to users who can open them.
	 *
	 * @dataProvider provide_refused_guest_assets
	 *
	 * @param bool   $flag       Feature flag state.
	 * @param string $slug       Member slug asked for.
	 * @param string $capability Capability the guest requires.
	 * @param int    $expected   Expected HTTP status.
	 * @return void
	 */
	#[DataProvider( 'provide_refused_guest_assets' )]
	public function test_guest_assets_refuses( $flag, $slug, $capability, $expected ) {
		$this->start_host_page( '__return_null', $capability );
		add_filter( 'jetpack_feature_flag_enabled_' . Admin_Shell::FLAG, $flag ? '__return_true' : '__return_false', 11 );

		$this->assertSame( $expected, Admin_Shell::guest_assets( $slug ) );
	}

	/**
	 * A request without a valid nonce gets nothing.
	 *
	 * @return void
	 */
	public function test_ajax_guest_assets_checks_nonce() {
		$this->start_host_page( '__return_null' );
		$_REQUEST['nonce'] = 'not-a-nonce';
		add_filter( 'wp_doing_ajax', '__return_true' );
		add_filter(
			'wp_die_ajax_handler',
			static function () {
				return static function () {
					throw new \RuntimeException( 'wp_die' );
				};
			}
		);

		$this->expectExceptionMessage( 'wp_die' );
		Admin_Shell::ajax_guest_assets();
	}

	/**
	 * The endpoint returns the member's own handles and their dependencies, not what other plugins enqueue.
	 *
	 * @return void
	 */
	public function test_guest_assets_returns_only_member_handles() {
		// A real admin page unhooks this deprecated back-compat callback on admin_enqueue_scripts.
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		wp_register_script( 'shell-test-dep', 'https://example.com/dep.js', array(), '1', true );
		wp_register_script( 'shell-test-guest', 'https://example.com/guest.js', array( 'shell-test-dep' ), '1', true );
		wp_register_script( 'shell-test-other', 'https://example.com/other.js', array(), '1', true );
		$this->add_action(
			'admin_enqueue_scripts',
			static function () {
				wp_enqueue_script( 'shell-test-other' );
			}
		);
		$this->start_host_page(
			function () {
				$this->add_action(
					'admin_enqueue_scripts',
					static function () {
						wp_enqueue_script( 'shell-test-guest' );
					}
				);
			},
			'manage_options',
			array( 'shell-test-guest' )
		);

		$html = Admin_Shell::guest_assets( 'guest-page' );

		$this->assertIsString( $html );
		$this->assertStringContainsString( 'guest.js', $html );
		$this->assertStringContainsString( 'dep.js', $html, 'dependencies of a member handle come along' );
		$this->assertStringNotContainsString( 'other.js', $html );
	}

	/**
	 * Add an action and remove it again in tearDown().
	 *
	 * @param string   $hook     Hook name.
	 * @param callable $callback Callback.
	 * @return void
	 */
	private function add_action( $hook, $callback ) {
		add_action( $hook, $callback );
		$this->added_actions[] = array( $hook, $callback );
	}

	/**
	 * Open the host member's page as an administrator, with one guest.
	 *
	 * @param callable $load       Guest loader.
	 * @param string   $capability Capability the guest requires.
	 * @param string[] $handles    Handles the guest endpoint may return.
	 * @return void
	 */
	private function start_host_page( $load, $capability = 'manage_options', $handles = array() ) {
		require_once __DIR__ . '/fixtures/wp-build-routes.php';
		add_filter( 'jetpack_feature_flag_enabled_' . Admin_Shell::FLAG, '__return_true' );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'shell-admin-' . wp_rand(),
					'user_pass'  => wp_generate_password(),
					'role'       => 'administrator',
				)
			)
		);
		$this->add_members(
			array(
				'host-page'  => array( 'build_page' => 'host-page' ) + self::valid_member(),
				'guest-page' => array(
					'build_prefix' => 'jetpack_shell_test',
					'build_page'   => 'guest-page',
					'init_modules' => array( '@jetpack/guest-init' ),
					'capability'   => $capability,
					'handles'      => $handles,
					'load'         => $load,
				) + self::valid_member(),
			)
		);
		$_GET['page']           = 'host-page';
		$GLOBALS['hook_suffix'] = Admin_Shell::screen_id( 'host-page' );
	}

	/**
	 * Hook a members filter that returns the given value.
	 *
	 * @param mixed $members Filter result.
	 * @return void
	 */
	private function add_members( $members ) {
		add_filter(
			'jetpack_admin_shell_members',
			static function () use ( $members ) {
				return $members;
			}
		);
	}

	/**
	 * A member with only the required keys.
	 *
	 * @return array
	 */
	private static function valid_member() {
		return array(
			'build_prefix' => 'jetpack_forms',
			'build_page'   => 'jetpack-forms-admin',
			'title'        => 'Forms',
			'load'         => '__return_null',
		);
	}
}

<?php
/**
 * Admin_Shell tests.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use Automattic\Jetpack\Assets\Script_Data;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
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
		remove_all_filters( 'guest-page-wp-admin_boot_dependencies' );
		remove_all_filters( 'script_module_data_' . Admin_Shell::CLIENT_MODULE );
		unset( $_GET[ Admin_Shell::DISABLE_QUERY_ARG ], $_GET['page'], $_REQUEST['nonce'], $GLOBALS['jetpack_shell_test_guest_page_routes_data'], $GLOBALS['jetpack_shell_test_missing_page_routes_data'], $GLOBALS['jetpack_shell_test_guest_page_wp_admin_routes'], $GLOBALS['hook_suffix'], $GLOBALS['admin_page_hooks'], $_REQUEST['action'], $_GET['member'], $GLOBALS['_parent_pages'], $GLOBALS['_registered_pages'], $GLOBALS['menu'], $GLOBALS['submenu'], $GLOBALS['wp_actions']['admin_menu'] );
		remove_all_actions( 'guest-page-wp-admin_init' );
		wp_deregister_script_module( 'guest/bookings' );
		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'wp_die_ajax_handler' );
		Admin_Menu::set_visibility_resolver( null );
		Admin_Menu::set_feature_activator( null );
		Admin_Menu::reset();
		foreach ( $this->added_actions as list( $hook, $callback, $priority ) ) {
			remove_action( $hook, $callback, $priority );
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
	 * The shell must ship on.
	 *
	 * @return void
	 */
	public function test_flag_is_registered_on_by_default() {
		$this->assertTrue( Feature_Flags::get( Admin_Shell::FLAG )['default'] ?? null );
		$this->assertTrue( Admin_Shell::is_enabled() );
	}

	/**
	 * Plugins call init() outside the admin menu, so admin-ajax gets the media library endpoint.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_hooks_the_media_library_endpoint() {
		Admin_Shell::init();

		$this->assertNotFalse( has_action( 'wp_ajax_' . Media_Library::AJAX_ACTION ) );
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
			'admin_menu'   => true,
			'header'       => array(
				'title'    => 'Forms',
				'subtitle' => '',
			),
		);

		$defaults = array(
			'init_modules' => array(),
			'default_path' => null,
			'capability'   => 'manage_options',
			'handles'      => array(),
			'admin_menu'   => false,
			'header'       => null,
		);
		$picked   = array(
			'title'    => 'Settings',
			'subtitle' => null,
		);

		return array(
			'required keys only'                  => array( self::valid_member(), $defaults ),
			'every key set'                       => array( $set + self::valid_member(), $set ),
			'no stand-in header'                  => array(
				array( 'header' => false ) + self::valid_member(),
				array( 'header' => false ) + $defaults,
			),
			'subtitle picked as the page renders' => array(
				array( 'header' => $picked ) + self::valid_member(),
				array( 'header' => $picked ) + $defaults,
			),
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
	 * Data provider for test_get_members_drops_only_an_invalid_header.
	 *
	 * @return array[] Header.
	 */
	public static function provide_invalid_headers() {
		return array(
			'not an array'                => array( 'Forms' ),
			'true, not the false opt-out' => array( true ),
			'no subtitle'                 => array( array( 'title' => 'Forms' ) ),
			'subtitle not text'           => array(
				array(
					'title'    => 'Forms',
					'subtitle' => 1,
				),
			),
			'empty title'                 => array(
				array(
					'title'    => '',
					'subtitle' => 'Sub',
				),
			),
		);
	}

	/**
	 * The header is cosmetic: a malformed one is dropped with a notice, and the member is kept.
	 *
	 * @dataProvider provide_invalid_headers
	 *
	 * @param mixed $header Header definition.
	 * @return void
	 */
	#[DataProvider( 'provide_invalid_headers' )]
	public function test_get_members_drops_only_an_invalid_header( $header ) {
		$this->add_members( array( 'jetpack-forms' => array( 'header' => $header ) + self::valid_member() ) );
		$notices = did_action( 'doing_it_wrong_run' );

		$members = Admin_Shell::get_members();

		$this->assertArrayHasKey( 'jetpack-forms', $members );
		$this->assertNull( $members['jetpack-forms']['header'] );
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
	 * @return array[] Flag state, `page` query arg (null for none), member slugs, expected host, screen (null for the page's own), whether the page is a top-level menu.
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
			'top-level member page'         => array( true, 'my-jetpack', $both, 'my-jetpack', 'toplevel_page_my-jetpack', true ),
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
	 * @param bool        $top     Whether the page is a top-level menu.
	 * @return void
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_get_host( $flag, $page, $slugs, $expected, $screen = null, $top = false ) {
		if ( $top ) {
			$GLOBALS['admin_page_hooks'] = array( $page => 'my-jetpack' );
		}
		add_filter( 'jetpack_feature_flag_enabled_' . Admin_Shell::FLAG, $flag ? '__return_true' : '__return_false' );
		$this->add_members( array_fill_keys( $slugs, self::valid_member() ) );
		if ( null !== $page ) {
			$_GET['page'] = $page;
		}
		$GLOBALS['hook_suffix'] = $screen ?? ( is_string( $page ) ? Admin_Shell::screen_id( $page ) : 'index.php' );

		$this->assertSame( $expected, Admin_Shell::get_host() );
	}

	/**
	 * Data provider for test_requested_guest.
	 *
	 * @return array[] Whether the request is admin-ajax, `action`, `member`, expected slug.
	 */
	public static function provide_guest_requests() {
		return array(
			'guest endpoint'      => array( true, Admin_Shell::GUEST_ACTION, 'jetpack-forms', 'jetpack-forms' ),
			'another ajax action' => array( true, 'heartbeat', 'jetpack-forms', null ),
			'not admin-ajax'      => array( false, Admin_Shell::GUEST_ACTION, 'jetpack-forms', null ),
			'member is not text'  => array( true, Admin_Shell::GUEST_ACTION, array( 'jetpack-forms' ), null ),
		);
	}

	/**
	 * Members can tell, from `init` on, that the guest endpoint is loading them.
	 *
	 * @dataProvider provide_guest_requests
	 *
	 * @param bool        $ajax     Whether the request is admin-ajax.
	 * @param string      $action   Value of `action`.
	 * @param mixed       $member   Value of `member`.
	 * @param string|null $expected Expected slug.
	 * @return void
	 */
	#[DataProvider( 'provide_guest_requests' )]
	public function test_requested_guest( $ajax, $action, $member, $expected ) {
		add_filter( 'wp_doing_ajax', $ajax ? '__return_true' : '__return_false' );
		$_REQUEST['action'] = $action;
		$_GET['member']     = $member;

		$this->assertSame( $expected, Admin_Shell::requested_guest() );
	}

	/**
	 * On a host page, a guest's routes join the import map, and the page hooks its loader added wait for the guest endpoint.
	 *
	 * @return void
	 */
	public function test_setup_loads_guest_and_defers_its_hooks() {
		$guest_enqueue = static function () {};
		$init_enqueue  = static function () {};
		$host_enqueue  = static function () {};
		$this->add_action( 'admin_enqueue_scripts', $host_enqueue );
		add_filter(
			'guest-page-wp-admin_boot_dependencies', // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- wp-build names this hook.
			static function ( $deps ) {
				$deps[] = array(
					'import' => 'dynamic',
					'id'     => 'guest/widgets/chart',
				);
				return $deps;
			}
		);
		$this->start_host_page(
			static function () use ( $guest_enqueue, $init_enqueue ) {
				add_action( 'admin_enqueue_scripts', $guest_enqueue );
				add_action(
					'guest-page-wp-admin_init',
					static function () use ( $init_enqueue ) {
						add_action( 'admin_enqueue_scripts', $init_enqueue );
						wp_register_script_module( 'guest/bookings', 'https://example.test/bookings.js' );
						wp_enqueue_script_module( 'guest/bookings' );
					}
				);
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
		$this->assertFalse( has_action( 'admin_enqueue_scripts', $init_enqueue ), 'the hook its page init action added was removed' );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', $host_enqueue ), 'hooks from before the guest loaded stay' );
		$this->assertSame(
			array(
				array(
					'import' => 'dynamic',
					'id'     => '@jetpack/guest-init',
				),
				array(
					'import' => 'dynamic',
					'id'     => 'guest/bookings',
				),
				array(
					'import' => 'dynamic',
					'id'     => 'guest/routes/home/route',
				),
				array(
					'import' => 'dynamic',
					'id'     => 'guest/routes/home/content',
				),
				array(
					'import' => 'dynamic',
					'id'     => 'guest/widgets/chart',
				),
			),
			apply_filters( 'host-page-wp-admin_boot_dependencies', array() ) // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- wp-build names this hook.
		);
		$config = apply_filters( 'script_module_data_' . Admin_Shell::CLIENT_MODULE, array() );
		$this->assertSame( 'host-page', $config['host'] ?? null );
		$this->assertSame( array( 'host-page', 'guest-page' ), array_keys( $config['members'] ?? array() ) );
		$this->assertNotContains( 'guest/bookings', wp_script_modules()->get_queue(), 'the module its page init action enqueued waits for the guest' );
		$this->assertSame( array( '@jetpack/guest-init', 'guest/bookings' ), $config['members']['guest-page']['initModules'] ?? null );
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
	 * Data provider for test_setup_runs_guest_page_init.
	 *
	 * @return array[] Page init listener, expected guest routes.
	 */
	public static function provide_page_init_listeners() {
		return array(
			'registers a route'                => array(
				static function () {
					jetpack_shell_test_register_guest_page_wp_admin_route( '/extra', 'extra/content' );
				},
				array(
					array(
						'path'           => '/extra',
						'content_module' => 'extra/content',
					),
					array( 'path' => '/' ),
				),
			),
			'edits the routes before wp-build' => array(
				static function () {
					$GLOBALS['jetpack_shell_test_guest_page_routes_data'] = array();
				},
				array(),
			),
		);
	}

	/**
	 * A guest gets the routes its page init action leaves, as on its own page.
	 *
	 * @dataProvider provide_page_init_listeners
	 * @param callable $listener Page init listener the guest loader hooks, ahead of wp-build's own for priority 5.
	 * @param array[]  $expected Guest routes.
	 * @return void
	 */
	#[DataProvider( 'provide_page_init_listeners' )]
	public function test_setup_runs_guest_page_init( $listener, $expected ) {
		$this->start_host_page(
			static function () use ( $listener ) {
				$GLOBALS['jetpack_shell_test_guest_page_routes_data'] = array( array( 'path' => '/' ) );
				add_action( 'guest-page-wp-admin_init', $listener, 5 );
			}
		);

		Admin_Shell::setup();

		$config = apply_filters( 'script_module_data_' . Admin_Shell::CLIENT_MODULE, array() );
		$this->assertSame( $expected, $config['members']['guest-page']['routes'] ?? null );
	}

	/**
	 * Data provider for test_setup_passes_live_app_limit.
	 *
	 * @return array[] Filter result, limit the client gets.
	 */
	public static function provide_live_app_limits() {
		return array(
			'unfiltered'   => array( null, null ),
			'a limit'      => array( 4, 4 ),
			'a string'     => array( '4', 4 ),
			'zero'         => array( 0, null ),
			'not a number' => array( 'four', null ),
		);
	}

	/**
	 * The client gets a positive live-app limit a site sets, and otherwise sizes it itself.
	 *
	 * @dataProvider provide_live_app_limits
	 * @param mixed    $filtered Filter result.
	 * @param int|null $expected Limit in the client config.
	 * @return void
	 */
	#[DataProvider( 'provide_live_app_limits' )]
	public function test_setup_passes_live_app_limit( $filtered, $expected ) {
		$this->start_host_page(
			static function () {
				$GLOBALS['jetpack_shell_test_guest_page_routes_data'] = array( array( 'path' => '/' ) );
			}
		);
		$filter = static function () use ( $filtered ) {
			return $filtered;
		};
		add_filter( 'jetpack_admin_shell_max_live_apps', $filter );

		Admin_Shell::setup();
		remove_filter( 'jetpack_admin_shell_max_live_apps', $filter );

		$config = apply_filters( 'script_module_data_' . Admin_Shell::CLIENT_MODULE, array() );
		$this->assertArrayHasKey( 'maxLiveApps', $config );
		$this->assertSame( $expected, $config['maxLiveApps'] );
	}

	/**
	 * Data provider for test_guest_without_built_routes_is_skipped.
	 *
	 * @return array[] Guest build page, whether its load sets the routes data global.
	 */
	public static function provide_guests_without_built_routes() {
		return array(
			'no generated page'  => array( 'missing-page', true ),
			'no routes registry' => array( 'guest-page', false ),
		);
	}

	/**
	 * A guest whose build has no route getter or no routes data is left out, without firing its page init.
	 *
	 * @dataProvider provide_guests_without_built_routes
	 * @param string $build_page  Guest wp-build page name.
	 * @param bool   $routes_data Whether its load sets the routes data global.
	 * @return void
	 */
	#[DataProvider( 'provide_guests_without_built_routes' )]
	public function test_guest_without_built_routes_is_skipped( $build_page, $routes_data ) {
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		$this->start_host_page(
			static function () use ( $build_page, $routes_data ) {
				if ( $routes_data ) {
					$GLOBALS[ 'jetpack_shell_test_' . str_replace( '-', '_', $build_page ) . '_routes_data' ] = array( array( 'path' => '/' ) );
				}
			}
		);
		add_filter(
			'jetpack_admin_shell_members',
			static function ( $members ) use ( $build_page ) {
				$members['guest-page']['build_page'] = $build_page;
				return $members;
			},
			11
		);
		$init_runs = did_action( $build_page . '-wp-admin_init' );

		Admin_Shell::setup();

		$this->assertFalse( has_filter( 'script_module_data_' . Admin_Shell::CLIENT_MODULE ), 'with its only guest left out, the shell stays off' );
		$this->assertIsString( Admin_Shell::guest_assets( 'guest-page' ) );
		$this->assertSame( $init_runs, did_action( $build_page . '-wp-admin_init' ) );
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
	 * The host page says whether its own feature is on, with the card to show when it is off; guests are asked when they are opened.
	 *
	 * @return void
	 */
	public function test_setup_reports_the_host_feature_and_each_gate() {
		$card = static function ( $html, $slug ) {
			return 'card for ' . $slug;
		};
		add_filter( 'jetpack_admin_shell_feature_off_card', $card, 10, 2 );
		Admin_Menu::add_menu( 'Host', 'Host', 'manage_options', 'host-page', '__return_null', null, array( 'module' => 'host-module' ) );
		Admin_Menu::add_menu( 'Guest', 'Guest', 'manage_options', 'guest-page', '__return_null', null, array( 'product' => 'guest-product' ) );
		Admin_Menu::set_visibility_resolver( '__return_false' );
		Admin_Menu::set_feature_activator( '__return_true' );
		$this->start_host_page(
			static function () {
				$GLOBALS['jetpack_shell_test_guest_page_routes_data'] = array( array( 'path' => '/' ) );
			}
		);

		Admin_Shell::setup();

		$members = apply_filters( 'script_module_data_' . Admin_Shell::CLIENT_MODULE, array() )['members'];
		remove_filter( 'jetpack_admin_shell_feature_off_card', $card );
		$this->assertSame( array( 'module' => 'host-module' ), $members['host-page']['gate'] );
		$this->assertFalse( $members['host-page']['featureOn'] );
		$this->assertSame( 'card for host-page', $members['host-page']['featureCard'] );
		$this->assertArrayNotHasKey( 'featureCard', $members['guest-page'] );
		$this->assertSame( array( 'product' => 'guest-product' ), $members['guest-page']['gate'] );
		$this->assertTrue( $members['guest-page']['featureOn'] );

		$nonce = $members['guest-page']['gateNonce'];
		$this->assertTrue( Admin_Shell::is_member_gate( 'guest-page', array( 'product' => 'guest-product' ), $nonce ) );
		$this->assertFalse( Admin_Shell::is_member_gate( 'guest-page', array( 'product' => 'other-product' ), $nonce ), 'another gate' );
		$this->assertFalse( Admin_Shell::is_member_gate( 'host-page', array( 'product' => 'guest-product' ), $nonce ), 'another member' );
	}

	/**
	 * A feature that can't be turned on here, as when a host holds it off, leaves its page to show itself.
	 *
	 * @return void
	 */
	public function test_feature_leaves_alone_what_it_cannot_turn_on() {
		$this->start_host_page( '__return_null' );
		Admin_Menu::set_visibility_resolver( '__return_false' );
		Admin_Menu::set_feature_activator( '__return_true', '__return_false' );

		$this->assertTrue( Admin_Shell::feature( 'guest-page', array( 'module' => 'm' ) ) );
		$this->assertSame( 404, Admin_Shell::feature( 'dropped-out-page', array( 'module' => 'm' ) ), 'a member that left the shell is unknown' );
		$this->assertSame( 'not_available', Admin_Shell::feature( 'guest-page', array( 'module' => 'm' ), true )->get_error_code() );
	}

	/**
	 * Data provider for test_feature_refuses.
	 *
	 * @return array[] Member slug asked for, gate, capability the guest requires, expected status.
	 */
	public static function provide_refused_features() {
		return array(
			'not a member'  => array( 'jetpack-settings', array( 'module' => 'm' ), 'manage_options', 404 ),
			'no gate'       => array( 'guest-page', array(), 'manage_options', 404 ),
			'no capability' => array( 'guest-page', array( 'module' => 'm' ), 'jetpack_shell_test_no_one_has_this', 403 ),
		);
	}

	/**
	 * The feature endpoint answers only for gated members, and only to users who can open them.
	 *
	 * @dataProvider provide_refused_features
	 *
	 * @param string $slug       Member slug asked for.
	 * @param array  $gate       Gate sent.
	 * @param string $capability Capability the guest requires.
	 * @param int    $expected   Expected HTTP status.
	 * @return void
	 */
	#[DataProvider( 'provide_refused_features' )]
	public function test_feature_refuses( $slug, $gate, $capability, $expected ) {
		$this->start_host_page( '__return_null', $capability );
		Admin_Menu::set_feature_activator( '__return_true' );

		$this->assertSame( $expected, Admin_Shell::feature( $slug, $gate, true ) );
	}

	/**
	 * Turning a feature on goes through the activator, and the answer is read back after it.
	 *
	 * @return void
	 */
	public function test_feature_turns_on_through_the_activator() {
		$this->start_host_page( '__return_null' );
		$on = false;
		Admin_Menu::set_visibility_resolver(
			static function () use ( &$on ) {
				return $on;
			}
		);
		Admin_Menu::set_feature_activator(
			static function ( $gate ) use ( &$on ) {
				$on = array( 'module' => 'm' ) === $gate;
				return true;
			}
		);

		$this->assertFalse( Admin_Shell::feature( 'guest-page', array( 'module' => 'm' ) ), 'only a POST turns it on' );
		$this->assertFalse( Admin_Shell::feature( 'dropped-out-page', array( 'module' => 'm' ) ), 'a member that left the shell with its feature still reads as off' );
		$this->assertTrue( Admin_Shell::feature( 'guest-page', array( 'module' => 'm' ), true ) );

		Admin_Menu::set_feature_activator(
			static function () {
				return new \WP_Error( 'not_allowed', 'No.' );
			}
		);
		$this->assertSame( 'No.', Admin_Shell::feature( 'guest-page', array( 'module' => 'm' ), true )->get_error_message() );
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
				// Stands in for wp_die(), which never returns.
				return /** @return never */ static function () {
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
		$this->add_action(
			'admin_print_scripts',
			static function () {
				wp_enqueue_script( 'shell-test-late', 'https://example.com/late.js', array(), '1', false );
				wp_enqueue_style( 'shell-test-late', 'https://example.com/late.css', array(), '1' );
			}
		);
		$this->start_host_page(
			function () {
				$GLOBALS['jetpack_shell_test_guest_page_routes_data'] = array( array( 'path' => '/' ) );
				$this->add_action(
					'admin_enqueue_scripts',
					static function () {
						wp_enqueue_script( 'shell-test-guest' );
					}
				);
				$this->add_action(
					'guest-page-wp-admin_init',
					static function () {
						wp_register_script( 'shell-test-init', 'https://example.com/init.js', array(), '1', true );
					}
				);
			},
			'manage_options',
			array( 'shell-test-guest', 'shell-test-init' )
		);

		$html = Admin_Shell::guest_assets( 'guest-page' );

		$this->assertIsString( $html );
		$this->assertStringContainsString( 'guest.js', $html );
		$this->assertStringContainsString( 'dep.js', $html, 'dependencies of a member handle come along' );
		$this->assertStringContainsString( 'init.js', $html, 'what its page init action registers comes along' );
		$this->assertStringNotContainsString( 'other.js', $html );
		$this->assertStringNotContainsString( 'late.js', $html, 'what another plugin enqueues on a print hook already ran on the host page' );
		$this->assertStringNotContainsString( 'late.css', $html );
	}

	/**
	 * A member that asks for the admin menu gets its pages and its top-level screen, but nothing its callbacks print or hook.
	 *
	 * @dataProvider provide_admin_menu_opt_in
	 *
	 * @param bool $admin_menu Whether the guest asks for the admin menu.
	 * @return void
	 */
	#[DataProvider( 'provide_admin_menu_opt_in' )]
	public function test_guest_assets_builds_the_admin_menu_only_for_a_member_that_asks( $admin_menu ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		unset( $GLOBALS['wp_actions']['admin_menu'] );
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		$seen                      = array( '', null );
		$plan_checked              = false;
		$plan_check                = static function () use ( &$plan_checked ) {
			$plan_checked = true;
		};
		$this->add_action(
			'admin_menu',
			static function () use ( $plan_check ) {
				add_menu_page( 'Guest', 'Guest', 'manage_options', 'guest-page', '__return_null' );
				add_action( 'current_screen', $plan_check );
				echo 'menu-output';
			}
		);
		$this->start_host_page(
			function () use ( &$seen ) {
				$this->add_action(
					'admin_enqueue_scripts',
					static function ( $hook_suffix ) use ( &$seen ) {
						$seen = array( menu_page_url( 'guest-page', false ), $hook_suffix );
					}
				);
			},
			'manage_options',
			array(),
			array( 'admin_menu' => $admin_menu )
		);

		$this->expectOutputString( '' );
		$html = Admin_Shell::guest_assets( 'guest-page' );
		remove_action( 'current_screen', $plan_check );

		$this->assertIsString( $html );
		$this->assertSame( $admin_menu, false !== strpos( $seen[0], 'page=guest-page' ) );
		$this->assertSame( $admin_menu ? 'toplevel_page_guest-page' : 'jetpack_page_guest-page', $seen[1] );
		$this->assertStringNotContainsString( 'menu-output', $html );
		$this->assertFalse( $plan_checked, 'What a menu callback hooks would run on a hover.' );
	}

	/**
	 * Whether the guest asks for the admin menu.
	 *
	 * @return array<string, array{bool}>
	 */
	public static function provide_admin_menu_opt_in() {
		return array(
			'asks'         => array( true ),
			'does not ask' => array( false ),
		);
	}

	/**
	 * What other plugins print on the print hooks already ran on the host page, so the endpoint leaves it out.
	 *
	 * @return void
	 */
	public function test_guest_assets_leaves_out_what_other_plugins_print() {
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		$this->add_action(
			'admin_print_footer_scripts',
			static function () {
				echo '<script>window.otherPluginFooter = 1;</script>';
			}
		);
		$this->add_action(
			'admin_print_scripts',
			static function () {
				echo '<script>window.otherPluginHead = 1;</script>';
			}
		);
		$this->add_action(
			'admin_enqueue_scripts',
			function () {
				$this->add_action(
					'admin_print_footer_scripts',
					static function () {
						echo '<script>window.otherPluginLate = 1;</script>';
					}
				);
			}
		);
		wp_register_script( 'shell-test-guest', 'https://example.com/guest.js', array(), '1', true );
		$this->start_host_page( '__return_null', 'manage_options', array( 'shell-test-guest' ) );

		$html = Admin_Shell::guest_assets( 'guest-page' );

		$this->assertIsString( $html );
		$this->assertStringContainsString( 'guest.js', $html );
		$this->assertStringNotContainsString( 'otherPluginFooter', $html );
		$this->assertStringNotContainsString( 'otherPluginHead', $html );
		$this->assertStringNotContainsString( 'otherPluginLate', $html, 'nor what a callback hooked while enqueuing prints' );
	}

	/**
	 * The member's own print callbacks, its handles' inline scripts, data other code attaches to them, and its script module data still print.
	 *
	 * @return void
	 */
	public function test_guest_assets_keeps_the_members_own_data() {
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		wp_register_script( 'shell-test-guest', 'https://example.com/guest.js', array(), '1', true );
		wp_add_inline_script( 'shell-test-guest', 'window.guestBefore = 1;', 'before' );
		wp_add_inline_script( 'shell-test-guest', 'window.guestAfter = 1;', 'after' );
		$this->add_action(
			'admin_print_scripts',
			static function () {
				wp_add_inline_script( 'shell-test-guest', 'window.attachedOnPrint = 1;', 'before' );
			},
			1
		);
		$this->start_host_page(
			function () {
				$this->add_action(
					'admin_print_footer_scripts',
					static function () {
						echo '<script>window.guestFooter = 1;</script>';
					}
				);
				wp_register_script_module( '@jetpack/shell-test-guest', 'https://example.com/guest-module.js' );
				wp_enqueue_script_module( '@jetpack/shell-test-guest' );
				add_filter( 'script_module_data_@jetpack/shell-test-guest', array( $this, 'guest_module_data' ) );
			},
			'manage_options',
			array( 'shell-test-guest' )
		);

		$html = Admin_Shell::guest_assets( 'guest-page' );
		remove_filter( 'script_module_data_@jetpack/shell-test-guest', array( $this, 'guest_module_data' ) );
		wp_dequeue_script_module( '@jetpack/shell-test-guest' );
		wp_deregister_script_module( '@jetpack/shell-test-guest' );

		$this->assertIsString( $html );
		$this->assertStringContainsString( 'window.guestFooter = 1;', $html, 'what the member\'s own print callback prints' );
		$this->assertMatchesRegularExpression( '/id="shell-test-guest-js-before">[^<]*window\.guestBefore = 1;/', $html );
		$this->assertMatchesRegularExpression( '/id="shell-test-guest-js-after">[^<]*window\.guestAfter = 1;/', $html );
		$this->assertStringContainsString( 'window.attachedOnPrint = 1;', $html, 'data another callback attaches to a member handle' );
		$this->assertStringContainsString( 'id="wp-script-module-data-@jetpack/shell-test-guest"', $html, 'core prints the member\'s script module data' );
	}

	/**
	 * Script module data the test guest passes.
	 *
	 * @return array
	 */
	public function guest_module_data() {
		return array( 'guest' => true );
	}

	/**
	 * `JetpackScriptData`, which Script_Data attaches on admin_print_scripts, still prints.
	 *
	 * @return void
	 */
	public function test_guest_assets_keeps_jetpack_script_data() {
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		// Script_Data renders once per request.
		$reset = \Closure::bind(
			static function () {
				// @phan-suppress-next-line PhanAccessPropertyPrivate -- Bound to Script_Data's scope.
				Script_Data::$did_render_script_data = false;
			},
			null,
			Script_Data::class
		);
		$reset();
		Script_Data::register_assets();
		$this->add_action( 'admin_print_scripts', array( Script_Data::class, 'render_script_data' ), 1 );
		$this->start_host_page( '__return_null', 'manage_options', array( Script_Data::SCRIPT_HANDLE ) );

		$html = Admin_Shell::guest_assets( 'guest-page' );
		$reset();

		$this->assertIsString( $html );
		$this->assertMatchesRegularExpression( '/id="jetpack-script-data-js-before">[^<]*window\.JetpackScriptData = /', $html );
	}

	/**
	 * A guest that prints wp-api-fetch must not set up a second nonce middleware on a host that has one.
	 *
	 * @return void
	 */
	public function test_guest_assets_guards_api_fetch_setup() {
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		$this->start_host_page( '__return_null', 'manage_options', array( 'wp-api-fetch' ) );

		$html = Admin_Shell::guest_assets( 'guest-page' );

		$this->assertIsString( $html );
		$guard = strpos( $html, 'if ( ! wp.apiFetch.nonceMiddleware ) {' );
		$this->assertNotFalse( $guard );
		$this->assertGreaterThan( $guard, strpos( $html, 'createNonceMiddleware' ) );
	}

	/**
	 * A guest gets no media library, even one whose page enqueues it or that still sets the removed `media` key: loadMediaLibrary() loads it on demand.
	 *
	 * @return void
	 */
	public function test_guest_assets_leaves_out_the_media_library() {
		$this->unhook_emoji_styles = remove_action( 'wp_print_styles', 'print_emoji_styles' );
		$load                      = function () {
			$this->add_action( 'admin_enqueue_scripts', 'wp_enqueue_media' );
		};
		$this->start_host_page( $load, 'manage_options', array(), array( 'media' => true ) );

		$html = Admin_Shell::guest_assets( 'guest-page' );

		$this->assertIsString( $html );
		$this->assertStringNotContainsString( 'id="media-views-js"', $html );
		$this->assertStringNotContainsString( 'id="tmpl-media-modal"', $html );
	}

	/**
	 * Add an action and remove it again in tearDown().
	 *
	 * @param string   $hook     Hook name.
	 * @param callable $callback Callback.
	 * @param int      $priority Priority.
	 * @return void
	 */
	private function add_action( $hook, $callback, $priority = 10 ) {
		add_action( $hook, $callback, $priority );
		$this->added_actions[] = array( $hook, $callback, $priority );
	}

	/**
	 * Open the host member's page as an administrator, with one guest.
	 *
	 * @param callable $load       Guest loader.
	 * @param string   $capability Capability the guest requires.
	 * @param string[] $handles    Handles the guest endpoint may return.
	 * @param array    $extra      More keys for the guest member.
	 * @return void
	 */
	private function start_host_page( $load, $capability = 'manage_options', $handles = array(), $extra = array() ) {
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
					'load'         => static function () use ( $load ) {
						jetpack_shell_test_load_build();
						$load();
					},
				) + $extra + self::valid_member(),
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

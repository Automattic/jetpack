<?php
/**
 * Admin shell: switch between Jetpack wp-build dashboards without a page load.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Decides whether the admin shell is on, and which dashboards have joined it.
 */
class Admin_Shell {

	/**
	 * Feature flag that turns the shell on. Off by default.
	 */
	const FLAG = 'jetpack-admin-shell';

	/**
	 * Query argument that turns the shell off for one request when set to `0`.
	 */
	const DISABLE_QUERY_ARG = 'jetpack_admin_shell';

	/**
	 * Member keys that must be non-empty strings.
	 */
	const REQUIRED_STRING_KEYS = array( 'build_prefix', 'build_page', 'title' );

	/**
	 * The admin-ajax action that returns a guest's page data.
	 */
	const GUEST_ACTION = 'jetpack_admin_shell_guest';

	/**
	 * Script module ID of the client.
	 */
	const CLIENT_MODULE = '@automattic/jetpack-admin-shell';

	/**
	 * Hooks where guests add their page data. On a host page, callbacks a guest adds here are removed: the guest endpoint runs them later.
	 */
	const DEFERRED_HOOKS = array( 'admin_enqueue_scripts', 'admin_print_scripts', 'admin_print_footer_scripts', 'jetpack_admin_js_script_data' );

	/**
	 * Whether init() has run.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Routes collected per member page slug.
	 *
	 * @var array<string, array[]>
	 */
	private static $routes = array();

	/**
	 * Member whose routes are being collected.
	 *
	 * @var string|null
	 */
	private static $collecting = null;

	/**
	 * Register the feature flag.
	 *
	 * @return void
	 */
	public static function register_feature_flag() {
		Feature_Flags::register(
			self::FLAG,
			array(
				'default'     => false,
				'description' => 'Switch between Jetpack dashboards in wp-admin without a page load.',
				'owner'       => 'jetpack-admin-ui',
			)
		);
	}

	/**
	 * Hook the shell up. Each hook checks is_enabled() itself, so this is safe to call on every request.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Priority 0: guests must register their modules before the host page builds its import map.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'setup' ), 0 );
		add_action( 'wp_ajax_' . self::GUEST_ACTION, array( __CLASS__, 'ajax_guest_assets' ) );
	}

	/**
	 * Whether the shell is on for this request.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only opt-out; it can only turn the shell off.
		if ( isset( $_GET[ self::DISABLE_QUERY_ARG ] ) && '0' === $_GET[ self::DISABLE_QUERY_ARG ] ) {
			return false;
		}

		/**
		 * Filters whether Jetpack dashboards share one wp-admin page.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether the shell is on. Defaults to the `jetpack-admin-shell` feature flag.
		 */
		return (bool) apply_filters( 'jetpack_admin_shell_enabled', Feature_Flags::is_enabled( self::FLAG ) );
	}

	/**
	 * Member dashboards, keyed by admin page slug. Entries that don't match the contract are dropped.
	 *
	 * @return array<string, array{build_prefix: string, build_page: string, init_modules: string[], title: string, default_path: string|null, load: callable, capability: string, handles: string[]}>
	 */
	public static function get_members() {
		/**
		 * Filters the dashboards that share the admin shell.
		 *
		 * Each entry is keyed by its admin page slug and holds:
		 * - build_prefix (string)   The wp-build prefix of the generated page functions.
		 * - build_page (string)     The wp-build page name.
		 * - init_modules (string[]) Script modules to import before the app boots.
		 * - title (string)          Document title while the page is shown.
		 * - default_path (string)   Optional. The `p` a bare menu link opens.
		 * - load (callable)         Registers the page's scripts and prints its initial data. Must be safe to run twice, and must not redirect, print or write options.
		 * - capability (string)     Optional, default `manage_options`. Required to load the page into the shell.
		 * - handles (string[])      Optional. Script and style handles the shell may return for the page.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $members Member definitions keyed by admin page slug.
		 */
		$members = apply_filters( 'jetpack_admin_shell_members', array() );
		if ( ! is_array( $members ) ) {
			return array();
		}

		$valid = array();
		foreach ( $members as $slug => $member ) {
			$normalized = self::normalize_member( $slug, $member );
			if ( null === $normalized ) {
				$message = sprintf( 'Admin shell member "%s" is missing a required key or has one of the wrong type, so it was skipped.', $slug );
				// Keep on one line: the release tooling only replaces the version in a single-line call.
				_doing_it_wrong( __METHOD__, esc_html( $message ), '$$next-version$$' );
				continue;
			}
			$valid[ $slug ] = $normalized;
		}

		return $valid;
	}

	/**
	 * The member page this request is for, when the shell runs on it.
	 *
	 * @return string|null
	 */
	public static function get_host() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks which page this is.
		$page = isset( $_GET['page'] ) && is_string( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		if ( '' === $page || ! self::is_enabled() ) {
			return null;
		}

		$members = self::get_members();
		if ( count( $members ) < 2 || ! isset( $members[ $page ] ) ) {
			return null;
		}
		return $page;
	}

	/**
	 * On a member page, ready the other members and print the client.
	 *
	 * @return void
	 */
	public static function setup() {
		$host = self::get_host();
		if ( null === $host ) {
			return;
		}

		$members = self::get_members();
		$guests  = array();
		foreach ( $members as $slug => $member ) {
			if ( $slug === $host || ! current_user_can( $member['capability'] ) ) {
				continue;
			}
			$routes = self::load_guest( $slug, $member );
			if ( null !== $routes ) {
				$guests[ $slug ] = $routes;
			}
		}
		if ( ! $guests ) {
			return;
		}

		add_filter(
			$members[ $host ]['build_page'] . '-wp-admin_boot_dependencies',
			static function ( $deps ) use ( $members, $guests ) {
				return self::add_guest_dependencies( $deps, $members, $guests );
			}
		);

		$config = self::get_client_config( $host, $members, $guests );
		add_filter(
			'script_module_data_' . self::CLIENT_MODULE,
			static function () use ( $config ) {
				return $config;
			}
		);
		self::enqueue_client();
	}

	/**
	 * Enqueue the client. Each file is its own module, so each URL carries a version that changes with the file.
	 *
	 * @return void
	 */
	private static function enqueue_client() {
		$deps = array();
		foreach ( array( 'adapter', 'app', 'chrome', 'debug', 'guest-assets', 'header', 'overlays' ) as $name ) {
			$deps[] = self::CLIENT_MODULE . '/' . $name;
			wp_register_script_module( self::CLIENT_MODULE . '/' . $name, plugins_url( "admin-shell/$name.js", __FILE__ ), array(), self::client_version( $name ) );
		}
		wp_enqueue_script_module( self::CLIENT_MODULE, plugins_url( 'admin-shell/index.js', __FILE__ ), $deps, self::client_version( 'index' ) );
	}

	/**
	 * Version for a client file: the package version, plus the file's modification time where it can be read.
	 *
	 * @param string $name File name without extension.
	 * @return string
	 */
	private static function client_version( $name ) {
		$file  = __DIR__ . "/admin-shell/$name.js";
		$mtime = is_readable( $file ) ? filemtime( $file ) : false;
		return $mtime ? Admin_Menu::PACKAGE_VERSION . '-' . $mtime : Admin_Menu::PACKAGE_VERSION;
	}

	/**
	 * Run a guest's loader on the host page and collect its routes.
	 *
	 * @param string $slug   Admin page slug.
	 * @param array  $member Normalized member.
	 * @return array[]|null Routes, or null when the guest's build isn't there.
	 */
	private static function load_guest( $slug, $member ) {
		$snapshot = self::hook_snapshot();
		call_user_func( $member['load'] );
		self::remove_added_callbacks( $snapshot );

		$register_page_routes = $member['build_prefix'] . '_register_page_routes';
		$routes_global        = $member['build_prefix'] . '_' . str_replace( '-', '_', $member['build_page'] ) . '_routes_data';
		if ( ! function_exists( $register_page_routes ) || ! isset( $GLOBALS[ $routes_global ] ) ) {
			return null;
		}

		self::$routes[ $slug ] = array();
		self::$collecting      = $slug;
		// The generated helper only calls a registrar that function_exists() accepts.
		call_user_func( $register_page_routes, $GLOBALS[ $routes_global ], __NAMESPACE__ . '\admin_shell_collect_route' );
		self::$collecting = null;

		return self::$routes[ $slug ];
	}

	/**
	 * Receive one route from a guest's generated route registration.
	 *
	 * @param string      $path           Route path.
	 * @param string|null $content_module Content script module ID.
	 * @param string|null $route_module   Route script module ID.
	 * @return void
	 */
	public static function collect_route( $path, $content_module = null, $route_module = null ) {
		if ( null === self::$collecting ) {
			return;
		}
		$route = array( 'path' => $path );
		if ( $content_module ) {
			$route['content_module'] = $content_module;
		}
		if ( $route_module ) {
			$route['route_module'] = $route_module;
		}
		self::$routes[ self::$collecting ][] = $route;
	}

	/**
	 * Add the guests' modules to the host page's import map, without downloading them.
	 *
	 * @param array $deps    Host boot dependencies.
	 * @param array $members Members keyed by slug.
	 * @param array $guests  Guest routes keyed by slug.
	 * @return array
	 */
	public static function add_guest_dependencies( $deps, $members, $guests ) {
		foreach ( $guests as $slug => $routes ) {
			$ids = $members[ $slug ]['init_modules'];
			foreach ( $routes as $route ) {
				$ids[] = $route['route_module'] ?? null;
				$ids[] = $route['content_module'] ?? null;
			}
			foreach ( array_filter( $ids ) as $id ) {
				$deps[] = array(
					'import' => 'dynamic',
					'id'     => $id,
				);
			}
		}
		return $deps;
	}

	/**
	 * What the client needs to know about the host and its guests.
	 *
	 * @param string $host    Host page slug.
	 * @param array  $members Members keyed by slug.
	 * @param array  $guests  Guest routes keyed by slug.
	 * @return array
	 */
	private static function get_client_config( $host, $members, $guests ) {
		$config = array(
			'host'           => $host,
			'members'        => array(),
			'guestAssetsUrl' => add_query_arg(
				array(
					'action' => self::GUEST_ACTION,
					'nonce'  => wp_create_nonce( self::GUEST_ACTION ),
				),
				admin_url( 'admin-ajax.php' )
			),
		);
		foreach ( array( $host => array() ) + $guests as $slug => $routes ) {
			$member                     = $members[ $slug ];
			$config['members'][ $slug ] = array(
				'mountId'     => $member['build_page'] . '-wp-admin-app',
				'routes'      => $routes,
				'initModules' => $member['init_modules'],
				'defaultPath' => $member['default_path'],
				'title'       => $member['title'],
			);
		}
		return $config;
	}

	/**
	 * Return the styles and scripts a guest prints on its own page, for the client to run before booting it.
	 *
	 * @return void
	 */
	public static function ajax_guest_assets() {
		check_ajax_referer( self::GUEST_ACTION, 'nonce' );
		// Not `page`: products treat a `page` naming them as a visit to their own screen.
		$slug    = isset( $_GET['member'] ) && is_string( $_GET['member'] ) ? sanitize_key( wp_unslash( $_GET['member'] ) ) : '';
		$members = self::is_enabled() ? self::get_members() : array();
		if ( ! isset( $members[ $slug ] ) ) {
			wp_send_json_error( null, 404, JSON_UNESCAPED_SLASHES );
		}
		if ( ! current_user_can( $members[ $slug ]['capability'] ) ) {
			wp_send_json_error( null, 403, JSON_UNESCAPED_SLASHES );
		}

		call_user_func( $members[ $slug ]['load'] );
		$hook_suffix = 'jetpack_page_' . $slug;
		set_current_screen( $hook_suffix );
		$GLOBALS['concatenate_scripts'] = false; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- One script tag per handle, so the client can skip what the host already has.

		ob_start();
		do_action( 'admin_enqueue_scripts', $hook_suffix ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		wp_print_styles();
		do_action( 'admin_print_scripts' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		print_head_scripts();
		print_footer_scripts();
		do_action( 'admin_print_footer_scripts' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		wp_send_json_success( array( 'html' => ob_get_clean() ), null, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * Snapshot the callbacks on the deferred hooks.
	 *
	 * @return array<string, array<string, true>>
	 */
	private static function hook_snapshot() {
		global $wp_filter;
		$snapshot = array();
		foreach ( self::DEFERRED_HOOKS as $hook ) {
			$snapshot[ $hook ] = array();
			foreach ( isset( $wp_filter[ $hook ] ) ? $wp_filter[ $hook ]->callbacks : array() as $priority => $callbacks ) {
				foreach ( array_keys( $callbacks ) as $id ) {
					$snapshot[ $hook ][ $priority . '|' . $id ] = true;
				}
			}
		}
		return $snapshot;
	}

	/**
	 * Remove callbacks added to the deferred hooks since the snapshot.
	 *
	 * @param array<string, array<string, true>> $snapshot From hook_snapshot().
	 * @return void
	 */
	private static function remove_added_callbacks( $snapshot ) {
		global $wp_filter;
		foreach ( self::DEFERRED_HOOKS as $hook ) {
			foreach ( isset( $wp_filter[ $hook ] ) ? $wp_filter[ $hook ]->callbacks : array() as $priority => $callbacks ) {
				foreach ( $callbacks as $id => $callback ) {
					if ( ! isset( $snapshot[ $hook ][ $priority . '|' . $id ] ) ) {
						remove_filter( $hook, $callback['function'], $priority );
					}
				}
			}
		}
	}

	/**
	 * Fill in a member's defaults, or return null when it can't be used.
	 *
	 * @param mixed $slug   Admin page slug.
	 * @param mixed $member Member definition.
	 * @return array|null
	 */
	private static function normalize_member( $slug, $member ) {
		if ( ! is_string( $slug ) || sanitize_key( $slug ) !== $slug || '' === $slug || ! is_array( $member ) ) {
			return null;
		}

		foreach ( self::REQUIRED_STRING_KEYS as $key ) {
			if ( ! isset( $member[ $key ] ) || ! is_string( $member[ $key ] ) || '' === $member[ $key ] ) {
				return null;
			}
		}

		if ( ! isset( $member['load'] ) || ! is_callable( $member['load'] ) ) {
			return null;
		}

		$member = array_merge(
			array(
				'init_modules' => array(),
				'default_path' => null,
				'capability'   => 'manage_options',
				'handles'      => array(),
			),
			$member
		);

		if (
			! self::is_string_list( $member['init_modules'] )
			|| ! self::is_string_list( $member['handles'] )
			|| ! is_string( $member['capability'] ) || '' === $member['capability']
			|| ( null !== $member['default_path'] && ! is_string( $member['default_path'] ) )
		) {
			return null;
		}

		return $member;
	}

	/**
	 * Whether a value is a list of strings.
	 *
	 * @param mixed $value Value to check.
	 * @return bool
	 */
	private static function is_string_list( $value ) {
		if ( ! is_array( $value ) || array_values( $value ) !== $value ) {
			return false;
		}
		foreach ( $value as $item ) {
			if ( ! is_string( $item ) ) {
				return false;
			}
		}
		return true;
	}
}

/**
 * Plain-function registrar for wp-build's generated route helpers, which only accept a function name.
 *
 * @param string      $path           Route path.
 * @param string|null $content_module Content script module ID.
 * @param string|null $route_module   Route script module ID.
 * @return void
 */
function admin_shell_collect_route( $path, $content_module = null, $route_module = null ) { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed -- Must load with the class; wp-build route helpers only take a function name.
	Admin_Shell::collect_route( $path, $content_module, $route_module );
}

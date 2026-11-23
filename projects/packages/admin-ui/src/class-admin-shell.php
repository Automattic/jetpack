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
	 * The admin-ajax action that says whether a member's feature is on, and turns it on.
	 */
	const FEATURE_ACTION = 'jetpack_admin_shell_feature';

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
		add_action( 'wp_ajax_' . self::FEATURE_ACTION, array( __CLASS__, 'ajax_feature' ) );
		// Plugins call init() on admin-ajax requests too, where the shell's members load the media library.
		Media_Library::init();
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
		 * @since 0.14.15
		 *
		 * @param bool $enabled Whether the shell is on. Defaults to the `jetpack-admin-shell` feature flag.
		 */
		return (bool) apply_filters( 'jetpack_admin_shell_enabled', Feature_Flags::is_enabled( self::FLAG ) );
	}

	/**
	 * Member dashboards, keyed by admin page slug. Entries that don't match the contract are dropped.
	 *
	 * @return array<string, array{build_prefix: string, build_page: string, init_modules: string[], title: string, header: array{title: string, subtitle: string|null}|false|null, default_path: string|null, load: callable, capability: string, handles: string[], admin_menu: bool}>
	 */
	public static function get_members() {
		/**
		 * Filters the dashboards that share the admin shell.
		 *
		 * Each entry is keyed by its admin page slug and holds:
		 * - build_prefix (string)   The wp-build prefix of the generated page functions.
		 * - build_page (string)     The wp-build page name.
		 * - init_modules (string[]) Script modules to import before the app boots, along with any its page init action enqueues.
		 * - title (string)          Document title while the page is shown.
		 * - header (array|false)    Optional. `title` and `subtitle` of the view a bare menu link opens, as the dashboard renders them, shown while it opens. `subtitle` is '' for none, or null when the dashboard picks it as it renders. False shows no stand-in on any of its views, for a page whose landing view has no standard page header. A malformed one is dropped, not the member.
		 * - default_path (string)   Optional. The `p` a bare menu link opens.
		 * - load (callable)         Loads the build that defines `<build_prefix>_get_<build_page>_wp_admin_routes()`, leaving its page init action to the shell, registers the page's scripts and prints its initial data. Must be safe to run twice, and must not redirect, print or write options. Add print hook callbacks here, not from admin_enqueue_scripts: the guest endpoint drops what those print.
		 * - capability (string)     Optional, default `manage_options`. Required to load the page into the shell.
		 * - handles (string[])      Optional. Script and style handles the guest endpoint prints, with their dependencies; nothing else is enqueued.
		 * - admin_menu (bool)       Optional, default false. Build the admin menu on the guest endpoint, after `load`, for page data read through menu_page_url(). What its callbacks print or hook is dropped.
		 *
		 * @since 0.14.15
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
				_doing_it_wrong( __METHOD__, esc_html( $message ), '0.14.15' );
				continue;
			}
			$valid[ $slug ] = $normalized;
		}

		return $valid;
	}

	/**
	 * The member the guest endpoint is loading in this request, readable from `init` on so members can scope their hooks to it.
	 *
	 * @since 0.15.0
	 *
	 * @return string|null Member slug, or null on any other request.
	 */
	public static function requested_guest() {
		// phpcs:disable WordPress.Security.NonceVerification -- Only scopes hooks; the endpoint verifies the nonce before it prints anything.
		// Not `page`: products treat a `page` naming them as a visit to their own screen.
		$action = isset( $_REQUEST['action'] ) && is_string( $_REQUEST['action'] ) ? sanitize_key( wp_unslash( $_REQUEST['action'] ) ) : '';
		$member = isset( $_GET['member'] ) && is_string( $_GET['member'] ) ? sanitize_key( wp_unslash( $_GET['member'] ) ) : '';
		if ( ! wp_doing_ajax() || self::GUEST_ACTION !== $action || '' === $member ) {
			return null;
		}
		return $member;
		// phpcs:enable WordPress.Security.NonceVerification
	}

	/**
	 * The member page this request is for, when the shell runs on it.
	 *
	 * @return string|null
	 */
	public static function get_host() {
		return self::resolve_host()[0];
	}

	/**
	 * The host page and the members, so callers that need both run the members filter once.
	 *
	 * @return array{0: string|null, 1: array} Host slug, or null when the shell doesn't run here; members.
	 */
	private static function resolve_host() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks which page this is.
		$page = isset( $_GET['page'] ) && is_string( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		// Members are Jetpack admin pages; checking the screen first keeps the members filter off other admin pages.
		$on_jetpack_screen = isset( $GLOBALS['hook_suffix'] ) && self::screen_id( $page ) === $GLOBALS['hook_suffix'];
		if ( '' === $page || ! $on_jetpack_screen || ! self::is_enabled() ) {
			return array( null, array() );
		}

		$members = self::get_members();
		if ( count( $members ) < 2 || ! isset( $members[ $page ] ) ) {
			return array( null, $members );
		}
		return array( $page, $members );
	}

	/**
	 * The screen ID, hook suffix and body class of a member page.
	 *
	 * @param string $slug Admin page slug.
	 * @return string
	 */
	public static function screen_id( $slug ) {
		global $admin_page_hooks;
		// Top-level pages, like Stats under the Dashboard, get core's prefix rather than the Jetpack menu's.
		return isset( $admin_page_hooks[ $slug ] ) ? 'toplevel_page_' . $slug : 'jetpack_page_' . $slug;
	}

	/**
	 * On a member page, ready the other members and print the client.
	 *
	 * @return void
	 */
	public static function setup() {
		list( $host, $members ) = self::resolve_host();
		if ( null === $host ) {
			return;
		}

		$guests = array();
		foreach ( $members as $slug => $member ) {
			if ( $slug === $host || ! current_user_can( $member['capability'] ) ) {
				continue;
			}
			list( $routes, $modules ) = self::load_guest( $member );
			if ( null !== $routes ) {
				$guests[ $slug ]                  = $routes;
				$members[ $slug ]['init_modules'] = array_values( array_unique( array_merge( $member['init_modules'], $modules ) ) );
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
	 * Enqueue the client: one script module, built from `src/admin-shell/` by webpack.
	 *
	 * @return void
	 */
	private static function enqueue_client() {
		$file = dirname( __DIR__ ) . '/build/admin-shell.js';
		if ( ! is_readable( $file ) ) {
			return;
		}
		// A hash of the file: CDNs cache script URLs by their version for a long time.
		wp_enqueue_script_module(
			self::CLIENT_MODULE,
			plugins_url( 'build/admin-shell.js', __DIR__ ),
			// Announces switches. Core prints the live regions it speaks into for its dependents.
			array(
				array(
					'id'     => '@wordpress/a11y',
					'import' => 'dynamic',
				),
			),
			substr( (string) md5_file( $file ), 0, 12 )
		);
	}

	/**
	 * Run a guest's loader and page init action on the host page, then drop the page hooks and script modules they added.
	 *
	 * @param array $member Normalized member.
	 * @return array{0: array[]|null, 1: string[]} Routes, or null when the guest's build or its routes aren't there; the script modules they enqueued.
	 */
	private static function load_guest( $member ) {
		$snapshot = self::hook_snapshot();
		$queued   = wp_script_modules()->get_queue();
		call_user_func( $member['load'] );
		$routes = self::run_page_init( $member );
		self::remove_added_callbacks( $snapshot );

		// The shell imports them with the guest's init modules, so a host visit alone never runs them.
		$modules = array_values( array_diff( wp_script_modules()->get_queue(), $queued ) );
		foreach ( $modules as $id ) {
			wp_dequeue_script_module( $id );
		}

		return array( $routes, $modules );
	}

	/**
	 * Fire a loaded member's wp-build page init action, which its enqueue check skips off its own screen.
	 *
	 * @param array $member Normalized member.
	 * @return array[]|null The page's routes, which its listeners can add to, or null when the guest's build or its routes aren't there.
	 */
	private static function run_page_init( $member ) {
		$page       = str_replace( '-', '_', $member['build_page'] );
		$get_routes = $member['build_prefix'] . '_get_' . $page . '_wp_admin_routes';
		// A build without its route registry still defines the getter, but would open a blank page.
		if ( ! function_exists( $get_routes ) || ! isset( $GLOBALS[ $member['build_prefix'] . '_' . $page . '_routes_data' ] ) ) {
			return null;
		}
		do_action( $member['build_page'] . '-wp-admin_init' ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- wp-build names this hook.
		return $get_routes();
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
			// Modules a guest adds to its own page's import map, such as Stats' widgets, which it imports on demand.
			$own_deps = apply_filters( $members[ $slug ]['build_page'] . '-wp-admin_boot_dependencies', array() ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.DynamicHooknameFound, WordPress.NamingConventions.ValidHookName.UseUnderscores -- The guest's generated wp-build hook.
			$ids      = array_merge( $ids, array_column( (array) $own_deps, 'id' ) );
			foreach ( array_unique( array_filter( $ids ) ) as $id ) {
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
			'host'             => $host,
			'members'          => array(),
			// Saved headers are per site, user and release: subdirectory multisite sites share one origin.
			'headerStorageKey' => sprintf( 'jetpack-admin-shell-header:%d:%d:%s:', get_current_blog_id(), get_current_user_id(), Admin_Menu::PACKAGE_VERSION ),
			'guestAssetsUrl'   => add_query_arg(
				array(
					'action' => self::GUEST_ACTION,
					'nonce'  => wp_create_nonce( self::GUEST_ACTION ),
				),
				admin_url( 'admin-ajax.php' )
			),
			'featureUrl'       => add_query_arg(
				array(
					'action' => self::FEATURE_ACTION,
					'nonce'  => wp_create_nonce( self::FEATURE_ACTION ),
				),
				admin_url( 'admin-ajax.php' )
			),
			'featureOff'       => array(
				/* translators: %s is a feature name, e.g. "Jetpack Forms". */
				'heading' => __( '%s is off', 'jetpack-admin-ui' ),
				'text'    => __( 'It was switched off in My Jetpack. Turning it on brings this page and its menu item back.', 'jetpack-admin-ui' ),
				/* translators: %s is a feature name, e.g. "Jetpack Forms". */
				'button'  => __( 'Turn on %s', 'jetpack-admin-ui' ),
				'busy'    => __( 'Turning on…', 'jetpack-admin-ui' ),
				'failed'  => __( 'It could not be turned on. Try again from My Jetpack.', 'jetpack-admin-ui' ),
			),
			'maxLiveApps'      => self::max_live_apps(),
		);
		foreach ( array( $host => array() ) + $guests as $slug => $routes ) {
			$member                     = $members[ $slug ];
			$gate                       = self::feature_gate( $slug );
			$config['members'][ $slug ] = array(
				'mountId'     => $member['build_page'] . '-wp-admin-app',
				'routes'      => $routes,
				'initModules' => $member['init_modules'],
				'defaultPath' => $member['default_path'],
				'title'       => $member['title'],
				'header'      => $member['header'],
				'adminTitle'  => self::admin_title( $slug, $member['title'] ),
				'bodyClass'   => self::screen_id( $slug ),
				'gate'        => $gate,
				// Ties the gate to this member, so the feature endpoint answers for no other.
				'gateNonce'   => null === $gate ? null : wp_create_nonce( self::gate_action( $slug, $gate ) ),
				// Guests are checked when they are opened; the host is on screen already.
				'featureOn'   => $slug !== $host || null === $gate || ! self::stands_in( $gate ),
			);
			// So the host shows its card without asking again.
			if ( false === $config['members'][ $slug ]['featureOn'] ) {
				$config['members'][ $slug ]['featureCard'] = self::feature_off_card( $slug );
			}
		}
		return $config;
	}

	/**
	 * The gate a member's menu item declared, while this admin-ui can answer for it.
	 *
	 * @param string $slug Admin page slug.
	 * @return array|null
	 */
	private static function feature_gate( $slug ) {
		// The admin-ui that won the autoloader may predate these methods.
		if ( ! method_exists( Admin_Menu::class, 'get_feature_gate' ) ) {
			return null;
		}
		return Admin_Menu::get_feature_gate( $slug );
	}

	/**
	 * Say whether a member's feature is on, or, on a POST with `activate`, turn it on.
	 *
	 * @return void
	 */
	public static function ajax_feature() {
		check_ajax_referer( self::FEATURE_ACTION, 'nonce' );
		// phpcs:disable WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- Checked above.
		$slug = isset( $_REQUEST['member'] ) && is_string( $_REQUEST['member'] ) ? sanitize_key( wp_unslash( $_REQUEST['member'] ) ) : '';
		$gate = array();
		foreach ( array( 'product', 'module' ) as $key ) {
			if ( isset( $_REQUEST[ $key ] ) && is_string( $_REQUEST[ $key ] ) && '' !== $_REQUEST[ $key ] ) {
				$gate[ $key ] = sanitize_key( wp_unslash( $_REQUEST[ $key ] ) );
			}
		}
		$activate   = isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] && ! empty( $_POST['activate'] );
		$gate_nonce = isset( $_REQUEST['gate_nonce'] ) && is_string( $_REQUEST['gate_nonce'] ) ? sanitize_key( wp_unslash( $_REQUEST['gate_nonce'] ) ) : '';
		// phpcs:enable

		if ( ! self::is_member_gate( $slug, $gate, $gate_nonce ) ) {
			wp_send_json_error( null, 403, JSON_UNESCAPED_SLASHES );
		}

		$result = self::feature( $slug, $gate, $activate );
		if ( is_int( $result ) ) {
			wp_send_json_error( null, $result, JSON_UNESCAPED_SLASHES );
		}
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ), 200, JSON_UNESCAPED_SLASHES );
		}
		$data = array( 'on' => $result );
		if ( ! $result ) {
			$data['card'] = self::feature_off_card( $slug );
		}
		wp_send_json_success( $data, 200, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * The HTML the shell shows in place of a member page whose feature is off.
	 *
	 * @param string $slug Admin page slug of the member.
	 * @return string Empty for the shell's plain panel.
	 */
	private static function feature_off_card( $slug ) {
		/**
		 * Filters the HTML the shell shows in place of a member page whose feature is off. Empty for the shell's plain panel.
		 *
		 * @since 0.15.0
		 *
		 * @param string $html Card HTML.
		 * @param string $slug Admin page slug of the member.
		 */
		return (string) apply_filters( 'jetpack_admin_shell_feature_off_card', '', $slug );
	}

	/**
	 * Whether a member's page shows as itself, after turning its feature on when asked to.
	 *
	 * @param string $slug     Member page slug.
	 * @param array  $gate     The gate the member's menu item declared.
	 * @param bool   $activate Whether to turn the feature on first.
	 * @return bool|\WP_Error|int False when the shell stands in for it, the activation error, or an HTTP status: 404 for no such member or gate, 403 when the user can't open it.
	 */
	public static function feature( $slug, array $gate, $activate = false ) {
		if ( ! self::is_enabled() || ! $gate || ! method_exists( Admin_Menu::class, 'is_feature_on' ) ) {
			return 404;
		}
		$members = self::get_members();
		if ( isset( $members[ $slug ] ) && ! current_user_can( $members[ $slug ]['capability'] ) ) {
			return 403;
		}
		// Most members stop joining the shell while their feature is off, so a missing one is known only when the shell stands in for it.
		if ( ! isset( $members[ $slug ] ) && ! self::stands_in( $gate ) ) {
			return 404;
		}
		if ( $activate ) {
			$result = self::can_turn_on( $gate )
				? Admin_Menu::turn_feature_on( $gate )
				: new \WP_Error( 'not_available', __( 'This feature can only be turned on from My Jetpack.', 'jetpack-admin-ui' ) );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}
		return ! self::stands_in( $gate );
	}

	/**
	 * Whether the shell shows a turn-on panel instead of a page: its feature is off and can be turned on here.
	 *
	 * @param array $gate A member's gate.
	 * @return bool
	 */
	private static function stands_in( array $gate ) {
		return ! Admin_Menu::is_feature_on( $gate ) && self::can_turn_on( $gate );
	}

	/**
	 * Whether this admin-ui and the site's activator can turn a gate's feature on.
	 *
	 * @param array $gate A member's gate.
	 * @return bool
	 */
	private static function can_turn_on( array $gate ) {
		// An older Admin_Menu, loaded first from another plugin's copy, predates the check.
		return method_exists( Admin_Menu::class, 'can_turn_feature_on' ) && Admin_Menu::can_turn_feature_on( $gate );
	}

	/**
	 * Whether a gate is the one this site gave the member, by the nonce sent with the shell config.
	 *
	 * @param string $slug  Member page slug.
	 * @param array  $gate  Gate from the request.
	 * @param string $nonce Gate nonce from the request.
	 * @return bool
	 */
	public static function is_member_gate( $slug, array $gate, $nonce ) {
		return '' !== $nonce && false !== wp_verify_nonce( $nonce, self::gate_action( $slug, $gate ) );
	}

	/**
	 * The nonce action that ties a gate to its member.
	 *
	 * @param string $slug Member page slug.
	 * @param array  $gate Its gate.
	 * @return string
	 */
	private static function gate_action( $slug, array $gate ) {
		ksort( $gate );
		return self::FEATURE_ACTION . '|' . $slug . '|' . http_build_query( $gate );
	}

	/**
	 * How many dashboards the client may keep live in one document.
	 *
	 * @return int|null The limit, or null to let the client size it from the device's memory.
	 */
	private static function max_live_apps() {
		/**
		 * Filters how many dashboards the admin shell keeps live, prewarmed or mounted, in one document.
		 * Past the limit, opening another dashboard loads the page.
		 *
		 * @since 0.15.0
		 *
		 * @param int|null $max_live_apps A positive limit, counting the page that loaded; null sizes it from the device's memory.
		 */
		$max_live_apps = apply_filters( 'jetpack_admin_shell_max_live_apps', null );
		return is_numeric( $max_live_apps ) && (int) $max_live_apps > 0 ? (int) $max_live_apps : null;
	}

	/**
	 * The document title a member page gets on its own page load.
	 *
	 * @param string $slug     Admin page slug.
	 * @param string $fallback Title to use when the page isn't in the admin menu.
	 * @return string
	 */
	private static function admin_title( $slug, $fallback ) {
		global $submenu;
		$title = $fallback;
		foreach ( is_array( $submenu ) ? $submenu : array() as $items ) {
			foreach ( $items as $item ) {
				if ( isset( $item[2] ) && $slug === $item[2] ) {
					$title = wp_strip_all_tags( $item[3] ?? $item[0] );
					break 2;
				}
			}
		}
		/* translators: Admin screen title. 1: Admin screen name, 2: Network or site name. */
		$admin_title = sprintf( __( '%1$s &lsaquo; %2$s &#8212; WordPress' ), $title, get_bloginfo( 'name' ) ); // phpcs:ignore WordPress.WP.I18n.MissingArgDomain -- Core's string, so the title matches the one core prints.
		/** This filter is documented in wp-admin/admin-header.php */
		$admin_title = apply_filters( 'admin_title', $admin_title, $title ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core filter.
		return html_entity_decode( wp_strip_all_tags( $admin_title ), ENT_QUOTES, 'UTF-8' );
	}

	/**
	 * Send the styles and scripts a guest prints on its own page, for the client to run before booting it.
	 *
	 * @return void
	 */
	public static function ajax_guest_assets() {
		check_ajax_referer( self::GUEST_ACTION, 'nonce' );
		$slug = self::requested_guest() ?? '';

		$html = self::guest_assets( $slug );
		if ( is_int( $html ) ) {
			wp_send_json_error( null, $html, JSON_UNESCAPED_SLASHES );
		}
		wp_send_json_success( array( 'html' => $html ), 200, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * The styles and scripts a member prints on its own page.
	 *
	 * @param string $slug Member page slug.
	 * @return string|int The HTML, or an HTTP status: 404 for no such member while the shell is on, 403 when the user can't open it.
	 */
	public static function guest_assets( $slug ) {
		$members = self::is_enabled() ? self::get_members() : array();
		if ( ! isset( $members[ $slug ] ) ) {
			return 404;
		}
		if ( ! current_user_can( $members[ $slug ]['capability'] ) ) {
			return 403;
		}

		$snapshot = self::hook_snapshot();
		call_user_func( $members[ $slug ]['load'] );
		if ( $members[ $slug ]['admin_menu'] ) {
			self::register_admin_menu_pages();
		}
		self::run_page_init( $members[ $slug ] );
		$own         = self::added_keys( $snapshot );
		$hook_suffix = self::screen_id( $slug );
		set_current_screen( $hook_suffix );
		$GLOBALS['concatenate_scripts'] = false; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- One script tag per handle, so the client can skip what the host already has.

		ob_start();
		do_action( 'admin_enqueue_scripts', $hook_suffix ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		$handles = $members[ $slug ]['handles'];
		// Only the member's own handles, and what they depend on, go back to the page. Printing them
		// even when nothing enqueued them: a page can rely on another script pulling one in.
		foreach ( array( wp_scripts(), wp_styles() ) as $dependencies ) {
			$dependencies->queue = array_values( array_filter( $handles, array( $dependencies, 'query' ) ) );
		}
		self::guard_api_fetch_setup();
		wp_print_styles();
		self::fire_print_hook( 'admin_print_scripts', $own['admin_print_scripts'] );
		print_head_scripts();
		print_footer_scripts();
		self::fire_print_hook( 'admin_print_footer_scripts', $own['admin_print_footer_scripts'] );
		return ob_get_clean();
	}

	/**
	 * Register the admin menu's pages, which admin-ajax never does, keeping only the pages: what its callbacks print or hook is dropped.
	 *
	 * Runs `admin_menu` alone: core's wp-admin/menu.php would also run its page access check, which dies on admin-ajax.
	 *
	 * @return void
	 */
	private static function register_admin_menu_pages() {
		global $menu, $submenu, $wp_filter;
		if ( did_action( 'admin_menu' ) ) {
			return;
		}
		// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited -- Menu callbacks expect the arrays core's menu.php would have set up.
		$menu    = is_array( $menu ) ? $menu : array();
		$submenu = is_array( $submenu ) ? $submenu : array();
		// phpcs:enable WordPress.WP.GlobalVariablesOverride.Prohibited
		$before = array();
		foreach ( $wp_filter as $hook => $callbacks ) {
			$before[ $hook ] = $callbacks->callbacks;
		}

		ob_start();
		do_action( 'admin_menu', '' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		ob_end_clean();

		// A hover must not run them: Jetpack's plan check on current_screen, for one, turns off modules.
		foreach ( $wp_filter as $hook => $callbacks ) {
			foreach ( $callbacks->callbacks as $priority => $by_id ) {
				foreach ( $by_id as $id => $callback ) {
					if ( ! isset( $before[ $hook ][ $priority ][ $id ] ) ) {
						remove_filter( $hook, $callback['function'], $priority );
					}
				}
			}
		}
	}

	/**
	 * Skip core's api-fetch setup when the host page already ran it.
	 *
	 * A second nonce middleware would keep sending the stale nonce after a refresh, so requests loop.
	 *
	 * @return void
	 */
	private static function guard_api_fetch_setup() {
		$after = wp_scripts()->get_data( 'wp-api-fetch', 'after' );
		if ( ! is_array( $after ) ) {
			return;
		}
		foreach ( $after as $i => $code ) {
			if ( is_string( $code ) && ( false !== strpos( $code, 'createRootURLMiddleware' ) || false !== strpos( $code, 'createNonceMiddleware' ) ) ) {
				$after[ $i ] = "if ( ! wp.apiFetch.nonceMiddleware ) {\n" . $code . "\n}";
			}
		}
		wp_scripts()->add_data( 'wp-api-fetch', 'after', $after );
	}

	/**
	 * Fire a print hook, discarding what callbacks echo or enqueue unless the member added them or core defines them.
	 *
	 * Every callback still runs, so data attached to the member's handles prints. Their output already ran on the host page.
	 *
	 * @param string             $hook Hook name.
	 * @param array<string,true> $own  Callbacks the member's loader added, keyed as hook_snapshot() keys them.
	 * @return void
	 */
	private static function fire_print_hook( $hook, array $own ) {
		global $wp_filter;
		$wrapped = array();
		foreach ( isset( $wp_filter[ $hook ] ) ? $wp_filter[ $hook ]->callbacks : array() as $priority => $by_id ) {
			foreach ( $by_id as $id => $callback ) {
				if ( isset( $own[ $priority . '|' . $id ] ) || self::is_core_callback( $callback['function'] ) ) {
					continue;
				}
				$function                    = $callback['function'];
				$wrapped[ $priority ][ $id ] = $function;
				$wp_filter[ $hook ]->callbacks[ $priority ][ $id ]['function'] = static function ( ...$args ) use ( $function ) {
					$level = ob_get_level();
					// WordPress.com enqueues jQuery here; printed again, it drops the host's plugins, like wpcom_proxy_request.
					$queues = array( wp_scripts()->queue, wp_styles()->queue );
					ob_start();
					try {
						call_user_func_array( $function, $args );
					} finally {
						wp_scripts()->queue = $queues[0];
						wp_styles()->queue  = $queues[1];
						// Also closes buffers the callback left open, stopping at one that can't be removed.
						while ( ob_get_level() > $level && ob_end_clean() ) {
							continue;
						}
					}
				};
			}
		}

		try {
			do_action( $hook ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.DynamicHooknameFound -- A core print hook.
		} finally {
			foreach ( $wrapped as $priority => $by_id ) {
				foreach ( $by_id as $id => $function ) {
					if ( isset( $wp_filter[ $hook ]->callbacks[ $priority ][ $id ] ) ) {
						$wp_filter[ $hook ]->callbacks[ $priority ][ $id ]['function'] = $function;
					}
				}
			}
		}
	}

	/**
	 * Whether a callback is defined in WordPress core, which prints the member's handles and script module data.
	 *
	 * The Gutenberg plugin counts as core: it can replace core's script module printers.
	 *
	 * @param callable $callback Callback.
	 * @return bool
	 */
	private static function is_core_callback( $callback ) {
		static $core_dirs = null;
		if ( null === $core_dirs ) {
			$core_dirs = array();
			$dirs      = array( ABSPATH . WPINC, ABSPATH . 'wp-admin' );
			// Found from its main file: WordPress.com loads it from a versioned directory.
			if ( function_exists( 'gutenberg_pre_init' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- Defined by the Gutenberg plugin, when active.
				$dirs[] = dirname( (string) ( new \ReflectionFunction( 'gutenberg_pre_init' ) )->getFileName() );
			}
			foreach ( $dirs as $dir ) {
				$real = realpath( $dir );
				if ( false !== $real ) {
					$core_dirs[] = trailingslashit( wp_normalize_path( $real ) );
				}
			}
		}
		try {
			$file = ( new \ReflectionFunction( \Closure::fromCallable( $callback ) ) )->getFileName();
		} catch ( \Throwable $e ) {
			return false;
		}
		if ( ! is_string( $file ) ) {
			return false;
		}
		$file = wp_normalize_path( $file );
		foreach ( $core_dirs as $dir ) {
			if ( 0 === strpos( $file, $dir ) ) {
				return true;
			}
		}
		return false;
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
	 * Keys of the callbacks added to the deferred hooks since the snapshot.
	 *
	 * @param array<string, array<string, true>> $snapshot From hook_snapshot().
	 * @return array<string, array<string, true>> Keyed by every deferred hook.
	 */
	private static function added_keys( $snapshot ) {
		$added = array();
		foreach ( self::hook_snapshot() as $hook => $keys ) {
			$added[ $hook ] = array_diff_key( $keys, $snapshot[ $hook ] );
		}
		return $added;
	}

	/**
	 * Callbacks added to the deferred hooks since the snapshot, in the order the hooks would run them.
	 *
	 * @param array<string, array<string, true>> $snapshot From hook_snapshot().
	 * @return array<string, array<array{function: callable, priority: int}>> Keyed by every deferred hook.
	 */
	private static function added_callbacks( $snapshot ) {
		global $wp_filter;
		$added = array();
		foreach ( self::DEFERRED_HOOKS as $hook ) {
			$added[ $hook ] = array();
			$callbacks      = isset( $wp_filter[ $hook ] ) ? $wp_filter[ $hook ]->callbacks : array();
			ksort( $callbacks );
			foreach ( $callbacks as $priority => $by_id ) {
				foreach ( $by_id as $id => $callback ) {
					if ( ! isset( $snapshot[ $hook ][ $priority . '|' . $id ] ) ) {
						$added[ $hook ][] = array(
							'function' => $callback['function'],
							'priority' => $priority,
						);
					}
				}
			}
		}
		return $added;
	}

	/**
	 * Remove callbacks added to the deferred hooks since the snapshot.
	 *
	 * @param array<string, array<string, true>> $snapshot From hook_snapshot().
	 * @return void
	 */
	private static function remove_added_callbacks( $snapshot ) {
		foreach ( self::added_callbacks( $snapshot ) as $hook => $callbacks ) {
			foreach ( $callbacks as $callback ) {
				remove_filter( $hook, $callback['function'], $callback['priority'] );
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

		$member += array(
			'init_modules' => array(),
			'header'       => null,
			'default_path' => null,
			'capability'   => 'manage_options',
			'handles'      => array(),
			'admin_menu'   => false,
		);

		if (
			! self::is_string_list( $member['init_modules'] )
			|| ! self::is_string_list( $member['handles'] )
			|| ! is_string( $member['capability'] ) || '' === $member['capability']
			|| ! is_bool( $member['admin_menu'] )
			|| ( null !== $member['default_path'] && ! is_string( $member['default_path'] ) )
		) {
			return null;
		}

		// Only cosmetic, so a malformed header is dropped and the member kept.
		if ( null !== $member['header'] && false !== $member['header'] && ! self::is_header( $member['header'] ) ) {
			$member['header'] = null;
			$message          = sprintf( 'Admin shell member "%s" has a header without a title and subtitle, so the header was skipped.', $slug );
			// Keep on one line: the release tooling only replaces the version in a single-line call.
			_doing_it_wrong( __CLASS__ . '::get_members', esc_html( $message ), '0.14.15' );
		}

		return $member;
	}

	/**
	 * Whether a value is a page header: a non-empty `title`, and a `subtitle` string or null.
	 *
	 * @param mixed $value Value to check.
	 * @return bool
	 */
	private static function is_header( $value ) {
		return is_array( $value )
			&& isset( $value['title'] ) && is_string( $value['title'] ) && '' !== $value['title']
			&& array_key_exists( 'subtitle', $value ) && ( null === $value['subtitle'] || is_string( $value['subtitle'] ) );
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

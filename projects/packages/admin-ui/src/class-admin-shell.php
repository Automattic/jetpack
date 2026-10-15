<?php
/**
 * Exploratory: switch between Jetpack wp-build dashboards without a page load.
 *
 * Each member dashboard keeps its own boot app. On a member page, the other members' modules
 * join the import map, and the client boots a member's app the first time it is opened, then
 * hides and shows the apps on later switches.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Keeps member dashboards alive side by side in one wp-admin page.
 */
class Admin_Shell {

	/**
	 * Whether init() has run.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Routes collected per member page slug.
	 *
	 * @var array
	 */
	private static $routes = array();

	/**
	 * Member currently collecting routes.
	 *
	 * @var string|null
	 */
	private static $collecting = null;

	/**
	 * Hook the shell up. Does nothing unless `jetpack_admin_shell_enabled` returns true.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Priority 2: after members load their own wp-build at priority 1, before menus register at 999.
		add_action( 'admin_menu', array( __CLASS__, 'setup' ), 2 );
		add_action( 'admin_init', array( __CLASS__, 'maybe_render_as_frame' ) );
		add_action( 'wp_ajax_jetpack_admin_shell_guest', array( __CLASS__, 'ajax_guest_assets' ) );
	}

	/**
	 * Hooks where guests add their page data; on the host page those callbacks wait for the guest endpoint.
	 */
	const DEFERRED_HOOKS = array( 'admin_enqueue_scripts', 'admin_print_scripts', 'admin_print_footer_scripts', 'jetpack_admin_js_script_data' );

	/**
	 * Snapshot the callbacks on the deferred hooks.
	 *
	 * @return array
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
	 * @param array $snapshot From hook_snapshot().
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
	 * Return the styles and scripts a guest prints on its own page, for the client to run before booting it.
	 *
	 * @return void
	 */
	public static function ajax_guest_assets() {
		check_ajax_referer( 'jetpack_admin_shell', 'nonce' );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Checked above.
		$slug    = isset( $_GET['member'] ) ? sanitize_key( wp_unslash( $_GET['member'] ) ) : '';
		$members = self::is_enabled() ? self::get_members() : array();
		if ( ! isset( $members[ $slug ] ) ) {
			wp_send_json_error( null, 404, JSON_UNESCAPED_SLASHES );
		}

		call_user_func( $members[ $slug ]['load'] );
		set_current_screen( 'jetpack_page_' . $slug );
		$GLOBALS['concatenate_scripts'] = false; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		do_action( 'admin_enqueue_scripts', 'jetpack_page_' . $slug ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		ob_start();
		wp_print_styles();
		do_action( 'admin_print_scripts' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		print_head_scripts();
		print_footer_scripts();
		do_action( 'admin_print_footer_scripts' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook.
		wp_send_json_success( array( 'html' => ob_get_clean() ), 200, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * Admin pages that never load in a keep-alive frame, by `page` slug.
	 *
	 * @return string[]
	 */
	public static function get_frame_exclusions() {
		/**
		 * Filters the admin pages the shell must not preload in a frame.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $pages Page slugs. Blaze lives outside wp-admin, so it is excluded.
		 */
		return (array) apply_filters( 'jetpack_admin_shell_frame_exclusions', array( 'advertising' ) );
	}

	/**
	 * Whether this request is a page the shell loaded into a keep-alive frame.
	 *
	 * @return bool
	 */
	public static function is_frame_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return isset( $_GET['jetpack_shell_frame'] ) && self::is_enabled();
	}

	/**
	 * Strip the wp-admin chrome from a framed page and keep its own navigation inside the shell.
	 *
	 * @return void
	 */
	public static function maybe_render_as_frame() {
		if ( ! self::is_frame_request() ) {
			return;
		}

		// A form post that redirects back to the page must stay chromeless.
		add_filter(
			'wp_redirect',
			static function ( $location ) {
				return str_contains( $location, 'jetpack_shell_frame' ) ? $location : add_query_arg( 'jetpack_shell_frame', '1', $location );
			}
		);
		add_filter(
			'admin_body_class',
			static function ( $classes ) {
				return $classes . ' jetpack-shell-frame';
			}
		);
		add_action(
			'admin_head',
			static function () {
				echo '<style>html.wp-toolbar{padding-top:0}#wpadminbar,#adminmenumain,#wpfooter{display:none}#wpcontent,#wpfooter{margin-inline-start:0}#wpbody-content{inset-block-start:0!important;inset-inline-start:0!important}</style>';
				wp_print_inline_script_tag( file_get_contents( __DIR__ . '/admin-shell-frame.js' ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			}
		);
	}

	/**
	 * Whether the shell is on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Filters whether Jetpack dashboards share one wp-admin page.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Default false.
		 */
		return (bool) apply_filters( 'jetpack_admin_shell_enabled', false );
	}

	/**
	 * Member dashboards, keyed by their admin page slug.
	 *
	 * Each entry: build_prefix and build_page (the wp-build names), init_modules, title,
	 * optional default_path (the `p` a bare menu link opens), and load (a callable that readies
	 * the member's wp-build and page data while another member's page renders).
	 *
	 * @return array
	 */
	public static function get_members() {
		/**
		 * Filters the dashboards that share the admin shell.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $members Member definitions keyed by admin page slug.
		 */
		return (array) apply_filters( 'jetpack_admin_shell_members', array() );
	}

	/**
	 * The member page this request is for, when the shell is active.
	 *
	 * @return string|null
	 */
	public static function get_host() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		if ( '' === $page || self::is_frame_request() || ! self::is_enabled() ) {
			return null;
		}

		$members = self::get_members();
		if ( count( $members ) < 2 || ! isset( $members[ $page ] ) ) {
			return null;
		}
		return $page;
	}

	/**
	 * Receives one route from a member's generated route registration.
	 *
	 * @param string      $path           Route path.
	 * @param string|null $content_module Content script module ID.
	 * @param string|null $route_module   Route script module ID.
	 * @return void
	 */
	public static function collect_route( $path, $content_module = null, $route_module = null ) {
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
	 * Load the other members onto the host page and add their modules to its import map.
	 *
	 * @return void
	 */
	public static function setup() {
		$host = self::get_host();
		if ( null === $host ) {
			return;
		}

		$members = self::get_members();
		$guests  = array_diff_key( $members, array( $host => true ) );

		foreach ( $guests as $slug => $guest ) {
			$snapshot = self::hook_snapshot();
			call_user_func( $guest['load'] );
			self::remove_added_callbacks( $snapshot );

			$register_page_routes = $guest['build_prefix'] . '_register_page_routes';
			$routes_global        = $guest['build_prefix'] . '_' . str_replace( '-', '_', $guest['build_page'] ) . '_routes_data';
			if ( ! function_exists( $register_page_routes ) || ! isset( $GLOBALS[ $routes_global ] ) ) {
				unset( $guests[ $slug ] );
				continue;
			}
			// The generated helper only calls a registrar that function_exists() accepts.
			self::$collecting = $slug;
			call_user_func( $register_page_routes, $GLOBALS[ $routes_global ], __NAMESPACE__ . '\\admin_shell_collect_route' );
			self::$collecting = null;
		}

		$host_build_page = $members[ $host ]['build_page'];

		add_filter(
			$host_build_page . '-wp-admin_boot_dependencies',
			static function ( $deps ) use ( $guests ) {
				foreach ( $guests as $slug => $guest ) {
					foreach ( $guest['init_modules'] as $id ) {
						$deps[] = array(
							'import' => 'static',
							'id'     => $id,
						);
					}
					foreach ( self::$routes[ $slug ] ?? array() as $route ) {
						if ( isset( $route['route_module'] ) ) {
							$deps[] = array(
								'import' => 'static',
								'id'     => $route['route_module'],
							);
						}
						if ( isset( $route['content_module'] ) ) {
							$deps[] = array(
								'import' => 'dynamic',
								'id'     => $route['content_module'],
							);
						}
					}
				}
				return $deps;
			}
		);

		add_action(
			'admin_head',
			static function () use ( $host, $members, $guests ) {
				self::print_script( $host, $members, array_keys( $guests ) );
			}
		);
	}

	/**
	 * Print the client half.
	 *
	 * @param string   $host    Host page slug.
	 * @param array    $members Member definitions.
	 * @param string[] $guests  Guest page slugs that loaded.
	 * @return void
	 */
	private static function print_script( $host, $members, $guests ) {
		$config = array(
			'host'            => $host,
			'members'         => array(),
			'frameExclusions' => self::get_frame_exclusions(),
			'guestAssetsUrl'  => add_query_arg(
				array(
					'action' => 'jetpack_admin_shell_guest',
					'nonce'  => wp_create_nonce( 'jetpack_admin_shell' ),
				),
				admin_url( 'admin-ajax.php' )
			),
		);
		foreach ( array_merge( array( $host ), $guests ) as $slug ) {
			$member                     = $members[ $slug ];
			$config['members'][ $slug ] = array(
				'mountId'     => $member['build_page'] . '-wp-admin-app',
				'routes'      => self::$routes[ $slug ] ?? array(),
				'initModules' => $member['init_modules'],
				'defaultPath' => $member['default_path'] ?? null,
				'title'       => $member['title'] ?? '',
			);
		}
		// A page's own stylesheet undoes the classic admin-page offset; a placeholder can show before it loads.
		echo '<style>.jetpack-admin-shell-placeholder .jp-admin-page{margin:0}</style>';
		wp_print_inline_script_tag(
			sprintf(
				'(%s)(%s);',
				rtrim( file_get_contents( __DIR__ . '/admin-shell.js' ), "; \n" ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				wp_json_encode( $config, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
			)
		);
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

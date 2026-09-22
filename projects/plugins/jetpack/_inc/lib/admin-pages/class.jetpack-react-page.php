<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets\Logo;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

require_once __DIR__ . '/class.jetpack-admin-page.php';
require_once __DIR__ . '/class-jetpack-redux-state-helper.php';

/**
 * Builds the landing page and its menu.
 */
class Jetpack_React_Page extends Jetpack_Admin_Page {
	/**
	 * Show the landing page only when Jetpack is connected.
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = false;

	/**
	 * Used for fallback when REST API is disabled.
	 *
	 * @var bool
	 */
	protected $is_redirecting = false;

	/**
	 * Hash routes the Settings app still renders; the legacy route redirect leaves them alone.
	 *
	 * Mirrors `settingsRoutes` in `_inc/client/main.jsx`, plus the app's other unredirected
	 * paths: `/newsletter`, the connection screens and the admin skip-link anchors.
	 *
	 * @var string[]
	 */
	const SPA_ROUTES = array(
		'/settings',
		'/security',
		'/performance',
		'/writing',
		'/sharing',
		'/discussion',
		'/earn',
		'/reader',
		'/traffic',
		'/privacy',
		'/newsletter',
		'/setup',
		'/connect-user',
		'/connect-user-setup',
		'/wpbody-content',
		'/wp-toolbar',
	);

	/**
	 * Sends the hash to its route's target, else to the fallback; unset targets stay in the app.
	 *
	 * @var string
	 */
	const LEGACY_ROUTE_REDIRECT_SCRIPT = <<<'JS'
function ( keep, routes, fallback ) {
	var path = window.location.hash.replace( /^#\/?/, '/' ).split( '?' )[ 0 ] || '/';
	var hasRoute = Object.prototype.hasOwnProperty.call( routes, path );
	var target = keep.indexOf( path ) === -1 && ( hasRoute ? routes[ path ] : fallback );
	if ( target ) {
		window.location.replace( target );
	}
}
JS;

	/**
	 * Add the main admin Jetpack menu.
	 *
	 * @return string|false Return value from WordPress's `add_menu_page()`.
	 */
	public function get_page_hook() {
		$logo = new Logo();
		// Keep this fallback in sync with Jetpack_Network::add_network_admin_menu().
		$icon = method_exists( $logo, 'get_base64_admin_menu_logo' ) ? $logo->get_base64_admin_menu_logo() : $logo->get_base64_logo();
		return add_menu_page( 'Jetpack', 'Jetpack', 'jetpack_admin_page', 'jetpack', array( $this, 'render' ), $icon, 3 );
	}

	/**
	 * Add page action.
	 *
	 * @param string $hook Hook of current page.
	 * @return void
	 */
	public function add_page_actions( $hook ) {
		/** This action is documented in class.jetpack-admin.php */
		do_action( 'jetpack_admin_menu', $hook );

		if ( ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		$page = sanitize_text_field( wp_unslash( $_GET['page'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'jetpack' !== $page ) {
			if ( strpos( $page, 'jetpack/' ) === 0 ) {
				$section = substr( $page, 8 );
				wp_safe_redirect( admin_url( 'admin.php?page=jetpack#/' . $section ) );
				exit( 0 );
			}
			return; // No need to handle the fallback redirection if we are not on the Jetpack page.
		}

		// Adding a redirect meta tag if the REST API is disabled.
		if ( ! $this->is_rest_api_enabled() ) {
			$this->is_redirecting = true;
			add_action( 'admin_head', array( $this, 'add_fallback_head_meta' ) );
		} else {
			add_action( 'admin_head', array( $this, 'print_legacy_route_redirect' ), 1 );
		}

		// Adding a redirect meta tag wrapped in noscript tags for all browsers in case they have JavaScript disabled.
		add_action( 'admin_head', array( $this, 'add_noscript_head_meta' ) );

		// If this is the first time the user is viewing the admin, don't show JITMs.
		// This filter is added just in time because this function is called on admin_menu
		// and JITMs are initialized on admin_init.
		if ( Jetpack::is_connection_ready() && ! Jetpack_Options::get_option( 'first_admin_view', false ) ) {
			Jetpack_Options::update_option( 'first_admin_view', true );
			add_filter( 'jetpack_just_in_time_msgs', '__return_false' );
		}
	}

	/**
	 * Remove the main Jetpack submenu if a site is in offline mode or connected
	 * or if My Jetpack is available.
	 * At that point, admins can access the Jetpack Dashboard instead.
	 *
	 * @since 13.8
	 */
	public function remove_jetpack_menu() {
		$is_offline_mode = ( new Status() )->is_offline_mode();
		$has_my_jetpack  = (
			class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' ) &&
			method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'should_initialize' ) &&
			\Automattic\Jetpack\My_Jetpack\Initializer::should_initialize()
		);

		if ( $is_offline_mode || $has_my_jetpack || Jetpack::is_connection_ready() ) {
			remove_submenu_page( 'jetpack', 'jetpack' );
		}
	}

	/**
	 * Where links into the removed dashboard routes land.
	 *
	 * Admins go to My Jetpack wherever it runs. Everyone else stays in the app,
	 * whose unknown-route handler opens Settings. While the partner coupon screen
	 * applies, every route goes there.
	 *
	 * @return array{keep: string[], routes: array<string, string>, fallback: string|null}
	 */
	public static function get_legacy_route_redirects() {
		$coupon_screen = self::get_partner_coupon_redirect();
		if ( $coupon_screen ) {
			return array(
				'keep'     => array(),
				'routes'   => array(),
				'fallback' => $coupon_screen,
			);
		}

		$pricing_url = Redirect::get_url( 'jetpack-plans' );
		$routes      = array(
			'/plans'        => $pricing_url,
			'/plans-prompt' => $pricing_url,
		);
		$fallback    = null;

		if ( self::can_use_my_jetpack() ) {
			$fallback = admin_url( 'admin.php?page=my-jetpack' );

			foreach ( array( 'akismet', 'backup', 'scan', 'search', 'security', 'videopress' ) as $product ) {
				$routes[ '/product/' . $product ] = $fallback . '#/add-' . $product;
			}

			$routes['/license/activation'] = $fallback . '#/add-license';

			foreach ( array( '/reconnect', '/disconnect', '/woo-setup' ) as $route ) {
				$routes[ $route ] = $fallback . '#/connection';
			}
		}

		return array(
			'keep'     => self::SPA_ROUTES,
			'routes'   => $routes,
			'fallback' => $fallback,
		);
	}

	/**
	 * Whether this request may be sent away from the app.
	 *
	 * @return bool
	 */
	public static function should_redirect_legacy_routes() {
		// A pending error only renders via the SPA's state notices; losing it would strand the admin.
		return ! Jetpack::state( 'error' );
	}

	/**
	 * Print the legacy route redirect; it must run before the app because the server never sees the hash.
	 */
	public function print_legacy_route_redirect() {
		if ( ! self::should_redirect_legacy_routes() ) {
			return;
		}

		$table = self::get_legacy_route_redirects();
		$flags = JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP;

		wp_print_inline_script_tag(
			sprintf(
				'( %s )( %s, %s, %s );',
				self::LEGACY_ROUTE_REDIRECT_SCRIPT,
				wp_json_encode( $table['keep'], $flags ),
				wp_json_encode( (object) $table['routes'], $flags ),
				wp_json_encode( $table['fallback'], $flags )
			)
		);
	}

	/**
	 * Whether My Jetpack can take over for the current user.
	 *
	 * @return bool
	 */
	private static function can_use_my_jetpack() {
		return current_user_can( 'manage_options' )
			&& class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' )
			&& method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'should_initialize' )
			&& \Automattic\Jetpack\My_Jetpack\Initializer::should_initialize();
	}

	/**
	 * The My Jetpack coupon screen, while it should replace this page.
	 *
	 * An older My Jetpack bounces showCouponRedemption back here, so only forward to one that renders it.
	 *
	 * @return string|null
	 */
	private static function get_partner_coupon_redirect() {
		if (
			! class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' )
			|| ! method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'get_partner_coupon_screen' )
			|| null === \Automattic\Jetpack\My_Jetpack\Initializer::get_partner_coupon_screen()
		) {
			return null;
		}

		return admin_url( 'admin.php?page=my-jetpack&showCouponRedemption=1' );
	}

	/**
	 * Determine whether a user can access the Jetpack Settings page.
	 *
	 * Rules are:
	 * - user is allowed to see the Jetpack Admin
	 * - site is connected or in offline mode
	 * - non-admins only need access to the settings when there are modules they can manage.
	 *
	 * @return bool $can_access_settings Can the user access settings.
	 */
	private function can_access_settings() {
		$connection = new Connection_Manager( 'jetpack' );
		$status     = new Status();

		// User must have the necessary permissions to see the Jetpack settings pages.
		if ( ! current_user_can( 'edit_posts' ) ) {
			return false;
		}

		// In offline mode, allow access to admins.
		if ( $status->is_offline_mode() && current_user_can( 'manage_options' ) ) {
			return true;
		}

		// If not in offline mode but site is not connected, bail.
		if ( ! Jetpack::is_connection_ready() ) {
			return false;
		}

		/*
		 * Additional checks for non-admins.
		*/
		if ( ! current_user_can( 'manage_options' ) ) {
			// If the site isn't connected at all, bail.
			if ( ! $connection->has_connected_owner() ) {
				return false;
			}

			/*
			 * If they haven't connected their own account yet,
			 * they have no use for the settings page.
			 * They will not be able to manage any settings.
			 */
			if ( ! $connection->is_user_connected() ) {
				return false;
			}

			/*
			 * Non-admins only have access to settings
			 * for the following modules:
			 * - Publicize
			 * - Post By Email
			 * If those modules are not available, bail.
			 */
			if (
				! Jetpack::is_module_active( 'post-by-email' )
					&& (
						! Jetpack::is_module_active( 'publicize' ) ||
						! current_user_can( 'publish_posts' )
					)
			) {
				return false;
			}
		}

		// fallback.
		return true;
	}

	/**
	 * Jetpack Settings sub-link.
	 *
	 * Shares the bottom tier with Beta Tester so it lands below the alphabetical run
	 * rather than inside it; the two sort by title within the tier. The upsell still
	 * renders underneath — Admin_Menu appends that one after sorting, so it never
	 * competes on position.
	 *
	 * @since 4.3.0
	 * @since 9.7.0 If Connection does not have an owner, restrict it to admins
	 */
	public function jetpack_add_settings_sub_nav_item() {
		if ( $this->can_access_settings() ) {
			Admin_Menu::add_menu(
				__( 'Settings', 'jetpack' ),
				__( 'Settings', 'jetpack' ),
				'jetpack_admin_page',
				Jetpack::admin_url( array( 'page' => 'jetpack#/settings' ) ),
				null,
				Admin_Menu::POSITION_LAST,
				array( 'key' => 'jetpack-settings' )
			);
		}
	}

	/**
	 * Fallback redirect meta tag if the REST API is disabled.
	 *
	 * @return void
	 */
	public function add_fallback_head_meta() {
		echo '<meta http-equiv="refresh" content="0; url=?page=jetpack_modules">';
	}

	/**
	 * Fallback meta tag wrapped in noscript tags for all browsers in case they have JavaScript disabled.
	 *
	 * @return void
	 */
	public function add_noscript_head_meta() {
		echo '<noscript>';
		$this->add_fallback_head_meta();
		echo '</noscript>';
	}

	/**
	 * Add action to render page specific HTML.
	 *
	 * @return void
	 */
	public function page_render() {
		/** This action is already documented in class.jetpack-admin-page.php */
		do_action( 'jetpack_notices' );

		// Fetch static.html.
		$static_html = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static.html' ); //phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, Not fetching a remote file.

		if ( false === $static_html ) {

			// If we still have nothing, display an error.
			echo '<p>';
			esc_html_e( 'Error fetching static.html. Try running: ', 'jetpack' );
			echo '<code>pnpm run distclean && pnpm jetpack build plugins/jetpack</code>';
			echo '</p>';
		} else {
			// We got the static.html so let's display it.
			echo $static_html; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
	}
	/**
	 * Allow robust deep links to React.
	 *
	 * The Jetpack dashboard requires fragments/hash values to make
	 * a deep link to it but passing fragments as part of a return URL
	 * will most often be discarded throughout the process.
	 * This logic aims to bridge this gap and reduce the chance of React
	 * specific links being broken while passing them along.
	 */
	public function react_redirects() {
		global $pagenow;

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'admin.php' !== $pagenow || ! isset( $_GET['jp-react-redirect'] ) ) {
			return;
		}

		$allowed_paths = array(
			'product-purchased' => admin_url( 'admin.php?page=jetpack' ),
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$target = sanitize_text_field( wp_unslash( $_GET['jp-react-redirect'] ) );
		if ( isset( $allowed_paths[ $target ] ) ) {
			wp_safe_redirect( $allowed_paths[ $target ] );
			exit( 0 );
		}
	}

	/**
	 * Load styles for static page.
	 */
	public function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Load admin page scripts.
	 */
	public function page_admin_scripts() {
		if ( $this->is_redirecting ) {
			return; // No need for scripts on a fallback page.
		}

		$status              = new Status();
		$is_offline_mode     = $status->is_offline_mode();
		$site_suffix         = $status->get_site_suffix();
		$script_deps_path    = JETPACK__PLUGIN_DIR . '_inc/build/admin.asset.php';
		$script_dependencies = array( 'jquery', 'wp-polyfill' );
		$version             = JETPACK__VERSION;
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
			$version             = $asset_manifest['version'];
		}

		$blog_id_prop = '';
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$blog_id = Connection_Manager::get_site_id( true );
			if ( $blog_id ) {
				$blog_id_prop = ', currentBlogID: "' . (int) $blog_id . '"';
			}
		}

		wp_enqueue_script(
			'react-plugin',
			plugins_url( '_inc/build/admin.js', JETPACK__PLUGIN_FILE ),
			$script_dependencies,
			$version,
			true
		);

		if ( ! $is_offline_mode && Jetpack::is_connection_ready() ) {
			// Required for Analytics.
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		}

		wp_set_script_translations( 'react-plugin', 'jetpack' );

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'react-plugin', 'var Initial_State=' . wp_json_encode( Jetpack_Redux_State_Helper::get_initial_state(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';', 'before' );

		// This will set the default URL of the jp_redirects lib.
		wp_add_inline_script( 'react-plugin', 'var jetpack_redirects = { currentSiteRawUrl: "' . $site_suffix . '"' . $blog_id_prop . ' };', 'before' );

		// Adds Connection package initial state.
		Connection_Initial_State::render_script( 'react-plugin' );
	}
}

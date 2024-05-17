<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets\Logo;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
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
	 * Add the main admin Jetpack menu.
	 *
	 * @return string|false Return value from WordPress's `add_menu_page()`.
	 */
	public function get_page_hook() {
		$icon = ( new Logo() )->get_base64_logo();
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

		if ( ! isset( $_GET['page'] ) || 'jetpack' !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is view logic.
			return; // No need to handle the fallback redirection if we are not on the Jetpack page.
		}

		// Adding a redirect meta tag if the REST API is disabled.
		if ( ! $this->is_rest_api_enabled() ) {
			$this->is_redirecting = true;
			add_action( 'admin_head', array( $this, 'add_fallback_head_meta' ) );
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
	 * Add Jetpack Dashboard sub-link and point it to AAG if the user can view stats, manage modules or if Protect is active.
	 *
	 * Works in Dev Mode or when user is connected.
	 *
	 * @since 4.3.0
	 */
	public function jetpack_add_dashboard_sub_nav_item() {
		if ( ( new Status() )->is_offline_mode() || Jetpack::is_connection_ready() ) {
			add_submenu_page( 'jetpack', __( 'Dashboard', 'jetpack' ), __( 'Dashboard', 'jetpack' ), 'jetpack_admin_page', 'jetpack#/dashboard', '__return_null', 1 );
			remove_submenu_page( 'jetpack', 'jetpack' );
		}
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
				&& ! Jetpack::is_module_active( 'publicize' )
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
	 * @since 4.3.0
	 * @since 9.7.0 If Connection does not have an owner, restrict it to admins
	 */
	public function jetpack_add_settings_sub_nav_item() {
		if ( $this->can_access_settings() ) {
			add_submenu_page( 'jetpack', __( 'Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'jetpack_admin_page', 'jetpack#/settings', '__return_null' );
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
			'product-purchased' => admin_url( '/admin.php?page=jetpack#/recommendations/product-purchased' ),
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$target = sanitize_text_field( wp_unslash( $_GET['jp-react-redirect'] ) );
		if ( isset( $allowed_paths[ $target ] ) ) {
			wp_safe_redirect( $allowed_paths[ $target ] );
			exit;
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
		wp_add_inline_script( 'react-plugin', 'var Initial_State=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( Jetpack_Redux_State_Helper::get_initial_state() ) ) . '"));', 'before' );

		// This will set the default URL of the jp_redirects lib.
		wp_add_inline_script( 'react-plugin', 'var jetpack_redirects = { currentSiteRawUrl: "' . $site_suffix . '"' . $blog_id_prop . ' };', 'before' );

		// Adds Connection package initial state.
		Connection_Initial_State::render_script( 'react-plugin' );
	}
}

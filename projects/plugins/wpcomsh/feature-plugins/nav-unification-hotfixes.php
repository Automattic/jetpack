<?php
/**
 * Hotfixes for Nav Unification feature, due to Jetpack monthly release cycle.
 * Each hotfix should declare when it is safe to be removed.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu;

/**
 * Overrides the `Atomic_Admin_Menu` menu class with hotfixes that have not been released yet on Jetpack.
 *
 * @param string $admin_menu_class Class name.
 */
function wpcomsh_use_nav_unification_hotfixes( $admin_menu_class ) {
	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return $admin_menu_class;
	}

	// Do not clash with fixes already shipped.
	if ( version_compare( JETPACK__VERSION, '9.9.1-alpha', '>=' ) ) {
		return $admin_menu_class;
	}

	require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/admin-menu/class-atomic-admin-menu.php';

	class Atomic_Hotfixes_Admin_Menu extends Atomic_Admin_Menu {
		/**
		 * Atomic_Hotfixes_Admin_Menu constructor.
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20228.
		 */
		protected function __construct() {
			parent::__construct();

			if ( ! $this->is_api_request ) {
				add_action( 'admin_menu', array( $this, 'handle_preferred_view' ), 99997 );
				add_action( 'wp_ajax_set_preferred_view', array( $this, 'handle_preferred_view' ) );
			}
		}

		/**
		 * Enqueues scripts and styles.
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20228.
		 */
		public function enqueue_scripts() {
			parent::enqueue_scripts();

			wp_enqueue_script(
				'wpcomsh-nav-unification-hotfixes',
				plugins_url( 'nav-unification-hotfixes.js', __FILE__ ),
				array(),
				JETPACK__VERSION,
				true
			);

			wp_localize_script(
				'wpcomsh-nav-unification-hotfixes',
				'jpAdminMenu',
				array(
					'screen' => $this->get_current_screen(),
				)
			);
		}

		/**
		 * Gets the identifier of the current screen.
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20228.
		 *
		 * @return string
		 */
		public function get_current_screen() {
			// phpcs:disable WordPress.Security.NonceVerification
			global $pagenow;
			$screen = isset( $_REQUEST['screen'] ) ? $_REQUEST['screen'] : $pagenow;
			if ( isset( $_GET['post_type'] ) ) {
				$screen = add_query_arg( 'post_type', $_GET['post_type'], $screen );
			}
			if ( isset( $_GET['taxonomy'] ) ) {
				$screen = add_query_arg( 'taxonomy', $_GET['taxonomy'], $screen );
			}
			if ( isset( $_GET['page'] ) ) {
				$screen = add_query_arg( 'page', $_GET['page'], $screen );
			}
			return $screen;
			// phpcs:enable WordPress.Security.NonceVerification
		}

		/**
		 * Stores the preferred view for the current screen.
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20228.
		 */
		public function handle_preferred_view() {
			// phpcs:disable WordPress.Security.NonceVerification
			if (
				! isset( $_GET['preferred-view'] ) ||
				! in_array( $_GET['preferred-view'], array( self::DEFAULT_VIEW, self::CLASSIC_VIEW ), true )
			) {
				return;
			}
			$this->set_preferred_view( $this->get_current_screen(), $_GET['preferred-view'] );
			if ( wp_doing_ajax() ) {
				wp_die();
			}
			// phpcs:enable WordPress.Security.NonceVerification
		}

		/**
		 * Adds Settings menu.
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20270.
		 */
		public function add_options_menu() {
			parent::add_options_menu();
			add_submenu_page( 'options-general.php', esc_attr__( 'Performance', 'jetpack' ), __( 'Performance', 'jetpack' ), 'manage_options', 'https://wordpress.com/settings/performance/' . $this->domain, null, 2 );
		}

		/**
		 * Prepend a dashboard swithcer to the "Screen Options" box of the current page.
		 * Callback for the 'screen_settings' filter (available in WP 3.0 and up).
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20228.
		 *
		 * @param string $current The currently added panels in screen options.
		 * @param object $screen Screen object (undocumented).
		 *
		 * @return string The HTML code to append to "Screen Options"
		 */
		public function register_dashboard_switcher( $current, $screen ) {
			$menu_mappings = array(
				'upload.php'                             => 'https://wordpress.com/media/',
				'edit.php'                               => 'https://wordpress.com/posts/',
				'edit-comments.php'                      => 'https://wordpress.com/comments/',
				'import.php'                             => 'https://wordpress.com/import/',
				'edit.php?post_type=page'                => 'https://wordpress.com/pages/',
				'users.php'                              => 'https://wordpress.com/people/team/',
				'options-general.php'                    => 'https://wordpress.com/settings/general/',
				'options-discussion.php'                 => 'https://wordpress.com/settings/discussion/',
				'options-writing.php'                    => 'https://wordpress.com/settings/writing/',
				'themes.php'                             => 'https://wordpress.com/themes/',
				'edit-tags.php?taxonomy=category'        => 'https://wordpress.com/settings/taxonomies/category/',
				'edit-tags.php?taxonomy=post_tag'        => 'https://wordpress.com/settings/taxonomies/post_tag/',
				'edit.php?post_type=jetpack-portfolio'   => 'https://wordpress.com/types/jetpack-portfolio/',
				'edit.php?post_type=jetpack-testimonial' => 'https://wordpress.com/types/jetpack-testimonial/',
			);

			$current_screen = $this->get_current_screen();

			// Let's show the switcher only in screens that we have a Calypso mapping to switch to.
			if ( ! isset( $menu_mappings[ $current_screen ] ) ) {
				return;
			}

			$contents = sprintf(
				'<div id="dashboard-switcher"><h5>%s</h5><p class="dashboard-switcher-text">%s</p><a class="button button-primary dashboard-switcher-button" href="%s">%s</a></div>',
				__( 'Screen features', 'jetpack' ),
				__( 'Currently you are seeing the classic WP-Admin view of this page. Would you like to see the default WordPress.com view?', 'jetpack' ),
				$menu_mappings[ $current_screen ] . $this->domain,
				__( 'Use WordPress.com view', 'jetpack' )
			);

			// Prepend the Dashboard swither to the other custom panels.
			$current = $contents . $current;
			return $current;
		}
	}

	return Atomic_Hotfixes_Admin_Menu::class;
}



add_action( 'jetpack_admin_menu_class', 'wpcomsh_use_nav_unification_hotfixes' );

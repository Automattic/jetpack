<?php
/**
 * Atomic Admin Menu file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\JITMS\JITM;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Subscribers_Dashboard\Dashboard as Subscribers_Dashboard;

require_once __DIR__ . '/class-admin-menu.php';

/**
 * Class Atomic_Admin_Menu.
 */
class Atomic_Admin_Menu extends Admin_Menu {

	/**
	 * Atomic_Admin_Menu constructor.
	 */
	protected function __construct() {
		parent::__construct();

		add_action( 'wp_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );
		add_action( 'admin_enqueue_scripts', array( $this, 'dequeue_scripts' ), 20 );
		add_action( 'wp_ajax_sidebar_state', array( $this, 'ajax_sidebar_state' ) );
		add_action( 'wp_ajax_jitm_dismiss', array( $this, 'wp_ajax_jitm_dismiss' ) );
		add_action( 'wp_ajax_upsell_nudge_jitm', array( $this, 'wp_ajax_upsell_nudge_jitm' ) );

		if ( ! $this->is_api_request ) {
			add_filter( 'submenu_file', array( $this, 'override_the_theme_installer' ), 10, 2 );
		}

		add_action(
			'admin_menu',
			function () {
				// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- Not worth bringing in a stub just for a callback in a remove_action call.
				remove_action( 'admin_menu', 'gutenberg_menu', 9 );
			},
			0
		);
	}

	/**
	 * Dequeues unnecessary scripts.
	 */
	public function dequeue_scripts() {
		wp_dequeue_script( 'a8c_wpcom_masterbar_overrides' ); // Initially loaded in modules/masterbar/masterbar/class-masterbar.php.
	}

	/**
	 * Determines whether the current locale is right-to-left (RTL).
	 *
	 * Performs the check against the current locale set on the WordPress.com's account settings.
	 * See `Masterbar::__construct` in `modules/masterbar/masterbar/class-masterbar.php`.
	 */
	public function is_rtl() {
		return get_user_option( 'jetpack_wpcom_is_rtl' );
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		parent::reregister_menu_items();

		$this->add_my_home_menu();
		$this->remove_gutenberg_menu();

		// Not needed outside of wp-admin.
		if ( ! $this->is_api_request ) {
			$this->add_new_site_link();
		}

		$this->add_woocommerce_installation_menu();
		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Get the preferred view for the given screen.
	 *
	 * @param string $screen Screen identifier.
	 * @param bool   $fallback_global_preference (Optional) Whether the global preference for all screens should be used
	 *                                           as fallback if there is no specific preference for the given screen.
	 *                                           Default: true.
	 * @return string
	 */
	public function get_preferred_view( $screen, $fallback_global_preference = true ) {

		// Export on Atomic sites are always managed on WP Admin.
		if ( in_array( $screen, array( 'export.php' ), true ) ) {
			return self::CLASSIC_VIEW;
		}

		/**
		 * When Jetpack SSO is disabled, we need to force Calypso because it might create confusion to be redirected to WP-Admin.
		 * Furthermore, because we don't display the quick switcher, users having an WP-Admin interface by default won't be able to go back to the Calyso version.
		 */
		if ( ! ( new Modules() )->is_active( 'sso' ) ) {
			return self::DEFAULT_VIEW;
		}

		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Adds Users menu.
	 */
	public function add_users_menu() {
		$slug = current_user_can( 'list_users' ) ? 'users.php' : 'profile.php';
		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'users.php' ) ) {
			$submenus_to_update = array(
				'users.php' => 'https://wordpress.com/people/team/' . $this->domain,
			);
			$this->update_submenus( $slug, $submenus_to_update );
		}

		if ( ! $this->use_wp_admin_interface() && ! apply_filters( 'jetpack_wp_admin_subscriber_management_enabled', false ) ) {
			// The 'Subscribers' menu exists in the Jetpack menu for Classic wp-admin interface, so only add it for non-wp-admin interfaces.
			// // @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( 'users.php', esc_attr__( 'Subscribers', 'jetpack-masterbar' ), __( 'Subscribers', 'jetpack-masterbar' ), 'list_users', 'https://wordpress.com/subscribers/' . $this->domain, null );
		} elseif ( apply_filters( 'jetpack_wp_admin_subscriber_management_enabled', false ) ) {
			$subscribers_dashboard = new Subscribers_Dashboard();
			$subscribers_dashboard->add_wp_admin_submenu();
		}

		// Users who can't 'list_users' will see "Profile" menu & "Profile > Account Settings" as submenu.
		add_submenu_page( $slug, esc_attr__( 'Account Settings', 'jetpack-masterbar' ), __( 'Account Settings', 'jetpack-masterbar' ), 'read', 'https://wordpress.com/me/account' );
	}

	/**
	 * Adds Plugins menu.
	 */
	public function add_plugins_menu() {

		global $submenu;

		// Calypso plugins screens link.
		$plugins_slug = 'https://wordpress.com/plugins/' . $this->domain;

		// Link to the Marketplace from Plugins > Add New on Atomic sites where the wpcom_admin_interface option is set to wp-admin.
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'plugins.php' ) ) {
			$submenus_to_update = array( 'plugin-install.php' => $plugins_slug );
			$this->update_submenus( 'plugins.php', $submenus_to_update );
			return;
		}

		// Link to the Marketplace on sites that can't manage plugins.
		if (
			function_exists( 'wpcom_site_has_feature' ) &&
			! wpcom_site_has_feature( \WPCOM_Features::MANAGE_PLUGINS )
		) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_menu_page( __( 'Plugins', 'jetpack-masterbar' ), __( 'Plugins', 'jetpack-masterbar' ), 'manage_options', $plugins_slug, null, 'dashicons-admin-plugins', 65 );
			return;
		}

		if ( ! isset( $submenu['plugins.php'] ) ) {
			return;
		}

		$plugins_submenu = $submenu['plugins.php'];

		// Move "Add New" plugin submenu to the top position.
		foreach ( $plugins_submenu as $submenu_key => $submenu_keys ) {
			if ( 'plugin-install.php' === $submenu_keys[2] ) {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu['plugins.php'] = array( $submenu_key => $plugins_submenu[ $submenu_key ] ) + $plugins_submenu;
			}
		}

		$submenus_to_update = array( 'plugin-install.php' => $plugins_slug );

		$this->update_submenus( 'plugins.php', $submenus_to_update );
	}

	/**
	 * Adds a custom element class for Site Switcher menu item.
	 *
	 * @param array $menu Associative array of administration menu items.
	 *
	 * @return array
	 */
	public function set_browse_sites_link_class( array $menu ) {
		foreach ( $menu as $key => $menu_item ) {
			if ( 'site-switcher' !== $menu_item[3] ) {
				continue;
			}

			$menu[ $key ][4] = add_cssclass( 'site-switcher', $menu_item[4] );
			break;
		}

		return $menu;
	}

	/**
	 * Adds a link to the menu to create a new site.
	 */
	public function add_new_site_link() {
		$site_count = get_user_option( 'wpcom_site_count' );
		if ( $site_count && $site_count > 1 ) {
			return;
		}

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( __( 'Add New Site', 'jetpack-masterbar' ), __( 'Add New Site', 'jetpack-masterbar' ), 'read', 'https://wordpress.com/start?ref=calypso-sidebar', null, 'dashicons-plus-alt' );
	}

	/**
	 * Returns the first available upsell nudge.
	 *
	 * @return array
	 */
	public function get_upsell_nudge() {
		$jitm         = JITM::get_instance();
		$message_path = 'calypso:sites:sidebar_notice';
		$message      = $jitm->get_messages( $message_path, wp_json_encode( array( 'message_path' => $message_path ) ), false );

		if ( isset( $message[0] ) ) {
			$message = $message[0];
			return array(
				'content'                      => $message->content->message,
				'cta'                          => $message->CTA->message, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'link'                         => $message->CTA->link, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'tracks_impression_event_name' => $message->tracks->display->name,
				'tracks_impression_cta_name'   => $message->tracks->display->props->cta_name,
				'tracks_click_event_name'      => $message->tracks->click->name,
				'tracks_click_cta_name'        => $message->tracks->click->props->cta_name,
				'dismissible'                  => $message->is_dismissible,
				'feature_class'                => $message->feature_class,
				'id'                           => $message->id,
			);
		}
	}

	/**
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		// This is supposed to be the same as class-admin-menu but with a different position specified for the Jetpack menu.
		if ( $this->use_wp_admin_interface() ) {
			parent::create_jetpack_menu( 2, false );
		} else {
			parent::add_jetpack_menu();
		}

		$scan_position = $this->get_submenu_item_count( 'jetpack' ) - 1;

		global $submenu;
		if ( isset( $submenu['jetpack'] ) ) {
			$backup_submenu_label = __( 'Backup', 'jetpack-masterbar' );
			$submenu_labels       = array_column( $submenu['jetpack'], 3 );
			$backup_position      = array_search( $backup_submenu_label, $submenu_labels, true );
			$scan_position        = $backup_position !== false ? $backup_position + 1 : $this->get_submenu_item_count( 'jetpack' ) - 1;
		}

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'jetpack', esc_attr__( 'Scan', 'jetpack-masterbar' ), __( 'Scan', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/scan/' . $this->domain, null, $scan_position );

		/**
		 * Prevent duplicate menu items that link to Jetpack Backup.
		 * Hide the one that's shown when the standalone backup plugin is not installed, since Jetpack Backup is already included in Atomic sites.
		 *
		 * @see https://github.com/Automattic/jetpack/pull/33955
		 */
		$this->hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-backups' ) ) );
	}

	/**
	 * Adds Stats menu.
	 */
	public function add_stats_menu() {
		$menu_title = __( 'Stats', 'jetpack-masterbar' );
		if (
			! $this->is_api_request &&
			( new Modules() )->is_active( 'stats' ) &&
			function_exists( 'stats_get_image_chart_src' )
		) {
			$img_src = esc_attr(
				stats_get_image_chart_src( 'admin-bar-hours-scale-2x', array( 'masterbar' => '' ) )
			);
			$alt     = esc_attr__( 'Hourly views', 'jetpack-masterbar' );

			$menu_title .= "<img class='sidebar-unified__sparkline' src='$img_src' width='80' height='20' alt='$alt'>";
		}

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( __( 'Stats', 'jetpack-masterbar' ), $menu_title, 'view_stats', 'https://wordpress.com/stats/day/' . $this->domain, null, 'dashicons-chart-bar', 3 );
	}

	/**
	 * Adds Upgrades menu.
	 *
	 * @param string $plan The current WPCOM plan of the blog.
	 */
	public function add_upgrades_menu( $plan = null ) {

		if ( get_option( 'wpcom_is_staging_site' ) ) {
			return;
		}
		$products = Jetpack_Plan::get();
		if ( array_key_exists( 'product_name_short', $products ) ) {
			$plan = $products['product_name_short'];
		}
		parent::add_upgrades_menu( $plan );

		$last_upgrade_submenu_position = $this->get_submenu_item_count( 'paid-upgrades.php' );

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'paid-upgrades.php', __( 'Domains', 'jetpack-masterbar' ), __( 'Domains', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, $last_upgrade_submenu_position - 1 );

		/**
		 * Whether to show the WordPress.com Emails submenu under the main Upgrades menu.
		 *
		 * @use add_filter( 'jetpack_show_wpcom_upgrades_email_menu', '__return_true' );
		 * @module masterbar
		 *
		 * @since jetpack-9.7.0
		 *
		 * @param bool $show_wpcom_upgrades_email_menu Load the WordPress.com Emails submenu item. Default to false.
		 */
		if ( apply_filters( 'jetpack_show_wpcom_upgrades_email_menu', false ) ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( 'paid-upgrades.php', __( 'Emails', 'jetpack-masterbar' ), __( 'Emails', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/email/' . $this->domain, null, $last_upgrade_submenu_position );
		}
	}

	/**
	 * Adds Settings menu.
	 */
	public function add_options_menu() {
		parent::add_options_menu();

		$has_feature_atomic = function_exists( 'wpcom_site_has_feature' ) && wpcom_site_has_feature( \WPCOM_Features::ATOMIC );
		add_submenu_page(
			'options-general.php',
			$has_feature_atomic ? esc_attr__( 'Server Settings', 'jetpack-masterbar' ) : esc_attr__( 'Hosting Features', 'jetpack-masterbar' ),
			$has_feature_atomic ? __( 'Server Settings', 'jetpack-masterbar' ) : __( 'Hosting Features', 'jetpack-masterbar' ),
			'manage_options',
			$has_feature_atomic ? 'https://wordpress.com/hosting-config/' . $this->domain : 'https://wordpress.com/hosting-features/' . $this->domain,
			null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			11
		);

		// Hide Settings > Performance when the interface is set to wp-admin.
		// This is due to these settings are mostly also available in Jetpack > Settings, in the Performance tab.
		if ( $this->use_wp_admin_interface() ) {
			$this->hide_submenu_page( 'options-general.php', 'https://wordpress.com/settings/performance/' . $this->domain );
		}
	}

	/**
	 * Adds Tools menu entries.
	 */
	public function add_tools_menu() {
		parent::add_tools_menu();

		// Link the Tools menu to Available Tools when the interface is set to wp-admin.
		if ( $this->use_wp_admin_interface() ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_submenu_page( 'tools.php', esc_attr__( 'Available Tools', 'jetpack-masterbar' ), __( 'Available Tools', 'jetpack-masterbar' ), 'edit_posts', 'tools.php', null, 0 );
		}

		/**
		 * Adds the WordPress.com Site Monitoring submenu under the main Tools menu.
		 */
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'tools.php', esc_attr__( 'Site Monitoring', 'jetpack-masterbar' ), __( 'Site Monitoring', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/site-monitoring/' . $this->domain, null, 7 );

		/**
		 * Adds the WordPress.com GitHub Deployments submenu under the main Tools menu.
		 */
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'tools.php', esc_attr__( 'GitHub Deployments', 'jetpack-masterbar' ), __( 'GitHub Deployments', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/github-deployments/' . $this->domain, null, 8 );
	}

	/**
	 * Override the global submenu_file for theme-install.php page so the WP Admin menu item gets highlighted correctly.
	 *
	 * @param string $submenu_file The current pages $submenu_file global variable value.
	 * @return string | null
	 */
	public function override_the_theme_installer( $submenu_file ) {
		global $pagenow;

		if ( 'themes.php' === $submenu_file && 'theme-install.php' === $pagenow ) {
			return null;
		}
		return $submenu_file;
	}

	/**
	 * Also remove the Gutenberg plugin menu.
	 */
	public function remove_gutenberg_menu() {
		// Always remove the Gutenberg menu.
		remove_menu_page( 'gutenberg' );
	}

	/**
	 * Saves the sidebar state ( expanded / collapsed ) via an ajax request.
	 */
	public function ajax_sidebar_state() {
		$expanded = isset( $_REQUEST['expanded'] ) ? filter_var( wp_unslash( $_REQUEST['expanded'] ), FILTER_VALIDATE_BOOLEAN ) : false; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		Client::wpcom_json_api_request_as_user(
			'/me/preferences',
			'2',
			array(
				'method' => 'POST',
			),
			array( 'calypso_preferences' => (object) array( 'sidebarCollapsed' => ! $expanded ) ),
			'wpcom'
		);

		wp_die();
	}

	/**
	 * Handle ajax requests to dismiss a just-in-time-message
	 */
	public function wp_ajax_jitm_dismiss() {
		check_ajax_referer( 'jitm_dismiss' );
		$jitm = \Automattic\Jetpack\JITMS\JITM::get_instance();
		if ( isset( $_REQUEST['id'] ) && isset( $_REQUEST['feature_class'] ) ) {
			$jitm->dismiss( sanitize_text_field( wp_unslash( $_REQUEST['id'] ) ), sanitize_text_field( wp_unslash( $_REQUEST['feature_class'] ) ) );
		}
		wp_die();
	}
}

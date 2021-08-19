<?php
/**
 * Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Redirect;

require_once __DIR__ . '/class-base-admin-menu.php';

/**
 * Class Admin_Menu.
 */
class Admin_Menu extends Base_Admin_Menu {

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		// Remove separators.
		remove_menu_page( 'separator1' );

		$this->add_stats_menu();
		$this->add_upgrades_menu();
		$this->add_posts_menu();
		$this->add_media_menu();
		$this->add_page_menu();
		$this->add_testimonials_menu();
		$this->add_portfolio_menu();
		$this->add_comments_menu();
		$this->add_appearance_menu();
		$this->add_plugins_menu();
		$this->add_users_menu();
		$this->add_tools_menu();
		$this->add_options_menu();
		$this->add_jetpack_menu();
		$this->add_gutenberg_menus();

		// Remove Links Manager menu since its usage is discouraged. https://github.com/Automattic/wp-calypso/issues/51188.
		// @see https://core.trac.wordpress.org/ticket/21307#comment:73.
		if ( $this->should_disable_links_manager() ) {
			remove_menu_page( 'link-manager.php' );
		}

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
		// When no preferred view has been set for "Users > All Users" or "Settings > General", keep the previous
		// behavior that forced the default view regardless of the global preference.
		if (
			$fallback_global_preference &&
			in_array( $screen, array( 'users.php', 'options-general.php' ), true )
		) {
			$preferred_view = parent::get_preferred_view( $screen, false );
			if ( self::UNKNOWN_VIEW === $preferred_view ) {
				return self::DEFAULT_VIEW;
			}
			return $preferred_view;
		}

		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Check if Links Manager is being used.
	 */
	public function should_disable_links_manager() {
		// The max ID number of the auto-generated links.
		// See /wp-content/mu-plugins/wpcom-wp-install-defaults.php in WP.com.
		$max_default_id = 10;

		// We are only checking the latest entry link_id so are limiting the query to 1.
		$link_manager_links = get_bookmarks(
			array(
				'orderby'        => 'link_id',
				'order'          => 'DESC',
				'limit'          => 1,
				'hide_invisible' => 0,
			)
		);

		// Ordered links by ID descending, check if the first ID is more than $max_default_id.
		if ( count( $link_manager_links ) > 0 && $link_manager_links[0]->link_id > $max_default_id ) {
			return false;
		}

		return true;
	}

	/**
	 * Adds My Home menu.
	 */
	public function add_my_home_menu() {
		$this->update_menu( 'index.php', 'https://wordpress.com/home/' . $this->domain, __( 'My Home', 'jetpack' ), 'manage_options', 'dashicons-admin-home' );
	}

	/**
	 * Adds upsell nudge as a menu.
	 *
	 * @param object $nudge The $nudge object containing the content, CTA, link and tracks.
	 */
	public function add_upsell_nudge( $nudge ) {
		$message = '
<div class="upsell_banner">
	<div class="banner__info">
		<div class="banner__title">%1$s</div>
	</div>
	<div class="banner__action">
		<button type="button" class="button">%2$s</button>
	</div>
</div>';

		$message = sprintf(
			$message,
			wp_kses( $nudge['content'], array() ),
			wp_kses( $nudge['cta'], array() )
		);

		add_menu_page( 'site-notices', $message, 'read', 'https://wordpress.com' . $nudge['link'], null, null, 1 );
		add_filter( 'add_menu_classes', array( $this, 'set_site_notices_menu_class' ) );
	}

	/**
	 * Adds a custom element class and id for Site Notices's menu item.
	 *
	 * @param array $menu Associative array of administration menu items.
	 * @return array
	 */
	public function set_site_notices_menu_class( array $menu ) {
		foreach ( $menu as $key => $menu_item ) {
			if ( 'site-notices' !== $menu_item[3] ) {
				continue;
			}

			$classes = ' toplevel_page_site-notices';

			if ( isset( $menu_item[4] ) ) {
				$menu[ $key ][4] = $menu_item[4] . $classes;
				$menu[ $key ][5] = 'toplevel_page_site-notices';
				break;
			}
		}

		return $menu;
	}

	/**
	 * Adds Stats menu.
	 */
	public function add_stats_menu() {
		add_menu_page( __( 'Stats', 'jetpack' ), __( 'Stats', 'jetpack' ), 'view_stats', 'https://wordpress.com/stats/day/' . $this->domain, null, 'dashicons-chart-bar', 3 );
	}

	/**
	 * Adds Upgrades menu.
	 *
	 * @param string $plan The current WPCOM plan of the blog.
	 */
	public function add_upgrades_menu( $plan = null ) {
		global $menu;

		$menu_exists = false;
		foreach ( $menu as $item ) {
			if ( 'paid-upgrades.php' === $item[2] ) {
				$menu_exists = true;
				break;
			}
		}

		if ( ! $menu_exists ) {
			if ( $plan ) {
				// Add display:none as a default for cases when CSS is not loaded.
				$site_upgrades = '%1$s<span class="inline-text" style="display:none">%2$s</span>';
				$site_upgrades = sprintf(
					$site_upgrades,
					__( 'Upgrades', 'jetpack' ),
					$plan
				);
			} else {
				$site_upgrades = __( 'Upgrades', 'jetpack' );
			}

			add_menu_page( __( 'Upgrades', 'jetpack' ), $site_upgrades, 'manage_options', 'paid-upgrades.php', null, 'dashicons-cart', 4 );
		}

		add_submenu_page( 'paid-upgrades.php', __( 'Plans', 'jetpack' ), __( 'Plans', 'jetpack' ), 'manage_options', 'https://wordpress.com/plans/my-plan/' . $this->domain, null, 1 );
		add_submenu_page( 'paid-upgrades.php', __( 'Purchases', 'jetpack' ), __( 'Purchases', 'jetpack' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $this->domain, null, 2 );

		if ( ! $menu_exists ) {
			// Remove the submenu auto-created by Core.
			$this->hide_submenu_page( 'paid-upgrades.php', 'paid-upgrades.php' );
		}
	}

	/**
	 * Adds Posts menu.
	 */
	public function add_posts_menu() {
		$submenus_to_update = array();

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'edit.php' ) ) {
			$submenus_to_update['edit.php']     = 'https://wordpress.com/posts/' . $this->domain;
			$submenus_to_update['post-new.php'] = 'https://wordpress.com/post/' . $this->domain;
		}

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'edit-tags.php?taxonomy=category' ) ) {
			$submenus_to_update['edit-tags.php?taxonomy=category'] = 'https://wordpress.com/settings/taxonomies/category/' . $this->domain;
		}

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'edit-tags.php?taxonomy=post_tag' ) ) {
			$submenus_to_update['edit-tags.php?taxonomy=post_tag'] = 'https://wordpress.com/settings/taxonomies/post_tag/' . $this->domain;
		}

		$this->update_submenus( 'edit.php', $submenus_to_update );
	}

	/**
	 * Adds Media menu.
	 */
	public function add_media_menu() {
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'upload.php' ) ) {
			return;
		}

		$this->hide_submenu_page( 'upload.php', 'media-new.php' );

		$this->update_menu( 'upload.php', 'https://wordpress.com/media/' . $this->domain );
	}

	/**
	 * Adds Page menu.
	 */
	public function add_page_menu() {
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'edit.php?post_type=page' ) ) {
			return;
		}

		$submenus_to_update = array(
			'edit.php?post_type=page'     => 'https://wordpress.com/pages/' . $this->domain,
			'post-new.php?post_type=page' => 'https://wordpress.com/page/' . $this->domain,
		);
		$this->update_submenus( 'edit.php?post_type=page', $submenus_to_update );
	}

	/**
	 * Adds Testimonials menu.
	 */
	public function add_testimonials_menu() {
		$this->add_custom_post_type_menu( 'jetpack-testimonial' );
	}

	/**
	 * Adds Portfolio menu.
	 */
	public function add_portfolio_menu() {
		$this->add_custom_post_type_menu( 'jetpack-portfolio' );
	}

	/**
	 * Adds a custom post type menu.
	 *
	 * @param string $post_type Custom post type.
	 */
	public function add_custom_post_type_menu( $post_type ) {
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'edit.php?post_type=' . $post_type ) ) {
			return;
		}

		$submenus_to_update = array(
			'edit.php?post_type=' . $post_type     => 'https://wordpress.com/types/' . $post_type . '/' . $this->domain,
			'post-new.php?post_type=' . $post_type => 'https://wordpress.com/edit/' . $post_type . '/' . $this->domain,
		);
		$this->update_submenus( 'edit.php?post_type=' . $post_type, $submenus_to_update );
	}

	/**
	 * Adds Comments menu.
	 */
	public function add_comments_menu() {
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'edit-comments.php' ) ) {
			return;
		}

		$this->update_menu( 'edit-comments.php', 'https://wordpress.com/comments/all/' . $this->domain );
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @return string The Customizer URL.
	 */
	public function add_appearance_menu() {
		$request_uri                     = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		$default_customize_slug          = add_query_arg( 'return', rawurlencode( remove_query_arg( wp_removable_query_args(), $request_uri ) ), 'customize.php' );
		$default_customize_header_slug_1 = add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $default_customize_slug );
		// TODO: Remove WPCom_Theme_Customizer::modify_header_menu_links() and WPcom_Custom_Header::modify_admin_menu_links().
		$default_customize_header_slug_2     = admin_url( 'themes.php?page=custom-header' );
		$default_customize_background_slug_1 = add_query_arg( array( 'autofocus' => array( 'control' => 'background_image' ) ), $default_customize_slug );
		// TODO: Remove Colors_Manager::modify_header_menu_links() and Colors_Manager_Common::modify_header_menu_links().
		$default_customize_background_slug_2 = add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), admin_url( 'customize.php' ) );

		if ( $this->is_api_request ) {
			// In case this is an api request we will have to add the 'return' querystring via JS.
			$customize_url = 'customize.php';
		} else {
			$customize_url = $default_customize_slug;
		}

		$submenus_to_update = array(
			$default_customize_slug              => $customize_url,
			$default_customize_header_slug_1     => add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url ),
			$default_customize_header_slug_2     => add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url ),
			$default_customize_background_slug_1 => add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), $customize_url ),
			$default_customize_background_slug_2 => add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), $customize_url ),
			'widgets.php'                        => add_query_arg( array( 'autofocus' => array( 'panel' => 'widgets' ) ), $customize_url ),
			'gutenberg-widgets'                  => add_query_arg( array( 'autofocus' => array( 'panel' => 'widgets' ) ), $customize_url ),
			'nav-menus.php'                      => add_query_arg( array( 'autofocus' => array( 'panel' => 'nav_menus' ) ), $customize_url ),
		);

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'themes.php' ) ) {
			$submenus_to_update['themes.php'] = 'https://wordpress.com/themes/' . $this->domain;
		}

		$this->update_submenus( 'themes.php', $submenus_to_update );

		$this->hide_submenu_page( 'themes.php', 'custom-header' );
		$this->hide_submenu_page( 'themes.php', 'custom-background' );

		return $customize_url;
	}

	/**
	 * Adds Plugins menu.
	 */
	public function add_plugins_menu() {
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'plugins.php' ) ) {
			return;
		}

		$this->hide_submenu_page( 'plugins.php', 'plugin-install.php' );
		$this->hide_submenu_page( 'plugins.php', 'plugin-editor.php' );

		$this->update_menu( 'plugins.php', 'https://wordpress.com/plugins/' . $this->domain );
	}

	/**
	 * Adds Users menu.
	 */
	public function add_users_menu() {
		$submenus_to_update = array(
			'profile.php' => 'https://wordpress.com/me',
		);

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'users.php' ) ) {
			$submenus_to_update['users.php']    = 'https://wordpress.com/people/team/' . $this->domain;
			$submenus_to_update['user-new.php'] = 'https://wordpress.com/people/new/' . $this->domain;
		}

		$slug = current_user_can( 'list_users' ) ? 'users.php' : 'profile.php';
		$this->update_submenus( $slug, $submenus_to_update );
		add_submenu_page( $slug, esc_attr__( 'Account Settings', 'jetpack' ), __( 'Account Settings', 'jetpack' ), 'read', 'https://wordpress.com/me/account' );
	}

	/**
	 * Adds Tools menu.
	 */
	public function add_tools_menu() {
		$submenus_to_update = array();
		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'import.php' ) ) {
			$submenus_to_update['import.php'] = 'https://wordpress.com/import/' . $this->domain;
		}
		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'export.php' ) ) {
			$submenus_to_update['export.php'] = 'https://wordpress.com/export/' . $this->domain;
		}
		$this->update_submenus( 'tools.php', $submenus_to_update );

		$this->hide_submenu_page( 'tools.php', 'tools.php' );
		$this->hide_submenu_page( 'tools.php', 'delete-blog' );

		add_submenu_page( 'tools.php', esc_attr__( 'Marketing', 'jetpack' ), __( 'Marketing', 'jetpack' ), 'publish_posts', 'https://wordpress.com/marketing/tools/' . $this->domain, null, 0 );
		add_submenu_page( 'tools.php', esc_attr__( 'Earn', 'jetpack' ), __( 'Earn', 'jetpack' ), 'manage_options', 'https://wordpress.com/earn/' . $this->domain, null, 1 );
	}

	/**
	 * Adds Settings menu.
	 */
	public function add_options_menu() {
		$submenus_to_update = array();

		$this->hide_submenu_page( 'options-general.php', 'sharing' );

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'options-general.php' ) ) {
			$submenus_to_update['options-general.php'] = 'https://wordpress.com/settings/general/' . $this->domain;
		}

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'options-writing.php' ) ) {
			$submenus_to_update['options-writing.php'] = 'https://wordpress.com/settings/writing/' . $this->domain;
		}

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'options-discussion.php' ) ) {
			$submenus_to_update['options-discussion.php'] = 'https://wordpress.com/settings/discussion/' . $this->domain;
		}

		$this->update_submenus( 'options-general.php', $submenus_to_update );

		add_submenu_page( 'options-general.php', esc_attr__( 'Performance', 'jetpack' ), __( 'Performance', 'jetpack' ), 'manage_options', 'https://wordpress.com/settings/performance/' . $this->domain, null, 1 );
	}

	/**
	 * Adds Jetpack menu.
	 */
	public function add_jetpack_menu() {
		$this->add_admin_menu_separator( 50, 'manage_options' );

		// TODO: Replace with proper SVG data url.
		$icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 40 40' %3E%3Cpath fill='%23a0a5aa' d='M20 0c11.046 0 20 8.954 20 20s-8.954 20-20 20S0 31.046 0 20 8.954 0 20 0zm11 17H21v19l10-19zM19 4L9 23h10V4z'/%3E%3C/svg%3E";

		$is_menu_updated = $this->update_menu( 'jetpack', null, null, null, $icon, 51 );
		if ( ! $is_menu_updated ) {
			add_menu_page( esc_attr__( 'Jetpack', 'jetpack' ), __( 'Jetpack', 'jetpack' ), 'manage_options', 'jetpack', null, $icon, 51 );
		}

		add_submenu_page( 'jetpack', esc_attr__( 'Activity Log', 'jetpack' ), __( 'Activity Log', 'jetpack' ), 'manage_options', 'https://wordpress.com/activity-log/' . $this->domain, null, 2 );
		add_submenu_page( 'jetpack', esc_attr__( 'Backup', 'jetpack' ), __( 'Backup', 'jetpack' ), 'manage_options', 'https://wordpress.com/backup/' . $this->domain, null, 3 );
		/* translators: Jetpack sidebar menu item. */
		add_submenu_page( 'jetpack', esc_attr__( 'Search', 'jetpack' ), __( 'Search', 'jetpack' ), 'manage_options', 'https://wordpress.com/jetpack-search/' . $this->domain, null, 4 );

		$this->hide_submenu_page( 'jetpack', 'jetpack#/settings' );
		$this->hide_submenu_page( 'jetpack', 'stats' );
		$this->hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-backups' ) ) );
		$this->hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-scanner' ) ) );

		if ( ! $is_menu_updated ) {
			// Remove the submenu auto-created by Core just to be sure that there no issues on non-admin roles.
			remove_submenu_page( 'jetpack', 'jetpack' );
		}
	}

	/**
	 * Update Site Editor menu item's link and position.
	 */
	public function add_gutenberg_menus() {
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'admin.php?page=gutenberg-edit-site' ) ) {
			return;
		}

		$this->update_menu( 'gutenberg-edit-site', 'https://wordpress.com/site-editor/' . $this->domain, null, null, null, 59 );
	}

	/**
	 * Adds Beta Testing link.
	 */
	public function add_beta_testing_menu() {
		$icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxOCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1LjE5MDEgMTAuODU2N0MxNC45NTc0IDEwLjYyNCAxNC42NjExIDEwLjQ2NTQgMTQuMzM4NCAxMC40MDA4TDEyLjM0OTMgMTAuMDAzM0MxMS4yNTkgOS43ODUzIDEwLjEyNzEgOS45MzY5IDkuMTMyNjIgMTAuNDM0Mkw4Ljg2NzYxIDEwLjU2NThDNy44NzMxMiAxMS4wNjMxIDYuNzQxMjUgMTEuMjE0NyA1LjY1MDk1IDEwLjk5NjdMNC4wNDE3OCAxMC42NzVDMy43NzI3OCAxMC42MjEzIDMuNDk0NjggMTAuNjM0OCAzLjIzMjE0IDEwLjcxNDNDMi45Njk2MSAxMC43OTM4IDIuNzMwNzYgMTAuOTM2OSAyLjUzNjc4IDExLjEzMDhNNC42NjY3OCAxLjMzMzM0SDEzLjMzMzRMMTEuNTAwMSAyLjE2NjY4VjYuNDc2NjhDMTEuNTAwMiA2LjkxODY3IDExLjY3NTkgNy4zNDI1MiAxMS45ODg0IDcuNjU1MDFMMTYuMTU1MSAxMS44MjE3QzE3LjIwNTEgMTIuODcxNyAxNi40NjA5IDE0LjY2NjcgMTQuOTc1OSAxNC42NjY3SDMuMDIzNDVDMS41Mzg0NSAxNC42NjY3IDAuNzk1MTE2IDEyLjg3MTcgMS44NDUxMiAxMS44MjE3TDYuMDExNzggNy42NTUwMUM2LjMyNDM2IDcuMzQyNTIgNi41MDAwMiA2LjkxODY3IDYuNTAwMTEgNi40NzY2OFYyLjE2NjY4TDQuNjY2NzggMS4zMzMzNFoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSIgc3Ryb2tlLWxpbmVqb2luPSJiZXZlbCIvPgo8cmVjdCB4PSIxLjcyNzU0IiB5PSIxMC43MjczIiB3aWR0aD0iMTQuNTQ1NSIgaGVpZ2h0PSIzLjYzNjM2IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
		add_menu_page( 'beta-testing', __( 'Beta Testing', 'jetpack' ), 'manage_options', 'https://wordpress.com/beta-testing/' . $this->domain, null, $icon, null );
	}

	/**
	 * Prepend a dashboard swithcer to the "Screen Options" box of the current page.
	 * Callback for the 'screen_settings' filter (available in WP 3.0 and up).
	 *
	 * @param string $current The currently added panels in screen options.
	 *
	 * @return string The HTML code to append to "Screen Options"
	 */
	public function register_dashboard_switcher( $current ) {
		$menu_mappings = require __DIR__ . '/menu-mappings.php';
		$screen        = $this->get_current_screen();

		// Let's show the switcher only in screens that we have a Calypso mapping to switch to.
		if ( ! isset( $menu_mappings[ $screen ] ) ) {
			return;
		}

		$contents = sprintf(
			'<div id="dashboard-switcher"><h5>%s</h5><p class="dashboard-switcher-text">%s</p><a class="button button-primary dashboard-switcher-button" href="%s">%s</a></div>',
			__( 'Screen features', 'jetpack' ),
			__( 'Currently you are seeing the classic WP-Admin view of this page. Would you like to see the default WordPress.com view?', 'jetpack' ),
			$menu_mappings[ $screen ] . $this->domain,
			__( 'Use WordPress.com view', 'jetpack' )
		);

		// Prepend the Dashboard swither to the other custom panels.
		$current = $contents . $current;

		return $current;
	}
}

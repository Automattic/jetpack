<?php
/**
 * P2 Admin Menu file.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-wpcom-admin-menu.php';

/**
 * Class P2_Admin_Menu.
 */
class P2_Admin_Menu extends WPcom_Admin_Menu {

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		parent::reregister_menu_items();
		$this->remove_menus();
	}

	/**
	 * Remove menu items not applicable for P2 sites.
	 */
	public function remove_menus() {
		if (
			defined( 'IS_WPCOM' ) && IS_WPCOM &&
			function_exists( 'require_lib' )
		) {
			require_lib( 'wpforteams' );

			if ( \WPForTeams\is_part_of_active_workspace( get_current_blog_id() ) ) {
				remove_menu_page( 'https://wordpress.com/plans/' . $this->domain );
			}
		}

		remove_menu_page( 'link-manager.php' );
		remove_menu_page( 'edit.php?post_type=feedback' );
		remove_menu_page( 'plugins.php' );
		remove_menu_page( 'https://wordpress.com/plugins/' . $this->domain );
		remove_submenu_page( 'plugins.php', 'plugins.php' );

		remove_submenu_page( 'https://wordpress.com/plans/' . $this->domain, 'https://wordpress.com/domains/manage/' . $this->domain );

		$themes_slug = 'https://wordpress.com/themes/' . $this->domain;
		remove_submenu_page( $themes_slug, $themes_slug );

		$tools_slug = 'https://wordpress.com/marketing/tools/' . $this->domain;
		remove_submenu_page( $tools_slug, 'https://wordpress.com/marketing/tools/' . $this->domain );
		remove_submenu_page( $tools_slug, 'https://wordpress.com/earn/' . $this->domain );

		remove_submenu_page( 'https://wordpress.com/settings/general/' . $this->domain, 'sharing' );
		remove_submenu_page( 'https://wordpress.com/settings/general/' . $this->domain, 'polls&action=options' );
		remove_submenu_page( 'https://wordpress.com/settings/general/' . $this->domain, 'ratings&action=options' );
		remove_submenu_page( 'https://wordpress.com/settings/general/' . $this->domain, 'https://wordpress.com/hosting-config/' . $this->domain );
		remove_submenu_page(
			'https://wordpress.com/settings/general/' . $this->domain,
			'https://wordpress.com/marketing/sharing-buttons/' . $this->domain
		);

		if ( $this->is_api_request ) {
			// This menu page is only added on WP Admin.
			add_menu_page( 'P2 Editor', 'P2 Editor', 'manage_options', 'p2editor', '', 'dashicons-admin-multisite' );
		}
	}

}

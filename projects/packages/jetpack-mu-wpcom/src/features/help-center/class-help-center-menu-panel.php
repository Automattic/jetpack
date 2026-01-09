<?php
/**
 * Help Center Menu Panel
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Help_Center_Menu_Panel
 *
 * Handles the help center menu panel functionality in the admin bar.
 *
 * @since 6.9.0
 */
class Help_Center_Menu_Panel {

	/**
	 * Get the SVG icon markup for a given icon name.
	 *
	 * @param string $icon_name The name of the icon to retrieve.
	 * @return string The SVG markup.
	 */
	private static function get_icon( $icon_name ) {
		$icons = array(
			'comment' => '<svg class="help-center-menu-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 4H6c-1.1 0-2 .9-2 2v12.9c0 .6.5 1.1 1.1 1.1.3 0 .5-.1.8-.3L8.5 17H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 11c0 .3-.2.5-.5.5H7.9l-2.4 2.4V6c0-.3.2-.5.5-.5h12c.3 0 .5.2.5.5v9z" /></svg>',
			'backup'  => '<svg class="help-center-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.5 12h1.75l-2.5 3-2.5-3H4a8 8 0 113.134 6.35l.907-1.194A6.5 6.5 0 105.5 12zm9.53 1.97l-2.28-2.28V8.5a.75.75 0 00-1.5 0V12a.747.747 0 00.218.529l1.282-.84-1.28.842 2.5 2.5a.75.75 0 101.06-1.061z" /></svg>',
			'page'    => '<svg class="help-center-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 7.5h-7V9h7V7.5Zm-7 3.5h7v1.5h-7V11Zm7 3.5h-7V16h7v-1.5Z" /><path d="M17 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM7 5.5h10a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5Z" /></svg>',
			'video'   => '<svg class="help-center-menu-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.7 3H5.3C4 3 3 4 3 5.3v13.4C3 20 4 21 5.3 21h13.4c1.3 0 2.3-1 2.3-2.3V5.3C21 4 20 3 18.7 3zm.8 15.7c0 .4-.4.8-.8.8H5.3c-.4 0-.8-.4-.8-.8V5.3c0-.4.4-.8.8-.8h13.4c.4 0 .8.4.8.8v13.4zM10 15l5-3-5-3v6z" /></svg>',
			'rss'     => '<svg class="help-center-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 10.2h-.8v1.5H5c1.9 0 3.8.8 5.1 2.1 1.4 1.4 2.1 3.2 2.1 5.1v.8h1.5V19c0-2.3-.9-4.5-2.6-6.2-1.6-1.6-3.8-2.6-6.1-2.6zm10.4-1.6C12.6 5.8 8.9 4.2 5 4.2h-.8v1.5H5c3.5 0 6.9 1.4 9.4 3.9s3.9 5.8 3.9 9.4v.8h1.5V19c0-3.9-1.6-7.6-4.4-10.4zM4 20h3v-3H4v3z" /></svg>',
		);

		return $icons[ $icon_name ] ?? '';
	}

	/**
	 * Add the help center menu panel to the admin bar.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public static function add_menu_panel( $wp_admin_bar ) {
		// Add chat support group
		$wp_admin_bar->add_group(
			array(
				'parent' => 'help-center',
				'id'     => 'help-center-menu-panel-chat',
				'meta'   => array(
					'class' => 'ab-sub-secondary',
				),
			)
		);

		// Add chat support menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'help-center-menu-panel-chat',
				'id'     => 'help-center-chat-support',
				'title'  => self::get_icon( 'comment' ) . '<span>' . __( 'Chat support', 'jetpack-mu-wpcom' ) . '</span>',
			)
		);

		// Add chat history menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'help-center-menu-panel-chat',
				'id'     => 'help-center-chat-history',
				'title'  => self::get_icon( 'backup' ) . '<span>' . __( 'Chat history', 'jetpack-mu-wpcom' ) . '</span>',
			)
		);

		// Add links group
		$wp_admin_bar->add_group(
			array(
				'parent' => 'help-center',
				'id'     => 'help-center-menu-panel-links',
				'meta'   => array(
					'class' => 'ab-sub-secondary',
				),
			)
		);

		// Add support guides menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'help-center-menu-panel-links',
				'id'     => 'help-center-support-guides',
				'title'  => self::get_icon( 'page' ) . '<span>' . __( 'Support guides', 'jetpack-mu-wpcom' ) . '</span>',
			)
		);

		// Add courses menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'help-center-menu-panel-links',
				'id'     => 'help-center-courses',
				'title'  => self::get_icon( 'video' ) . '<span>' . __( 'Courses', 'jetpack-mu-wpcom' ) . '</span>',
				'href'   => 'https://wordpress.com/support/courses/',
				'meta'   => array(
					'target' => '_blank',
				),
			)
		);

		// Add product updates menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'help-center-menu-panel-links',
				'id'     => 'help-center-product-updates',
				'title'  => self::get_icon( 'rss' ) . '<span>' . __( 'Product updates', 'jetpack-mu-wpcom' ) . '</span>',
				'href'   => 'https://wordpress.com/blog/category/product-features/',
				'meta'   => array(
					'target' => '_blank',
				),
			)
		);
	}

	/**
	 * Initialize the help center menu panel.
	 */
	public static function init() {
			add_action(
				'admin_bar_menu',
				array( __CLASS__, 'add_menu_panel' ),
				12
			);
	}
}

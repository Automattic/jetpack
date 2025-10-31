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
 * @since $$next-version$$
 */
class Help_Center_Menu_Panel {

	/**
	 * Check if the help center menu panel should be displayed.
	 *
	 * @return bool True if the menu panel should be displayed.
	 */
	public static function should_display_menu_panel() {
		// Only add the help center menu panel if the flags parameter is present
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		return isset( $_GET['flags'] ) && strpos( sanitize_text_field( wp_unslash( $_GET['flags'] ) ), 'help-center-menu-panel' ) !== false;
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Add the help center menu panel to the admin bar.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public static function add_menu_panel( $wp_admin_bar ) {
		if ( ! self::should_display_menu_panel() ) {
			return;
		}

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
				'title'  => __( 'Chat support', 'jetpack-mu-wpcom' ),
			)
		);

		// Add chat history menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'help-center-menu-panel-chat',
				'id'     => 'help-center-chat-history',
				'title'  => __( 'Chat history', 'jetpack-mu-wpcom' ),
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
				'title'  => __( 'Support guides', 'jetpack-mu-wpcom' ),
			)
		);

		// Add courses menu item
		$wp_admin_bar->add_node(
			array(
				'parent' => 'help-center-menu-panel-links',
				'id'     => 'help-center-courses',
				'title'  => __( 'Courses', 'jetpack-mu-wpcom' ),
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
				'title'  => __( 'Product updates', 'jetpack-mu-wpcom' ),
				'href'   => 'https://wordpress.com/blog/category/product-features/',
				'meta'   => array(
					'target' => '_blank',
				),
			)
		);
	}

	/**
	 * Initialize the help center menu panel.
	 *
	 * @param string $variant The variant of the help center being loaded.
	 */
	public static function init( $variant ) {
		if ( $variant === 'wp-admin' || $variant === 'wp-admin-disconnected' ) {
			add_action(
				'admin_bar_menu',
				array( __CLASS__, 'add_menu_panel' ),
				12
			);
		}
	}
}

<?php
/**
 * WordPress.com Site Menu
 *
 * Add's a WordPress.com menu item to the admin menu linking back to the sites WordPress.com home page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Add a WordPress.com menu item to the wp-admin sidebar menu.
 */
function wpcom_add_wpcom_menu_item() {
	if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
		add_menu_page(
			esc_attr__( 'All Sites', 'jetpack-mu-wpcom' ),
			esc_attr__( 'All Sites', 'jetpack-mu-wpcom' ),
			'manage_options',
			'https://wordpress.com/sites',
			null,
			'dashicons-arrow-left-alt2',
			0
		);

		// Position a separator below the WordPress.com menu item.
		// Inspired by https://github.com/Automattic/jetpack/blob/b6b6e86c5491869782857141ca48168dfa195635/projects/plugins/jetpack/modules/masterbar/admin-menu/class-base-admin-menu.php#L239
		global $menu;
		$separator = array(
			'',                                  // Menu title (ignored).
			'manage_options',                    // Required capability.
			wp_unique_id( 'separator-custom-' ), // URL or file (ignored, but must be unique).
			'',                                  // Page title (ignored).
			'wp-menu-separator',                 // CSS class. Identifies this item as a separator.
		);
		$position  = 0;
		if ( isset( $menu[ "$position" ] ) ) {
			$position            = $position + substr( base_convert( md5( $separator[2] . $separator[0] ), 16, 10 ), -5 ) * 0.00001;
			$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		} else {
			$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}
}
add_action( 'admin_menu', 'wpcom_add_wpcom_menu_item' );

/**
 * Helper function to determine if the admin notice should be shown.
 *
 * @return bool
 */
function wpcom_site_menu_should_show_notice() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return false;
	}
	if ( get_option( 'wpcom_site_menu_notice_dismissed' ) ) {
		return false;
	}

	$screen = get_current_screen();
	return 'dashboard' === $screen->id;
}

/**
 * Add a notice to the admin menu to inform users about the new WordPress.com menu item.
 */
function wpcom_add_hosting_menu_intro_notice() {
	if ( ! wpcom_site_menu_should_show_notice() || ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}
	?>
	<style>

		body.no-js .wpcom-site-menu-intro-notice {
			display: none !important;
		}
		.wpcom-site-menu-intro-notice {
			display: none !important;
			padding: 8px 12px;
		}

		.wrap > .wpcom-site-menu-intro-notice {
			display: flex !important;
		}
		.wpcom-site-menu-intro-notice.notice.notice-info {
			border-left-color: #3858e9;
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.wpcom-site-menu-intro-notice .dashicons-wordpress-alt {
			color: #3858e9;
			font-size: 32px;
			width: 32px;
			height: 32px;
		}

		.wpcom-site-menu-intro-notice span.title {
			font-size: 14px;
			font-weight: 600;
		}

		.wpcom-site-menu-intro-notice span {
			color: rgb(29, 35, 39);
			font-size: 14px;
		}

		.wpcom-site-menu-intro-notice a.close-button {
			height: 16px;
			margin-left: auto;
		}
	</style>
	<div class="wpcom-site-menu-intro-notice notice notice-info" role="alert">
		<div class="banner-icon">
			<span class="dashicons dashicons-wordpress-alt"></span>
		</div>
		<div>
			<span class="title"><?php esc_html_e( 'WordPress.com', 'jetpack-mu-wpcom' ); ?></span><br />
			<span>
				<?php esc_html_e( 'To access settings for plans, domains, subscribers, etc., click "Hosting" in the sidebar.', 'jetpack-mu-wpcom' ); ?>
			</span>
		</div>
		<a href="#" class="close-button" aria-label=<?php echo esc_attr__( 'Dismiss', 'jetpack-mu-wpcom' ); ?>>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12.7019" y="2.35547" width="1.53333" height="15.287" rx="0.766667" transform="rotate(45 12.7019 2.35547)" fill="#646970"></rect><rect x="13.6445" y="13.165" width="1.53333" height="15.287" rx="0.766667" transform="rotate(135 13.6445 13.165)" fill="#646970"></rect></svg>
		</a>
	</div>
	<?php
}
add_action( 'admin_notices', 'wpcom_add_hosting_menu_intro_notice' );

/**
 * Handles the AJAX request to dismiss the admin notice.
 */
function wpcom_add_hosting_menu_intro_notice_dismiss() {
	if ( ! wpcom_site_menu_should_show_notice() ) {
		return;
	}
	?>
	<script>
		document.addEventListener( 'DOMContentLoaded', function() {
			document.querySelector( '.wpcom-site-menu-intro-notice a.close-button' ).addEventListener( 'click', function( event ) {
				event.preventDefault();
				this.closest( '.wpcom-site-menu-intro-notice' ).remove();
				wp.ajax.post( 'dismiss_wpcom_site_menu_intro_notice' );
			} );
		} );
	</script>
	<?php
}
add_action( 'admin_footer', 'wpcom_add_hosting_menu_intro_notice_dismiss' );

/**
 * Acts as the AJAX callback to set an option for dismissing the admin notice.
 */
function wpcom_site_menu_handle_dismiss_notice() {
	update_option( 'wpcom_site_menu_notice_dismissed', 1 );
	wp_die();
}
add_action( 'wp_ajax_dismiss_wpcom_site_menu_intro_notice', 'wpcom_site_menu_handle_dismiss_notice' );

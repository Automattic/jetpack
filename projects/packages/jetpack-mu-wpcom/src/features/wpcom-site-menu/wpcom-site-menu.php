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
 *
 * Of note, we need the $parent_slug so that we can link the submenu items to the parent menu item. Using a URL
 * for the slug doesn't appear to work when registering submenus. Because we use the parent slug in the top
 * level menu item, we need to find a solution to link that menu out to WordPress.com.
 *
 * We accomplish this by:
 *
 * - Adding a submenu item that links to /sites.
 * - Hiding that submenu item with CSS.
 *
 * This works because the top level menu item links to wherever the submenu item links to.
 */
function wpcom_add_wpcom_menu_item() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	global $menu;

	$parent_slug = 'wpcom-hosting-menu';
	$domain      = wp_parse_url( home_url(), PHP_URL_HOST );

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
	$separator = array(
		'',
		'manage_options',
		wp_unique_id( 'separator-custom-' ),
		'',
		'wp-menu-separator',
	);

	$position = 0;
	if ( isset( $menu[ "$position" ] ) ) {
		$position            = $position + substr( base_convert( md5( $separator[2] . $separator[0] ), 16, 10 ), -5 ) * 0.00001;
		$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	} else {
		$menu[ "$position" ] = $separator; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	add_menu_page(
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ),
		'manage_options',
		$parent_slug,
		null,
		'dashicons-cloud',
		3
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/home/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/plans/$domain" ),
		null
	);

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		add_submenu_page(
			$parent_slug,
			esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
			esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
			'manage_options',
			esc_url( "https://wordpress.com/add-ons/$domain" ),
			null
		);
	}

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/domains/manage/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/email/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/purchases/subscriptions/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Configuration', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Configuration', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/hosting-config/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Monitoring', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Monitoring', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/site-monitoring/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Monetize', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Monetize', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/earn/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Subscribers', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Subscribers', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/subscribers/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Connections', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Connections', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/marketing/connections/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/settings/general/$domain" ),
		null
	);

	// By default, WordPress adds a submenu item for the parent menu item, which we don't want.
	remove_submenu_page(
		$parent_slug,
		$parent_slug
	);
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

/**
 * Ensures customizer menu and adminbar items are not visible on a block theme for atomic sites.
 */
function hide_customizer_menu_on_block_theme() {
	$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
	if ( ! $is_wpcom && wp_is_block_theme() && ! is_customize_preview() ) {
		remove_action( 'customize_register', 'add_logotool_button', 20 );
		remove_action( 'customize_register', 'footercredits_register', 99 );
		remove_action( 'customize_register', 'wpcom_disable_customizer_site_icon', 20 );

		if ( class_exists( '\Jetpack_Fonts' ) ) {
			$jetpack_fonts_instance = \Jetpack_Fonts::get_instance();
			remove_action( 'customize_register', array( $jetpack_fonts_instance, 'register_controls' ) );
			remove_action( 'customize_register', array( $jetpack_fonts_instance, 'maybe_prepopulate_option' ), 0 );
		}

		remove_action( 'customize_register', array( 'Jetpack_Fonts_Typekit', 'maybe_override_for_advanced_mode' ), 20 );

		remove_action( 'customize_register', 'Automattic\Jetpack\Dashboard_Customizations\register_css_nudge_control' );

		remove_action( 'customize_register', array( 'Jetpack_Custom_CSS_Enhancements', 'customize_register' ) );
	}
}
add_action( 'init', 'hide_customizer_menu_on_block_theme' );

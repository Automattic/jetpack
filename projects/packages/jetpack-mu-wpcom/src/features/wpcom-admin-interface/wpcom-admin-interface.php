<?php
/**
 * Additional wpcom_admin_interface option on settings.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Masterbar\Admin_Menu;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Add the Admin Interface Style setting on the General settings page.
 * This setting allows users to switch between the classic WP-Admin interface and the WordPress.com legacy dashboard.
 * The setting is stored in the wpcom_admin_interface option.
 * The setting is displayed only if the has the wp-admin interface selected.
 */
function wpcomsh_wpcom_admin_interface_settings_field() {
	add_settings_field( 'wpcom_admin_interface', __( 'Admin Interface Style', 'jetpack-mu-wpcom' ), 'wpcom_admin_interface_display', 'general', 'default' );

	register_setting( 'general', 'wpcom_admin_interface', array( 'sanitize_callback' => 'esc_attr' ) );
}

/**
 * Display the wpcom_admin_interface setting on the General settings page.
 */
function wpcom_admin_interface_display() {
	remove_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option', 10 );
	$value = get_option( 'wpcom_admin_interface', 'calypso' );
	add_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option', 10 );

	echo '<fieldset>';
	echo '<label><input type="radio" name="wpcom_admin_interface" value="wp-admin" ' . checked( 'wp-admin', $value, false ) . '/> <span>' . esc_html__( 'Classic style', 'jetpack-mu-wpcom' ) . '</span></label><p>' . esc_html__( 'Use WP-Admin to manage your site.', 'jetpack-mu-wpcom' ) . '</p><br>';
	echo '<label><input type="radio" name="wpcom_admin_interface" value="calypso" ' . checked( 'calypso', $value, false ) . '/> <span>' . esc_html__( 'Default style', 'jetpack-mu-wpcom' ) . '</span></label><p>' . esc_html__( 'Use WordPress.com’s native dashboard to manage your site.', 'jetpack-mu-wpcom' ) . '</p><br>';
	echo '</fieldset>';
}
add_action( 'admin_init', 'wpcomsh_wpcom_admin_interface_settings_field' );

/**
 * Track the wpcom_admin_interface_changed event.
 *
 * @param string $value The new value.
 * @return void
 */
function wpcom_admin_interface_track_changed_event( $value ) {
	$event_name = 'wpcom_admin_interface_changed';
	$properties = array( 'interface' => $value );
	if ( function_exists( 'wpcomsh_record_tracks_event' ) ) {
		wpcomsh_record_tracks_event( $event_name, $properties );
	} else {
		require_lib( 'tracks/client' );
		tracks_record_event( get_current_user_id(), $event_name, $properties );
	}
}

/**
 * Check if we should disable the calypso links.
 *
 * @param string $screen The given screen.
 *
 * @return bool
 */
function wpcom_should_disable_calypso_links( string $screen ): bool {
	if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' || ! ( new Host() )->is_wpcom_platform() ) {
		return true;
	}

	if ( ( new Host() )->is_wpcom_simple() && function_exists( '\Automattic\Jetpack\Dashboard_Customizations\show_unified_nav' ) && ! \Automattic\Jetpack\Dashboard_Customizations\show_unified_nav() ) {
		return true;
	}

	if ( ( new Host() )->is_woa_site() && ! apply_filters( 'jetpack_load_admin_menu_class', true ) ) {
		return true;
	}

	$admin_menu = wpcom_get_custom_admin_menu_class();

	if ( ! $admin_menu ) {
		return true;
	}

	return $admin_menu::get_instance()->get_preferred_view( $screen ) === Admin_Menu::CLASSIC_VIEW;
}

/**
 * Update the wpcom_admin_interface option on wpcom as it's the persistent data.
 * Also implements the redirect from WP Admin to Calypso when the interface option
 * is changed.
 *
 * @access private
 * @since 4.20.0
 *
 * @param string $new_value The new settings value.
 * @param string $old_value The old settings value.
 * @return string The value to update.
 */
function wpcom_admin_interface_pre_update_option( $new_value, $old_value ) {
	if ( $new_value === $old_value ) {
		return $new_value;
	}

	if ( ! class_exists( 'Jetpack_Options' ) || ! class_exists( 'Automattic\Jetpack\Connection\Client' ) || ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return $new_value;
	}

	global $pagenow;
	$on_wp_admin_options_page = isset( $pagenow ) && 'options.php' === $pagenow;

	if ( $on_wp_admin_options_page ) {
		wpcom_admin_interface_track_changed_event( $new_value );
	}

	if ( ! ( new Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
		$blog_id = Jetpack_Options::get_option( 'id' );
		Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/hosting/admin-interface",
			'v2',
			array( 'method' => 'POST' ),
			array( 'interface' => $new_value )
		);
	}

	return $new_value;
}
add_filter( 'pre_update_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_update_option', 10, 2 );

const WPCOM_DUPLICATED_VIEW = array(
	'edit.php',
	'edit.php?post_type=page',
	'edit.php?post_type=post', // Alias for posts. It's used for the post filters (published, draft, sticky, etc).
	'edit.php?post_type=jetpack-portfolio',
	'edit.php?post_type=jetpack-testimonial',
	'edit-comments.php',
	'edit-tags.php?taxonomy=category',
	'edit-tags.php?taxonomy=post_tag',
	'export.php',
	'options-general.php',
	'options-writing.php',
	'options-reading.php',
	'options-discussion.php',
	'upload.php',
);

/**
 * Get the current screen section.
 *
 * Temporary function copied from Base_Admin_Menu.
 *
 * return string
 */
function wpcom_admin_get_current_screen() {
	// phpcs:disable WordPress.Security.NonceVerification
	global $pagenow;
	$screen = isset( $_REQUEST['screen'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['screen'] ) ) : $pagenow;
	if ( isset( $_GET['post_type'] ) ) {
		$screen = add_query_arg( 'post_type', sanitize_text_field( wp_unslash( $_GET['post_type'] ) ), $screen );
	}
	if ( isset( $_GET['taxonomy'] ) ) {
		$screen = add_query_arg( 'taxonomy', sanitize_text_field( wp_unslash( $_GET['taxonomy'] ) ), $screen );
	}
	if ( isset( $_GET['page'] ) ) {
		$screen = add_query_arg( 'page', sanitize_text_field( wp_unslash( $_GET['page'] ) ), $screen );
	}
	return $screen;
	// phpcs:enable WordPress.Security.NonceVerification
}

/**
 * Override the wpcom_admin_interface option with experiment variation.
 *
 * @param mixed $default_value The value to return instead of the option value.
 *
 * @return string Filtered wpcom_admin_interface option.
 */
function wpcom_admin_interface_pre_get_option( $default_value ) {
	$current_screen = wpcom_admin_get_current_screen();

	// If the user is on a screen that has been untangled, we need to return the wp-admin interface.
	if ( in_array( $current_screen, WPCOM_DUPLICATED_VIEW, true ) ) {
		return 'wp-admin';
	}

	return $default_value;
}

/**
 * Change the Admin menu links to WP-Admin for specific sections.
 *
 * @param array $value Preferred views.
 *
 * @return array Filtered preferred views.
 */
function wpcom_admin_get_user_option_jetpack( $value ) {
	if ( ! is_array( $value ) ) {
		$value = array();
	}

	foreach ( WPCOM_DUPLICATED_VIEW as $path ) {
		$value[ $path ] = Automattic\Jetpack\Masterbar\Base_Admin_Menu::CLASSIC_VIEW;
	}

	return $value;
}

add_filter( 'get_user_option_jetpack_admin_menu_preferred_views', 'wpcom_admin_get_user_option_jetpack' );
add_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option', 10 );

add_action(
	'admin_menu',
	function () {
		remove_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option' );
	},
	PHP_INT_MIN
);

add_action(
	'admin_menu',
	function () {
		add_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option', 10 );
	},
	PHP_INT_MAX
);
/**
 * Hides the "View" switcher on WP Admin screens that have been untangled.
 */
function wpcom_duplicate_views_hide_view_switcher() {
	$admin_menu_class = wpcom_get_custom_admin_menu_class();
	if ( $admin_menu_class ) {
		$admin_menu = $admin_menu_class::get_instance();

		$current_screen = wpcom_admin_get_current_screen();
		if ( in_array( $current_screen, WPCOM_DUPLICATED_VIEW, true ) ) {
			remove_filter( 'in_admin_header', array( $admin_menu, 'add_dashboard_switcher' ) );
		}
	}
}
add_action( 'admin_init', 'wpcom_duplicate_views_hide_view_switcher' );

/**
 * Determines whether the admin interface has been recently changed by checking the presence of the `admin-interface-changed` query param.
 *
 * @return bool
 */
function wpcom_has_admin_interface_changed() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	return ( sanitize_key( wp_unslash( $_GET['admin-interface-changed'] ?? 'false' ) ) ) === 'true';
}

/**
 * Displays a success notice in the dashboard after changing the admin interface.
 */
function wpcom_show_admin_interface_notice() {
	if ( ! wpcom_has_admin_interface_changed() ) {
		return;
	}

	global $pagenow;
	if ( $pagenow !== 'index.php' ) {
		return;
	}

	wp_admin_notice(
		__( 'Admin interface style changed.', 'jetpack-mu-wpcom' ),
		array(
			'type'        => 'success',
			'dismissible' => true,
		)
	);
}
add_action( 'admin_notices', 'wpcom_show_admin_interface_notice' );

/**
 * Gets the name of the class used to customize the admin menu when Nav Unification is enabled.
 *
 * @return false|class-string<\Automattic\Jetpack\Masterbar\Base_Admin_Menu> The class name of the customized admin menu if any, false otherwise.
 */
function wpcom_get_custom_admin_menu_class() {
	if ( ! function_exists( '\Automattic\Jetpack\Masterbar\get_admin_menu_class' ) || ! function_exists( '\Automattic\Jetpack\Masterbar\should_customize_nav' ) ) {
		return false;
	}

	$admin_menu_class = apply_filters( 'jetpack_admin_menu_class', \Automattic\Jetpack\Masterbar\get_admin_menu_class() );
	if ( ! \Automattic\Jetpack\Masterbar\should_customize_nav( $admin_menu_class ) ) {
		return false;
	}

	return $admin_menu_class;
}

/**
 * Enable the Blaze dashboard (WP-Admin) for users.
 *
 * @param bool $activation_status The activation status - use WP-Admin or Calypso.
 * @return mixed|true
 */
add_filter( 'jetpack_blaze_dashboard_enable', '__return_true' );

/**
 * Make the Jetpack Stats page to point to the Calypso Stats Admin menu - temporary. This is needed because WP-Admin pages are rolled-out individually.
 *
 * This should be removed when the sites are fully untangled (or with the Jetpack Stats).
 *
 * This is enabled only for the stats page for users that are part of the remove duplicate views experiment.
 *
 * @param string $file The parent_file of the page.
 *
 * @return mixed
 */
function wpcom_select_calypso_admin_menu_stats_for_jetpack_post_stats( $file ) {
	global $_wp_real_parent_file, $pagenow;

	$is_on_stats_page = 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'stats' === $_GET['page'];

	if ( ! $is_on_stats_page ) {
		return $file;
	}

	remove_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option' );
	$is_using_wp_admin = get_option( 'wpcom_admin_interface' ) === 'wp-admin';
	if ( function_exists( 'wpcom_admin_interface_pre_get_option' ) ) {
		add_filter( 'pre_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_get_option' );
	}

	if ( $is_using_wp_admin ) {
		return $file;
	}

	if ( ! wpcom_get_custom_admin_menu_class() ) {
		return $file;
	}

	/**
	 * Not ideal... We shouldn't be doing this.
	 */
	$_wp_real_parent_file['jetpack'] = 'https://wordpress.com/stats/day/' . ( new Status() )->get_site_suffix(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

	return $file;
}

add_filter( 'parent_file', 'wpcom_select_calypso_admin_menu_stats_for_jetpack_post_stats' );

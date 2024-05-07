<?php
/**
 * Additional wpcom_admin_interface option on settings.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Add the Admin Interface Style setting on the General settings page.
 * This setting allows users to switch between the classic WP-Admin interface and the WordPress.com legacy dashboard.
 * The setting is stored in the wpcom_admin_interface option.
 * The setting is displayed only if the has the wp-admin interface selected.
 */
function wpcomsh_wpcom_admin_interface_settings_field() {
	if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return;
	}

	add_settings_field( 'wpcom_admin_interface', null, 'wpcom_admin_interface_display', 'general', 'default' );

	register_setting( 'general', 'wpcom_admin_interface', 'esc_attr' );
}

/**
 * Display the wpcom_admin_interface setting on the General settings page.
 */
function wpcom_admin_interface_display() {
	$value = get_option( 'wpcom_admin_interface' );

	echo '<tr valign="top"><th scope="row"><label for="wpcom_admin_interface">' . esc_html__( 'Admin Interface Style', 'jetpack-mu-wpcom' ) . '</label></th><td>';
	echo '<fieldset>';
	echo '<label><input type="radio" name="wpcom_admin_interface" value="wp-admin" ' . checked( 'wp-admin', $value, false ) . '/> <span>' . esc_html__( 'Classic style', 'jetpack-mu-wpcom' ) . '</span></label><p>' . esc_html__( 'Use WP-Admin to manage your site.', 'jetpack-mu-wpcom' ) . '</p><br>';
	echo '<label><input type="radio" name="wpcom_admin_interface" value="calypso" ' . checked( 'calypso', $value, false ) . '/> <span>' . esc_html__( 'Default style', 'jetpack-mu-wpcom' ) . '</span></label><p>' . esc_html__( 'Use WordPress.com’s legacy dashboard to manage your site.', 'jetpack-mu-wpcom' ) . '</p><br>';
	echo '</fieldset>';
}

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_action( 'admin_init', 'wpcomsh_wpcom_admin_interface_settings_field' );
}

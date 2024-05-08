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
	add_settings_field( 'wpcom_admin_interface', '', 'wpcom_admin_interface_display', 'general', 'default' );

	register_setting( 'general', 'wpcom_admin_interface', array( 'sanitize_callback' => 'esc_attr' ) );
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

if ( ! empty( get_option( 'wpcom_classic_early_release' ) ) || ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
	add_action( 'admin_init', 'wpcomsh_wpcom_admin_interface_settings_field' );
}

/**
 * Update the wpcom_admin_interface option on wpcom as it's the persistent data.
 *
 * @access private
 * @since 4.20.0
 *
 * @param array $new_value The new settings value.
 * @param array $old_value The old settings value.
 * @return array The value to update.
 */
function wpcom_admin_interface_pre_update_option( $new_value, $old_value ) {
	if ( $new_value === $old_value ) {
		return $new_value;
	}

	if ( ! class_exists( 'Jetpack_Options' ) || ! class_exists( 'Automattic\Jetpack\Connection\Client' ) || ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return $new_value;
	}

	if ( ( new Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
		return $new_value;
	}

	$blog_id = Jetpack_Options::get_option( 'id' );
	Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
		"/sites/$blog_id/hosting/admin-interface",
		'v2',
		array( 'method' => 'POST' ),
		array( 'interface' => $new_value )
	);

	return $new_value;
}
add_filter( 'pre_update_option_wpcom_admin_interface', 'wpcom_admin_interface_pre_update_option', 10, 2 );

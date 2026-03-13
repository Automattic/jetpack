<?php
/**
 * WPCOM attachment pages settings.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Registers the attachment pages settings section, field, and the setting.
 *
 * @return void
 */
function wpcom_attachment_pages_settings_init() {
	add_settings_section( 'wpcom_attachment_pages', esc_html__( 'Attachment pages', 'jetpack-mu-wpcom' ), function () {}, 'media' );
	add_settings_field( 'wp_attachment_pages_enabled', esc_html__( 'Attachment pages settings', 'jetpack-mu-wpcom' ), 'wpcom_attachment_pages_settings_display', 'media', 'wpcom_attachment_pages' );
	register_setting( 'media', 'wp_attachment_pages_enabled', array( 'sanitize_callback' => 'wpcom_attachment_pages_setting_sanitization' ) );
}

add_action( 'admin_init', 'wpcom_attachment_pages_settings_init', 11 );

/**
 * Renders the attachment pages settings section.
 *
 * @return void
 */
function wpcom_attachment_pages_settings_display() {
	printf(
		'<label><input type="checkbox" name="wp_attachment_pages_enabled" id="wp_attachment_pages_enabled" value="1" %s/> <label for="wp_attachment_pages_enabled">%s</label>',
		checked( '1', get_option( 'wp_attachment_pages_enabled' ), false ),
		esc_html__( 'Enable attachment pages.', 'jetpack-mu-wpcom' )
	);
}

/**
 * Sanitizes the wp_attachment_pages option value.
 *
 * Turns the input value into either '1' or '0' based
 * on the bool value of the input.
 *
 * @param string|null $value Value provided by the WordPress settings API.
 * @return string '1' or '0'.
 */
function wpcom_attachment_pages_setting_sanitization( $value ) {
	return $value ? '1' : '0';
}

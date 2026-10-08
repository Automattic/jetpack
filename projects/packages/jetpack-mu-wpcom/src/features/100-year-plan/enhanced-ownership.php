<?php
/**
 * Enhanced Ownership
 *
 * The site-level legacy contact setting is retired in favour of the account-level
 * feature on WordPress.com, which covers every site a user owns.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Registers the settings section.
 */
function wpcom_eo_settings_page_init() {
	if ( ! wpcom_site_has_feature( WPCOM_Features::LEGACY_CONTACT ) ) {
		return;
	}

	add_settings_section(
		'wpcom_enhanced_ownership_section',
		__( 'Enhanced Ownership', 'jetpack-mu-wpcom' ),
		'wpcom_legacy_contact_render',
		'general'
	);
}
add_action( 'admin_init', 'wpcom_eo_settings_page_init' );

/**
 * Renders a pointer to the account-level legacy contact setting.
 */
function wpcom_legacy_contact_render() {
	?>
	<p class="description"><?php esc_html_e( 'Choose someone to look after your sites when you pass away.', 'jetpack-mu-wpcom' ); ?></p>
	<p class="description">
		<?php
		printf(
			/* translators: %s: link to the account-level legacy contact settings on WordPress.com. */
			esc_html__( 'Legacy contact is now set on your WordPress.com account and applies to all of your sites. %s', 'jetpack-mu-wpcom' ),
			'<a href="https://my.wordpress.com/me/security/legacy-contact">' . esc_html__( 'Manage your legacy contact ↗', 'jetpack-mu-wpcom' ) . '</a>'
		);
		?>
	</p>
	<?php
}

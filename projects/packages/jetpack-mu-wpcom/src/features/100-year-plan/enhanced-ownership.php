<?php
/**
 * Enhanced Ownership
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Registers Enhanced Ownership settings.
 */
function wpcom_eo_register_settings() {
	if ( ! wpcom_site_has_feature( WPCOM_Features::LEGACY_CONTACT ) ) {
		return;
	}

	register_setting(
		'general',
		'wpcom_legacy_contact',
		array(
			'type'         => 'string',
			'description'  => 'The legacy contact for this site.',
			'show_in_rest' => true,
			'default'      => '',
		)
	);
}
add_action( 'admin_init', 'wpcom_eo_register_settings' );
add_action( 'rest_api_init', 'wpcom_eo_register_settings' );

/**
 * Adds settings to the v1 API site settings endpoint.
 *
 * @param array $settings A single site's settings.
 * @return array
 */
function wpcom_eo_get_options_v1_api( $settings ) {
	if ( wpcom_site_has_feature( WPCOM_Features::LEGACY_CONTACT ) ) {
		$settings['wpcom_legacy_contact'] = get_option( 'wpcom_legacy_contact' );
	}

	return $settings;
}
add_filter( 'site_settings_endpoint_get', 'wpcom_eo_get_options_v1_api' );

/**
 * Updates settings via public-api.wordpress.com.
 *
 * @param array $input             Associative array of site settings to be updated.
 *                                 Cast and filtered based on documentation.
 * @param array $unfiltered_input  Associative array of site settings to be updated.
 *                                 Neither cast nor filtered. Contains raw input.
 * @return array
 */
function wpcom_eo_update_options_v1_api( $input, $unfiltered_input ) {
	if ( isset( $unfiltered_input['wpcom_legacy_contact'] ) ) {
		$input['wpcom_legacy_contact'] = sanitize_text_field( $unfiltered_input['wpcom_legacy_contact'] );
	}

	return $input;
}
add_filter( 'rest_api_update_site_settings', 'wpcom_eo_update_options_v1_api', 10, 2 );

/**
 * Registers the settings section and fields.
 */
function wpcom_eo_settings_page_init() {
	if ( ! wpcom_site_has_feature( WPCOM_Features::LEGACY_CONTACT ) ) {
		return;
	}

	add_settings_section(
		'wpcom_enhanced_ownership_section',
		__( 'Enhanced Ownership', 'jetpack-mu-wpcom' ),
		'', // No callback needed.
		'general'
	);

	add_settings_field(
		'wpcom_legacy_contact',
		__( 'Legacy Contact', 'jetpack-mu-wpcom' ),
		'wpcom_legacy_contact_render',
		'general',
		'wpcom_enhanced_ownership_section',
		array(
			'label_for' => 'wpcom_legacy_contact',
		)
	);
}
add_action( 'admin_init', 'wpcom_eo_settings_page_init' );

/**
 * Renders the Legacy Contact settings markup.
 */
function wpcom_legacy_contact_render() {
	?>
	<input type="text" id="wpcom_legacy_contact" class="regular-text" name="wpcom_legacy_contact" value="<?php echo esc_attr( get_option( 'wpcom_legacy_contact' ) ); ?>">
	<p class="description"><?php esc_html_e( 'Choose someone to look after your site when you pass away.', 'jetpack-mu-wpcom' ); ?></p>
	<p class="description">
		<?php
		printf(
			/* translators: link to the help page: https://wordpress.com/help */
			esc_html__( 'To take ownership of the site, we ask that the person you designate contacts us at %s with a copy of the death certificate.', 'jetpack-mu-wpcom' ),
			'<a href="https://wordpress.com/help">wordpress.com/help</a>'
		);
		?>
	</p>
	<?php
}

<?php
/**
 * Locked Mode.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds the action to limit capabilities for locked mode sites when the Locked Mode feature is available
 * and the option enabled.
 */
function wpcom_lm_maybe_add_map_meta_cap_filter() {
	// On REST API requests, wait until we switch to the correct blog to add the filter.
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST && 'plugins_loaded' === current_filter() ) {
		return;
	}

	if ( wpcom_site_has_feature( WPCOM_Features::LOCKED_MODE ) && get_option( 'wpcom_locked_mode' ) ) {
		add_filter( 'map_meta_cap', 'wpcom_lm_remove_post_capabilities', 10, 2 );
	} else {
		remove_filter( 'map_meta_cap', 'wpcom_lm_remove_post_capabilities' );
	}
}
add_action( 'plugins_loaded', 'wpcom_lm_maybe_add_map_meta_cap_filter', 11 );
add_action( 'rest_api_switched_to_blog', 'wpcom_lm_maybe_add_map_meta_cap_filter' );

/**
 * Registers Locked Mode settings.
 */
function wpcom_lm_register_settings() {
	if ( ! wpcom_site_has_feature( WPCOM_Features::LOCKED_MODE ) ) {
		return;
	}

	register_setting(
		'general',
		'wpcom_locked_mode',
		array(
			'type'              => 'boolean',
			'description'       => 'Whether the site is in locked mode.',
			'show_in_rest'      => true,
			'default'           => false,
			'sanitize_callback' => function ( $value ) {
				return (bool) $value;
			},
		)
	);
}
add_action( 'admin_init', 'wpcom_lm_register_settings' );
add_action( 'rest_api_init', 'wpcom_lm_register_settings' );

/**
 * Adds settings to the v1 API site settings endpoint.
 *
 * @param array $settings A single site's settings.
 * @return array
 */
function wpcom_lm_get_options_v1_api( $settings ) {
	if ( wpcom_site_has_feature( WPCOM_Features::LOCKED_MODE ) ) {
		$settings['wpcom_locked_mode'] = (bool) get_option( 'wpcom_locked_mode' );
	}

	return $settings;
}
add_filter( 'site_settings_endpoint_get', 'wpcom_lm_get_options_v1_api' );

/**
 * Updates settings via public-api.wordpress.com.
 *
 * @param array $input             Associative array of site settings to be updated.
 *                                 Cast and filtered based on documentation.
 * @param array $unfiltered_input  Associative array of site settings to be updated.
 *                                 Neither cast nor filtered. Contains raw input.
 * @return array
 */
function wpcom_lm_update_options_v1_api( $input, $unfiltered_input ) {
	if ( isset( $unfiltered_input['wpcom_locked_mode'] ) ) {
		$input['wpcom_locked_mode'] = (bool) $unfiltered_input['wpcom_locked_mode'];
	}

	return $input;
}
add_filter( 'rest_api_update_site_settings', 'wpcom_lm_update_options_v1_api', 10, 2 );

/**
 * Registers the settings section and fields.
 */
function wpcom_lm_settings_page_init() {
	if ( ! wpcom_site_has_feature( WPCOM_Features::LOCKED_MODE ) ) {
		return;
	}

	add_settings_section(
		'wpcom_enhanced_ownership_section',
		__( 'Enhanced Ownership', 'jetpack-mu-wpcom' ),
		'', // No callback needed.
		'general'
	);

	add_settings_field(
		'wpcom_locked_mode',
		__( 'Locked Mode', 'jetpack-mu-wpcom' ),
		'wpcom_locked_mode_render',
		'general',
		'wpcom_enhanced_ownership_section',
		array(
			'label_for' => 'wpcom_locked_mode',
		)
	);
}
add_action( 'admin_init', 'wpcom_lm_settings_page_init' );

/**
 * Renders the Locked Mode settings markup.
 */
function wpcom_locked_mode_render() {
	?>
	<input type="checkbox" id="wpcom_locked_mode" name="wpcom_locked_mode" <?php checked( get_option( 'wpcom_locked_mode' ) ); ?>>
	<label for="wpcom_locked_mode"><?php esc_html_e( 'Enable Locked Mode', 'jetpack-mu-wpcom' ); ?></label>
	<p class="description"><?php esc_html_e( 'Prevents new post and page from being created as well as existing posts and pages from being edited, and closes comments site wide.', 'jetpack-mu-wpcom' ); ?></p>
	<?php
}

/**
 * Removes post and page creation/editing capabilities for locked mode sites.
 *
 * @param array  $caps The user's capabilities.
 * @param string $cap  The capability name.
 * @return array
 */
function wpcom_lm_remove_post_capabilities( $caps, $cap ) {
	switch ( $cap ) {
		case 'edit_posts':
			if ( ! defined( 'REST_API_REQUEST' ) || ! REST_API_REQUEST ) {
				$caps = array( 'do_not_allow' );
				break;
			}

			// This is only called on REST API requests on sites that have the Locked Mode feature, where Locked Mode is enabled.
			$trace = debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS, 8 ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions

			// phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
			if ( isset( $trace[7]['class'] ) && 'WPCOM_JSON_API_Site_Settings_Endpoint' === $trace[7]['class'] && 'get_settings_response' === $trace[7]['function'] ) {
				/*
				 * This targets the edit_posts check in WPCOM_JSON_API_Site_Settings_Endpoint::get_settings_response().
				 * We still want to allow the endpoint to return the settings for the site, even if the site is in locked mode.
				 * So in this case we don't change the capabilities, for all other cases we do.
				 */
			} else {
				$caps = array( 'do_not_allow' );
			}
			break;

		case 'install_themes':
		case 'switch_themes':
		case 'edit_themes':
		case 'delete_themes':
		case 'edit_theme_options':
		case 'customize':
		case 'install_plugins':
		case 'activate_plugins':
		case 'edit_plugins':
		case 'delete_plugins':
		case 'edit_files':
		case 'upload_files':
		case 'edit_comment':
		case 'moderate_comments':
		case 'manage_categories':
		case 'manage_links':
		case 'import':
		case 'edit_others_posts':
		case 'edit_published_posts':
		case 'publish_posts':
		case 'delete_posts':
		case 'delete_others_posts':
		case 'delete_published_posts':
		case 'delete_private_posts':
		case 'edit_private_posts':
		case 'edit_pages':
		case 'edit_others_pages':
		case 'edit_published_pages':
		case 'publish_pages':
		case 'delete_pages':
		case 'delete_others_pages':
		case 'delete_published_pages':
		case 'delete_private_pages':
		case 'edit_private_pages':
		case 'create_users':
		case 'delete_users':
			$caps = array( 'do_not_allow' );
	}

	return $caps;
}

/**
 * Disables comments site-wide for locked mode sites.
 *
 * @param bool $comments_open Whether the current post is open for comments.
 */
function wpcom_lm_disable_comments( $comments_open ) {
	if ( wpcom_site_has_feature( WPCOM_Features::LOCKED_MODE ) && get_option( 'wpcom_locked_mode' ) ) {
		return false;
	}

	return $comments_open;
}
add_filter( 'comments_open', 'wpcom_lm_disable_comments' );

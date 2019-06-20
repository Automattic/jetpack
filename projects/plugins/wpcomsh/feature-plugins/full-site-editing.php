<?php
/**
 * Customizations for the Full Site Editing plugin.
 */

/**
 * Filters whether Starter Page Templates should be disabled.
 *
 * @param bool $should_disable Whether the feature should be disabled.
 * @return bool
 */
function wpcomsh_maybe_disable_spt( $should_disable ) {
	// `environment-id` is added to Gutenframe `iframe` query args
	// within the Calypso repo
	$is_horizon = ( ! empty( $_GET['environment-id'] ) && $_GET['environment-id'] === 'horizon' );

	// Disable outside Horizon
	if ( ! $is_horizon ) {
		return true;
	}

	$enabled_themes = [
		'business',
		'business-wpcom',
		'calm-business',
		'calm-business-wpcom',
		'elegant-business',
		'elegant-business-wpcom',
		'friendly-business',
		'friendly-business-wpcom',
		'modern-business',
		'modern-business-wpcom',
		'professional-business',
		'professional-business-wpcom',
		'sophisticated-business',
		'sophisticated-business-wpcom',
	];

	if ( ! in_array( get_stylesheet(), $enabled_themes, true ) ) {
		return true;
	}

	return $should_disable;
}
add_filter( 'a8c_disable_starter_page_templates', 'wpcomsh_maybe_disable_spt' );

// Disable until they're ready for prime time.
add_filter( 'a8c_disable_full_site_editing', '__return_true', 99 );

/**
 * Adds the tracking identity to config that is passed to Starter Page Template frontend.
 * That way we can publish our code to plugin directory sans tracking code.
 *
 * @param  array $config Config for the frontend
 * @return array The modified config
 */
function wpcom_fse_spt_add_tracking_identity_to_config( $config ) {
    // Load identity.
    $has_active_jetpack = ( class_exists('Jetpack') && Jetpack::is_active() );
    if ( $has_active_jetpack && class_exists( 'Jetpack_Tracks_Client' ) ) {
        $config['tracksUserData'] = Jetpack_Tracks_Client::get_connected_user_tracks_identity();
        // Enqueue tracks script.
        wp_enqueue_script(
            'jp-tracks',
            '//stats.wp.com/w.js',
            [],
            gmdate('YW'),
            true
        );
    }

    return $config;
}
add_filter( 'fse_starter_page_templates_config', 'wpcom_fse_spt_add_tracking_identity_to_config' );

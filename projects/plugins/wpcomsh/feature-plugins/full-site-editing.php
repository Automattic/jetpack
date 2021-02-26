<?php
/**
 * Customizations for the Full Site Editing plugin.
 */

/**
 * Disables Full Site Editing if the eligability option does not exist.
 *
 * @return bool true if FSE should be disabled, false if FSE should be enabled
 */
function wpcomsh_maybe_disable_fse() {
	// Always disable FSE if the site is not eligible:
	return ! get_option( 'a8c-fse-is-eligible' );
}
add_filter( 'a8c_disable_full_site_editing', 'wpcomsh_maybe_disable_fse' );

// Enable the navigation sidebar for all sites.
add_filter( 'a8c_enable_nav_sidebar', '__return_true' );

// Enable block patterns API.
add_filter( 'a8c_enable_block_patterns_api', '__return_true' );

/**
 * Enable coming soon for all sites
 */

add_filter( 'a8c_enable_public_coming_soon', '__return_true' );

/**
 * Returns Atomic persistent data value for wpcom_public_coming_soon when
 *
 * @return int The value of WPCOM_PUBLIC_COMING_SOON if set, otherwise the option value
 */
function wpcomsh_coming_soon_get_atomic_persistent_data( $wpcom_public_coming_soon ){
	$persistent_data = new Atomic_Persistent_Data();
	$persistent_data_coming_soon_value = $persistent_data->WPCOM_PUBLIC_COMING_SOON;

	if ( $persistent_data_coming_soon_value !== null ) {
		return $persistent_data_coming_soon_value;
	}

	return $wpcom_public_coming_soon;
}

add_filter( 'option_wpcom_public_coming_soon', 'wpcomsh_coming_soon_get_atomic_persistent_data' );

/**
 * Adds the tracking identity to config that is passed to Starter Page Template frontend.
 * That way we can publish our code to plugin directory sans tracking code.
 *
 * @param  array $config Config for the frontend
 * @return array The modified config
 */
function wpcom_fse_spt_add_tracking_identity_to_config( $config ) {
	// Load identity.
	$has_active_jetpack = ( class_exists( 'Jetpack' ) && Jetpack::is_active() );
	if ( $has_active_jetpack && class_exists( 'Jetpack_Tracks_Client' ) ) {
		$config['tracksUserData'] = Jetpack_Tracks_Client::get_connected_user_tracks_identity();
		// Enqueue tracks script.
		wp_enqueue_script(
			'jp-tracks',
			'//stats.wp.com/w.js',
			[],
			gmdate( 'YW' ),
			true
		);
	}

	return $config;
}
add_filter( 'fse_starter_page_templates_config', 'wpcom_fse_spt_add_tracking_identity_to_config' );

/**
 * Adds site meta data for Gutenberg Tracking.
 *
 * @see https://github.com/Automattic/wp-calypso/pull/34655
 */
function wpcom_fse_global_editors_script() {
	if ( ! class_exists( 'Jetpack' ) || ! class_exists( 'Jetpack_Options' ) || ! Jetpack::is_active() ) {
		return;
	}

	$script = sprintf( 'var _currentSiteId=%d,_currentSiteType="atomic";', (int) Jetpack_Options::get_option( 'id' ) );

	wp_add_inline_script( 'editor', $script, 'before' );
	wp_add_inline_script( 'wp-list-reusable-blocks', $script );
}
add_action( 'admin_enqueue_scripts', 'wpcom_fse_global_editors_script' );

/**
 * Enable site launch on editor
 */
function wpcom_editor_site_launch()
{
	// Temporarily disable launch.
	return false;

	// If site is already launched, skip.
	if ( \Private_Site\is_launched() ) {
		return false;
	}

	// Get site creation flow (currently unused)
	// $site_creation_flow = get_option( 'site_creation_flow' );

	// Get site slug & launch url
	$blog_id    = get_current_blog_id();
	$site_url   = get_home_url( $blog_id );
	$site_slug  = wp_parse_url( $site_url, PHP_URL_HOST );
	$launch_url = 'https://wordpress.com/start/launch-site?siteSlug=' . $site_slug;

	// Prepare site launch options
	$site_launch_options = [
		'site_slug'        => $site_slug,
		'launch_url'       => $launch_url,
		'launch_flow'      => 'launch-site',
		'is_gutenboarding' => false,
		'anchor_podcast'   => false,
	];

	return $site_launch_options;
}
add_filter( 'a8c_enable_editor_site_launch', 'wpcom_editor_site_launch' );

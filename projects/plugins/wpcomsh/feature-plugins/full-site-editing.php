<?php
/**
 * Customizations for the Full Site Editing plugin.
 *
 * @package wpcomsh
 */

/**
 * Disables Full Site Editing if the eligability option does not exist.
 *
 * @return bool true if FSE should be disabled, false if FSE should be enabled
 */
function wpcomsh_maybe_disable_fse() {
	// Always disable FSE if the site is not eligible.
	return ! get_option( 'a8c-fse-is-eligible' );
}
add_filter( 'a8c_disable_full_site_editing', 'wpcomsh_maybe_disable_fse' );

// Enable block patterns API.
add_filter( 'a8c_enable_block_patterns_api', '__return_true' );

/**
 * Enable coming soon for all sites.
 */
add_filter( 'a8c_enable_public_coming_soon', '__return_true' );

/**
 * Returns Atomic persistent data value for wpcom_public_coming_soon.
 *
 * @param string $wpcom_public_coming_soon Value for the coming soon option.
 *
 * @return string The value of WPCOM_PUBLIC_COMING_SOON if set, otherwise the option value.
 */
function wpcomsh_coming_soon_get_atomic_persistent_data( $wpcom_public_coming_soon ) {
	$persistent_data                   = new Atomic_Persistent_Data();
	$persistent_data_coming_soon_value = $persistent_data->WPCOM_PUBLIC_COMING_SOON; // phpcs:ignore WordPress.NamingConventions.ValidVariableName

	if ( $persistent_data_coming_soon_value !== null ) {
		return $persistent_data_coming_soon_value;
	}

	return $wpcom_public_coming_soon;
}
add_filter( 'option_wpcom_public_coming_soon', 'wpcomsh_coming_soon_get_atomic_persistent_data' );

/**
 * Returns Atomic persistent data value for wpcom_public_preview_links.
 *
 * @param string $wpcom_public_preview_links Value for the preview links option.
 *
 * @return string The value of WPCOM_PUBLIC_PREVIEW_LINKS if set, otherwise the option value.
 */
function wpcomsh_public_preview_links_get_atomic_persistent_data( $wpcom_public_preview_links ) {
	$persistent_data                            = new Atomic_Persistent_Data();
	$persistent_data_public_preview_links_value = $persistent_data->WPCOM_PUBLIC_PREVIEW_LINKS; // phpcs:ignore WordPress.NamingConventions.ValidVariableName

	if ( $persistent_data_public_preview_links_value !== null ) {
		return json_decode( $persistent_data_public_preview_links_value );
	}

	return $wpcom_public_preview_links;
}
// need to hook to default_option_* too because if this option doesn't exist, the hook wouldn't run.
add_filter( 'default_option_wpcom_public_preview_links', 'wpcomsh_public_preview_links_get_atomic_persistent_data' );
add_filter( 'option_wpcom_public_preview_links', 'wpcomsh_public_preview_links_get_atomic_persistent_data' );

/**
 * Replaces the Yoast SEO error notice from that warns of SEO issues
 * when the site is in Coming Soon mode,
 * or when search engines are discouraged from indexing the site.
 *
 * @return void
 */
function wpcom_public_coming_soon_replace_yoast_seo_notice() {
	$wpseo_options = get_option( 'wpseo', false );
	if ( ! $wpseo_options ) {
		// Do nothing if Yoast is not installed.
		return;
	}

	$is_wpcom_public_coming_soon_enabled = 1 === (int) get_option( 'wpcom_public_coming_soon', 0 );
	$are_search_engines_discouraged      = 0 === (int) get_option( 'blog_public' );

	/*
	 * The Yoast SEO notice should be replaced either if the site is in Coming Soon mode or
	 * if indexing is discouraged, on the site.
	 */
	$should_replace_yoast_notice = $are_search_engines_discouraged || $is_wpcom_public_coming_soon_enabled;

	if ( $should_replace_yoast_notice && ! $wpseo_options['ignore_search_engines_discouraged_notice'] ) {
		// Hide the Yoast SEO notice if it's not hidden and the site is set to Coming Soon mode.
		$wpseo_options['ignore_search_engines_discouraged_notice'] = true;
		update_option( 'wpseo', $wpseo_options );
	}

	if ( ! $should_replace_yoast_notice && $wpseo_options['ignore_search_engines_discouraged_notice'] ) {
		// Restore the default setting if Coming Soon mode is disabled.
		$wpseo_options['ignore_search_engines_discouraged_notice'] = false;
		update_option( 'wpseo', $wpseo_options );
	}

	$pagenow             = $GLOBALS['pagenow'];
	$on_wpseo_admin_page = $pagenow === 'admin.php' && strpos( filter_input( INPUT_GET, 'page' ), 'wpseo' ) === 0;
	$notice_pages        = array(
		'index.php',
		'plugins.php',
		'update-core.php',
	);

	// Only show the notice on certain admin pages and Yoast SEO admin pages.
	if (
		$should_replace_yoast_notice
		&& $wpseo_options['ignore_search_engines_discouraged_notice'] == true // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
		&& ( $on_wpseo_admin_page || in_array( $pagenow, $notice_pages, true ) )
	) {
		// Get site slug & settings url.
		$blog_id      = get_current_blog_id();
		$site_url     = get_home_url( $blog_id );
		$site_slug    = wp_parse_url( $site_url, PHP_URL_HOST );
		$settings_url = 'https://wordpress.com/settings/general/' . $site_slug . '#site-privacy-settings';

		if ( $is_wpcom_public_coming_soon_enabled ) {
			/* translators: 1: opening anchor tag; 2: closing anchor tag. */
			$text = __( 'Heads up! Your site is currently in Coming Soon mode. If you want search engines to show this site in their search results you have to launch your site. %1$sClick here%2$s to change your site\'s privacy settings.', 'wpcomsh' );
		} else {
			/* translators: 1: opening anchor tag; 2: closing anchor tag. */
			$text = __( 'Heads up! Search engines are currently discouraged from indexing your site. If you want search engines to show this site in their search results you have to launch your site. %1$sClick here%2$s to change your site\'s privacy settings.', 'wpcomsh' );
		}

		printf(
			'<div class="notice notice-info is-dismissible"><p><strong>' . esc_html( $text ) . '</strong></p></div>',
			'<a href="' . esc_url( $settings_url ) . '">',
			'</a>'
		);
	}
}
add_action( 'admin_notices', 'wpcom_public_coming_soon_replace_yoast_seo_notice' );

/**
 * Adds the tracking identity to config that is passed to Starter Page Template frontend.
 * That way we can publish our code to plugin directory sans tracking code.
 *
 * @param  array $config Config for the frontend.
 * @return array The modified config.
 */
function wpcom_fse_spt_add_tracking_identity_to_config( $config ) {
	// Load identity.
	$has_active_jetpack = ( class_exists( 'Jetpack' ) && Jetpack::is_connection_ready() );
	if ( $has_active_jetpack && class_exists( 'Jetpack_Tracks_Client' ) ) {
		$config['tracksUserData'] = Jetpack_Tracks_Client::get_connected_user_tracks_identity();
		// Enqueue tracks script.
		wp_enqueue_script(
			'jp-tracks',
			'//stats.wp.com/w.js',
			array(),
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
	if ( ! class_exists( 'Jetpack' ) || ! class_exists( 'Jetpack_Options' ) || ! Jetpack::is_connection_ready() ) {
		return;
	}

	$script = sprintf( 'var _currentSiteId=%d,_currentSiteType="atomic";', (int) Jetpack_Options::get_option( 'id' ) );

	wp_add_inline_script( 'editor', $script, 'before' );
	wp_add_inline_script( 'wp-list-reusable-blocks', $script );
}
add_action( 'admin_enqueue_scripts', 'wpcom_fse_global_editors_script' );

/**
 * This function hooks into the action that is dispatched when changes to the Global Styles of site are made.
 *
 * @param string $message The message that will be logged.
 *
 * @return void
 */
function logstash_log_global_styles( $message ) {
	// We sample the logs so that we only send 1 in 100 logs. We don't treat proxied requests in any special way.
	if ( time() % 100 !== 0 ) {
		return;
	}

	// This data has the format that's expected by the logstash endpoint.
	$data = wp_json_encode(
		array(
			'feature' => 'atomic_global_styles_gate',
			'message' => $message,
			'extra'   => array(
				'trace'          => ( new Exception() )->getTraceAsString(),
				'atomic_site_id' => wpcomsh_get_atomic_site_id(),
			),
		)
	);

	// We FAF the call to the logging endpoint.
	wp_remote_post( 'https://public-api.wordpress.com/rest/v1.1/logstash', array( 'body' => array( 'params' => $data ) ) );
}
add_action( 'global_styles_log', 'logstash_log_global_styles' );

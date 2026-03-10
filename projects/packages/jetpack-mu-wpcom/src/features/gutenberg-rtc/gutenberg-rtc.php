<?php
/**
 * Gutenberg RTC (Real-Time Collaboration) customizations
 * This handles RTC-related configurations for the Gutenberg editor on JP sites.
 *
 * Currently disables HTTP polling to prevent issues, but can be extended
 * in the future for other RTC-related customizations.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Determines whether Gutenberg RTC is enabled.
 *
 * Disabled by default until the PingHub provider is ready
 * and we are confident in proceeding with the rollout.
 */
function wpcom_is_gutenberg_rtc_enabled() {
	return apply_filters( 'wpcom_is_gutenberg_rtc_enabled', false );
}

/**
 * Get WPCOM RTC providers.
 */
function wpcom_get_gutenberg_rtc_providers() {
	if ( ! wpcom_is_gutenberg_rtc_enabled() ) {
		return array();
	}

	$allowed_providers = array( 'http-polling', 'pinghub' );
	$providers         = apply_filters( 'wpcom_gutenberg_rtc_providers', array( 'pinghub' ) );
	if ( ! is_array( $providers ) ) {
		return array();
	}

	return array_values(
		array_filter(
			$providers,
			function ( $provider ) use ( $allowed_providers ) {
				return in_array( $provider, $allowed_providers, true );
			}
		)
	);
}

/**
 * Enqueue block editor assets for Gutenberg RTC customizations.
 */
function wpcom_enqueue_gutenberg_rtc_assets() {
	$providers = wpcom_get_gutenberg_rtc_providers();

	// If HTTP polling (Gutenberg’s built-in default provider when this script isn’t enqueued)
	// is the only provider being used, then we don’t need to inject any assets since that’s
	// already the default behavior.
	if ( count( $providers ) === 1 && in_array( 'http-polling', $providers, true ) ) {
		return;
	}

	$handle = jetpack_mu_wpcom_enqueue_calypso_app( 'wpcom-gutenberg-rtc' );
	if ( ! $handle ) {
		return;
	}

	$data = wp_json_encode(
		array(
			'providers' => wpcom_get_gutenberg_rtc_providers(),
		),
		JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
	);

	wp_add_inline_script(
		$handle,
		"var wpcomGutenbergRTC = $data;",
		'before'
	);
}
add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_gutenberg_rtc_assets' );

/**
 * Unregister the RTC setting field, Collaboration, on the Writing page if there are no RTC providers.
 */
function wpcom_unregister_rtc_setting() {
	global $wp_settings_fields;

	$providers   = wpcom_get_gutenberg_rtc_providers();
	$option_name = 'wp_enable_real_time_collaboration';
	if ( isset( $wp_settings_fields['writing']['default'][ $option_name ] ) && count( $providers ) === 0 ) {
		unset( $wp_settings_fields['writing']['default'][ $option_name ] );
	}

	// TODO: Clean up the old name. See https://github.com/WordPress/gutenberg/pull/75837.
	$option_name = 'enable_real_time_collaboration';
	if ( isset( $wp_settings_fields['writing']['default'][ $option_name ] ) && count( $providers ) === 0 ) {
		unset( $wp_settings_fields['writing']['default'][ $option_name ] );
	}
}
add_action( 'admin_init', 'wpcom_unregister_rtc_setting', 11 );

/**
 * Disable the `wp_enable_real_time_collaboration` option if there are no RTC providers.
 *
 * @param mixed $pre_option The value to return instead of the option value.
 * @return string|false Filtered wp_enable_real_time_collaboration option
 */
function wpcom_disable_rtc_option( $pre_option ) {
	$providers = wpcom_get_gutenberg_rtc_providers();
	if ( count( $providers ) === 0 ) {
		return '0';
	}

	return $pre_option;
}
add_filter( 'pre_option_wp_enable_real_time_collaboration', 'wpcom_disable_rtc_option' );
add_filter( 'pre_option_enable_real_time_collaboration', 'wpcom_disable_rtc_option' ); // TODO: Clean up the old name. See https://github.com/WordPress/gutenberg/pull/75837.

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
	$is_enabled = false;
	if ( function_exists( 'wpcom_site_has_feature' ) && class_exists( 'WPCOM_Features' ) ) {
		$blog_id    = get_wpcom_blog_id();
		$is_enabled = wpcom_site_has_feature( WPCOM_Features::REAL_TIME_COLLABORATION, $blog_id );
	}

	return apply_filters( 'wpcom_is_gutenberg_rtc_enabled', $is_enabled );
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
 * Generate a short-lived JWT for authenticating PingHub WebSocket connections.
 *
 * On simple WordPress.com sites sign_JWT() is called directly — the REST
 * endpoint files are not loaded in the admin context so rest_do_request
 * cannot be used. On Jetpack/Atomic sites it is fetched from the WPCOM API
 * over the Jetpack connection.
 *
 * @return string|null Signed JWT, or null on failure.
 */
function wpcom_gutenberg_rtc_get_pinghub_jwt() {
	$user_id = get_current_user_id();
	$blog_id = get_wpcom_blog_id();

	if ( ! $user_id || ! $blog_id ) {
		return null;
	}

	// Simple WordPress.com sites: use the internal REST endpoint.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$request  = new \WP_REST_Request( 'POST', "/wpcom/v2/sites/$blog_id/jetpack-pinghub/jwt/sign" );
		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			return null;
		}

		$data = $response->get_data();
		return isset( $data['jwt'] ) ? $data['jwt'] : null;
	}

	// Jetpack/Atomic: call the WPCOM endpoint over the Jetpack connection.
	if ( ! class_exists( 'Automattic\Jetpack\Connection\Client' ) ) {
		return null;
	}

	$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
		"/sites/$blog_id/jetpack-pinghub/jwt/sign",
		'2',
		array( 'method' => 'POST' )
	);

	if ( is_wp_error( $response ) ) {
		return null;
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );
	return $body['jwt'] ?? null;
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

	$handle = jetpack_mu_wpcom_enqueue_assets( 'gutenberg-rtc', array( 'js' ) );

	$data = wp_json_encode(
		array(
			'providers'       => wpcom_get_gutenberg_rtc_providers(),
			// TODO: We need the endpoint on Jetpack site for client to refresh the token per hour.
			'pinghubJWTToken' => wpcom_gutenberg_rtc_get_pinghub_jwt(),
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

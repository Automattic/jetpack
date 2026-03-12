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
	if ( function_exists( 'wpcom_site_has_feature' ) && class_exists( 'WPCOM_Features' ) && defined( 'WPCOM_Features::REAL_TIME_COLLABORATION' ) ) {
		$blog_id    = get_wpcom_blog_id();
		$is_enabled = wpcom_site_has_feature( WPCOM_Features::REAL_TIME_COLLABORATION, $blog_id );
	}

	return apply_filters( 'wpcom_is_gutenberg_rtc_enabled', $is_enabled );
}

/**
 * Determine if HTTP polling should be enforced for the current blog.
 *
 * @return bool True if HTTP polling should be enforced for the current blog, false otherwise.
 */
function should_enforce_http_polling_for_blog() {
	$blog_id = get_wpcom_blog_id();

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC && ( $blog_id % 100 === 1 ) ) {
		return true;
	}
	return false;
}

/**
 * Get WPCOM RTC providers.
 */
function wpcom_get_gutenberg_rtc_providers() {
	if ( should_enforce_http_polling_for_blog() ) {
		return array( 'http-polling' );
	}

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
 * Register the Gutenberg RTC REST endpoint.
 */
add_action(
	'rest_api_init',
	function () {
		$providers = wpcom_get_gutenberg_rtc_providers();
		if ( ! in_array( 'pinghub', $providers, true ) ) {
			return;
		}

		require_once __DIR__ . '/class-wp-rest-gutenberg-rtc.php';
		( new WP_REST_Gutenberg_RTC() )->register_routes();
	}
);

/**
 * Enqueue block editor assets for Gutenberg RTC customizations.
 */
function wpcom_enqueue_gutenberg_rtc_assets() {
	$handle = jetpack_mu_wpcom_enqueue_assets( 'gutenberg-rtc', array( 'js' ) );

	$data = wp_json_encode(
		array(
			'providers'         => wpcom_get_gutenberg_rtc_providers(),
			'maxPeersPerRoom'   => wpcom_get_gutenberg_rtc_max_peers_per_room(),
			'maxClientsPerUser' => wpcom_get_gutenberg_rtc_max_clients_per_user(),
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
 * Get the maximum number of peers allowed per room.
 *
 * @return int Max peers per room.
 */
function wpcom_get_gutenberg_rtc_max_peers_per_room() {
	return (int) apply_filters( 'wpcom_gutenberg_rtc_max_peers_per_room', 2 );
}

/**
 * Get the maximum number of clients (tabs) allowed per user in a room.
 *
 * @return int Max clients per user.
 */
function wpcom_get_gutenberg_rtc_max_clients_per_user() {
	return (int) apply_filters( 'wpcom_gutenberg_rtc_max_clients_per_user', 2 );
}

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
 * When there are no providers, always force the option off.
 * When there are providers, respect the stored option value.
 *
 * @param mixed $value  The value of the option.
 * @return mixed
 */
function wpcom_filter_rtc_option( $value ) {
	$providers = wpcom_get_gutenberg_rtc_providers();
	// No providers: force the option off, regardless of what's in the DB.
	if ( count( $providers ) === 0 ) {
		return '0';
	}
	// Providers exist: respect whatever is stored.
	return $value;
}
add_filter( 'option_wp_enable_real_time_collaboration', 'wpcom_filter_rtc_option', 10 );
add_filter( 'option_enable_real_time_collaboration', 'wpcom_filter_rtc_option', 10 ); // Old name.
/**
 * When there ARE providers and the option is NOT stored yet,
 * default the option to enabled (1).
 *
 * @return mixed
 */
function wpcom_default_rtc_option() {
	$providers = wpcom_get_gutenberg_rtc_providers();
	// No providers: keep default disabled.
	if ( count( $providers ) === 0 ) {
		return '0';
	}
	// Providers exist and option is not stored yet → default to enabled.
	return '1';
}
add_filter( 'default_option_wp_enable_real_time_collaboration', 'wpcom_default_rtc_option', 20 );
add_filter( 'default_option_enable_real_time_collaboration', 'wpcom_default_rtc_option', 20 );

/**
 * Override the default for the Gutenberg RTC setting so that
 * when providers exist, it defaults to enabled in the UI.
 */
function wpcom_override_rtc_setting_default() {
	$providers   = wpcom_get_gutenberg_rtc_providers();
	$option_name = 'wp_enable_real_time_collaboration';

	// Ensure the Gutenberg setting is unregistered first.
	unregister_setting( 'writing', $option_name );

	register_setting(
		'writing',
		$option_name,
		array(
			'type'              => 'boolean',
			'description'       => __( 'Enable Real-Time Collaboration', 'jetpack-mu-wpcom' ),
			'sanitize_callback' => 'rest_sanitize_boolean',
			// Dynamic default: true when providers exist, false otherwise.
			'default'           => count( $providers ) > 0,
			'show_in_rest'      => true,
		)
	);
}
// Run after Gutenberg's own registration (default priority 10).
add_action( 'admin_init', 'wpcom_override_rtc_setting_default', 20 );

/**
 * Get the maximum number of simultaneous RTC collaborators allowed per room.
 *
 * @return int Maximum collaborator count. 0 means unlimited.
 */
function wpcom_rtc_get_max_collaborators() {
	return (int) apply_filters( 'wpcom_rtc_max_collaborators', 2 );
}

/**
 * Limit the number of simultaneous RTC collaborators per room.
 *
 * Hooks into `rest_pre_dispatch` to check the current awareness state before
 * allowing a new client to join a sync room. If the number of active
 * collaborators (excluding the requesting client) meets or exceeds the limit,
 * a 429 error is returned.
 *
 * @param mixed           $result  Response to replace the requested version with. Can be anything
 *                                 a normal endpoint can return, or null to not hijack the request.
 * @param WP_REST_Server  $server  Server instance.
 * @param WP_REST_Request $request Request used to generate the response.
 * @return mixed|WP_Error Original result or WP_Error if limit exceeded.
 */
function wpcom_rtc_limit_collaborators( $result, $server, $request ) {
	if ( null !== $result ) {
		return $result;
	}

	$route = $request->get_route();
	if ( '/wp-sync/v1/updates' !== $route ) {
		return $result;
	}

	// Only enforce for HTTP polling ramp-up sites; PingHub handles its own limits.
	if ( ! should_enforce_http_polling_for_blog() ) {
		return $result;
	}

	$max_collaborators = wpcom_rtc_get_max_collaborators();
	if ( $max_collaborators <= 0 ) {
		return $result;
	}

	if ( ! class_exists( 'WP_Sync_Post_Meta_Storage' ) ) {
		return $result;
	}

	$rooms = $request['rooms'];
	if ( ! is_array( $rooms ) ) {
		return $result;
	}

	$storage = new WP_Sync_Post_Meta_Storage(); // @phan-suppress-current-line PhanUndeclaredClassMethod -- Guarded by class_exists() above.
	$now     = time();

	foreach ( $rooms as $room_request ) {
		$room      = $room_request['room'] ?? '';
		$client_id = $room_request['client_id'] ?? 0;

		$existing = $storage->get_awareness_state( $room ); // @phan-suppress-current-line PhanUndeclaredClassMethod
		$active   = array_filter(
			$existing,
			function ( $entry ) use ( $client_id, $now ) {
				// Exclude the current client (reconnection case).
				if ( $entry['client_id'] === $client_id ) {
					return false;
				}
				// Only count clients within the awareness timeout (30s).
				return ( $now - $entry['updated_at'] ) < 30;
			}
		);

		if ( count( $active ) >= $max_collaborators ) {
			return new WP_Error(
				'rest_sync_connection_limit_exceeded',
				__( 'Too many editors connected.', 'jetpack-mu-wpcom' ),
				array( 'status' => 429 )
			);
		}
	}

	return $result;
}
add_filter( 'rest_pre_dispatch', 'wpcom_rtc_limit_collaborators', 10, 3 );

<?php
/**
 * Plugin Name: Jetpack E2E Admin Shell
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Sets up the unconnected e2e site for the admin shell suite. Only that suite activates it.
 *
 * @package automattic/jetpack
 */

// The shell-off run sets this option, so the two runs differ only by the flag.
if ( ! get_option( 'e2e_admin_shell_off' ) ) {
	add_filter( 'jetpack_feature_flag_enabled_jetpack-admin-shell', '__return_true' );
}

// Most members need a connection: keep Jetpack out of localhost's offline mode and stub one on activation.
add_filter( 'jetpack_offline_mode', '__return_false', 99 );

register_activation_hook(
	__FILE__,
	function () {
		$admins = get_users(
			array(
				'role'    => 'administrator',
				'orderby' => 'ID',
				'number'  => 1,
				'fields'  => 'ID',
			)
		);
		$owner  = (int) reset( $admins );
		Jetpack_Options::update_options(
			array(
				'id'          => 123456789,
				'blog_token'  => 'e2e.blog',
				'user_tokens' => array( $owner => "e2e.user.$owner" ),
				'master_user' => $owner,
			)
		);
	}
);

register_deactivation_hook(
	__FILE__,
	function () {
		Jetpack_Options::delete_option( array( 'id', 'blog_token', 'user_tokens', 'master_user' ) );
		delete_option( 'e2e_admin_shell_off' );
	}
);

// The stubbed tokens can't sign requests, so fail WordPress.com calls at once instead of waiting on them.
add_filter(
	'pre_http_request',
	function ( $response, $args, $url ) {
		$host = (string) wp_parse_url( $url, PHP_URL_HOST );
		if ( preg_match( '/(^|\.)(wordpress|wp)\.com$/', $host ) ) { // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Hostname pattern.
			return new WP_Error( 'e2e_admin_shell_offline', 'WordPress.com is unreachable from the admin shell e2e site.' );
		}
		return $response;
	},
	10,
	3
);

/*
 * A menu hover fetches the hovered dashboard's guest data, which must save nothing: the dashboard's own
 * page load does that. Log every option and user meta write made while serving that request.
 */
const E2E_ADMIN_SHELL_GUEST_WRITES = 'e2e_admin_shell_guest_writes_';

// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Compared only; the shell checks the nonce.
if ( wp_doing_ajax() && isset( $_GET['action'] ) && 'jetpack_admin_shell_guest' === wp_unslash( $_GET['action'] ) ) {
	$e2e_admin_shell_writes = array();
	$e2e_admin_shell_log    = static function ( $key ) use ( &$e2e_admin_shell_writes ) {
		// Transients are caches that expire on their own; `cron` is rescheduled by whichever request spawns cron.
		if ( ! preg_match( '/^option:(_site)?_transient_/', $key ) && 'option:cron' !== $key ) {
			$e2e_admin_shell_writes[] = $key;
		}
	};
	foreach ( array( 'added_option', 'updated_option', 'deleted_option' ) as $e2e_admin_shell_hook ) {
		add_action(
			$e2e_admin_shell_hook,
			static function ( $option ) use ( $e2e_admin_shell_log ) {
				$e2e_admin_shell_log( "option:$option" );
			}
		);
	}
	foreach ( array( 'added_user_meta', 'updated_user_meta', 'deleted_user_meta' ) as $e2e_admin_shell_hook ) {
		add_action(
			$e2e_admin_shell_hook,
			static function ( $meta_id, $user_id, $meta_key ) use ( $e2e_admin_shell_log ) {
				$e2e_admin_shell_log( "user_meta:$meta_key" );
			},
			10,
			3
		);
	}
	add_action(
		'shutdown',
		static function () use ( &$e2e_admin_shell_writes ) {
			if ( ! $e2e_admin_shell_writes ) {
				return;
			}
			// One row per request, so parallel hovers can't overwrite each other's log.
			add_option(
				E2E_ADMIN_SHELL_GUEST_WRITES . wp_generate_uuid4(),
				array(
					// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Logged only.
					'member' => isset( $_GET['member'] ) ? sanitize_key( wp_unslash( $_GET['member'] ) ) : '',
					'writes' => array_values( array_unique( $e2e_admin_shell_writes ) ),
				),
				'',
				false
			);
		},
		PHP_INT_MAX
	);
}

/*
 * The hover test reads that log here. With `reset=1` it also clears the log and the values earlier hover
 * bugs saved, so a rerun on the same site can catch them again.
 */
add_action(
	'wp_ajax_e2e_admin_shell_guest_writes',
	static function () {
		global $wpdb;
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( null, 403, JSON_UNESCAPED_SLASHES );
		}
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Test-only lookup by prefix.
		$names = $wpdb->get_col( $wpdb->prepare( "SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s", $wpdb->esc_like( E2E_ADMIN_SHELL_GUEST_WRITES ) . '%' ) );
		$log   = array_map( 'get_option', $names );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Test-only, admins only.
		if ( ! empty( $_GET['reset'] ) ) {
			foreach ( $names as $name ) {
				delete_option( $name );
			}
			// What the Forms hover bug saved. Settings' hover writes need WordPress.com answers this site never gets.
			delete_option( 'jetpack_forms_classic_state' );
		}
		wp_send_json_success( $log, 200, JSON_UNESCAPED_SLASHES );
	}
);

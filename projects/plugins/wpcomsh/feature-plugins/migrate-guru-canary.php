<?php
/**
 * This code is used to signal WPCOM that a migration using Migrate Guru has started.
 *
 * @package wpcomsh
 */

add_action( 'muplugins_loaded', 'wpcomsh_check_for_migrate_guru_request_params', 0, 0 );

/**
 * Check for Migrate Guru request parameters and enqueue a function on
 * shutdown to signal WPCOM that a migration has started. It's enqueued on shutdown
 * because when Migrate Guru starts a migration it might exit the process early, and
 * we can't call it directly from this function since we still need some functions
 * to be loaded at this point.
 */
function wpcomsh_check_for_migrate_guru_request_params() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	$is_migrate_guru_migration_start_request =
		isset( $_SERVER['REQUEST_METHOD'] ) &&
		$_SERVER['REQUEST_METHOD'] === 'POST' &&
		isset( $_REQUEST['bvplugname'] ) &&
		$_REQUEST['bvplugname'] === 'migrateguru' &&
		isset( $_REQUEST['wing'] ) &&
		$_REQUEST['wing'] === 'fswrt' &&
		isset( $_REQUEST['bvMethod'] ) &&
		$_REQUEST['bvMethod'] === 'wrtfle';
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	if ( ! $is_migrate_guru_migration_start_request ) {
		return;
	}

	$active_migration_start_time = get_transient( 'wpcomsh_migrate_guru_migration_start_time' );
	if ( is_int( $active_migration_start_time ) ) {
		// We already have an active migration, so nothing further needed.
		wpcomsh_migrate_guru_log( "Migration detected, not calling WPCOM since there's already an ongoing request" );
		return;
	}

	// Set the transient for 60 seconds so we don't trigger another request for the next minute.
	set_transient( 'wpcomsh_migrate_guru_migration_start_time', time(), 60 );

	wpcomsh_migrate_guru_log( 'Migration detected, registering shutdown function' );

	register_shutdown_function( 'wpcomsh_migrate_guru_migration_started' );
}

/**
 * Logs to error_log if filter wpcomsh_migrate_guru_logging_enabled is true.
 *
 * @param string $message The message to log.
 */
function wpcomsh_migrate_guru_log( $message ) {
	$logging_enabled = apply_filters( 'wpcomsh_migrate_guru_logging_enabled', false );
	if ( $logging_enabled ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'wpcomsh_migrate_guru_migration: ' . $message );
	}
}

/**
 * Signal WPCOM that a migration using Migrate Guru has started. This function is enqueued on
 * shutdown.
 */
function wpcomsh_migrate_guru_migration_started() {
	wpcomsh_migrate_guru_log( 'Calling WPCOM to signal a migration has started' );

	include_once WP_CONTENT_DIR . '/../__wp__/wp-includes/pluggable.php';
	include_once WP_PLUGIN_DIR . '/jetpack/jetpack.php';

	$wpcom_blog_id = _wpcom_get_current_blog_id();
	$endpoint      = sprintf( '/sites/%s/atomic-migration-status', $wpcom_blog_id );
	$response      = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
		$endpoint,
		'v2',
		array( 'method' => 'POST' ),
		array(
			'status'         => 'started',
			'migration_type' => 'migrate-guru',
		),
		'wpcom'
	);

	if ( 200 !== $response['response']['code'] || empty( $response['body'] ) ) {
		wpcomsh_migrate_guru_log( 'WPCOM call failed' );
		return;
	}

	wpcomsh_migrate_guru_log( 'WPCOM call successful' );
}

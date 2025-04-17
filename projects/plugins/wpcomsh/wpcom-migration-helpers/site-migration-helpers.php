<?php
/**
 * Migration helper functions.
 *
 * @package wpcom-migration-helpers
 */

/**
 * Checks if there's an active site migration happening for the current site.
 *
 * The current site is the destination site for the migration.
 *
 * @return bool
 */
function wpcomsh_is_migration_in_progress() {
	return get_option( 'wpcomsh_site_migration_status', false ) === '1';
}

/**
 * Redirect the user to Calypso's Migrate status page if there's an active migration.
 *
 * This is a lock on `WP-Admin` to prevent users losing changes if they change something
 * that will get overwritten after the restore.
 */
function wpcomsh_redirect_if_active_migration() {
	if ( wpcomsh_is_migration_in_progress() && ! wp_doing_ajax() ) {
		$redirect_url = 'https://wordpress.com/migrate/' . str_replace(
			'/',
			'::',
			str_replace(
				array(
					'https://',
					'http://',
				),
				'',
				untrailingslashit( site_url( '/' ) )
			)
		);

		wp_safe_redirect( $redirect_url, 302 );
		exit( 0 );
	}
}
add_action( 'admin_init', 'wpcomsh_redirect_if_active_migration' );

/**
 * Allow setting the `site_migration_status` from WPCOM to the target site through Jetpack.
 *
 * @param array $options List of allowed Jetpack options.
 *
 * @return array
 */
function wpcomsh_allow_migration_option( $options ) {
	// For storing AT options.
	$options[] = 'wpcomsh_site_migration_status';

	return $options;
}

add_filter( 'jetpack_options_whitelist', 'wpcomsh_allow_migration_option' );

/**
 * Logs the start and end of an AIOWP migration import and any errors that occur during the import.
 */
function aiowp_migration_logging_helper() {
	if ( ! class_exists( 'Ai1wm_Main_Controller' ) ) {
		return;
	}

	$target_blog_id = _wpcom_get_current_blog_id();

	// Filter that gets called when import starts
	add_filter(
		'ai1wm_import',
		function ( $params = array() ) use ( $target_blog_id ) {
			wpcomsh_record_tracks_event(
				'wpcom_import_start',
				array(
					'migration_tool' => 'aiowp',
					'target_blog_id' => $target_blog_id,
				)
			);
			return $params;
		},
		10
	);

	// Filter that gets called when import finishes or is cancelled by the user
	add_filter(
		'ai1wm_import',
		function ( $params = array() ) use ( $target_blog_id ) {
			wpcomsh_record_tracks_event(
				'wpcom_import_done',
				array(
					'migration_tool' => 'aiowp',
					'target_blog_id' => $target_blog_id,
				)
			);
			return $params;
		},
		400
	);

	// Filter that gets called when an import fails
	add_filter(
		'ai1wm_notification_error_toggle',
		function ( $should_notify ) {
			do_action(
				'wpcomsh_log',
				'There was an error with the AIOWP Migration.'
			);
			return $should_notify;
		},
		9
	);
}
add_action( 'plugins_loaded', 'aiowp_migration_logging_helper', 10 );

/**
 * Helper function that registers a filter that listens for the AIOWP migration completed event.
 * Once detected, it will trigger a call to an endpoint on WPCOM to run the corresponding cleanup jobs.
 */
function aiowp_migration_status_helper() {
	if ( ! class_exists( 'Ai1wm_Main_Controller' ) ) {
		return;
	}

	$wpcom_blog_id             = Jetpack_Options::get_option( 'id' );
	$wpcom_blog_id_backup_file = WP_CONTENT_DIR . '/uploads/blog_id_backup.txt';
	add_filter(
		'ai1wm_import',
		function ( $params = array() ) use ( $wpcom_blog_id, $wpcom_blog_id_backup_file ) {
			// This filter runs at this priority at the start of the import.
			// We store the wpcom_blog_id in a backup file so we can use it later in the import, since
			// the blog id is removed from the db by subsequent steps in the AIOWP migration.
			file_put_contents( $wpcom_blog_id_backup_file, $wpcom_blog_id ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			return $params;
		},
		10
	);
	add_filter(
		'ai1wm_import',
		function ( $params = array() ) use ( $wpcom_blog_id_backup_file ) {
			if ( ! file_exists( $wpcom_blog_id_backup_file ) ) {
				do_action( 'wpcomsh_log', 'No wpcom_blog_id_backup_file found' );
				return $params;
			}

			// Read the wpcom_blog_id from the backup file.
			$file_contents = file_get_contents( $wpcom_blog_id_backup_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

			if ( false === $file_contents ) {
				do_action( 'wpcomsh_log', 'Failed to read wpcom_blog_id_backup_file' );
				return $params;
			}

			if ( ! is_numeric( $file_contents ) || (int) $file_contents === 0 ) {
				do_action( 'wpcomsh_log', 'The content of the wpcom_blog_id_backup_file is not valid' );
				return $params;
			}

			$wpcom_blog_id = intval( $file_contents );
			unlink( $wpcom_blog_id_backup_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink

			$endpoint = sprintf( '/sites/%s/migration-aiowp-notifications', $wpcom_blog_id );
			$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
				$endpoint,
				'v2',
				array( 'method' => 'POST' ),
				array( 'status' => 'completed' ),
				'wpcom'
			);
			if ( 200 !== $response['response']['code'] || empty( $response['body'] ) ) {
				return $params;
			}
			return $params;
		},
		400
	);
}

add_action( 'plugins_loaded', 'aiowp_migration_status_helper', 10 );

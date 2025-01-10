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
		exit();
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

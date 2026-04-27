<?php
/**
 * Post-update health check — probes each updated plugin after the files
 * are swapped and rolls back on failure.
 *
 * Complements `update-guard.php` (parse-error gate before install) with a
 * runtime probe after install, so fatals that only surface at load or init
 * (missing class, version drift, etc.) don't leave an active site broken.
 *
 * See README.md for the full flow.
 *
 * @package automattic/jetpack-mu-wpcom
 */

add_filter( 'upgrader_pre_install', 'pcg_healthcheck_capture_snapshot', 10, 2 );
add_action( 'upgrader_process_complete', 'pcg_healthcheck_after_update', 99, 2 );
add_action( 'admin_notices', 'pcg_healthcheck_render_notice' );

/**
 * Hooked on `upgrader_pre_install`. Captures a snapshot for every plugin
 * that's about to be updated, so we have a version + was_active to fall
 * back to when the post-update probe fails.
 *
 * @param bool|WP_Error $return     Upgrade status passed through.
 * @param array         $hook_extra { type, action, plugin? }.
 * @return bool|WP_Error Passed through unchanged.
 */
function pcg_healthcheck_capture_snapshot( $return, $hook_extra ) {
	if ( ! apply_filters( 'pcg_guard_updates', false ) ) {
		return $return;
	}
	if ( ! pcg_healthcheck_is_plugin_update( $hook_extra ) ) {
		return $return;
	}
	$plugin_file = (string) ( $hook_extra['plugin'] ?? '' );
	if ( '' !== $plugin_file ) {
		PCG_Snapshot::capture( $plugin_file );
	}
	return $return;
}

/**
 * Hooked on `upgrader_process_complete`. For each plugin update, probes the
 * installed code and rolls back to the snapshot on fatal/throwable.
 *
 * @param WP_Upgrader|null $upgrader   Upgrader instance (unused).
 * @param array            $hook_extra { type, action, plugins? }.
 * @return void
 */
function pcg_healthcheck_after_update( $upgrader, $hook_extra ) {
	unset( $upgrader );

	if ( ! apply_filters( 'pcg_guard_updates', false ) ) {
		return;
	}
	if ( ! pcg_healthcheck_is_plugin_update( $hook_extra ) ) {
		return;
	}

	$plugin_files = array();
	if ( ! empty( $hook_extra['plugins'] ) && is_array( $hook_extra['plugins'] ) ) {
		$plugin_files = array_values( array_filter( array_map( 'strval', $hook_extra['plugins'] ) ) );
	} elseif ( ! empty( $hook_extra['plugin'] ) ) {
		$plugin_files[] = (string) $hook_extra['plugin'];
	}

	foreach ( $plugin_files as $plugin_file ) {
		pcg_healthcheck_probe_and_maybe_rollback( $plugin_file );
	}
}

/**
 * Run the probe for a single plugin and roll back if it fails. Results are
 * stashed in a per-user transient that the admin_notices hook drains.
 *
 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
 * @return void
 */
function pcg_healthcheck_probe_and_maybe_rollback( $plugin_file ) {
	$snapshot = PCG_Snapshot::consume( $plugin_file );
	if ( ! is_array( $snapshot ) || empty( $snapshot['was_active'] ) ) {
		return;
	}

	$abs = WP_PLUGIN_DIR . '/' . $plugin_file;
	if ( ! is_file( $abs ) ) {
		return;
	}

	$tester = new PCG_Load_Tester();
	$result = $tester->test( $abs );
	$status = (string) ( $result['status'] ?? '' );

	if ( 'ok' === $status ) {
		// Update succeeded — drop the local backup so it doesn't pile up under wp-content/upgrade/.
		PCG_Snapshot::cleanup_backup( $snapshot );
		return;
	}
	if ( 'fatal' !== $status && 'throwable' !== $status ) {
		// "error" from the probe itself (transport failure, missing file) — don't roll back on ambiguous signals.
		// Treat these as inconclusive and clean up the backup; otherwise it lingers indefinitely.
		PCG_Snapshot::cleanup_backup( $snapshot );
		return;
	}

	$rollback = PCG_Rollback::to_snapshot( $snapshot );
	pcg_healthcheck_stash_notice( $plugin_file, $result, $rollback );

	/**
	 * Fires after a post-update probe fails and rollback has been attempted.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @param array  $probe       Probe result from PCG_Load_Tester::test().
	 * @param array  $rollback    Result from PCG_Rollback::to_snapshot().
	 * @param array  $snapshot    The consumed snapshot.
	 */
	do_action( 'pcg_post_update_diagnosis', $plugin_file, $result, $rollback, $snapshot );
}

/**
 * Is this $hook_extra a plugin update (not an install, not a theme)?
 *
 * @param array $hook_extra { type, action, ... }.
 * @return bool
 */
function pcg_healthcheck_is_plugin_update( $hook_extra ) {
	$type   = (string) ( $hook_extra['type'] ?? '' );
	$action = (string) ( $hook_extra['action'] ?? '' );
	return 'plugin' === $type && 'update' === $action;
}

/**
 * Stash a per-user admin notice describing the probe failure and rollback
 * outcome, keyed by the current user id so concurrent updates don't
 * clobber each other's notices.
 *
 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
 * @param array  $probe       Probe result from PCG_Load_Tester::test().
 * @param array  $rollback    Result from PCG_Rollback::to_snapshot().
 * @return void
 */
function pcg_healthcheck_stash_notice( $plugin_file, $probe, $rollback ) {
	$key      = 'pcg_healthcheck_notice_' . get_current_user_id();
	$existing = get_transient( $key );
	if ( ! is_array( $existing ) ) {
		$existing = array();
	}
	$existing[ $plugin_file ] = array(
		'reason'   => pcg_guard_format_block_reason( $probe ),
		'rollback' => $rollback,
	);
	set_transient( $key, $existing, 10 * MINUTE_IN_SECONDS );
}

/**
 * Render any stashed post-update notices for the current user.
 *
 * @return void
 */
function pcg_healthcheck_render_notice() {
	$key      = 'pcg_healthcheck_notice_' . get_current_user_id();
	$messages = get_transient( $key );
	if ( ! is_array( $messages ) || empty( $messages ) ) {
		return;
	}
	delete_transient( $key );
	?>
	<div class="notice notice-error">
		<p><strong><?php esc_html_e( 'WordPress.com detected a fatal after a plugin update and attempted to restore the previous version:', 'jetpack-mu-wpcom' ); ?></strong></p>
		<ul style="list-style:disc;padding-inline-start:24px;">
			<?php foreach ( $messages as $plugin => $info ) : ?>
				<li>
					<code><?php echo esc_html( (string) $plugin ); ?></code> — <?php echo esc_html( (string) $info['reason'] ); ?>
					<br />
					<em><?php echo esc_html( pcg_healthcheck_describe_rollback( $info['rollback'] ) ); ?></em>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
	<?php
}

/**
 * Human-readable summary of a rollback result.
 *
 * @param array $rollback Rollback result from PCG_Rollback::to_snapshot().
 * @return string
 */
function pcg_healthcheck_describe_rollback( $rollback ) {
	$status = (string) ( $rollback['status'] ?? '' );
	$to     = (string) ( $rollback['restored_to'] ?? '' );
	switch ( $status ) {
		case 'reactivated':
			return sprintf(
				/* translators: %s: previous plugin version. */
				__( 'Restored to version %s and reactivated.', 'jetpack-mu-wpcom' ),
				$to
			);
		case 'restored':
			return sprintf(
				/* translators: %s: previous plugin version. */
				__( 'Restored to version %s; left deactivated.', 'jetpack-mu-wpcom' ),
				$to
			);
		case 'rollback_unavailable':
			return __( 'Rollback unavailable (previous version not downloadable); plugin left deactivated.', 'jetpack-mu-wpcom' );
		case 'rollback_failed':
		default:
			return __( 'Rollback failed; plugin left deactivated. Please investigate.', 'jetpack-mu-wpcom' );
	}
}

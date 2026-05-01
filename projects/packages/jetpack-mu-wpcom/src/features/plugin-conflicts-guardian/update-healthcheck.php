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
function pcg_healthcheck_after_update( $upgrader, $hook_extra ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- $upgrader is the WP-Upgrader-supplied argument; we accept it for the action signature.
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

	// Read the just-installed (possibly broken) plugin headers so the
	// admin notice can name the plugin and the version we tried to
	// upgrade to, instead of the raw plugin_file path.
	if ( ! function_exists( 'get_plugin_data' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	$new_data    = get_plugin_data( $abs, false, false );
	$plugin_name = (string) ( $new_data['Name'] ?? '' );
	if ( '' === $plugin_name ) {
		$plugin_name = $plugin_file;
	}
	$new_version = (string) ( $new_data['Version'] ?? '' );

	$tester = new PCG_Load_Tester();
	$result = $tester->test( $abs, PCG_Load_Tester::MODE_UPDATE );
	$status = (string) ( $result['status'] ?? '' );

	// Anything other than a captured fatal is a no-op rollback-wise: ok =
	// the update is fine; error = inconclusive transport failure we don't
	// want to act on. Either way, drop the local backup so it doesn't
	// linger under the temp dir.
	if ( 'fatal' !== $status && 'throwable' !== $status ) {
		PCG_Snapshot::cleanup_backup( $snapshot );
		return;
	}

	$rollback = PCG_Rollback::to_snapshot( $snapshot );
	pcg_healthcheck_stash_notice( $plugin_file, $result, $rollback, $plugin_name, $new_version );

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
 * @param string $plugin_name Human-readable plugin Name header (falls back to $plugin_file).
 * @param string $new_version Version we tried to upgrade to (Version header on the new files).
 * @return void
 */
function pcg_healthcheck_stash_notice( $plugin_file, $probe, $rollback, $plugin_name = '', $new_version = '' ) {
	$key      = 'pcg_healthcheck_notice_' . get_current_user_id();
	$existing = get_transient( $key );
	if ( ! is_array( $existing ) ) {
		$existing = array();
	}
	$existing[ $plugin_file ] = array(
		'reason'      => pcg_guard_format_block_reason( $probe ),
		'rollback'    => $rollback,
		'plugin_name' => '' !== $plugin_name ? $plugin_name : $plugin_file,
		'new_version' => $new_version,
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
			<?php
			foreach ( $messages as $plugin => $info ) :
				$name        = (string) ( $info['plugin_name'] ?? $plugin );
				$new_version = (string) ( $info['new_version'] ?? '' );
				$headline    = '' !== $new_version
					? sprintf(
						/* translators: 1: plugin name, 2: version we attempted to upgrade to. */
						__( '%1$s (update to %2$s)', 'jetpack-mu-wpcom' ),
						$name,
						$new_version
					)
					: $name;
				?>
				<li>
					<strong><?php echo esc_html( $headline ); ?></strong> — <?php echo esc_html( (string) $info['reason'] ); ?>
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

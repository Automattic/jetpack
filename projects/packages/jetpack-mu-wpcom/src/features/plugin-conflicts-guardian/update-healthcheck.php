<?php
/**
 * Post-update health check — probes the site once after a batch of plugin
 * updates and rolls back every snapshot in the batch on failure.
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
	if ( ! apply_filters( 'pcg_guard_updates', true ) ) {
		return $return;
	}
	if ( pcg_force_override_active( 'update_plugins' ) ) {
		return $return;
	}
	if ( ! pcg_healthcheck_is_plugin_pre_install_update( $hook_extra ) ) {
		return $return;
	}
	$plugin_file = (string) ( $hook_extra['plugin'] ?? '' );
	if ( '' === $plugin_file ) {
		return $return;
	}
	// Skip inactive (probe ignores them) and network-active (probe is
	// per-site, rollback flips one plugin — wrong shape for network).
	if ( ! function_exists( 'is_plugin_active' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	if ( ! is_plugin_active( $plugin_file ) ) {
		return $return;
	}
	if ( is_multisite() && is_plugin_active_for_network( $plugin_file ) ) {
		return $return;
	}
	PCG_Snapshot::capture( $plugin_file );
	return $return;
}

/**
 * Hooked on `upgrader_process_complete`. Probes the site once after the
 * batch of plugin updates and, on fatal, rolls back every snapshotted
 * plugin in the batch.
 *
 * One probe is enough because MODE_UPDATE checks whether the site as a
 * whole bootstraps — it doesn't isolate which plugin caused the fatal.
 * If the site is broken, we can't safely tell which plugin to blame, so
 * we restore the whole batch.
 *
 * @param WP_Upgrader|null $upgrader   Upgrader instance (unused).
 * @param array            $hook_extra { type, action, plugins? }.
 * @return void
 */
function pcg_healthcheck_after_update( $upgrader, $hook_extra ) {
	if ( ! apply_filters( 'pcg_guard_updates', true ) ) {
		return;
	}
	if ( pcg_force_override_active( 'update_plugins' ) ) {
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

	// Drain all stashed snapshots up front, keeping only the ones that
	// were active and whose new files are still on disk. Anything else
	// can't take the site down, so it doesn't need a probe.
	if ( ! function_exists( 'get_plugin_data' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	$candidates = array();
	foreach ( $plugin_files as $plugin_file ) {
		$snapshot = PCG_Snapshot::consume( $plugin_file );
		if ( ! is_array( $snapshot ) ) {
			continue;
		}
		if ( empty( $snapshot['was_active'] ) ) {
			PCG_Snapshot::cleanup_backup( $snapshot );
			continue;
		}
		$plugin_main = WP_PLUGIN_DIR . '/' . $plugin_file;
		if ( ! is_file( $plugin_main ) ) {
			continue;
		}

		$new_data    = get_plugin_data( $plugin_main, false, false );
		$plugin_name = (string) ( $new_data['Name'] ?? '' );
		if ( '' === $plugin_name ) {
			$plugin_name = $plugin_file;
		}
		$candidates[] = array(
			'plugin_file' => $plugin_file,
			'snapshot'    => $snapshot,
			'plugin_main' => $plugin_main,
			'plugin_name' => $plugin_name,
			'new_version' => (string) ( $new_data['Version'] ?? '' ),
		);
	}

	if ( empty( $candidates ) ) {
		return;
	}

	// MODE_UPDATE skips require_once and just observes the bootstrap, so one
	// probe suffices for the whole batch. The paths are only readability checks.
	$tester       = new PCG_Load_Tester();
	$plugin_mains = array_values( array_column( $candidates, 'plugin_main' ) );
	$result       = $tester->test( $plugin_mains, PCG_Load_Tester::MODE_UPDATE );
	$status       = (string) ( $result['status'] ?? '' );

	// Anything other than a captured fatal is a no-op rollback-wise: ok =
	// the update is fine; error = inconclusive transport failure we don't
	// want to act on. Either way, drop local backups so they don't
	// linger under the temp dir.
	if ( 'fatal' !== $status && 'throwable' !== $status ) {
		foreach ( $candidates as $candidate ) {
			PCG_Snapshot::cleanup_backup( $candidate['snapshot'] );
		}
		return;
	}

	foreach ( $candidates as $candidate ) {
		$rollback = PCG_Rollback::to_snapshot( $candidate['snapshot'] );
		pcg_healthcheck_stash_notice( $candidate['plugin_file'], $result, $rollback, $candidate['plugin_name'], $candidate['new_version'] );
		pcg_healthcheck_log_rollback( $candidate, $result, $rollback );

		/**
		 * Fires after a post-update probe fails and rollback has been attempted.
		 *
		 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
		 * @param array  $probe       Probe result from PCG_Load_Tester::test().
		 * @param array  $rollback    Result from PCG_Rollback::to_snapshot().
		 * @param array  $snapshot    The consumed snapshot.
		 */
		do_action( 'pcg_post_update_diagnosis', $candidate['plugin_file'], $result, $rollback, $candidate['snapshot'] );
	}
}

/**
 * Log a post-update rollback to logstash. Best-effort.
 *
 * @param array $candidate Per-plugin context built in `pcg_healthcheck_after_update()`.
 * @param array $probe     Shared probe verdict from `PCG_Load_Tester::test()`.
 * @param array $rollback  Result from `PCG_Rollback::to_snapshot()`.
 * @return void
 */
function pcg_healthcheck_log_rollback( array $candidate, array $probe, array $rollback ) {
	pcg_log_event(
		'Update rolled back',
		array(
			'plugin'           => (string) $candidate['plugin_file'],
			'new_version'      => (string) $candidate['new_version'],
			'previous_version' => (string) ( $candidate['snapshot']['version'] ?? '' ),
			'probe_status'     => (string) ( $probe['status'] ?? '' ),
			// Basename only — absolute paths leak install layout.
			'probe_file'       => isset( $probe['file'] ) ? basename( (string) $probe['file'] ) : '',
			'probe_line'       => (int) ( $probe['line'] ?? 0 ),
			'probe_reason'     => (string) ( $probe['message'] ?? '' ),
			'rollback_status'  => (string) ( $rollback['status'] ?? '' ),
			'restored_to'      => (string) ( $rollback['restored_to'] ?? '' ),
		)
	);
}

/**
 * Is this $hook_extra a plugin update (not an install, not a theme)?
 *
 * Use on `upgrader_process_complete`, where WP core always populates
 * `type` and `action` even for bulk runs.
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
 * Is this $hook_extra a plugin update at the `upgrader_pre_install` filter?
 *
 * `Plugin_Upgrader::bulk_upgrade()` only passes `plugin` (and `temp_backup`)
 * in the per-plugin `hook_extra` — `type` and `action` aren't set, so the
 * post-install predicate would miss every bulk update. We disambiguate by
 * presence of the `plugin` key plus negative checks: if `type`/`action`
 * happen to be set (single-update path), they must say plugin/update.
 * Theme bulk updates use a `theme` key instead, and plugin installs don't
 * set `plugin`, so neither false-matches.
 *
 * @param array $hook_extra { plugin, type?, action?, temp_backup?, ... }.
 * @return bool
 */
function pcg_healthcheck_is_plugin_pre_install_update( $hook_extra ) {
	if ( empty( $hook_extra['plugin'] ) ) {
		return false;
	}
	if ( isset( $hook_extra['type'] ) && 'plugin' !== $hook_extra['type'] ) {
		return false;
	}
	if ( isset( $hook_extra['action'] ) && 'update' !== $hook_extra['action'] ) {
		return false;
	}
	return true;
}

/**
 * Stash a site-wide admin notice describing the probe failure and rollback
 * outcome. Site-wide (not per-user) so cron/CLI updates — which run with
 * no current user — still surface a notice to admins on next page load.
 *
 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
 * @param array  $probe       Probe result from PCG_Load_Tester::test().
 * @param array  $rollback    Result from PCG_Rollback::to_snapshot().
 * @param string $plugin_name Human-readable plugin Name header (falls back to $plugin_file).
 * @param string $new_version Version we tried to upgrade to (Version header on the new files).
 * @return void
 */
function pcg_healthcheck_stash_notice( $plugin_file, $probe, $rollback, $plugin_name = '', $new_version = '' ) {
	$key      = 'pcg_healthcheck_notice';
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
 * Render any stashed post-update notices to users who can manage plugins.
 *
 * @return void
 */
function pcg_healthcheck_render_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$key      = 'pcg_healthcheck_notice';
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

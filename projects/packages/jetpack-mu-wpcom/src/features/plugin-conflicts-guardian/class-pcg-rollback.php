<?php
/**
 * Rollback a failed plugin update.
 *
 * Two paths, tried in order:
 *
 *   1. Local backup. If `PCG_Snapshot::create_backup()` stashed a copy
 *      of the pre-update files under `wp-content/upgrade/pcg-backups/`,
 *      restore from there — works for any plugin (paid, private, .org)
 *      and needs no network round-trip.
 *   2. WordPress.org versioned ZIP. Fallback for cases where the local
 *      backup is missing or restoration failed.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Restores the pre-update plugin files from the snapshot.
 */
class PCG_Rollback {

	/**
	 * Restore the plugin to its pre-update version.
	 *
	 * @param array{plugin_file:string,slug:string,version:string,was_active:bool,backup_path?:string,timestamp:float} $snapshot Snapshot from PCG_Snapshot::capture().
	 * @return array{status:string,reason?:string,restored_to?:string,via?:string}
	 *         status is one of "restored", "reactivated", "rollback_unavailable", "rollback_failed".
	 */
	public static function to_snapshot( $snapshot ) {
		if ( empty( $snapshot['plugin_file'] ) ) {
			return array(
				'status' => 'rollback_unavailable',
				'reason' => 'Snapshot missing plugin_file.',
			);
		}

		// Deactivate first so the broken version stops fataling on every request.
		$plugin_file = (string) $snapshot['plugin_file'];
		if ( function_exists( 'deactivate_plugins' ) ) {
			deactivate_plugins( array( $plugin_file ), true );
		}

		// Try the local backup first — fast, offline, works for any source.
		$local = self::to_local_backup( $snapshot );
		if ( 'rollback_unavailable' !== ( $local['status'] ?? '' ) && 'rollback_failed' !== ( $local['status'] ?? '' ) ) {
			return self::reactivate_if_needed( $local, $snapshot );
		}

		// Fallback to .org download.
		$download = self::to_download( $snapshot );
		if ( 'rollback_unavailable' === ( $download['status'] ?? '' ) || 'rollback_failed' === ( $download['status'] ?? '' ) ) {
			// Surface the local-backup failure when both paths failed but the local one is more informative.
			if ( ! empty( $local['reason'] ) ) {
				$download['reason'] = (string) $local['reason'] . ' / ' . (string) ( $download['reason'] ?? '' );
			}
			return $download;
		}
		return self::reactivate_if_needed( $download, $snapshot );
	}

	/**
	 * Restore from the local backup directory captured at snapshot time.
	 *
	 * @param array $snapshot Snapshot.
	 * @return array{status:string,reason?:string,restored_to?:string,via?:string}
	 */
	public static function to_local_backup( $snapshot ) {
		$backup_path = is_array( $snapshot ) ? (string) ( $snapshot['backup_path'] ?? '' ) : '';
		$plugin_file = (string) ( $snapshot['plugin_file'] ?? '' );
		$asset_name  = PCG_Snapshot::asset_name( $plugin_file );

		if ( '' === $backup_path || '' === $asset_name ) {
			return array(
				'status' => 'rollback_unavailable',
				'reason' => 'No local backup recorded for this update.',
			);
		}
		$backup_asset = $backup_path . '/' . $asset_name;
		if ( ! file_exists( $backup_asset ) ) {
			return array(
				'status' => 'rollback_unavailable',
				'reason' => 'Local backup missing on disk.',
			);
		}

		$current = WP_PLUGIN_DIR . '/' . $asset_name;
		if ( file_exists( $current ) && ! self::delete_recursive( $current ) ) {
			return array(
				'status' => 'rollback_failed',
				'reason' => 'Could not remove the broken plugin files.',
			);
		}

		// Try a same-filesystem rename first; fall back to copy + delete-source.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename,WordPress.PHP.NoSilencedErrors.Discouraged -- WP_Filesystem::move would do an unconditional copy + delete; rename is the whole point here.
		$moved = @rename( $backup_asset, $current );
		if ( ! $moved ) {
			if ( ! self::copy_recursive( $backup_asset, $current ) ) {
				return array(
					'status' => 'rollback_failed',
					'reason' => 'Could not restore plugin from local backup.',
				);
			}
			self::delete_recursive( $backup_asset );
		}

		// Drop the (now-empty) backup wrapper dir.
		self::delete_recursive( $backup_path );

		return array(
			'status'      => 'restored',
			'restored_to' => (string) ( $snapshot['version'] ?? '' ),
			'via'         => 'local_backup',
		);
	}

	/**
	 * Re-download and reinstall from WordPress.org.
	 *
	 * @param array $snapshot Snapshot.
	 * @return array{status:string,reason?:string,restored_to?:string,via?:string}
	 */
	public static function to_download( $snapshot ) {
		$slug    = (string) ( $snapshot['slug'] ?? '' );
		$version = (string) ( $snapshot['version'] ?? '' );

		$zip_url = self::build_download_url( $slug, $version );
		if ( '' === $zip_url ) {
			return array(
				'status' => 'rollback_unavailable',
				'reason' => 'No WordPress.org download URL could be built for this plugin.',
			);
		}

		$install = self::install_from_url( $zip_url );
		if ( is_wp_error( $install ) ) {
			return array(
				'status' => 'rollback_failed',
				'reason' => (string) $install->get_error_message(),
			);
		}

		return array(
			'status'      => 'restored',
			'restored_to' => $version,
			'via'         => 'wp_org_download',
		);
	}

	/**
	 * If the snapshot says the plugin was active, reactivate it and
	 * promote `restored` → `reactivated` on success.
	 *
	 * @param array $result   Successful rollback result.
	 * @param array $snapshot Snapshot.
	 * @return array
	 */
	protected static function reactivate_if_needed( $result, $snapshot ) {
		if ( empty( $snapshot['was_active'] ) || ! function_exists( 'activate_plugin' ) ) {
			return $result;
		}
		$activated = activate_plugin( (string) $snapshot['plugin_file'], '', false, true );
		if ( ! is_wp_error( $activated ) ) {
			$result['status'] = 'reactivated';
		}
		return $result;
	}

	/**
	 * Build the canonical WordPress.org versioned ZIP URL for a plugin.
	 *
	 * @param string $slug    Plugin slug (directory name).
	 * @param string $version Previous version string (e.g. "7.9.1").
	 * @return string URL, or '' when inputs are invalid.
	 */
	public static function build_download_url( $slug, $version ) {
		$slug    = trim( (string) $slug );
		$version = trim( (string) $version );
		if ( '' === $slug || '' === $version ) {
			return '';
		}
		if ( ! preg_match( '/^[a-z0-9\-]+$/i', $slug ) ) {
			return '';
		}
		if ( ! preg_match( '/^[0-9][0-9A-Za-z\.\-]*$/', $version ) ) {
			return '';
		}
		return sprintf( 'https://downloads.wordpress.org/plugin/%s.%s.zip', rawurlencode( $slug ), rawurlencode( $version ) );
	}

	/**
	 * Download $url and re-install it via Plugin_Upgrader with clear_destination.
	 *
	 * @param string $url Versioned plugin ZIP URL.
	 * @return true|WP_Error
	 */
	protected static function install_from_url( $url ) {
		if ( ! class_exists( 'Plugin_Upgrader' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		}
		if ( ! class_exists( 'Automatic_Upgrader_Skin' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-automatic-upgrader-skin.php';
		}

		$skin     = new Automatic_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );
		$result   = $upgrader->install(
			$url,
			array(
				'overwrite_package' => true,
				'clear_destination' => true,
			)
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( false === $result || null === $result ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- get_errors() is defined on WP_Upgrader_Skin; Phan's stubs omit it.
			$errors = $skin->get_errors();
			if ( $errors instanceof WP_Error && $errors->has_errors() ) {
				return $errors;
			}
			return new WP_Error( 'pcg_rollback_install_failed', 'Plugin_Upgrader::install() returned false.' );
		}
		return true;
	}

	/**
	 * Recursively copy $src → $dst.
	 *
	 * @param string $src Source path.
	 * @param string $dst Destination path.
	 * @return bool
	 */
	protected static function copy_recursive( $src, $dst ) {
		if ( is_file( $src ) ) {
			return copy( $src, $dst );
		}
		if ( ! is_dir( $src ) ) {
			return false;
		}
		if ( ! wp_mkdir_p( $dst ) ) {
			return false;
		}
		$dir = opendir( $src );
		if ( false === $dir ) {
			return false;
		}
		while ( false !== ( $entry = readdir( $dir ) ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			if ( '.' === $entry || '..' === $entry ) {
				continue;
			}
			if ( ! self::copy_recursive( $src . '/' . $entry, $dst . '/' . $entry ) ) {
				closedir( $dir );
				return false;
			}
		}
		closedir( $dir );
		return true;
	}

	/**
	 * Recursively delete $path. Returns true on success or if path is gone.
	 *
	 * @param string $path Path to delete.
	 * @return bool
	 */
	protected static function delete_recursive( $path ) {
		if ( ! file_exists( $path ) && ! is_link( $path ) ) {
			return true;
		}
		if ( is_file( $path ) || is_link( $path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink,WordPress.PHP.NoSilencedErrors.Discouraged -- WP_Filesystem may not be initialized in upgrader context.
			return @unlink( $path );
		}
		$dir = opendir( $path );
		if ( false === $dir ) {
			return false;
		}
		$ok = true;
		while ( false !== ( $entry = readdir( $dir ) ) ) { // phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			if ( '.' === $entry || '..' === $entry ) {
				continue;
			}
			$ok = self::delete_recursive( $path . '/' . $entry ) && $ok;
		}
		closedir( $dir );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir,WordPress.PHP.NoSilencedErrors.Discouraged -- WP_Filesystem may not be initialized in upgrader context.
		return @rmdir( $path ) && $ok;
	}
}

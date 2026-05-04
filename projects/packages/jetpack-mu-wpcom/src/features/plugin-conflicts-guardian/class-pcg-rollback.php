<?php
/**
 * Rollback a failed plugin update.
 *
 * Two paths, tried in order:
 *
 *   1. Local backup. If `PCG_Snapshot::create_backup()` stashed a copy
 *      of the pre-update files under `<get_temp_dir()>/pcg-backups/<unique>/`,
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
		$fs = self::fs();
		if ( ! $fs ) {
			return array(
				'status' => 'rollback_failed',
				'reason' => 'WP_Filesystem unavailable.',
			);
		}
		$backup_asset = $backup_path . '/' . $asset_name;
		if ( ! $fs->exists( $backup_asset ) ) {
			return array(
				'status' => 'rollback_unavailable',
				'reason' => 'Local backup missing on disk.',
			);
		}

		$current = WP_PLUGIN_DIR . '/' . $asset_name;

		// Stage the broken plugin aside (instead of deleting it outright)
		// so a failed restore leaves the slug populated with the broken
		// version, not empty. The plugin will still be deactivated by the
		// caller, but its files staying on disk is what lets WP / the user
		// see and re-attempt the update later.
		//
		// The dot-prefix on the trash basename hides it from
		// `get_plugins()`, which skips entries starting with `.`. Avoids
		// a phantom plugin row appearing during the brief rollback window.
		$trash = '';
		if ( $fs->exists( $current ) ) {
			$trash = WP_PLUGIN_DIR . '/.pcg-rollback-trash-' . $asset_name . '-' . md5( uniqid( '', true ) );
			if ( ! $fs->move( $current, $trash, false ) ) {
				return array(
					'status' => 'rollback_failed',
					'reason' => 'Could not stage broken plugin files aside.',
				);
			}
		}

		$restore_failed = static function ( $reason ) use ( $fs, $current, $trash ) {
			if ( '' !== $trash ) {
				// Throw away any partial restore, then put the broken
				// plugin back where it was so the slug isn't empty.
				$fs->delete( $current, true );
				$fs->move( $trash, $current, true );
			}
			return array(
				'status' => 'rollback_failed',
				'reason' => $reason,
			);
		};

		// move() works for files (and same-fs dir renames). For cross-fs
		// dir moves WP_Filesystem_Direct::move can't recurse, so fall
		// back to copy_dir on dirs.
		$moved = $fs->move( $backup_asset, $current, true );
		if ( ! $moved ) {
			if ( $fs->is_dir( $backup_asset ) ) {
				if ( ! wp_mkdir_p( $current ) || true !== copy_dir( $backup_asset, $current ) ) {
					return $restore_failed( 'Could not restore plugin from local backup (cross-fs copy_dir failed).' );
				}
			} else {
				return $restore_failed( 'Could not restore plugin from local backup.' );
			}
		}

		// Restore succeeded — drop the trashed broken plugin and the
		// (now-empty-ish) backup wrapper dir.
		if ( '' !== $trash ) {
			$fs->delete( $trash, true );
		}
		$fs->delete( $backup_path, true );

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
		if ( true === $result ) {
			return true;
		}
		// install() returned false/null. Surface the skin's accumulated
		// errors when available; otherwise fall back to a generic one.
		if ( method_exists( $skin, 'get_errors' ) ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- existence checked at runtime.
			$errors = $skin->get_errors();
			if ( $errors instanceof WP_Error && $errors->has_errors() ) {
				return $errors;
			}
		}
		return new WP_Error( 'pcg_rollback_install_failed', 'Plugin_Upgrader::install() returned false.' );
	}

	/**
	 * Lazy-init WP_Filesystem and return the global instance, or null
	 * when initialization fails. Inside upgrader hooks WP has already
	 * called WP_Filesystem(), so this is effectively a no-op fetch.
	 *
	 * @return WP_Filesystem_Base|null
	 */
	protected static function fs() {
		global $wp_filesystem;
		if ( $wp_filesystem ) {
			return $wp_filesystem;
		}
		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		WP_Filesystem();
		return $wp_filesystem;
	}
}

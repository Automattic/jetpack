<?php
/**
 * Pre-update snapshot for plugin updates.
 *
 * Captures enough state before an update to decide whether the post-update
 * probe needs to run (was_active), what to roll back to if it fails
 * (version), and a local copy of the existing files so the rollback can
 * happen without re-downloading anything (backup_path).
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Transient-backed snapshot of a plugin's state immediately before an update.
 */
class PCG_Snapshot {

	const BACKUP_DIRNAME = 'pcg-backups';

	/**
	 * How long the snapshot transient and on-disk backup live before
	 * cleanup considers them stale. A slow upgrader (large package, slow
	 * disk, queued cron run) can take well over the WP transient default,
	 * and if the transient expires before `upgrader_process_complete`
	 * fires, the backup on disk becomes unrecoverable for rollback. Match
	 * the sweep TTL so both expire on the same clock.
	 */
	const LIFETIME         = HOUR_IN_SECONDS;
	const STALE_BACKUP_TTL = HOUR_IN_SECONDS;

	/**
	 * Capture and persist the snapshot for $plugin_file.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR, e.g. "akismet/akismet.php".
	 * @return array{plugin_file:string,slug:string,version:string,was_active:bool,backup_path:string,timestamp:float}|null
	 *         The stored snapshot, or null when we lack enough info to make one.
	 */
	public static function capture( $plugin_file ) {
		$plugin_file = (string) $plugin_file;
		if ( '' === $plugin_file ) {
			return null;
		}

		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$abs = WP_PLUGIN_DIR . '/' . $plugin_file;
		if ( ! is_file( $abs ) ) {
			return null;
		}

		$data = get_plugin_data( $abs, false, false );

		$snapshot = array(
			'plugin_file' => $plugin_file,
			'slug'        => self::slug_from_file( $plugin_file ),
			'version'     => (string) ( $data['Version'] ?? '' ),
			'was_active'  => is_plugin_active( $plugin_file ),
			'backup_path' => self::create_backup( $plugin_file ),
			'timestamp'   => microtime( true ),
		);

		set_transient( self::transient_key( $plugin_file ), $snapshot, self::LIFETIME );

		return $snapshot;
	}

	/**
	 * Read the snapshot for $plugin_file, consuming it (single use).
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return array|null
	 */
	public static function consume( $plugin_file ) {
		$key  = self::transient_key( (string) $plugin_file );
		$data = get_transient( $key );
		delete_transient( $key );
		return is_array( $data ) ? $data : null;
	}

	/**
	 * Copy the plugin's current on-disk files to an isolated backup
	 * directory under `wp-content/upgrade/pcg-backups/<unique>/`.
	 *
	 * The plugin asset (its directory for dir-style plugins, its file
	 * for single-file plugins) is copied to the same name inside the
	 * backup dir, so rollback knows where to find it via $backup_path.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return string Absolute path to the backup root, or '' on failure.
	 */
	public static function create_backup( $plugin_file ) {
		$asset_name = self::asset_name( $plugin_file );
		if ( '' === $asset_name ) {
			return '';
		}
		$src = WP_PLUGIN_DIR . '/' . $asset_name;
		$fs  = self::fs();
		if ( ! $fs || ! $fs->exists( $src ) ) {
			return '';
		}

		$root = self::backup_root();
		if ( '' === $root || ! wp_mkdir_p( $root ) ) {
			return '';
		}

		// Sweep orphaned backups left behind when a previous update
		// captured a snapshot but `upgrader_process_complete` never
		// fired (upgrader fatal, redirect, etc.).
		self::sweep_stale_backups();

		$dest_root = $root . '/' . md5( uniqid( '', true ) );
		if ( ! wp_mkdir_p( $dest_root ) ) {
			return '';
		}

		$dest = $dest_root . '/' . $asset_name;
		if ( $fs->is_file( $src ) ) {
			if ( ! $fs->copy( $src, $dest, true ) ) {
				$fs->delete( $dest_root, true );
				return '';
			}
			return $dest_root;
		}
		if ( ! wp_mkdir_p( $dest ) || true !== copy_dir( $src, $dest ) ) {
			$fs->delete( $dest_root, true );
			return '';
		}

		return $dest_root;
	}

	/**
	 * Drop the backup directory associated with this snapshot, if any.
	 *
	 * @param array $snapshot Snapshot.
	 * @return void
	 */
	public static function cleanup_backup( $snapshot ) {
		$path = is_array( $snapshot ) ? (string) ( $snapshot['backup_path'] ?? '' ) : '';
		if ( '' === $path ) {
			return;
		}
		// Sanity: only delete things we own under the backup root.
		$root = self::backup_root();
		if ( '' === $root || 0 !== strpos( $path, $root . '/' ) ) {
			return;
		}
		$fs = self::fs();
		if ( $fs ) {
			$fs->delete( $path, true );
		}
	}

	/**
	 * Delete backup subdirectories under the backup root that are older
	 * than {@see self::STALE_BACKUP_TTL}. Cheap to run — the root is
	 * shallow and only touched during plugin updates.
	 *
	 * Only entries whose names look like our own md5-named dirs are
	 * considered, so a misconfigured `pcg_backup_root` filter pointing
	 * at a shared directory can't trash unrelated files.
	 *
	 * @return void
	 */
	public static function sweep_stale_backups() {
		$root = self::backup_root();
		if ( '' === $root || ! is_dir( $root ) ) {
			return;
		}
		$fs = self::fs();
		if ( ! $fs ) {
			return;
		}
		$entries = @scandir( $root ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- scandir on a missing/unreadable dir is non-fatal here.
		if ( ! is_array( $entries ) ) {
			return;
		}
		$cutoff = time() - self::STALE_BACKUP_TTL;
		foreach ( $entries as $entry ) {
			if ( ! preg_match( '/^[a-f0-9]{32}$/', $entry ) ) {
				continue;
			}
			$path  = $root . '/' . $entry;
			$mtime = @filemtime( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- transient FS races shouldn't warn.
			if ( false === $mtime || $mtime > $cutoff ) {
				continue;
			}
			$fs->delete( $path, true );
		}
	}

	/**
	 * Resolve the backup root directory. Defaults to a `pcg-backups`
	 * folder inside WordPress's temp dir (`get_temp_dir()` — typically
	 * the system tmpdir, falling back to `wp-content/uploads/` only
	 * when nothing else is writable). Override via `pcg_backup_root`.
	 *
	 * @return string Absolute path with trailing slash trimmed; '' to disable backups.
	 */
	public static function backup_root() {
		if ( ! function_exists( 'get_temp_dir' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		$default = rtrim( get_temp_dir(), '/' ) . '/' . self::BACKUP_DIRNAME;
		/**
		 * Filter the directory where pre-update plugin backups are
		 * staged. Return an absolute path; an empty string disables
		 * the local-backup rollback path entirely.
		 *
		 * @param string $default Absolute default path.
		 */
		$root = (string) apply_filters( 'pcg_backup_root', $default );
		return rtrim( $root, '/' );
	}

	/**
	 * The plugin "asset" path relative to WP_PLUGIN_DIR. For dir-style
	 * plugins that's the slug directory; for single-file plugins it's
	 * the file itself.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return string
	 */
	public static function asset_name( $plugin_file ) {
		$plugin_file = (string) $plugin_file;
		if ( '' === $plugin_file ) {
			return '';
		}
		if ( false !== strpos( $plugin_file, '/' ) ) {
			return self::slug_from_file( $plugin_file );
		}
		return $plugin_file;
	}

	/**
	 * Derive the plugin slug (directory name) from the plugin_file basename.
	 * Single-file plugins (e.g. "hello.php") use the stem.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return string
	 */
	public static function slug_from_file( $plugin_file ) {
		$plugin_file = (string) $plugin_file;
		if ( false !== strpos( $plugin_file, '/' ) ) {
			return dirname( $plugin_file );
		}
		return pathinfo( $plugin_file, PATHINFO_FILENAME );
	}

	/**
	 * Transient key for a plugin_file snapshot.
	 *
	 * @param string $plugin_file Basename relative to WP_PLUGIN_DIR.
	 * @return string
	 */
	public static function transient_key( $plugin_file ) {
		return 'pcg_snap_' . md5( (string) $plugin_file );
	}

	/**
	 * Lazy-init WP_Filesystem and return the global instance, or null
	 * when initialization fails (e.g. credentialed FTP not configured).
	 *
	 * Inside upgrader hooks, core has already initialized WP_Filesystem,
	 * so this is effectively a no-op fetch in that context.
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

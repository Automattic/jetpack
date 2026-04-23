<?php
/**
 * Upload handler for the Plugin Conflicts Guardian admin page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Accepts a zip upload, extracts it to a temp dir inside WP's uploads
 * area, runs the compat checker against the extracted plugin, and
 * cleans up. Returns either a PCG_Verdict (success) or a WP_Error
 * (validation / extraction failure), never raw exceptions.
 *
 * Security gates:
 *   - Caller is expected to have verified cap + nonce before invoking.
 *   - Only `.zip` files are accepted; other extensions are rejected.
 *   - Max upload size is capped at 25 MB (plenty for typical plugins).
 *   - Extraction uses `unzip_file()` which rejects zip-slip paths.
 *   - Temp dir lives under `wp_upload_dir().basedir/pcg-tmp/` and is
 *     recursively removed in a try/finally.
 */
class PCG_Upload_Handler {

	const MAX_UPLOAD_BYTES = 26214400; // 25 MB.

	/**
	 * Entry point. Runs the full upload → extract → check → cleanup flow.
	 *
	 * @param array $file Entry from `$_FILES` (e.g. `$_FILES['plugin_zip']`).
	 * @return PCG_Verdict|WP_Error
	 */
	public function handle( $file ) {
		$validation = $this->validate( $file );
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		$workspace = $this->make_workspace();
		if ( is_wp_error( $workspace ) ) {
			return $workspace;
		}

		try {
			$extracted = $this->extract( $file['tmp_name'], $workspace );
			if ( is_wp_error( $extracted ) ) {
				return $extracted;
			}

			$plugin_dir = $this->locate_plugin_dir( $workspace );
			if ( '' === $plugin_dir ) {
				return new WP_Error(
					'pcg_no_plugin',
					'The uploaded archive does not contain a WordPress plugin (no file with a Plugin Name header).'
				);
			}

			$checker = new PCG_Compat_Checker( new PCG_Wporg_Source(), new PCG_Site_State() );
			return $checker->check_upload( $plugin_dir );
		} finally {
			$this->rrmdir( $workspace );
		}
	}

	/**
	 * Validate the `$_FILES` entry: presence, upload-error code, size,
	 * and the `.zip` extension. MIME isn't checked because WordPress's
	 * own plugin installer relies on extension + unzip result too.
	 *
	 * @param array $file `$_FILES` entry.
	 * @return true|WP_Error
	 */
	private function validate( $file ) {
		if ( ! is_array( $file ) || empty( $file['tmp_name'] ) ) {
			return new WP_Error( 'pcg_no_file', 'No file was uploaded.' );
		}
		if ( UPLOAD_ERR_OK !== (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) ) {
			return new WP_Error( 'pcg_upload_error', 'Upload failed. Please try again.' );
		}
		if ( (int) ( $file['size'] ?? 0 ) > self::MAX_UPLOAD_BYTES ) {
			return new WP_Error( 'pcg_too_large', sprintf( 'File exceeds the %d MB limit.', (int) ( self::MAX_UPLOAD_BYTES / 1048576 ) ) );
		}
		$name = (string) ( $file['name'] ?? '' );
		if ( 'zip' !== strtolower( pathinfo( $name, PATHINFO_EXTENSION ) ) ) {
			return new WP_Error( 'pcg_wrong_type', 'Only .zip plugin archives are accepted.' );
		}
		return true;
	}

	/**
	 * Create a uniquely-named temp dir under the uploads directory.
	 *
	 * @return string|WP_Error Absolute path, or WP_Error on failure.
	 */
	private function make_workspace() {
		$uploads = wp_upload_dir();
		if ( ! empty( $uploads['error'] ) ) {
			return new WP_Error( 'pcg_uploads_error', (string) $uploads['error'] );
		}
		$base = trailingslashit( (string) $uploads['basedir'] ) . 'pcg-tmp';
		if ( ! wp_mkdir_p( $base ) ) {
			return new WP_Error( 'pcg_mkdir_failed', 'Could not create temp directory for extraction.' );
		}
		$dir = $base . '/' . wp_generate_password( 12, false );
		if ( ! wp_mkdir_p( $dir ) ) {
			return new WP_Error( 'pcg_mkdir_failed', 'Could not create per-upload workspace.' );
		}
		return $dir;
	}

	/**
	 * Unzip the uploaded file into the workspace using WordPress's own
	 * `unzip_file()` (which handles zip-slip protection internally).
	 *
	 * @param string $zip_path    Uploaded temp file.
	 * @param string $destination Absolute dir to extract into.
	 * @return true|WP_Error
	 */
	private function extract( $zip_path, $destination ) {
		if ( ! function_exists( 'unzip_file' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}
		if ( ! WP_Filesystem() ) {
			return new WP_Error( 'pcg_fs_unavailable', 'Could not initialize WP_Filesystem.' );
		}
		$result = unzip_file( $zip_path, $destination );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return true;
	}

	/**
	 * Identify the extracted plugin's root directory. WordPress plugin
	 * zips typically contain one top-level directory (e.g. `akismet/`);
	 * we pick the first subdirectory that carries a `Plugin Name` header
	 * in any of its top-level PHP files. Falls back to the workspace
	 * itself when the zip was flat (no wrapper dir).
	 *
	 * @param string $workspace Extraction directory.
	 * @return string Absolute path of the plugin dir, or '' when none found.
	 */
	private function locate_plugin_dir( $workspace ) {
		$source = new PCG_Local_Source();

		if ( null !== $source->parse( $workspace ) ) {
			return $workspace;
		}
		$candidates = glob( rtrim( $workspace, '/' ) . '/*', GLOB_ONLYDIR );
		if ( ! is_array( $candidates ) ) {
			return '';
		}
		foreach ( $candidates as $candidate ) {
			if ( null !== $source->parse( $candidate ) ) {
				return $candidate;
			}
		}
		return '';
	}

	/**
	 * Recursively remove a directory. Safe no-op when the path doesn't
	 * exist; errors from individual unlinks are suppressed — failing to
	 * clean up is not worth crashing the page over.
	 *
	 * @param string $dir Absolute path.
	 */
	private function rrmdir( $dir ) {
		if ( ! is_string( $dir ) || '' === $dir || ! is_dir( $dir ) ) {
			return;
		}
		$iter = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);
		foreach ( $iter as $path => $file ) {
			if ( $file->isDir() ) {
				@rmdir( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- best-effort cleanup; WP_Filesystem lacks a recursive rmdir.
			} else {
				@unlink( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.unlink_unlink -- best-effort cleanup.
			}
		}
		@rmdir( $dir ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- best-effort cleanup.
	}
}

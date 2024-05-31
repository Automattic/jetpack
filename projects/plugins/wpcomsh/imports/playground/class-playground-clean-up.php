<?php
/**
 * Playground_Clean_Up file.
 *
 * @package wpcomsh
 */

namespace Imports;

/**
 * Class Playground_Clean_Up
 *
 * This class perform Playground files clean up.
 */
class Playground_Clean_Up {

	/**
	 * Clean up the backup.
	 *
	 * @param string $zip_or_tar_file_path The path to the ZIP or TAR file to be imported.
	 * @param string $destination_path The path where the backup will be imported.
	 *
	 * @return boolean|\WP_Error True on success, or a WP_Error on failure.
	 */
	public static function remove_tmp_files( string $zip_or_tar_file_path, string $destination_path ) {
		if ( file_exists( $zip_or_tar_file_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			unlink( $zip_or_tar_file_path );
		}

		self::remove_folder( $destination_path );

		return true;
	}
	/**
	 * Remove a folder.
	 *
	 * @param string $folder_path The folder path.
	 *
	 * @return bool
	 */
	public static function remove_folder( string $folder_path ): bool {
		if ( ! is_dir( $folder_path ) ) {
			return false;
		}

		$files = scandir( $folder_path );

		foreach ( $files as $file ) {
			if ( $file === '.' || $file === '..' ) {
				continue;
			}

			$name = $folder_path . '/' . $file;

			if ( is_dir( $name ) ) {
				self::remove_folder( $name );
			} else {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
				unlink( $name );
			}
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		rmdir( $folder_path );

		return true;
	}
}

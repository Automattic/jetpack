<?php
/**
 * FS_Operations file.
 *
 * @package wpcomsh
 */

namespace Imports\Utils;

/**
 * Class FS_Operations
 *
 * This class provides some file system operations.
 */
class FS_Operations {
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

<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;
use SplFileInfo;

class Simple_Delete implements Path_Action {
	/**
	 * Delete a file or directory.
	 *
	 * @param SplFileInfo $file The file or directory to delete.
	 * @return bool True if it was a file, false if it was a directory.
	 */
	public function apply_to_path( SplFileInfo $file ) {
		if ( $file->isDir() ) {
			Logger::debug( 'rmdir: ' . $file->getPathname() );
			@rmdir( $file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
			return false;
		} else {
			// Delete all files in the directory
			Logger::debug( 'unlink: ' . $file->getPathname() );
			@unlink( $file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			return true;
		}
	}
}

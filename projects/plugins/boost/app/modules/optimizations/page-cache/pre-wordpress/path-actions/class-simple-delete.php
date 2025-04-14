<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;
use SplFileInfo;

/**
 * Delete a file or directory, non-recursively.
 */
class Simple_Delete implements Path_Action {
	/**
	 * Delete a file or directory.
	 *
	 * @param SplFileInfo $file The file or directory to delete.
	 * @return int The number of files or directories deleted.
	 */
	public function apply_to_path( SplFileInfo $file ) {
		if ( $file->isDir() && Filesystem_Utils::is_dir_empty( $file->getPathname() ) ) {
			Logger::debug( 'rmdir: ' . $file->getPathname() );
			return $this->delete_dir( $file );
		} elseif ( $file->isFile() ) {
			// Do not delete index.html files independently. We will only delete them when the directory is empty.
			if ( $file->getFilename() === 'index.html' ) {
				return 0;
			}

			// Delete a file in the directory
			Logger::debug( 'unlink: ' . $file->getPathname() );
			$this->delete_file( $file );
			return 1;
		}

		return 0;
	}

	private function delete_dir( SplFileInfo $file ) {
		$count = 0;
		if ( Filesystem_Utils::is_dir_empty( $file->getPathname() ) ) {
			// An empty directory will still have an index.html file, which we will delete with the directory.
			$count += Filesystem_Utils::delete_empty_dir( $file->getPathname() );
		}

		return $count;
	}

	private function delete_file( SplFileInfo $file ) {
		@unlink( $file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
		return true;
	}
}

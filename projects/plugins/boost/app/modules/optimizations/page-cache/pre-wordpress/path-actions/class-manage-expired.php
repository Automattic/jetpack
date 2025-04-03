<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;
use SplFileInfo;

class Manage_Expired implements Path_Action {
	private $ttl;
	private $action;

	const ACTION_DELETE  = 'delete';
	const ACTION_REBUILD = 'rebuild';

	/**
	 * @param int    $ttl The time to live for the file.
	 * @param string $action The action to perform on the file. Can be 'delete' or 'rebuild'.
	 */
	public function __construct( $ttl, $action ) {
		$this->ttl    = $ttl;
		$this->action = $action;
	}

	/**
	 * Rebuild or delete expired files.
	 *
	 * @param SplFileInfo $file The file or directory to apply the action to.
	 * @return false|int False if nothing was done, or the number of files deleted.
	 */
	public function apply_to_path( SplFileInfo $file ) {
		// index.html is deleted with the directory itself.
		if ( $file->getFilename() === 'index.html' ) {
			return 0;
		}

		if ( $file->isDir() ) {
			return $this->delete_dir( $file );
		}

		$file_path = $file->getPathname();
		$filemtime = filemtime( $file_path );
		$now       = time();
		// if the file ends with the rebuild file extension, it is a rebuilt file and the ttl is different.
		if (
			Filesystem_Utils::is_rebuild_file( $file->getFilename() )
			&& ( $filemtime + $this->ttl ) <= $now
		) {
			Logger::debug( 'Deleting expired rebuilt file: ' . $file_path );
			$expired = true;
		} else {
			$expired = ( $filemtime + $this->ttl ) <= $now;
		}

		if ( $expired ) {
			if ( $this->action === self::ACTION_REBUILD && ! Filesystem_Utils::is_rebuild_file( $file->getFilename() ) ) {
				if ( Filesystem_Utils::rebuild_file( $file_path ) ) {
					return 1;
				} else {
					Logger::debug( 'Could not rebuild file: ' . $file_path );
					return false;
				}
			} elseif ( $this->action === self::ACTION_DELETE ) {
				if ( Filesystem_Utils::delete_file( $file_path ) ) {
					return 1;
				} else {
					Logger::debug( 'Could not delete file: ' . $file_path );
					return false;
				}
			}
		}

		return 0;
	}

	private function delete_dir( SplFileInfo $file ) {
		if ( Filesystem_Utils::is_dir_empty( $file->getPathname() ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			@unlink( $file->getPathname() . '/index.html' );

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
			@rmdir( $file->getPathname() );
			return 1;
		}
	}
}

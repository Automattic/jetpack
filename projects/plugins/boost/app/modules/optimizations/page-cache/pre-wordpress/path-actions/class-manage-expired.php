<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use SplFileInfo;

class Manage_Expired implements Path_Action {
	private $ttl;
	private $sub_action;

	/**
	 * @param int         $ttl The time to live for the file.
	 * @param Path_Action $action The action to perform on the file. Can be 'delete' or 'rebuild'.
	 */
	public function __construct( $ttl, Path_Action $action ) {
		$this->ttl        = $ttl;
		$this->sub_action = $action;
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
			$expired = true;
		} else {
			$expired = ( $filemtime + $this->ttl ) <= $now;
		}

		if ( $expired ) {
			if ( Filesystem_Utils::is_rebuild_file( $file->getFilename() ) ) {
				$count = $this->delete( $file );
				return $count;
			}

			return $this->sub_action->apply_to_path( $file );
		}
		return 0;
	}

	private function delete_dir( SplFileInfo $file ) {
		$count = 0;
		if ( Filesystem_Utils::is_dir_empty( $file->getPathname() ) ) {
			$count += $this->delete( new SplFileInfo( $file->getPathname() . '/index.html' ) );
			$count += $this->delete( new SplFileInfo( $file->getPathname() ) );
		}

		return $count;
	}

	private function delete( SplFileInfo $file ) {
		$action = new Simple_Delete();
		return $action->apply_to_path( $file );
	}
}

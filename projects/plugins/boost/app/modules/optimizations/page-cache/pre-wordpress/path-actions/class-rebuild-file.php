<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use SplFileInfo;

/**
 * Rebuild a file.
 */
class Rebuild_File implements Path_Action {
	public function apply_to_path( SplFileInfo $file ) {
		if ( $file->isDir() && Filesystem_Utils::is_dir_empty( $file->getPathname() ) ) {
			Filesystem_Utils::delete_empty_dir( $file->getPathname() );
			return false;
		}

		if ( $file->isDir() || $file->getFilename() === 'index.html' ) {
			return false;
		}

		// If it's already a rebuild file, delete it because it expired long ago.
		if ( Filesystem_Utils::is_rebuild_file( $file->getFilename() ) ) {
			$action = new Simple_Delete();
			return $action->apply_to_path( $file );
		}

		$rebuilt = Filesystem_Utils::rebuild_file( $file->getPathname() );
		return $rebuilt ? 1 : false;
	}
}

<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use SplFileInfo;

class Rebuild_File implements Path_Action {
	public function apply_to_path( SplFileInfo $file ) {
		if ( $file->isDir() || $file->getFilename() === 'index.html' ) {
			return false;
		}

		$rebuilt = Filesystem_Utils::rebuild_file( $file->getPathname() );
		return $rebuilt ? 1 : false;
	}
}

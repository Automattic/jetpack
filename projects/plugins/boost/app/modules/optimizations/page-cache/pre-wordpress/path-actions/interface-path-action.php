<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions;

use SplFileInfo;

interface Path_Action {
	/**
	 * Apply the action to the path.
	 *
	 * @param SplFileInfo $path The path to apply the action to.
	 * @return false|int False if nothing was done, or the number of files deleted.
	 */
	public function apply_to_path( SplFileInfo $path );
}

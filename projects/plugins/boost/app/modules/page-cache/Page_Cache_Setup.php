<?php
/*
 * The file is temporarily here to get PR #26458 merged.
 *
 * The plugin uninstall hook was registered in the Page_Cache file. Since we are changing the namespaces
 * the uninstall hook broke the test-plugin-upgrade. So, this file is temporarily here to get the PR merged.
 * After the PR is merged, this file should be removed.
 */

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache_Setup as Actual_Page_Cache_Setup;

class Page_Cache_Setup {
	public static function uninstall() {
		Actual_Page_Cache_Setup::uninstall();
	}
}

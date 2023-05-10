<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Contracts;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;

interface Lazy_Entry {
	/**
	 * "Look pal, I'm so lazy I can't even finish this sente.." - Lazy Entry
	 *
	 * Entries can tag themselves as "lazy" by implementing this interface.
	 * By tagging an entry as "lazy" it won't be loaded with `wp_localize_script`.
	 *
	 * This is useful when you want DataSync, but getting the data is going
	 * to slow down the admin dashboard page load.
	 * For example - uncached network requests.
	 *
	 * @see Data_Sync::_print_options_script_tag()
	 */
}

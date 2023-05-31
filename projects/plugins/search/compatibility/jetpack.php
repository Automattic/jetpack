<?php
/**
 * Jetpack compatibility
 *
 * @package automattic/jetpack-search-plugin
 */

namespace Automattic\Jetpack\Search_Plugin\Compatibility\Jetpack;

// Search package uses priority 10 to override Search submenu visibility for Jetpack.
// The captibility check is already done in `add_submenu_page()`, so we just return `true` from here.
// https://github.com/Automattic/jetpack/blob/8594fe4d22863b251383c2550ca5f8d000d45b89/projects/packages/search/compatibility/jetpack.php#L29.
add_filter( 'jetpack_search_should_add_search_submenu', '__return_true', 20 );

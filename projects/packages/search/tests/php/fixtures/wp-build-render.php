<?php
/**
 * Stands in for the render function `@wordpress/build` generates, so tests can reach
 * the wp-build branch without the package being built.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search\Fixtures;

/**
 * Echo the mount container the generated page would render.
 *
 * @return void
 */
function wp_build_render_page() {
	echo '<div id="jetpack-search-dashboard-wp-admin-app"></div>';
}

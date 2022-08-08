<?php
/**
 * Compatibility for Jetpack Search version <= 0.17.0.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search\Compatibility\Jetpack;

// @todo find the appropriate filter for settings update
// add_filter( 'option_sidebars_widgets', __NAMESPACE__ . '\update_deprecated_results_overlay_trigger', 10, 2 );

/**
 * We've retired the 'results' overlay trigger and want to migrate users to the similar 'immediate' setting.
 */
function update_deprecated_results_overlay_trigger( /*$sidebars_widgets*/ ) {
	// update results > immediate
}

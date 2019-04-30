<?php

namespace Jetpack\V7\Core;

/**
 * Checks if the code debug mode turned on, and returns false if it is. When Jetpack is in
 * code debug mode, it shouldn't use minified assets. Note that this filter is not being used
 * in every place where assets are enqueued. The filter is added at priority 9 to be overridden
 * by any default priority filter that runs after it.
 *
 * @since 6.2.0
 *
 * @return boolean
 *
 * @filter jetpack_should_use_minified_assets
 */
function jetpack_should_use_minified_assets() {
	if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
		return false;
	}
	return true;
}

add_filter( 'jetpack_should_use_minified_assets', 'jetpack_should_use_minified_assets', 9 );

class Assets {

}
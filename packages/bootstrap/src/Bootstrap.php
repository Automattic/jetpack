<?php
namespace Automattic\Jetpack;

class Bootstrap {
	static function init() {
		/**
		 * Returns the location of Jetpack's lib directory. This filter is applied
		 * in require_lib().
		 *
		 * @since 4.0.2
		 *
		 * @return string Location of Jetpack library directory.
		 *
		 * @filter jetpack_require_lib_dir
		 */
		add_filter( 'jetpack_require_lib_dir', array( 'Bootstrap', 'require_lib_dir' ) );

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
		add_filter( 'jetpack_should_use_minified_assets', array( 'Bootstrap', 'should_use_minified_assets' ), 9 );
	}

	static function require_lib_dir() {
		return JETPACK__PLUGIN_DIR . '_inc/lib';
	}

	static function should_use_minified_assets() {
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			return false;
		}
		return true;
	}
}
<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Functions required for the test suite to run.
 *
 * @package automattic/jetpack-autoloader
 */

/**
 * Since PHP8 added a warning for setting `$throw` to `false` in `spl_autoload_register()`,
 * we need to define the autoload functions in order for them to be registered.
 */
namespace Automattic\Jetpack\Autoloader\jp123 {

	/**
	 * A dummy autoloader function to register.
	 */
	function autoload() {}

	/**
	 * A dummy autoloader class to register.
	 */
	class PHP_Autoloader {
		/**
		 * A dummy autoloader function to register.
		 */
		public static function load_class() {}
	}
}

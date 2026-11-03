<?php
/**
 * Minimal `Jetpack` stand-in for separate-process tests of the standalone
 * default. JETPACK__VERSION stays undefined so available modules keep coming
 * from the `jetpack_get_available_standalone_modules` filter.
 *
 * @package automattic/jetpack-activity-log
 */

// phpcs:disable Squiz.Commenting, Generic.Commenting, WordPress.Files.FileName

if ( ! class_exists( 'Jetpack' ) ) {
	class Jetpack {}
}

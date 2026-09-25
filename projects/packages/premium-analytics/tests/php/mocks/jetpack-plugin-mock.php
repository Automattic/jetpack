<?php
/**
 * Minimal `Jetpack` stand-in for separate-process section availability tests.
 * JETPACK__VERSION stays undefined so tests can control available modules with
 * the `jetpack_get_available_standalone_modules` filter.
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable Squiz.Commenting, Generic.Commenting, WordPress.Files.FileName

if ( ! class_exists( 'Jetpack' ) ) {
	class Jetpack {}
}

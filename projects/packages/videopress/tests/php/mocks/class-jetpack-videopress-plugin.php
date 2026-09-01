<?php
/**
 * Minimal stub of the VideoPress standalone plugin class.
 *
 * Status::is_standalone_plugin_active() only checks `class_exists( 'Jetpack_VideoPress_Plugin' )`,
 * so requiring this file is enough to make Status::is_active() return true in a test. Only require
 * it from tests that run in an isolated process, so the forced-active state never leaks into the
 * rest of the suite.
 *
 * @package automattic/jetpack-videopress
 */

if ( ! class_exists( 'Jetpack_VideoPress_Plugin' ) ) {
	/**
	 * Stub standalone plugin class used only to satisfy the active-state check in tests.
	 */
	class Jetpack_VideoPress_Plugin {}
}

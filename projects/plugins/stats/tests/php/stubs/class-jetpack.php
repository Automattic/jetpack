<?php
/**
 * Stand-in for the Jetpack plugin, which the Stats plugin detects by its main class.
 *
 * @package automattic/jetpack-stats-plugin
 */

// phpcs:disable Generic.Classes.DuplicateClassName.Found -- loaded only in an isolated process that never loads the Jetpack plugin.

/**
 * Empty Jetpack plugin class.
 */
class Jetpack {}

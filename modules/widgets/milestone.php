<?php
/**
 * Milestone widget loader.
 *
 * Everything happens within the folder, but Jetpack loads widgets via a widgets/*.php scheme.
 *
 * @package Jetpack.
 */

/**
 * Register the milestone widget.  This makes it easier to keep the /milestone/ dir content in sync with wpcom.
 */
require __DIR__ . '/milestone/class-milestone-widget.php';

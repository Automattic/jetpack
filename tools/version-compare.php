#!/usr/bin/env php
<?php
/**
 * A simple script to compare versions from the command line.
 *
 * Usage:
 *
 *     tools/version-compare.php "VER1" "VER2" "OP"
 *
 * @see https://www.php.net/version_compare
 * @package automattic/jetpack
 */

array_shift( $argv );
exit( (int) ! version_compare( ...$argv ) );

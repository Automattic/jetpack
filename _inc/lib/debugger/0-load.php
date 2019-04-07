<?php
/**
 * Loading the various functions used for Jetpack Debugging.
 *
 * @package Jetpack.
 */

/* Jetpack Connection Testing Framework */
require_once 'class-jetpack-cxn-test-base.php';
/* Jetpack Connection Tests */
require_once 'class-jetpack-cxn-tests.php';
/* Jetpack Debug Data */
require_once 'class-jetpack-debug-data.php';
/* The "In-Plugin Debugger" admin page. */
require_once 'class-jetpack-debugger.php';

add_filter( 'debug_information', array( 'Jetpack_Debug_Data', 'core_debug_data' ) );

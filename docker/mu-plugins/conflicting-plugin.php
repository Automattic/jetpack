<?php

/*
 * Plugin Name: Conflicting Plugin
 * License: GPL2+
 */
error_log( 'loading conflicting plugin' );
// loading the library results in an error
require_once 'conflicting-plugin/class.jetpack.php';
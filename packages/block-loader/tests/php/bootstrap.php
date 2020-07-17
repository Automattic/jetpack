<?php

// Composer autoloader must be loaded before WP_PHPUNIT__DIR will be available
require_once __DIR__ . '/../../vendor/autoload.php';

// Give access to tests_add_filter() function.
require_once getenv( 'WP_PHPUNIT__DIR' ) . '/includes/functions.php';

// Start up the WP testing environment.
require getenv( 'WP_PHPUNIT__DIR' ) . '/includes/bootstrap.php';

/*
 * Using the Speed Trap Listener provided by WordPress Core testing suite to expose
 * slowest running tests. See the configuration in phpunit.xml.dist
 */
require getenv( 'WP_PHPUNIT__DIR' ) . '/includes/listener-loader.php';

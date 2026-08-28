<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-cookie-consent
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/class-testcase.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init( null, 'sqlite' );

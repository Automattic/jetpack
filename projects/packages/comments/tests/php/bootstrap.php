<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-comments
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );
define( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

\Automattic\Jetpack\Test_Environment::init();

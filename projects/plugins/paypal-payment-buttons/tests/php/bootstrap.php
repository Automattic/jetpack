<?php
/**
 * Bootstrap.
 *
 * @package automattic/paypal-payment-buttons
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

\Automattic\Jetpack\Test_Environment::init();
require_once __DIR__ . '/../../paypal-payment-buttons.php';

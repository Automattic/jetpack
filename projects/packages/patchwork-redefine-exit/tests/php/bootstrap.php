<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Require Patchwork
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';
\Automattic\RedefineExit::setup();

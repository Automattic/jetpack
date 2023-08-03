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

// Preloading the file to reconcile Brain\Monkey with WorDBless.
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

require_once __DIR__ . '/../../jetpack-chat.php';

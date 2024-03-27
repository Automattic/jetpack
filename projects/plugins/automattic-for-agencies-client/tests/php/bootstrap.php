<?php
/**
 * Bootstrap.
 *
 * @package automattic/automattic-for-agencies-client
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Preloading the file to reconcile Brain\Monkey with WorDBless.
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

\WorDBless\Load::load();
require_once __DIR__ . '/../../automattic-for-agencies-client.php';

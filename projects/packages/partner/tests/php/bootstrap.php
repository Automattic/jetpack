<?php
/**
 * Bootstrap for tests.
 *
 * @package Automattic/jetpack-partner
 */

/**
 * Composer's autoloader is all we need.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

/**
 * Preloading the file to reconcile Brain\Monkey with Wordbless.
 */
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

/**
 * Load WorDBless
 */
\WorDBless\Load::load();

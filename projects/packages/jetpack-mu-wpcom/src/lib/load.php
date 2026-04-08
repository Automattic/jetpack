<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Load all lib files.
 *
 * This file is the entrypoint for the lib/ directory. It requires
 * every lib file so the functions are available to all features.
 *
 * @package automattic/jetpack-mu-wpcom
 */

require_once __DIR__ . '/site-owner.php';
require_once __DIR__ . '/admin-notifications.php';

<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-crm
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

/**
 * Load WorDBless.
 */
\WorDBless\Load::load();

/**
 * Load all feature flags, so they will be testable.
 */
add_filter( 'jetpack_crm_feature_flag_api_v4', '__return_true' );

/**
 * Load Jetpack CRM.
 *
 * Not all code is automatically loaded any we depend on a lot of global
 * variables, so the easiest path forward (for now at least) is to just
 * load the core plugin file so everything is initiated.
 */
require_once __DIR__ . '/../../ZeroBSCRM.php';

<?php
/**
 *
 * Plugin Name: WordPress.com Features
 * Description: Test plugin for the jetpack-mu-wpcom package
 * Version: 1.0.1-alpha
 * Author: Automattic
 * License: GPLv2 or later
 * Text Domain: jetpack-mu-wpcom-plugin
 *
 * @package automattic/jetpack-mu-wpcom-plugin
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/vendor/autoload.php';

/**
 * Jetpack_Mu_Wpcom initialization.
 */
if (
	class_exists( 'Automattic\Jetpack\Jetpack_Mu_Wpcom' ) &&
	Automattic\Jetpack\Jetpack_Mu_Wpcom::$initialized === false
) {
	Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
}

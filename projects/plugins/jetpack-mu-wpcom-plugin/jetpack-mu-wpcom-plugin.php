<?php
/**
 *
 * Plugin Name: WordPress.com Features
 * Description: Test plugin for the jetpack-mu-wpcom package
 * Version: 0.1.0-alpha
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
 * Developers: add `define( 'JETPACK_MU_WPCOM_LOAD_VIA_PLUGIN', true );`
 * to your wp-config.php file to load this plugin,
 * and not load the jetpack-mu-wpcom package required in wpcomsh.
 */
if (
	class_exists( 'Automattic\Jetpack\Jetpack_Mu_Wpcom' )
	&& defined( 'JETPACK_MU_WPCOM_LOAD_VIA_PLUGIN' )
) {
	Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
}

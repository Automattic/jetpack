<?php
/**
 *
 * Plugin Name: WordPress.com Features
 * Description: Test plugin for the jetpack-mu-wpcom package
<<<<<<< HEAD
 * Version: 1.6.13
=======
 * Version: 1.6.13-alpha
>>>>>>> 99805fa5d7 ([not verified] Update project versions)
 * Author: Automattic
 * License: GPLv2 or later
 * Text Domain: jetpack-mu-wpcom-plugin
 *
 * @package automattic/jetpack-mu-wpcom-plugin
 */

/**
 * Conditionally load the jetpack-mu-wpcom package.
 *
 * JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN=true will load the package via the Jetpack Beta Tester plugin, not wpcomsh.
 */
if ( defined( 'JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN' ) && JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN ) {
	require_once __DIR__ . '/vendor/autoload.php';
	if ( class_exists( 'Automattic\Jetpack\Jetpack_Mu_Wpcom' ) ) {
		Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
	}
}

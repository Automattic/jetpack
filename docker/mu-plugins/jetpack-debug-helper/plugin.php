<?php
/**
 * Plugin Name: Jetpack Debug Tools
 * Description: Give me a Jetpack connection, and I'll break it every way possible.
 * Author: Automattic - Jetpack Crew
 * Version: 1.0
 * Text Domain: jetpack
 *
 * @package Jetpack.
 */

namespace Automattic\Jetpack\Debug_Helper;

// phpcs:disable WordPress.WhiteSpace.PrecisionAlignment.Found

/*
 .--..--..--..--..--..--..--..--..--..--..--..--..--..--..--..--.
/ .. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \.. \
\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/ /
 \/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /
 / /\/ /`' /`' /`' /`' /`' /`' /`' /`' /`' /`' /`' /`' /`' /\/ /\
/ /\ \/`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'\ \/\ \
\ \/\ \                                                    /\ \/ /
 \/ /\ \                                                  / /\/ /
 / /\/ /    MUST COMMENT OUT THE LINE BELOW               \ \/ /\
/ /\ \/                                                    \ \/\ \
\ \/\ \             TO ACTIVATE THE BROKEN TOKEN TOOL.     /\ \/ /
 \/ /\ \                                                  / /\/ /
 / /\/ /                                                  \ \/ /\
/ /\ \/                                                    \ \/\ \
\ \/\ \.--..--..--..--..--..--..--..--..--..--..--..--..--./\ \/ /
 \/ /\/ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ ../ /\/ /
 / /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\/ /\
/ /\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \/\ \
\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `'\ `' /
 `--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'`--'
 */
add_filter( 'jetpack_debug_helper_modules', '__return_empty_array' );

// phpcs:enable

/**
 * Include file names from the modules directory here.
 *
 * @todo Add UI to make this easier to use in a testing situation.
 */
$modules = array(
	'class-broken-token.php',
);

/**
 * Filter the features of the Jetpack Debug Helper.
 *
 * This is part of the mu-plugins folder within Jetpack's built-in local Docker environment.
 * This filter does not exist and is non-functional in production code.
 *
 * @param array $modules Array of file names. File names are based on the docker/mu-plugins/jetpack-debug-helper/inc folder.
 */
foreach ( (array) apply_filters( 'jetpack_debug_helper_modules', $modules ) as $module ) {
	include_once plugin_dir_path( __FILE__ ) . 'modules/' . $module;
}
